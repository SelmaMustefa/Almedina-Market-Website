import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';
import { validateCategoryInput } from '../middleware/validate';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';

const router = Router();

// Public routes
router.get('/', optionalAuth, getCategories);
router.get('/:id', optionalAuth, getCategoryById);

// Admin-only routes
router.post('/', authenticate, requireAdmin, validateCategoryInput, createCategory);
router.put('/:id', authenticate, requireAdmin, updateCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

export default router;
