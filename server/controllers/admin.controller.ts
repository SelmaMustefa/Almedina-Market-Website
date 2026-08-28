import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabaseAdmin';

export async function getAdminStats(req: Request, res: Response) {
  const supabase = getSupabaseAdmin();

  let totalProducts = 0;
  let lowStockProducts = 0;
  let outOfStockProducts = 0;
  let totalOrders = 0;
  let totalRevenue = 0;
  let pendingOrders = 0;
  let totalCustomers = 0;

  if (supabase) {
    try {
      // 1. Products summary
      const { data: products } = await supabase.from('products').select('id, stock_quantity, price');
      if (products) {
        totalProducts = products.length;
        lowStockProducts = products.filter((p: any) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10).length;
        outOfStockProducts = products.filter((p: any) => (p.stock_quantity || 0) <= 0).length;
      }

      // 2. Orders & Revenue summary
      const { data: orders } = await supabase.from('orders').select('id, status, payment_status, total_amount');
      if (orders) {
        totalOrders = orders.length;
        pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length;
        totalRevenue = orders
          .filter((o: any) => o.status !== 'cancelled')
          .reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
      }

      // 3. Profiles / Customers count
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      totalCustomers = count || 0;
    } catch (err: any) {
      console.warn('[AdminController] Stats aggregation warning:', err.message);
    }
  }

  return res.json({
    success: true,
    stats: {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      totalCustomers,
      currency: 'ETB',
      timestamp: new Date().toISOString(),
    },
  });
}

export async function getCustomers(req: Request, res: Response) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json({
          success: true,
          count: data.length,
          customers: data,
        });
      }
    } catch (err: any) {
      console.warn('[AdminController] Get customers error:', err.message);
    }
  }

  return res.json({
    success: true,
    count: 0,
    customers: [],
  });
}
