import { createClient } from '@supabase/supabase-js';
import { Category, Product, Order, Review, ReturnReport, ContactSubmission, NamedShoppingList } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Verifies Supabase connection health
 */
export async function syncFirebaseUserToSupabase(user: {
  id: string;
  email?: string;
  name?: string;
  phoneNumber?: string;
  avatar?: string;
  role?: string;
}): Promise<boolean> {
  try {
    const payload = {
      firebase_uid: user.id,
      email: user.email || null,
      name: user.name || null,
      phone: user.phoneNumber || null,
      avatar: user.avatar || null,
      role: user.role || 'customer',
      updated_at: new Date().toISOString(),
    };

    // 1. Try upsert with firebase_uid
    const { error: err1 } = await supabase.from('users').upsert(payload, { onConflict: 'firebase_uid' });
    if (!err1) return true;

    // 2. Try upsert with id primary key
    const payloadWithId = { id: user.id, ...payload };
    const { error: err2 } = await supabase.from('users').upsert(payloadWithId);
    if (!err2) return true;

    // 3. Fallback: try profiles table
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email || null,
        name: user.name || null,
        phone: user.phoneNumber || null,
        avatar: user.avatar || null,
        role: user.role || 'customer',
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Ignore fallback profiles error
    }

    return true;
  } catch (err) {
    console.warn('syncFirebaseUserToSupabase non-fatal warning:', err);
    return false;
  }
}

export async function checkSupabaseConnection(): Promise<{ connected: boolean; url: string; error?: string }> {
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1);
    if (!error) return { connected: true, url: supabaseUrl };
    
    // Check ping
    const pingRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: supabaseAnonKey },
    }).catch(() => null);

    if (pingRes && (pingRes.ok || pingRes.status === 401 || pingRes.status === 200)) {
      return { connected: true, url: supabaseUrl };
    }
    return { connected: false, url: supabaseUrl, error: error?.message };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { connected: false, url: supabaseUrl, error: errorMsg };
  }
}

// ─── Categories Sync ───────────────────────────────────────────────────────
export async function fetchCategoriesFromSupabase(): Promise<Category[] | null> {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return null;
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      arabicName: row.arabic_name || row.arabicName || undefined,
      description: row.description || '',
      iconName: row.icon_name || row.iconName || 'Package',
      image: row.image || '',
      sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    }));
  } catch (err) {
    console.warn('fetchCategoriesFromSupabase error:', err);
    return null;
  }
}

