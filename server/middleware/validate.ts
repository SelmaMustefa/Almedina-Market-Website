import { Request, Response, NextFunction } from 'express';

export function validateProductInput(req: Request, res: Response, next: NextFunction) {
  const { name, price, category } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Product name is required and must be a non-empty string.',
    });
  }

  if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Product price must be a valid positive number.',
    });
  }

  if (!category || typeof category !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Product category is required.',
    });
  }

  if (req.body.stock !== undefined && (typeof req.body.stock !== 'number' || req.body.stock < 0)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Product stock quantity cannot be negative.',
    });
  }

  next();
}

export function validateCategoryInput(req: Request, res: Response, next: NextFunction) {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Category name is required.',
    });
  }

  next();
}

export function validateOrderInput(req: Request, res: Response, next: NextFunction) {
  const { items, customerName, customerPhone, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Order must contain at least one item.',
    });
  }

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Customer name is required.',
    });
  }

  if (!customerPhone || typeof customerPhone !== 'string' || customerPhone.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Customer phone number is required.',
    });
  }

  if (paymentMethod) {
    const norm = String(paymentMethod).toLowerCase().trim();
    if (norm !== 'chapa' && norm !== 'cash') {
      return res.status(400).json({
        success: false,
        error: "Validation Error: Unsupported payment method. Only 'chapa' and 'cash' are permitted.",
      });
    }
  }

  next();
}
