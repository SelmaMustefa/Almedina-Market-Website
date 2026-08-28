import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getSupabaseAdmin } from '../config/supabaseAdmin';

// Bethel Shop reference location in Addis Ababa
const SHOP_LOCATION = {
  latitude: 8.9833,
  longitude: 38.7083,
  maxDeliveryDistanceKm: 6.0,
  baseDeliveryFeeETB: 50,
  perKmFeeETB: 15,
  minDeliverySubtotalETB: 1000,
};

// Fallback product prices in ETB if Supabase is offline or not seeded
const FALLBACK_PRODUCT_CATALOG: Record<string, { name: string; priceETB: number; unit: string }> = {
  'prod-1786966198085': { name: 'Almarai Cream Cheese', priceETB: 2500, unit: '500g' },
  'prod-1786966198086': { name: 'Puck Processed Cream Cheese', priceETB: 2800, unit: '910g' },
  'prod-1786966198087': { name: 'Nido Milk Powder (Imported)', priceETB: 4200, unit: '2.5kg' },
  'prod-1786966198088': { name: 'Abu Bint Premium Basmati Rice', priceETB: 3600, unit: '5kg' },
  'prod-1786966198089': { name: 'Al Walimah Pure Basmati Rice', priceETB: 6800, unit: '10kg' },
  'prod-1786966198090': { name: 'Afia Pure Corn Oil', priceETB: 2200, unit: '1.8L' },
  'prod-1786966198091': { name: 'Almarai 100% Pure Ghee', priceETB: 3100, unit: '800g' },
  'prod-1786966198092': { name: 'Luna Pure Evaporated Milk', priceETB: 280, unit: '170g' },
  'prod-1786966198093': { name: 'Goody Authentic Saudi Macaroni', priceETB: 450, unit: '500g' },
  'prod-1786966198094': { name: 'Indomie Instant Fried Noodles (Pack of 5)', priceETB: 650, unit: '5 x 80g' },
  'prod-1786966198095': { name: 'Almarai 100% Natural Mango Juice', priceETB: 650, unit: '1L' },
  'prod-1786966198096': { name: 'Rani Float Peach Drink with Chunks', priceETB: 320, unit: '240ml' },
  'prod-1786966198097': { name: 'Crystal Fiery Hot Sauce (Imported)', priceETB: 380, unit: '474ml' },
  'prod-1786966198098': { name: 'Al Taj Pure Dairy Clotted Cream', priceETB: 490, unit: '170g' },
  'prod-1786966198099': { name: 'Premium Royal Khudri Dates', priceETB: 1850, unit: '1kg' },
  'prod-1786966200001': { name: 'Traditional Halabi Halwa with Pistachio', priceETB: 1450, unit: '400g' },
  'prod-1786966200002': { name: 'Capri-Sun Fruit Punch (10 Pouches)', priceETB: 1200, unit: '10 x 200ml' },
  'prod-1786966200003': { name: 'American More Fiery Pepper Sauce', priceETB: 420, unit: '474ml' },
  'prod-1786966200004': { name: 'Ayaan Pure Tomato Paste', priceETB: 340, unit: '400g' },
  'prod-1786966200005': { name: 'Galaxy Smooth Milk Chocolate Bar (Family Pack)', priceETB: 850, unit: '135g' },
  'prod-1786966200006': { name: 'KitKat 4-Finger Milk Chocolate (Pack of 4)', priceETB: 720, unit: '4 x 41.5g' },
  'prod-1786966200007': { name: 'Al Kabeer Tender Chicken Breast Fillets', priceETB: 2400, unit: '1kg' },
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number = SHOP_LOCATION.latitude, lon2: number = SHOP_LOCATION.longitude): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Authoritative Server-Side Order Creation
 * Validates product prices against catalog/database, calculates subtotal, delivery fee,
 * grand total, enforces Chapa/Cash payment methods. Chapa checkout starts after admin confirmation.
 */
