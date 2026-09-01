import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCurrentUser, syncUserSession } from '../controllers/auth.controller';

const router = Router();

// GET /api/auth/me - Retrieve current verified user
router.get('/me', authenticate, getCurrentUser);

// POST /api/auth/sync - Sync Firebase user profile to backend database
router.post('/sync', authenticate, syncUserSession);

export default router;
