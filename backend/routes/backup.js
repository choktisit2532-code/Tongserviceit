import { Router } from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = Router();

const tables = [
  'shop_settings',
  'customers',
  'products',
  'documents',
  'document_items',
  'document_counters'
];

router.get('/export', async (req, res, next) => {
  try {
    const backup = {};
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      backup[table] = data || [];
    }

    const today = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tong-service-it-backup-${today}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) { next(err); }
});

router.post('/import', async (req, res, next) => {
  try {
    const payload = req.body;

    for (const table of tables) {
      if (!Array.isArray(payload[table])) {
        const err = new Error(`ไฟล์ JSON ไม่ถูกต้อง: ไม่พบ ${table}`);
        err.status = 400;
        throw err;
      }
    }

    // Important order: master data first, documents next, items last.
    for (const table of ['shop_settings', 'customers', 'products', 'documents', 'document_items', 'document_counters']) {
      if (!payload[table].length) continue;
      const { error } = await supabase.from(table).upsert(payload[table], { onConflict: 'id' });
      if (error) throw error;
    }

    res.json({ ok: true, imported_tables: tables });
  } catch (err) { next(err); }
});

export default router;
