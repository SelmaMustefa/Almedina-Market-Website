import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Requires user to have the 'admin' role.
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to access administrative resources.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Administrative privileges required.',
    });
  }

  return next();
}

/**
 * Requires user to be authenticated (customer or admin).
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required for this action.',
    });
  }

  return next();
}
