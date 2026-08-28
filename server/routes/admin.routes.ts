import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';
import { getAdminStats, getCustomers } from '../controllers/admin.controller';

const router = Router();

// GET /api/admin/stats - Aggregated KPI metrics
router.get('/stats', authenticate, requireAdmin, getAdminStats);

// GET /api/admin/customers - List registered customer profiles
router.get('/customers', authenticate, requireAdmin, getCustomers);

export default router;