export async function upsertCategoryToSupabase(category: Category, sortOrder = 0): Promise<boolean> {
  try {
    const payload = {
      id: category.id,
      name: category.name,
      arabic_name: category.arabicName || null,
      description: category.description || '',
      icon_name: category.iconName || 'Package',
      image: category.image || '',
      sort_order: category.sortOrder ?? sortOrder,
    };
    const { error } = await supabase.from('categories').upsert(payload);
    if (error) {
      console.warn(`upsertCategoryToSupabase (${category.id}) error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`upsertCategoryToSupabase (${category.id}) exception:`, err);
    return false;
  }
}

export async function deleteCategoryFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function syncCategoriesToSupabase(categoriesList: Category[]): Promise<boolean> {
  try {
    if (!categoriesList || categoriesList.length === 0) return true;
    const payloads = categoriesList.map((cat, idx) => ({
      id: cat.id,
      name: cat.name,
      arabic_name: cat.arabicName || null,
      description: cat.description || '',
      icon_name: cat.iconName || 'Package',
      image: cat.image || '',
      sort_order: cat.sortOrder ?? (idx + 1),
    }));
    const { error } = await supabase.from('categories').upsert(payloads);
    if (error) {
      console.warn('syncCategoriesToSupabase error:', error.message);
      // Fallback: try individual upserts
      for (const cat of categoriesList) {
        await upsertCategoryToSupabase(cat);
      }
    }
    return true;
  } catch (err) {
    console.warn('syncCategoriesToSupabase exception:', err);
    return false;
  }
}

export async function syncAllCatalogToSupabase(
  categoriesList: Category[],
  productsList: Product[]
): Promise<{ categoriesSynced: number; productsSynced: number; error?: string }> {
  try {
    // 1. Sync Categories first (so foreign keys in products table are satisfied)
    let catCount = 0;
    for (let i = 0; i < categoriesList.length; i++) {
      const ok = await upsertCategoryToSupabase(categoriesList[i], i + 1);
      if (ok) catCount++;
    }

    // 2. Sync Products
    let prodCount = 0;
    for (const prod of productsList) {
      const ok = await upsertProductToSupabase(prod);
      if (ok) prodCount++;
    }

    return { categoriesSynced: catCount, productsSynced: prodCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { categoriesSynced: 0, productsSynced: 0, error: msg };
  }
}

// ─── Products Sync ─────────────────────────────────────────────────────────
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error || !data) return null;
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      arabicName: row.arabic_name || row.arabicName,
      categoryId: row.category_id || row.categoryId,
      priceETB: Number(row.price_etb ?? row.priceETB ?? 0),
      unit: row.unit,
      image: row.image,
      stockCount: Number(row.stock_count ?? row.stockCount ?? 0),
      lowStockThreshold: Number(row.low_stock_threshold ?? row.lowStockThreshold ?? 2),
      isAvailable: Boolean(row.is_available ?? row.isAvailable ?? true),
      description: row.description || '',
      origin: row.origin || 'Imported',
      rating: Number(row.rating ?? 5.0),
      reviewCount: Number(row.review_count ?? row.reviewCount ?? 0),
      isPopular: Boolean(row.is_popular ?? row.isPopular ?? false),
      isImported: Boolean(row.is_imported ?? row.isImported ?? true),
    }));
  } catch {
    return null;
  }
}

export async function upsertProductToSupabase(product: Product): Promise<boolean> {
  try {
    // Ensure category exists in categories table so FK constraint is satisfied
    if (product.categoryId) {
      await supabase.from('categories').upsert({
        id: product.categoryId,
        name: product.categoryId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: '',
        icon_name: 'Package',
        image: product.image || '',
        sort_order: 99,
      }, { onConflict: 'id', ignoreDuplicates: true });
    }

    const payload = {
      id: product.id,
      name: product.name,
      arabic_name: product.arabicName || null,
      category_id: product.categoryId,
      price_etb: Number(product.priceETB || 0),
      unit: product.unit || '1 unit',
      image: product.image || '',
      stock_count: Number(product.stockCount ?? 0),
      low_stock_threshold: Number(product.lowStockThreshold ?? 5),
      is_available: Boolean(product.isAvailable ?? true),
      description: product.description || '',
      origin: product.origin || 'Imported',
      rating: Number(Number(product.rating ?? 5.0).toFixed(1)),
      review_count: Number(product.reviewCount ?? 0),
      is_popular: Boolean(product.isPopular ?? false),
      is_imported: Boolean(product.isImported ?? true),
    };
    const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn(`upsertProductToSupabase (${product.id}) error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`upsertProductToSupabase (${product.id}) exception:`, err);
    return false;
  }
}

export async function deleteProductFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ─── Orders Sync ───────────────────────────────────────────────────────────
export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  try {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) {
      if (error) console.warn('Supabase fetchOrders warning:', error.message);
      return null;
    }

    // Attempt to also fetch normalized order_items if table exists
    let itemsByOrderId = new Map<string, any[]>();
    try {
      const { data: orderItemRows } = await supabase.from('order_items').select('*');
      if (orderItemRows && orderItemRows.length > 0) {
        orderItemRows.forEach((itemRow: any) => {
          const oid = itemRow.order_id || itemRow.orderId;
          if (!oid) return;
          const currentList = itemsByOrderId.get(oid) || [];
          currentList.push({
            productId: itemRow.product_id || itemRow.productId || 'prod-custom',
            productName: itemRow.product_name || itemRow.productName || 'Ordered Item',
            priceETB: Number(itemRow.price_etb ?? itemRow.priceETB ?? 0),
            quantity: Number(itemRow.quantity ?? 1),
            unit: itemRow.unit || 'item',
            subtotalETB: Number(itemRow.subtotal_etb ?? itemRow.subtotalETB ?? 0),
          });
          itemsByOrderId.set(oid, currentList);
        });
      }
    } catch {
      // order_items table fetch optional
    }

    return data.map((row) => {
      let items = row.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch { items = []; }
      }
      // If row.items is empty or not present, check itemsByOrderId
      if ((!items || !Array.isArray(items) || items.length === 0) && itemsByOrderId.has(row.id)) {
        items = itemsByOrderId.get(row.id);
      }

      let deliveryLocation = row.delivery_location || row.deliveryLocation || undefined;
      if (typeof deliveryLocation === 'string') {
        try { deliveryLocation = JSON.parse(deliveryLocation); } catch { deliveryLocation = undefined; }
      }
      let rawMethod = String(row.payment_method || row.paymentMethod || 'cash').toLowerCase();
      let normalizedMethod: 'chapa' | 'cash' = 'cash';
      if (rawMethod === 'chapa' || rawMethod === 'telebirr' || rawMethod === 'cbe_birr' || rawMethod === 'online') {
        normalizedMethod = 'chapa';
      } else {
        normalizedMethod = 'cash';
      }

      let rawPaymentStatus = String(row.payment_status || row.paymentStatus || 'unpaid');
      let normalizedPaymentStatus: any = rawPaymentStatus;
      if (rawPaymentStatus === 'unpaid' && normalizedMethod === 'cash') {
        normalizedPaymentStatus = 'pending_cash';
      }

      return {
        id: row.id,
        orderNumber: row.order_number || row.orderNumber,
        userId: row.user_id || row.userId,
        customerName: row.customer_name || row.customerName,
        customerPhone: row.customer_phone || row.customerPhone,
        fulfillmentType: row.fulfillment_type || row.fulfillmentType,
        deliveryLocation,
        subtotalETB: Number(row.subtotal_etb ?? row.subtotalETB ?? 0),
        deliveryFeeETB: Number(row.delivery_fee_etb ?? row.deliveryFeeETB ?? 0),
        totalETB: Number(row.total_etb ?? row.totalETB ?? 0),
        paymentMethod: normalizedMethod,
        paymentStatus: normalizedPaymentStatus,
        orderStatus: row.order_status || row.orderStatus,
        chapaTxRef: row.chapa_tx_ref || row.chapaTxRef || undefined,
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt,
        items: Array.isArray(items) ? items : [],
        notes: row.notes || undefined,
        cancellationReason: row.cancellation_reason || row.cancellationReason || undefined,
      };
    });
  } catch (err) {
    console.error('Exception fetching orders from Supabase:', err);
    return null;
  }
}

