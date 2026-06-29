import { supabase } from './supabaseClient.js';

export async function generateDocumentNumber(docType, docDate) {
  const date = new Date(docDate);
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${yy}${mm}`;

  // Preferred: atomic PostgreSQL function from database/schema.sql
  const { data: rpcData, error: rpcError } = await supabase.rpc('next_document_no', {
    p_doc_type: docType,
    p_year_month: yearMonth
  });

  if (!rpcError && rpcData) {
    return rpcData;
  }

  // Fallback for incomplete database setup.
  const { data: existing, error: selectError } = await supabase
    .from('document_counters')
    .select('*')
    .eq('doc_type', docType)
    .eq('year_month', yearMonth)
    .maybeSingle();

  if (selectError) throw selectError;

  const next = (existing?.last_number || 0) + 1;

  if (existing) {
    const { error } = await supabase
      .from('document_counters')
      .update({ last_number: next })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('document_counters')
      .insert({ doc_type: docType, year_month: yearMonth, last_number: next });
    if (error) throw error;
  }

  return `${docType}${String(next).padStart(3, '0')}-${yearMonth}`;
}
