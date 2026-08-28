import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getSupabaseAdmin } from '../config/supabaseAdmin';

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated user.',
    });
  }

  const supabase = getSupabaseAdmin();
  let dbProfile = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.uid)
        .maybeSingle();

      if (!error && data) {
        dbProfile = data;
      }
    } catch (e) {
      console.warn('[AuthController] DB lookup error for user:', e);
    }
  }

  return res.json({
    success: true,
    user: {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name,
      profile: dbProfile,
    },
  });
}

export async function syncUserSession(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated user.',
    });
  }

  const { fullName, phone, role } = req.body;

  // Prevent registration/sync of al.medina.market90@gmail.com as customer
  const userEmail = req.user.email?.toLowerCase().trim() || '';
  if (userEmail === 'al.medina.market90@gmail.com' && role === 'customer') {
    return res.status(400).json({
      success: false,
      error: 'This email address is reserved exclusively for Almedina Market administrative management and cannot be registered or synced as a customer account. Please use the Admin Portal.',
    });
  }

  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      await supabase.from('profiles').upsert({
        id: req.user.uid,
        full_name: fullName || req.user.name,
        phone: phone || '',
        role: role || req.user.role,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[AuthController] Profile sync warning:', e);
    }
  }

  return res.json({
    success: true,
    message: 'User session synchronized successfully.',
    user: {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role,
      name: fullName || req.user.name,
    },
  });
}