export async function syncPaymentRecordToSupabase(payment: {
  orderId: string;
  paymentMethod: 'chapa' | 'cash';
  paymentStatus: string;
  amount: number;
  currency?: string;
  provider?: 'chapa' | 'cash';
  providerTransactionId?: string;
  internalTransactionReference?: string;
}): Promise<boolean> {
  try {
    const payload = {
      order_id: payment.orderId,
      payment_method: payment.paymentMethod,
      payment_status: payment.paymentStatus,
      amount: payment.amount,
      currency: payment.currency || 'ETB',
      provider: payment.provider || payment.paymentMethod,
      provider_transaction_id: payment.providerTransactionId || null,
      internal_transaction_reference: payment.internalTransactionReference || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('payments').upsert(payload, { onConflict: 'order_id' });
    if (error) {
      console.warn('syncPaymentRecordToSupabase note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('syncPaymentRecordToSupabase exception:', err);
    return false;
  }
}

export async function upsertOrderToSupabase(
  order: Order,
  user?: { id: string; email?: string; name?: string; phoneNumber?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Ensure user record exists in Supabase if user info is available
    if (user) {
      await syncFirebaseUserToSupabase(user);
    }

    // 2. Full payload with snake_case naming
    const fullPayload: Record<string, any> = {
      id: order.id,
      order_number: order.orderNumber,
      user_id: order.userId,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      fulfillment_type: order.fulfillmentType,
      subtotal_etb: order.subtotalETB,
      delivery_fee_etb: order.deliveryFeeETB,
      total_etb: order.totalETB,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      chapa_tx_ref: order.chapaTxRef || null,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      items: typeof order.items === 'object' ? order.items : [],
      notes: order.notes || null,
      cancellation_reason: order.cancellationReason || null,
    };

    if (order.deliveryLocation) {
      fullPayload.delivery_location = order.deliveryLocation;
    }

    // Try primary full payload upsert
    const { error: fullErr } = await supabase.from('orders').upsert(fullPayload);
    if (!fullErr) {
      console.log('✅ Order saved to Supabase (full payload upsert):', order.id);
      syncOrderItemsToSupabase(order);
      return { success: true };
    }

    console.warn('⚠️ Primary Supabase order upsert note:', fullErr.message);

    // Fallback 1: Strip delivery_location (if missing from schema) & stringify items
    const safePayload = { ...fullPayload };
    delete safePayload.delivery_location;
    if (typeof safePayload.items !== 'string') {
      safePayload.items = JSON.stringify(safePayload.items);
    }

    const { error: safeErr } = await supabase.from('orders').upsert(safePayload);
    if (!safeErr) {
      console.log('✅ Order saved to Supabase (safe payload fallback):', order.id);
      syncOrderItemsToSupabase(order);
      return { success: true };
    }

    // Fallback 2: Minimal core payload upsert
    const corePayload = {
      id: order.id,
      order_number: order.orderNumber,
      user_id: order.userId,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      fulfillment_type: order.fulfillmentType,
      subtotal_etb: order.subtotalETB,
      delivery_fee_etb: order.deliveryFeeETB,
      total_etb: order.totalETB,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };

    const { error: coreErr } = await supabase.from('orders').upsert(corePayload);
    if (!coreErr) {
      console.log('✅ Order saved to Supabase (core payload fallback):', order.id);
      syncOrderItemsToSupabase(order);
      return { success: true };
    }

    // Fallback 3: Omit user_id (if user_id foreign key constraint fails)
    const { user_id, ...noUserPayload } = corePayload as any;
    const { error: noUserErr } = await supabase.from('orders').upsert(noUserPayload);
    if (!noUserErr) {
      console.log('✅ Order saved to Supabase (no user_id fallback):', order.id);
      syncOrderItemsToSupabase(order);
      return { success: true };
    }

    console.error('❌ Supabase order upsert failed:', coreErr.message || noUserErr?.message);
    return { success: false, error: coreErr.message || noUserErr?.message };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('❌ Exception during Supabase order upsert:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// Helper to safely insert into order_items table
async function syncOrderItemsToSupabase(order: Order) {
  if (order.items && order.items.length > 0) {
    try {
      const orderItemRows = order.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        price_etb: item.priceETB,
        quantity: item.quantity,
        unit: item.unit,
        subtotal_etb: item.subtotalETB,
      }));
      await supabase.from('order_items').upsert(orderItemRows, { onConflict: 'order_id,product_id' });
    } catch {
      // Ignore order_items sync warning
    }
  }
}

// ─── Reviews Sync ──────────────────────────────────────────────────────────
export async function fetchReviewsFromSupabase(): Promise<Review[] | null> {
  try {
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return null;
    return data.map((row) => ({
      id: row.id,
      productId: row.product_id || row.productId,
      orderId: row.order_id || row.orderId,
      userId: row.user_id || row.userId,
      userName: row.user_name || row.userName,
      rating: Number(row.rating),
      comment: row.comment,
      createdAt: row.created_at || row.createdAt,
      status: row.status,
    }));
  } catch {
    return null;
  }
}

export async function upsertReviewToSupabase(review: Review): Promise<boolean> {
  try {
    const payload = {
      id: review.id,
      product_id: review.productId,
      order_id: review.orderId,
      user_id: review.userId,
      user_name: review.userName,
      rating: review.rating,
      comment: review.comment,
      created_at: review.createdAt,
      status: review.status,
    };
    const { error } = await supabase.from('reviews').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

// ─── Contact Submissions Sync ──────────────────────────────────────────────
export async function fetchContactsFromSupabase(): Promise<ContactSubmission[] | null> {
  try {
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return null;
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      message: row.message,
      createdAt: row.created_at || row.createdAt,
      isRead: Boolean(row.is_read ?? row.isRead ?? false),
    }));
  } catch {
    return null;
  }
}

export async function upsertContactToSupabase(contact: ContactSubmission): Promise<boolean> {
  try {
    const payload = {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      message: contact.message,
      created_at: contact.createdAt,
      is_read: contact.isRead,
    };
    const { error } = await supabase.from('contacts').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

// ─── Return Reports Sync ───────────────────────────────────────────────────
export async function fetchReturnsFromSupabase(): Promise<ReturnReport[] | null> {
  try {
    const { data, error } = await supabase.from('returns').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return null;
    return data.map((row) => ({
      id: row.id,
      orderId: row.order_id || row.orderId,
      orderNumber: row.order_number || row.orderNumber,
      userId: row.user_id || row.userId,
      userName: row.user_name || row.userName,
      userPhone: row.user_phone || row.userPhone,
      reason: row.reason,
      photoUrl: row.photo_url || row.photoUrl,
      notes: row.notes,
      createdAt: row.created_at || row.createdAt,
      status: row.status,
      adminResolution: row.admin_resolution || row.adminResolution || undefined,
      adminResponseNotes: row.admin_response_notes || row.adminResponseNotes || undefined,
    }));
  } catch {
    return null;
  }
}

export async function upsertReturnToSupabase(returnReport: ReturnReport): Promise<boolean> {
  try {
    const payload = {
      id: returnReport.id,
      order_id: returnReport.orderId,
      order_number: returnReport.orderNumber,
      user_id: returnReport.userId,
      user_name: returnReport.userName,
      user_phone: returnReport.userPhone,
      reason: returnReport.reason,
      photo_url: returnReport.photoUrl,
      notes: returnReport.notes,
      created_at: returnReport.createdAt,
      status: returnReport.status,
      admin_resolution: returnReport.adminResolution || null,
      admin_response_notes: returnReport.adminResponseNotes || null,
    };
    const { error } = await supabase.from('returns').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

// ─── User Saved Products / Bookmarks Sync ─────────────────────────────────
export async function fetchUserSavedProductIds(userId: string): Promise<string[] | null> {
  if (!userId) return null;
  try {
    // 1. Try dedicated user_favorites / user_saved_products table
    const { data: favData, error: favErr } = await supabase
      .from('user_favorites')
      .select('product_id')
      .eq('user_id', userId);

    if (!favErr && Array.isArray(favData) && favData.length > 0) {
      return favData.map((row) => row.product_id).filter(Boolean);
    }

    // 2. Try user profile saved_products column
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('saved_products, favorites')
      .or(`id.eq.${userId},firebase_uid.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    if (!userErr && userData) {
      const saved = userData.saved_products || userData.favorites;
      if (Array.isArray(saved)) return saved;
      if (typeof saved === 'string') {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // ignore
        }
      }
    }

    // 3. Fallback: try profiles table
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('saved_products, favorites')
      .eq('id', userId)
      .limit(1)
      .maybeSingle();

    if (!profileErr && profileData) {
      const saved = profileData.saved_products || profileData.favorites;
      if (Array.isArray(saved)) return saved;
    }

    return null;
  } catch (err) {
    console.warn('fetchUserSavedProductIds non-fatal notice:', err);
    return null;
  }
}

export async function saveUserSavedProductIds(userId: string, productIds: string[]): Promise<boolean> {
  if (!userId) return false;
  try {
    const cleanIds = Array.from(new Set(productIds));

    // 1. Try updating users / profiles table with JSON array
    const { error: userUpdateErr } = await supabase
      .from('users')
      .update({ saved_products: cleanIds, updated_at: new Date().toISOString() })
      .or(`id.eq.${userId},firebase_uid.eq.${userId}`);

    // Also try updating profiles table if present
    try {
      await supabase
        .from('profiles')
        .update({ saved_products: cleanIds, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch {
      // ignore
    }

    // 2. Try updating user_favorites table (delete old + insert current)
    try {
      await supabase.from('user_favorites').delete().eq('user_id', userId);
      if (cleanIds.length > 0) {
        const rows = cleanIds.map((pid) => ({
          user_id: userId,
          product_id: pid,
          created_at: new Date().toISOString(),
        }));
        await supabase.from('user_favorites').insert(rows);
      }
    } catch {
      // Table might not exist; users JSON column was already attempted
    }

    return !userUpdateErr;
  } catch (err) {
    console.warn('saveUserSavedProductIds non-fatal notice:', err);
    return false;
  }
}

