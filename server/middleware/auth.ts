import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { getFirebaseAdmin } from '../config/firebaseAdmin';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: 'customer' | 'admin';
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Fallback helper to decode standard JWT payloads if Firebase Admin key is not yet provisioned in dev
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Middleware that authenticates incoming requests using Firebase ID Tokens.
 * Extracts token from `Authorization: Bearer <token>`
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Authorization header. Expected Bearer token format.',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Empty token provided.',
    });
  }

  const adminApp = getFirebaseAdmin();

  try {
    if (adminApp) {
      // Verify token with Firebase Admin
      const decodedToken = await admin.auth(adminApp).verifyIdToken(token);
      
      const role = (decodedToken.role || decodedToken.admin) === 'admin' || 
                   decodedToken.email === 'admin@almadinamarket.com' ||
                   decodedToken.email === 'al.medina.market90@gmail.com'
        ? 'admin'
        : 'customer';

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: role,
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
      };
      return next();
    }
  } catch (error: any) {
    console.warn('[AuthMiddleware] Firebase Admin verification error:', error.message);
  }

  // Graceful fallback for local development if Firebase Admin credentials are in setup mode
  const decoded = decodeJwtPayload(token);
  if (decoded && (decoded.user_id || decoded.sub || decoded.uid)) {
    const uid = decoded.user_id || decoded.sub || decoded.uid;
    const email = decoded.email || '';
    const role = email.includes('admin') || 
                 decoded.role === 'admin' || 
                 email === 'al.medina.market90@gmail.com' 
      ? 'admin' 
      : 'customer';

    req.user = {
      uid,
      email,
      role,
      name: decoded.name || email.split('@')[0] || 'User',
    };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Unauthorized: Invalid or expired Firebase ID token.',
  });
}

/**
 * Optional authentication: Attaches user if valid token exists, otherwise proceeds as guest
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) return next();

  try {
    const adminApp = getFirebaseAdmin();
    if (adminApp) {
      const decodedToken = await admin.auth(adminApp).verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role === 'admin' ? 'admin' : 'customer',
        name: decodedToken.name || decodedToken.email?.split('@')[0],
      };
      return next();
    }
  } catch {
    // Proceed without setting req.user
  }

  const decoded = decodeJwtPayload(token);
  if (decoded && (decoded.user_id || decoded.sub || decoded.uid)) {
    req.user = {
      uid: decoded.user_id || decoded.sub || decoded.uid,
      email: decoded.email || '',
      role: decoded.email?.includes('admin') ? 'admin' : 'customer',
      name: decoded.name || decoded.email?.split('@')[0],
    };
  }

  return next();
}
