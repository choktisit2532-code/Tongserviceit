import { supabase } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

export const listTable = (table, orderBy = 'created_at') => async (req, res, next) => {
  try {
    const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending: false });
    if (error) throw new HttpError(500, `Cannot load ${table}`, error.message);
    res.json(data);
  } catch (error) { next(error); }
};
