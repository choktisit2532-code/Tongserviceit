import { supabase } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

export async function nextDocumentNumber(type, dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, 'Invalid document date');

  const yearBE = date.getFullYear() + 543;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const suffix = `${String(yearBE).slice(-2)}${month}`;

  const { data, error } = await supabase
    .from('documents')
    .select('number')
    .eq('type', type)
    .like('number', `${type}%-${suffix}`)
    .order('number', { ascending: false })
    .limit(1);

  if (error) throw new HttpError(500, 'Cannot generate document number', error.message);

  let sequence = 1;
  if (data?.[0]?.number) {
    const match = data[0].number.match(/^[A-Z]+(\d+)-/);
    if (match) sequence = Number(match[1]) + 1;
  }
  return `${type}${String(sequence).padStart(3, '0')}-${suffix}`;
}
