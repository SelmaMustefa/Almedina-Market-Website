import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';
import { validateProductInput } from '../middleware/validate';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';

const router = Router();

// Public routes (or optional auth)
router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProductById);

// Admin-only routes
router.post('/', authenticate, requireAdmin, validateProductInput, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
