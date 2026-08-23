import { Response } from 'express';
import { PrismaClient, Status } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { isComplaintOverdue } from '../utils/overdue';

const prisma = new PrismaClient();

export const getDashboardAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Get basic counts by status
    const totalComplaints = await prisma.complaint.count();
    const openComplaints = await prisma.complaint.count({ where: { status: Status.OPEN } });
    const inProgressComplaints = await prisma.complaint.count({ where: { status: Status.IN_PROGRESS } });
    const resolvedComplaints = await prisma.complaint.count({ where: { status: Status.RESOLVED } });

    // 2. Get complaints by category for charts
    const categoryGroups = await prisma.complaint.groupBy({
      by: ['category'],
      _count: { category: true },
    });
    
    // Format category data for frontend Recharts
    const complaintsByCategory = categoryGroups.map(group => ({
      name: group.category,
      value: group._count.category
    }));

    // 3. Calculate Overdue Complaints dynamically
    // Fetch only active complaints to check if they are overdue
    const activeComplaints = await prisma.complaint.findMany({
      where: { status: { in: [Status.OPEN, Status.IN_PROGRESS] } },
      select: { createdAt: true, status: true }
    });

    const overdueCount = activeComplaints.filter(c => isComplaintOverdue(c.createdAt, c.status)).length;

    res.status(200).json({
      overview: {
        total: totalComplaints,
        open: openComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints,
        overdue: overdueCount
      },
      charts: {
        byCategory: complaintsByCategory
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching dashboard analytics.' });
  }
};