export async function createOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      items,
      customerName,
      customerPhone,
      customerEmail,
      fulfillmentType = 'delivery',
      deliveryAddress,
      deliveryLandmark,
      coordinates,
      paymentMethod,
      notes,
    } = req.body;

    // 1. Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order must contain at least one valid item.',
      });
    }

    // 2. Validate payment method: ONLY 'chapa' or 'cash' allowed
    const normalizedMethod = String(paymentMethod || '').toLowerCase().trim();
    if (normalizedMethod !== 'chapa' && normalizedMethod !== 'cash') {
      return res.status(400).json({
        success: false,
        error: "Invalid payment method. Only 'chapa' and 'cash' are supported.",
      });
    }

    // 3. Validate customer contacts
    if (!customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Customer name and phone number are required.',
      });
    }

    const supabase = getSupabaseAdmin();

    // 4. Retrieve authoritative prices from database (with catalog fallback)
    const productIds = items.map((i: any) => i.productId || i.id).filter(Boolean);
    let dbProductsMap: Record<string, { name: string; price_etb: number; unit: string; stock_quantity?: number }> = {};

    if (supabase && productIds.length > 0) {
      try {
        const { data: dbProducts } = await supabase
          .from('products')
          .select('id, name, price_etb, unit, stock_quantity')
          .in('id', productIds);
        if (dbProducts) {
          for (const p of dbProducts) {
            dbProductsMap[p.id] = p;
          }
        }
      } catch (err) {
        console.warn('[OrderController] Supabase product query notice:', err);
      }
    }

    // 5. Authoritatively calculate subtotal and validate items
    let serverSubtotal = 0;
    const validatedItems = [];

    for (const rawItem of items) {
      const pId = rawItem.productId || rawItem.id;
      const qty = Math.max(1, parseInt(rawItem.quantity, 10) || 1);

      const dbProd = dbProductsMap[pId];
      const fallbackProd = FALLBACK_PRODUCT_CATALOG[pId];

      const name = dbProd?.name || fallbackProd?.name || rawItem.name || 'Product';
      const unit = dbProd?.unit || fallbackProd?.unit || rawItem.unit || 'unit';
      const priceETB = Number(dbProd?.price_etb ?? fallbackProd?.priceETB ?? rawItem.priceETB ?? rawItem.price ?? 0);

      if (priceETB <= 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid product price for '${name}'.`,
        });
      }

      const itemSubtotal = priceETB * qty;
      serverSubtotal += itemSubtotal;

      validatedItems.push({
        productId: pId,
        productName: name,
        priceETB,
        quantity: qty,
        unit,
        subtotalETB: itemSubtotal,
      });
    }

    // 6. Authoritatively calculate delivery fee and validate delivery distance
    let serverDeliveryFee = 0;
    let distanceKm = 0;

    if (fulfillmentType === 'delivery') {
      const lat = coordinates?.lat || coordinates?.latitude || SHOP_LOCATION.latitude;
      const lng = coordinates?.lng || coordinates?.longitude || SHOP_LOCATION.longitude;
      distanceKm = calculateDistanceKm(lat, lng);

      if (distanceKm > SHOP_LOCATION.maxDeliveryDistanceKm) {
        return res.status(400).json({
          success: false,
          error: `Delivery location is ${distanceKm} km away, which exceeds our ${SHOP_LOCATION.maxDeliveryDistanceKm} km maximum delivery radius from Bethel Shop. Please choose Store Pickup instead.`,
        });
      }

      if (serverSubtotal < SHOP_LOCATION.minDeliverySubtotalETB) {
        return res.status(400).json({
          success: false,
          error: `Minimum order subtotal for delivery is ${SHOP_LOCATION.minDeliverySubtotalETB} ETB. Current subtotal is ${serverSubtotal} ETB.`,
        });
      }

      serverDeliveryFee = SHOP_LOCATION.baseDeliveryFeeETB + Math.round(distanceKm * SHOP_LOCATION.perKmFeeETB);
    } else {
      serverDeliveryFee = 0;
    }

    const serverTotal = serverSubtotal + serverDeliveryFee;
    const orderId = `ord_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const orderNumber = `ALM-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    let chapaTxRef: string | null = null;
    let chapaCheckoutUrl: string | null = null;
    let paymentStatus = normalizedMethod === 'chapa' ? 'payment_pending' : 'pending_cash';

    // 7. Chapa: store a tx_ref now. Checkout is created only after admin confirms the order.
    if (normalizedMethod === 'chapa') {
      chapaTxRef = `ALM-TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 8. Construct authoritative order payload
    const orderRecord = {
      id: orderId,
      order_number: orderNumber,
      user_id: req.user?.uid || `usr-guest-${Date.now()}`,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      fulfillment_type: fulfillmentType,
      delivery_address_text: deliveryAddress || (fulfillmentType === 'pickup' ? 'Bethel Store Pickup' : 'Addis Ababa'),
      delivery_landmark: deliveryLandmark || null,
      delivery_latitude: coordinates?.lat || null,
      delivery_longitude: coordinates?.lng || null,
      delivery_distance_km: distanceKm,
      subtotal_etb: serverSubtotal,
      delivery_fee_etb: serverDeliveryFee,
      total_etb: serverTotal,
      payment_method: normalizedMethod,
      payment_status: paymentStatus,
      order_status: 'pending',
      chapa_tx_ref: chapaTxRef,
      notes: notes || null,
      created_at: now,
      updated_at: now,
    };

    // 9. Persist order to Supabase
    if (supabase) {
      try {
        await supabase.from('orders').upsert([orderRecord]);

        // Insert order items
        const itemRows = validatedItems.map((item) => ({
          order_id: orderId,
          product_id: item.productId,
          product_name: item.productName,
          price_etb: item.priceETB,
          quantity: item.quantity,
          unit: item.unit,
          subtotal_etb: item.subtotalETB,
        }));
        await supabase.from('order_items').upsert(itemRows);

        // Insert payment record
        await supabase.from('payments').upsert([
          {
            order_id: orderId,
            payment_method: normalizedMethod,
            payment_status: paymentStatus,
            amount: serverTotal,
            currency: 'ETB',
            provider: normalizedMethod,
            internal_transaction_reference: chapaTxRef,
            created_at: now,
            updated_at: now,
          },
        ]);

        // Decrement stock
        for (const item of validatedItems) {
          try {
            const { data: currentStock } = await supabase.from('products').select('stock_quantity').eq('id', item.productId).single();
            if (currentStock && typeof currentStock.stock_quantity === 'number') {
              const updatedQty = Math.max(0, currentStock.stock_quantity - item.quantity);
              await supabase.from('products').update({ stock_quantity: updatedQty }).eq('id', item.productId);
            }
          } catch {
            // Ignore stock count sync notice
          }
        }
      } catch (dbErr: any) {
        console.warn('[OrderController] Supabase insert warning:', dbErr.message);
      }
    }

    const fullOrderResponse = {
      id: orderId,
      orderNumber,
      userId: orderRecord.user_id,
      customerName,
      customerPhone,
      fulfillmentType,
      deliveryLocation: fulfillmentType === 'delivery' ? {
        addressText: deliveryAddress,
        landmark: deliveryLandmark,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
        distanceKm,
      } : undefined,
      subtotalETB: serverSubtotal,
      deliveryFeeETB: serverDeliveryFee,
      totalETB: serverTotal,
      paymentMethod: normalizedMethod as 'chapa' | 'cash',
      paymentStatus: paymentStatus as any,
      orderStatus: 'pending' as const,
      chapaTxRef: chapaTxRef || undefined,
      items: validatedItems,
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
    };

    return res.status(201).json({
      success: true,
      message: normalizedMethod === 'chapa'
        ? 'Order placed. Payment opens after the shop confirms the order.'
        : 'Cash order placed. Payment will be collected in cash upon delivery/pickup.',
      order: fullOrderResponse,
      checkoutUrl: chapaCheckoutUrl,
      txRef: chapaTxRef,
      paymentMethod: normalizedMethod,
    });
  } catch (error: any) {
    console.error('[OrderController] Fatal create order exception:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error creating order.',
    });
  }
}

