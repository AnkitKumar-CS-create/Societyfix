export interface User {
  id: string;
  name: string;
  email: string;
  role: 'RESIDENT' | 'ADMIN';
  apartmentNumber?: string;
  block?: string;
}

export interface ComplaintHistory {
  id: string;
  complaintId: string;
  newStatus: string;
  oldStatus?: string;
  actorId: string;
  note?: string;
  createdAt: string;
  actor: { name: string; role: string };
}

export interface ComplaintComment {
  id: string;
  message: string;
  createdAt: string;
  author: { name: string; role: string };
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  photoUrl?: string;
  resolvedAt?: string;
  createdAt: string;
  residentId: string;
  isOverdue?: boolean;
  resident?: { name: string; apartmentNumber?: string; block?: string };
  history?: ComplaintHistory[];
  comments?: ComplaintComment[];
  latestUpdate?: string | null;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
  createdBy?: { name: string };
}