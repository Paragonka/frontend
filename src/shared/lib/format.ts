export function formatCurrency(amount?: number | string | null, currency: string = 'PLN'): string {
  const value = Number(amount)
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
  }).format(Number.isFinite(value) ? value : 0)
}

/**
 * Formats a Date as a local calendar date `YYYY-MM-DD` without any UTC
 * conversion. Unlike `toISOString().split('T')[0]`, this never shifts the
 * date for timezones east of UTC (e.g. Europe/Warsaw) where the UTC date
 * can be one day behind the local one.
 */
export function formatDateOnly(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDate(date: string | Date): string {
  if (!date || (typeof date === 'string' && !date.trim())) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}