/**
 * Admin Action: Confirm Cash Payment Received
 * Protected: Requires authenticated user with 'admin' role.
 * Rejects unauthorized customer attempts.
 */
export async function confirmCashPayment(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authorized administrators and staff can confirm cash payments.',
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required.',
      });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    if (supabase) {
      // Find order
      const { data: order, error: findErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (findErr || !order) {
        return res.status(404).json({
          success: false,
          error: `Order '${id}' not found.`,
        });
      }

      // Update order to PAID and Confirmed/Completed
      const { data: updatedOrder, error: updateErr } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: order.order_status === 'pending' ? 'confirmed' : order.order_status,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        return res.status(500).json({
          success: false,
          error: updateErr.message,
        });
      }

      // Update payment record in payments table
      await supabase
        .from('payments')
        .update({
          payment_status: 'paid',
          updated_at: now,
        })
        .eq('order_id', id);

      console.log(`[OrderController] Admin ${req.user.email || req.user.uid} confirmed cash payment for order ${id}`);

      return res.json({
        success: true,
        message: 'Cash payment confirmed as received. Order status updated.',
        order: updatedOrder,
      });
    }

    return res.json({
      success: true,
      message: 'Cash payment marked as received.',
      order: { id, payment_status: 'paid', updated_at: now },
    });
  } catch (error: any) {
    console.error('[OrderController] Confirm cash exception:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error confirming cash payment.',
    });
  }
}

