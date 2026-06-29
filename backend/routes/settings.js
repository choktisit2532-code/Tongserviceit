import { Router } from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.json(data || {
      shop_name: 'ต้อง เซอร์วิส ไอที',
      address: '',
      phone: '',
      email: '',
      tax_id: '',
      scb_account: '',
      ktb_account: ''
    });
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const { data: existing, error: findError } = await supabase
      .from('shop_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;

    if (existing?.id) {
      const { data, error } = await supabase
        .from('shop_settings')
        .update(req.body)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw error;
      return res.json(data);
    }

    const { data, error } = await supabase
      .from('shop_settings')
      .insert(req.body)
      .select('*')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
