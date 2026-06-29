import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { nextDocumentNumber } from '../services/documentService.js';

const itemSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().positive(),
  price: z.coerce.number().nonnegative()
});

const documentSchema = z.object({
  type: z.enum(['QT', 'IN', 'BN', 'RC', 'DO']),
  date: z.string().date(),
  due_date: z.string().date().nullable().optional(),
  customer_id: z.string().min(1),
  discount: z.coerce.number().nonnegative().default(0),
  withholding_tax: z.coerce.number().nonnegative().default(0),
  transfer_fee: z.coerce.number().nonnegative().default(0),
  remarks: z.string().default(''),
  status: z.enum(['PENDING', 'APPROVED', 'PAID']).default('PENDING'),
  sig_type: z.enum(['canvas', 'saved', 'none']).default('none'),
  items: z.array(itemSchema).min(1)
});

export async function listDocuments(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*, customers(id,name,type)')
      .order('date', { ascending: false });
    if (error) throw new HttpError(500, 'Cannot load documents', error.message);
    res.json(data);
  } catch (error) { next(error); }
}

export async function generateNumber(req, res, next) {
  try {
    const type = z.enum(['QT', 'IN', 'BN', 'RC', 'DO']).parse(req.query.type);
    const date = z.string().date().parse(req.query.date);
    res.json({ number: await nextDocumentNumber(type, date) });
  } catch (error) { next(error); }
}

export async function createDocument(req, res, next) {
  try {
    const input = documentSchema.parse(req.body);
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const grandTotal = Math.max(0, subtotal - input.discount - input.withholding_tax + input.transfer_fee);
    const number = await nextDocumentNumber(input.type, input.date);

    const payload = { ...input, number, subtotal, grand_total: grandTotal };
    const { data, error } = await supabase.from('documents').insert(payload).select().single();
    if (error) throw new HttpError(500, 'Cannot save document', error.message);

    if (input.type === 'RC') {
      const invoiceNumbers = input.remarks.match(/IN\d+-\d+/g) || [];
      if (invoiceNumbers.length) {
        await supabase.from('documents').update({ status: 'PAID' }).in('number', invoiceNumbers);
      }
    }
    res.status(201).json(data);
  } catch (error) {
    if (error instanceof z.ZodError) return next(new HttpError(400, 'Invalid document data', error.flatten()));
    next(error);
  }
}