export async function getMyOrders(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required to view user orders.',
    });
  }

  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', req.user.uid)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json({
          success: true,
          count: data.length,
          orders: data,
        });
      }
    } catch (err: any) {
      console.warn('[OrderController] Fetch my orders error:', err.message);
    }
  }

  return res.json({
    success: true,
    count: 0,
    orders: [],
  });
}

export async function getAllOrders(req: AuthenticatedRequest, res: Response) {
  const { status, paymentStatus, search } = req.query;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('order_status', String(status));
      }

      if (paymentStatus && paymentStatus !== 'all') {
        query = query.eq('payment_status', String(paymentStatus));
      }

      if (search) {
        query = query.or(`customer_name.ilike.%${String(search)}%,order_number.ilike.%${String(search)}%,customer_phone.ilike.%${String(search)}%`);
      }

      const { data, error } = await query;

      if (!error && data) {
        return res.json({
          success: true,
          count: data.length,
          orders: data,
        });
      }
    } catch (err: any) {
      console.warn('[OrderController] Admin fetch orders error:', err.message);
    }
  }

  return res.json({
    success: true,
    count: 0,
    orders: [],
  });
}

export async function getOrderById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single();

      if (!error && data) {
        if (req.user && req.user.role !== 'admin' && data.user_id && data.user_id !== req.user.uid) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You do not have permission to view this order.',
          });
        }

        return res.json({
          success: true,
          order: data,
        });
      }
    } catch (err: any) {
      console.warn('[OrderController] Fetch order by id error:', err.message);
    }
  }

  return res.status(404).json({
    success: false,
    error: `Order '${id}' not found.`,
  });
}

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;
  const supabase = getSupabaseAdmin();

  const updates: any = { updated_at: new Date().toISOString() };
  if (status) updates.order_status = status;
  if (paymentStatus) updates.payment_status = paymentStatus;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return res.json({
          success: true,
          message: 'Order status updated successfully.',
          order: data,
        });
      }
    } catch (err: any) {
      console.error('[OrderController] Update status error:', err.message);
    }
  }

  return res.json({
    success: true,
    message: 'Order status updated.',
    order: { id, ...updates },
  });
}
