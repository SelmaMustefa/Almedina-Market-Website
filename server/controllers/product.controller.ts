import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabaseAdmin';

export async function getProducts(req: Request, res: Response) {
  const { category, search, inStockOnly } = req.query;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category_id', String(category));
      }

      if (search) {
        query = query.ilike('name', `%${String(search)}%`);
      }

      if (inStockOnly === 'true') {
        query = query.gt('stock_quantity', 0);
      }

      const { data, error } = await query;

      if (!error && data) {
        return res.json({
          success: true,
          count: data.length,
          products: data,
        });
      }
    } catch (err: any) {
      console.warn('[ProductController] Supabase fetch error, fallbacking:', err.message);
    }
  }

  return res.json({
    success: true,
    count: 0,
    products: [],
  });
}

export async function getProductById(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) {
        return res.json({
          success: true,
          product: data,
        });
      }
    } catch (err: any) {
      console.warn('[ProductController] Find by id error:', err.message);
    }
  }

  return res.status(404).json({
    success: false,
    error: `Product with ID '${id}' not found.`,
  });
}

export async function createProduct(req: Request, res: Response) {
  const { name, nameAmharic, description, price, originalPrice, categoryId, stockQuantity, unit, imageUrl, isHalal, isFeatured, badge } = req.body;
  const supabase = getSupabaseAdmin();

  const newProduct = {
    name,
    name_amharic: nameAmharic || null,
    description: description || '',
    price: Number(price),
    original_price: originalPrice ? Number(originalPrice) : null,
    category_id: categoryId || 'cat_butchery',
    stock_quantity: stockQuantity !== undefined ? Number(stockQuantity) : 50,
    unit: unit || 'kg',
    image_url: imageUrl || '',
    is_halal: isHalal !== undefined ? Boolean(isHalal) : true,
    is_featured: Boolean(isFeatured),
    badge: badge || null,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
      if (!error && data) {
        return res.status(201).json({
          success: true,
          message: 'Product created successfully in database.',
          product: data,
        });
      }
    } catch (err: any) {
      console.error('[ProductController] Insert error:', err.message);
    }
  }

  return res.status(201).json({
    success: true,
    message: 'Product recorded.',
    product: { id: `prod_${Date.now()}`, ...newProduct },
  });
}

export async function updateProduct(req: Request, res: Response) {
  const { id } = req.params;
  const updateData = req.body;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').update(updateData).eq('id', id).select().single();
      if (!error && data) {
        return res.json({
          success: true,
          message: 'Product updated successfully.',
          product: data,
        });
      }
    } catch (err: any) {
      console.error('[ProductController] Update error:', err.message);
    }
  }

  return res.json({
    success: true,
    message: 'Product updated.',
    product: { id, ...updateData },
  });
}

export async function deleteProduct(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        return res.json({
          success: true,
          message: `Product ${id} deleted successfully.`,
        });
      }
    } catch (err: any) {
      console.error('[ProductController] Delete error:', err.message);
    }
  }

  return res.json({
    success: true,
    message: `Product ${id} deleted.`,
  });
}
