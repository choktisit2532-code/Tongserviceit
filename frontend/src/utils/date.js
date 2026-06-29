export function toISODate(date = new Date()) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

export function formatThaiDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

export function addDaysISO(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days));
  return toISODate(d);
}

export function diffDays(start, end) {
  const a = new Date(start);
  const b = new Date(end);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}
