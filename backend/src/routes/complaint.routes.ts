import { Router } from 'express';
import { 
  createComplaint, 
  getComplaints, 
  getComplaintById, 
  updateComplaintStatus,
  updateComplaintPriority,
  addComplaintComment
} from '../controllers/complaint.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// All complaint routes require the user to be logged in
router.use(requireAuth);

// Resident & Admin shared routes
router.post('/', createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.post('/:id/comments', addComplaintComment);

// Admin-only routes for management
router.patch('/:id/status', requireAdmin, updateComplaintStatus);
router.patch('/:id/priority', requireAdmin, updateComplaintPriority);

export default router;