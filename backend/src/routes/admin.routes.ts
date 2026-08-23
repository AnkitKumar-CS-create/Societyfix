import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Protect this entire router so ONLY admins can access it
router.use(requireAuth, requireAdmin);

router.get('/dashboard', getDashboardAnalytics);

export default router;