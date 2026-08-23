import { Status } from '@prisma/client';

export const isComplaintOverdue = (createdAt: Date, status: Status): boolean => {
  // If it's resolved, it's not overdue
  if (status === Status.RESOLVED) return false;

  // Read the threshold from .env (default to 3 days if missing)
  const overdueDaysThreshold = parseInt(process.env.COMPLAINT_OVERDUE_DAYS || '3', 10);
  
  const now = new Date();
  const createdDate = new Date(createdAt);

  // Calculate the difference in milliseconds, then convert to days
  const diffInMs = now.getTime() - createdDate.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  return diffInDays > overdueDaysThreshold;
};