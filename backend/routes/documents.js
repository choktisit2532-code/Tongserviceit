import { Router } from 'express';
import { supabase } from '../services/supabaseClient.js';
import { generateDocumentNumber } from '../services/documentNumberService.js';
import { calculateTotals } from '../services/taxService.js';
import { applyStatusLinking } from '../services/statusService.js';
import {
  assertAllowedDocType,
  assertDueDateRule,
  assertItems,
  getInitialStatus
} from '../services/documentRuleService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*, customers(name, customer_type, phone, address, tax_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*, customers(*), document_items(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      doc_type,
      doc_date,
      due_date,
      customer_id,
      source_doc_ids = [],
      note = '',
      items = []
    } = req.body;

    assertItems(items);

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      const err = new Error('ไม่พบข้อมูลลูกค้า');
      err.status = 400;
      throw err;
    }

    assertAllowedDocType(customer.customer_type, doc_type);
    assertDueDateRule(doc_type, doc_date, due_date);

    if (source_doc_ids.length) {
      const { data: sourceDocs, error: sourceError } = await supabase
        .from('documents')
        .select('id, doc_no, doc_type, customer_id')
        .in('id', source_doc_ids);

      if (sourceError) throw sourceError;

      if (sourceDocs.length !== source_doc_ids.length) {
        const err = new Error('เอกสารต้นทางไม่ถูกต้อง');
        err.status = 400;
        throw err;
      }

      for (const src of sourceDocs) {
        if (src.customer_id !== customer_id) {
          const err = new Error('เอกสารต้นทางต้องเป็นของลูกค้าคนเดียวกัน');
          err.status = 400;
          throw err;
        }
      }
    }

    const sourceDocNos = source_doc_ids.length
      ? (await supabase.from('documents').select('doc_no').in('id', source_doc_ids)).data.map((d) => d.doc_no)
      : [];

    const cleanItems = items.map((item) => ({
      product_id: item.product_id || null,
      description: item.description,
      qty: Number(item.qty),
      unit_price: Number(item.unit_price),
      total: Number(item.qty) * Number(item.unit_price)
    }));

    const { data: shopSettings, error: settingsError } = await supabase
      .from('shop_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (settingsError) throw settingsError;

    const totals = calculateTotals({
      customerType: customer.customer_type,
      docType: doc_type,
      items: cleanItems
    });

    const docNo = await generateDocumentNumber(doc_type, doc_date);

    const documentPayload = {
      doc_type,
      doc_no: docNo,
      doc_date,
      due_date: ['QT', 'BN', 'IN'].includes(doc_type) ? due_date || null : null,
      customer_id,
      customer_type: customer.customer_type,
      source_doc_ids,
      source_doc_nos: sourceDocNos,
      ...totals,
      note: String(note || '').trim(),
      customer_snapshot: {
        name: customer.name,
        customer_type: customer.customer_type,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        tax_id: customer.tax_id
      },
      shop_snapshot: shopSettings ? {
        shop_name: shopSettings.shop_name,
        address: shopSettings.address,
        phone: shopSettings.phone,
        email: shopSettings.email,
        tax_id: shopSettings.tax_id,
        scb_account: shopSettings.scb_account,
        ktb_account: shopSettings.ktb_account,
        logo_url: shopSettings.logo_url
      } : null,
      status: getInitialStatus(doc_type)
    };

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert(documentPayload)
      .select('*')
      .single();

    if (docError) throw docError;

    const itemPayloads = cleanItems.map((item) => ({
      ...item,
      document_id: document.id
    }));

    const { error: itemError } = await supabase.from('document_items').insert(itemPayloads);
    if (itemError) throw itemError;

    await applyStatusLinking(document);

    const { data: fullDocument, error: fullError } = await supabase
      .from('documents')
      .select('*, customers(*), document_items(*)')
      .eq('id', document.id)
      .single();

    if (fullError) throw fullError;

    res.status(201).json(fullDocument);
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const { status, reason = '' } = req.body;

    if (status !== 'CANCELLED') {
      const err = new Error('Starter นี้รองรับการเปลี่ยนสถานะด้วยมือเฉพาะ CANCELLED');
      err.status = 400;
      throw err;
    }

    const { data, error } = await supabase
      .from('documents')
      .update({
        status,
        cancellation_reason: String(reason || '').trim() || null,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { data: document, error: findError } = await supabase
      .from('documents').select('id, status, doc_no').eq('id', req.params.id).single();
    if (findError) throw findError;
    if (document.status !== 'DRAFT') {
      const err = new Error('ลบได้เฉพาะเอกสารสถานะ DRAFT เท่านั้น เอกสารที่ออกแล้วให้ใช้การยกเลิก');
      err.status = 400;
      throw err;
    }
    const { error } = await supabase.from('documents').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true, doc_no: document.doc_no });
  } catch (err) { next(err); }
});

export default router;
