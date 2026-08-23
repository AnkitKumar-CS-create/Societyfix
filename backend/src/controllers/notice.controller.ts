import { sendImportantNoticeEmail } from '../services/email.service';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// 1. Create Notice (Admin only)
export const createNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, isImportant } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        isImportant: isImportant || false,
        createdById: adminId,
      },
    });

    // If important, trigger email broadcast to all residents
    if (isImportant) {
      const residents = await prisma.user.findMany({
        where: { role: 'RESIDENT' },
        select: { email: true }
      });
      const emails = residents.map(r => r.email);
      
      if (emails.length > 0) {
        sendImportantNoticeEmail(emails, title, content);
      }
    }
    res.status(201).json({ message: 'Notice created successfully', notice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating notice.' });
  }
};

// 2. Get All Notices (Residents & Admins)
export const getNotices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notices = await prisma.notice.findMany({
      include: {
        createdBy: { select: { name: true } }
      },
      orderBy: [
        { isImportant: 'desc' }, // This fulfills the requirement: Important notices appear at the top
        { createdAt: 'desc' }    // Then sort by newest
      ]
    });

    res.status(200).json(notices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notices.' });
  }
};

// 3. Delete Notice (Admin only)
export const deleteNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !id) {
      res.status(400).json({ message: 'A valid notice ID is required.' });
      return;
    }

    await prisma.notice.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting notice.' });
  }
};