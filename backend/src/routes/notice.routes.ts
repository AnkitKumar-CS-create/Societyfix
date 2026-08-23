import { Router } from 'express';
import { createNotice, getNotices, deleteNotice } from '../controllers/notice.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Everyone logged in can view notices
router.get('/', requireAuth, getNotices);

// Only Admins can create and delete notices
router.post('/', requireAuth, requireAdmin, createNotice);
router.delete('/:id', requireAuth, requireAdmin, deleteNotice);

export default router;