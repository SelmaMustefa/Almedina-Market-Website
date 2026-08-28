import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireAdmin, requireAuth } from '../middleware/role';
import { validateOrderInput } from '../middleware/validate';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  confirmCashPayment,
} from '../controllers/order.controller';

const router = Router();

// Customer creates an order (works with authenticated users or guests with optional token)
router.post('/', optionalAuth, validateOrderInput, createOrder);

// Authenticated customer views their own orders
router.get('/my-orders', authenticate, getMyOrders);

// Admin views all orders
router.get('/', authenticate, requireAdmin, getAllOrders);

// View specific order details (checks ownership inside controller)
router.get('/:id', optionalAuth, getOrderById);

// Admin updates order status
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);

// Admin confirms cash received for an order
router.post('/:id/confirm-cash', authenticate, requireAdmin, confirmCashPayment);
router.patch('/:id/confirm-cash', authenticate, requireAdmin, confirmCashPayment);

export default router;
