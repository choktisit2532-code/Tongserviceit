import { supabase } from './supabaseClient.js';

export async function applyStatusLinking(createdDocument) {
  const sourceIds = createdDocument.source_doc_ids || [];
  if (!sourceIds.length) return;

  if (['IN', 'DO', 'RC'].includes(createdDocument.doc_type)) {
    await supabase
      .from('documents')
      .update({ status: 'APPROVED' })
      .in('id', sourceIds)
      .eq('doc_type', 'QT')
      .neq('status', 'CANCELLED');
  }

  if (createdDocument.doc_type !== 'RC') return;

  // RC from IN => IN PAID and BN linked to that IN PAID
  const { data: sources, error } = await supabase
    .from('documents')
    .select('*')
    .in('id', sourceIds);

  if (error) throw error;

  const inIds = sources.filter((d) => d.doc_type === 'IN').map((d) => d.id);
  const bnIds = sources.filter((d) => d.doc_type === 'BN').map((d) => d.id);

  if (inIds.length) {
    await supabase
      .from('documents')
      .update({ status: 'PAID' })
      .in('id', inIds)
      .eq('doc_type', 'IN')
      .neq('status', 'CANCELLED');

    // Pay BN that references the same IN.
    const { data: bns, error: bnError } = await supabase
      .from('documents')
      .select('id')
      .eq('doc_type', 'BN')
      .overlaps('source_doc_ids', inIds);

    if (bnError) throw bnError;

    if (bns?.length) {
      await supabase
        .from('documents')
        .update({ status: 'PAID' })
        .in('id', bns.map((b) => b.id))
        .neq('status', 'CANCELLED');
    }
  }

  if (bnIds.length) {
    await supabase
      .from('documents')
      .update({ status: 'PAID' })
      .in('id', bnIds)
      .eq('doc_type', 'BN')
      .neq('status', 'CANCELLED');

    // If BN references IN, mark IN paid too.
    const { data: bns, error: bnError } = await supabase
      .from('documents')
      .select('source_doc_ids')
      .in('id', bnIds);

    if (bnError) throw bnError;

    const linkedInIds = [...new Set((bns || []).flatMap((b) => b.source_doc_ids || []))];

    if (linkedInIds.length) {
      await supabase
        .from('documents')
        .update({ status: 'PAID' })
        .in('id', linkedInIds)
        .eq('doc_type', 'IN')
        .neq('status', 'CANCELLED');
    }
  }
}
