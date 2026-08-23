import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route (requires token)
router.get('/me', requireAuth, getMe);

export default router;