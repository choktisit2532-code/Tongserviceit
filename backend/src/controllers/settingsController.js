import { supabase } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

export async function getSettings(req, res, next) {
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (error) throw new HttpError(500, 'Cannot load settings', error.message);
    res.json(data);
  } catch (error) { next(error); }
}
