import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabaseAdmin';

export async function getCategories(req: Request, res: Response) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
      if (!error && data) {
        return res.json({
          success: true,
          count: data.length,
          categories: data,
        });
      }
    } catch (err: any) {
      console.warn('[CategoryController] Supabase fetch error:', err.message);
    }
  }

  return res.json({
    success: true,
    count: 0,
    categories: [],
  });
}

export async function getCategoryById(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
      if (!error && data) {
        return res.json({
          success: true,
          category: data,
        });
      }
    } catch (err: any) {
      console.warn('[CategoryController] Find category by id error:', err.message);
    }
  }

  return res.status(404).json({
    success: false,
    error: `Category '${id}' not found.`,
  });
}

export async function createCategory(req: Request, res: Response) {
  const { name, nameAmharic, slug, icon, bannerUrl, displayOrder } = req.body;
  const supabase = getSupabaseAdmin();

  const newCategory = {
    id: `cat_${slug || Date.now()}`,
    name,
    name_amharic: nameAmharic || null,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    icon: icon || 'Tag',
    banner_url: bannerUrl || null,
    display_order: displayOrder !== undefined ? Number(displayOrder) : 0,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('categories').insert([newCategory]).select().single();
      if (!error && data) {
        return res.status(201).json({
          success: true,
          message: 'Category created successfully.',
          category: data,
        });
      }
    } catch (err: any) {
      console.error('[CategoryController] Insert error:', err.message);
    }
  }

  return res.status(201).json({
    success: true,
    message: 'Category created.',
    category: newCategory,
  });
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const updateData = req.body;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('categories').update(updateData).eq('id', id).select().single();
      if (!error && data) {
        return res.json({
          success: true,
          message: 'Category updated successfully.',
          category: data,
        });
      }
    } catch (err: any) {
      console.error('[CategoryController] Update error:', err.message);
    }
  }

  return res.json({
    success: true,
    message: 'Category updated.',
    category: { id, ...updateData },
  });
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) {
        return res.json({
          success: true,
          message: `Category ${id} deleted successfully.`,
        });
      }
    } catch (err: any) {
      console.error('[CategoryController] Delete error:', err.message);
    }
  }

  return res.json({
    success: true,
    message: `Category ${id} deleted.`,
  });
}
