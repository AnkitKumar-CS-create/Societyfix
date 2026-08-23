import { sendStatusUpdateEmail } from '../services/email.service';
import { Response } from 'express';
import { PrismaClient, Status, Priority, Category, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { isComplaintOverdue } from '../utils/overdue';

const prisma = new PrismaClient();

// 1. Create a Complaint (Resident)
export const createComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, photoUrl } = req.body;
    const residentId = req.user?.userId;

    if (!residentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Create the complaint and its first history record simultaneously using Prisma transaction
    const complaint = await prisma.$transaction(async (tx) => {
      const newComplaint = await tx.complaint.create({
        data: {
          title,
          description,
          category,
          photoUrl,
          residentId,
          status: Status.OPEN,
          priority: Priority.MEDIUM,
        },
      });

      await tx.complaintHistory.create({
        data: {
          complaintId: newComplaint.id,
          newStatus: Status.OPEN,
          actorId: residentId,
          note: 'Complaint raised by resident.',
        },
      });

      return newComplaint;
    });

    res.status(201).json({ message: 'Complaint created successfully', complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating complaint.' });
  }
};

// 2. Get All Complaints (Admin gets all, Resident gets their own)
export const getComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, userId } = req.user!;
    const getQueryValue = (value: unknown): string | undefined =>
      typeof value === 'string' ? value : undefined;
    const status = getQueryValue(req.query.status);
    const category = getQueryValue(req.query.category);
    const from = getQueryValue(req.query.from);
    const to = getQueryValue(req.query.to);

    const whereCondition: Prisma.ComplaintWhereInput = role === 'RESIDENT'
      ? { residentId: userId }
      : {};

    if (status && Object.values(Status).includes(status as Status)) {
      whereCondition.status = status as Status;
    }
    if (category && Object.values(Category).includes(category as Category)) {
      whereCondition.category = category as Category;
    }
    if (from || to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (from && !Number.isNaN(Date.parse(from))) createdAt.gte = new Date(from);
      if (to && !Number.isNaN(Date.parse(to))) createdAt.lte = new Date(to);
      whereCondition.createdAt = createdAt;
    }

    const complaints = await prisma.complaint.findMany({
      where: whereCondition,
      include: {
        resident: { select: { name: true, apartmentNumber: true, block: true } },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { note: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate overdue status dynamically for each complaint
    const complaintsWithOverdue = complaints.map(c => ({
      ...c,
      latestUpdate: c.history[0]?.note || null,
      isOverdue: isComplaintOverdue(c.createdAt, c.status)
    }));

    complaintsWithOverdue.sort((first, second) =>
      Number(second.isOverdue) - Number(first.isOverdue)
    );

    res.status(200).json(complaintsWithOverdue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching complaints.' });
  }
};

// 3. Get Single Complaint by ID
export const getComplaintById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    if (typeof id !== 'string' || !id) {
      res.status(400).json({ message: 'A valid complaint ID is required.' });
      return;
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        resident: { select: { name: true, apartmentNumber: true, block: true } },
        history: {
          include: { actor: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' } // Oldest to newest for visual timeline
        },
        comments: {
          include: { author: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found.' });
      return;
    }

    // Security: Residents can only view their own complaints
    if (role === 'RESIDENT' && complaint.residentId !== userId) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const complaintWithOverdue = {
      ...complaint,
      isOverdue: isComplaintOverdue(complaint.createdAt, complaint.status)
    };

    res.status(200).json(complaintWithOverdue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching complaint details.' });
  }
};

export const addComplaintComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authorId = req.user?.userId;
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

    if (typeof id !== 'string' || !id || !authorId || !message) {
      res.status(400).json({ message: 'A valid complaint ID and message are required.' });
      return;
    }

    const complaint = await prisma.complaint.findUnique({ where: { id }, select: { residentId: true } });
    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found.' });
      return;
    }
    if (req.user?.role === 'RESIDENT' && complaint.residentId !== authorId) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const comment = await prisma.complaintComment.create({
      data: { complaintId: id, authorId, message },
      include: { author: { select: { name: true, role: true } } }
    });

    const recipientId = authorId === complaint.residentId ? undefined : complaint.residentId;
    if (recipientId) {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'COMPLAINT_COMMENT',
          title: 'New complaint reply',
          message: `${comment.author.name} replied to your complaint.`
        }
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding complaint comment.' });
  }
};

// 4. Update Complaint Status (Admin)
export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const adminId = req.user?.userId;

    if (typeof id !== 'string' || !id) {
      res.status(400).json({ message: 'A valid complaint ID is required.' });
      return;
    }

    if (!adminId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const existingComplaint = await prisma.complaint.findUnique({ where: { id } });
    if (!existingComplaint) {
      res.status(404).json({ message: 'Complaint not found.' });
      return;
    }

    if (existingComplaint.status === Status.RESOLVED) {
      res.status(400).json({ message: 'Cannot update a resolved complaint.' });
      return;
    }

    // Update complaint and create history log simultaneously
    const updatedComplaint = await prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: { 
          status,
          resolvedAt: status === Status.RESOLVED ? new Date() : null
        },
      });

      await tx.complaintHistory.create({
        data: {
          complaintId: id,
          oldStatus: existingComplaint.status,
          newStatus: status,
          actorId: adminId,
          note: note || `Status updated to ${status}`,
        },
      });

      return updated;
    });

    const resident = await prisma.user.findUnique({ where: { id: updatedComplaint.residentId } });
    if (resident) {
      void sendStatusUpdateEmail(resident.email, updatedComplaint.title, updatedComplaint.status, note);
    }

    res.status(200).json({ message: 'Status updated successfully', complaint: updatedComplaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating status.' });
  }
};
export const updateComplaintPriority = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (typeof id !== 'string' || !id) {
      res.status(400).json({ message: 'A valid complaint ID is required.' });
      return;
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: { priority },
    });

    res.status(200).json({ message: 'Priority updated successfully', complaint: updatedComplaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating priority.' });
  }
};