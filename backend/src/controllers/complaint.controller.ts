import { sendStatusUpdateEmail } from '../services/email.service';
import { Response } from 'express';
import { PrismaClient, Status, Priority } from '@prisma/client';
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
    
    // Determine query conditions based on role
    const whereCondition = role === 'RESIDENT' ? { residentId: userId } : {};

    const complaints = await prisma.complaint.findMany({
      where: whereCondition,
      include: {
        resident: { select: { name: true, apartmentNumber: true, block: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate overdue status dynamically for each complaint
    const complaintsWithOverdue = complaints.map(c => ({
      ...c,
      isOverdue: isComplaintOverdue(c.createdAt, c.status)
    }));

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
        // Fetch resident's email to send notification
    const resident = await prisma.user.findUnique({ where: { id: updatedComplaint.residentId } });
    if (resident) {
      // Fire and forget email notification
      sendStatusUpdateEmail(resident.email, updatedComplaint.title, updatedComplaint.status, note);
    }
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