/** Convierte un Date (o string parseable) a 'YYYY-MM-DD' usando la fecha local, sin desfase de zona horaria. */
export function toIsoDate(d: any): string | undefined {
  if (!d) return undefined;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Convierte 'YYYY-MM-DD' (o ISO datetime) a Date en hora local, evitando el desfase UTC→local. */
export function isoToLocalDate(s: any): Date | null {
  if (!s) return null;
  const str = String(s).slice(0, 10);
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
