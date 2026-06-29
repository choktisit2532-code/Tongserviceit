import { Router } from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = Router();

router.get('/monthly', async (req, res, next) => {
  try {
    const month = String(req.query.month || '').padStart(2, '0');
    const year = String(req.query.year || new Date().getFullYear());
    const customerType = req.query.customer_type || '';

    const start = `${year}-${month}-01`;
    const endDate = new Date(Number(year), Number(month), 0);
    const end = `${year}-${month}-${String(endDate.getDate()).padStart(2, '0')}`;

    let query = supabase
      .from('documents')
      .select('*, customers(name, customer_type)')
      .eq('doc_type', 'RC')
      .neq('status', 'CANCELLED')
      .gte('doc_date', start)
      .lte('doc_date', end)
      .order('doc_date', { ascending: true });

    if (customerType) query = query.eq('customer_type', customerType);

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    const summary = rows.reduce((acc, row) => {
      acc.total_sales += Number(row.subtotal || 0);
      acc.total_withholding_tax += Number(row.withholding_tax || 0);
      acc.total_transfer_fee += Number(row.transfer_fee || 0);
      acc.total_net_transfer += Number(row.net_total || 0);
      return acc;
    }, {
      total_sales: 0,
      total_withholding_tax: 0,
      total_transfer_fee: 0,
      total_net_transfer: 0
    });

    res.json({ summary, rows });
  } catch (err) { next(err); }
});

export default router;
