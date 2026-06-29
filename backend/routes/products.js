import { Router } from 'express';
import { supabase } from '../services/supabaseClient.js';
import { validateProduct } from '../services/validationService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (req.query.include_inactive !== 'true') query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = validateProduct(req.body);
    const { data, error } = await supabase.from('products').insert(payload).select('*').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = { ...validateProduct(req.body), updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('products').update(payload).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json({ ok: true, product: data });
  } catch (err) { next(err); }
});

export default router;
