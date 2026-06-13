import { formatCurrency, formatDate, formatDateOnly } from '@/shared/lib/format'

describe('formatCurrency', () => {
  it('formats amount in PLN by default', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('zł')
    expect(result).toContain('1234,56')
  })

  it('formats amount in EUR', () => {
    const result = formatCurrency(99.99, 'EUR')
    expect(result).toContain('€')
    expect(result).toContain('99,99')
  })

  it('formats undefined as 0 PLN', () => {
    const result = formatCurrency(undefined)
    expect(result).toContain('zł')
    expect(result).toContain('0,00')
  })

  it('formats null as 0 PLN', () => {
    const result = formatCurrency(null)
    expect(result).toContain('zł')
    expect(result).toContain('0,00')
  })

  it('formats NaN as 0 PLN', () => {
    const result = formatCurrency(NaN)
    expect(result).toContain('0,00')
  })

  it('formats Infinity as 0 PLN', () => {
    const result = formatCurrency(Infinity)
    expect(result).toContain('0,00')
  })

  it('formats numeric string in PLN', () => {
    const result = formatCurrency('50.00')
    expect(result).toContain('zł')
    expect(result).toContain('50,00')
  })

  it('formats non-numeric string as 0 PLN', () => {
    const result = formatCurrency('abc')
    expect(result).toContain('zł')
    expect(result).toContain('0,00')
  })

  it('formats integer number', () => {
    const result = formatCurrency(130)
    expect(result).toContain('130,00')
    expect(result).toContain('zł')
  })
})

describe('formatDate', () => {
  it('formats date string', () => {
    expect(formatDate('2024-03-15')).toBe('15.03.2024')
  })

  it('formats Date object', () => {
    expect(formatDate(new Date('2024-03-15'))).toBe('15.03.2024')
  })
})

describe('formatDateOnly', () => {
  it('formats first day of month without UTC shift (2026-08-01)', () => {
    // Regression for M4: toISOString() shifted this to 2026-07-31 in TZ east of UTC.
    expect(formatDateOnly(new Date(2026, 7, 1))).toBe('2026-08-01')
  })

  it('formats last day of month without UTC shift (2026-08-31)', () => {
    expect(formatDateOnly(new Date(2026, 8, 0))).toBe('2026-08-31')
  })

  it('pads single-digit months and days', () => {
    expect(formatDateOnly(new Date(2026, 2, 5))).toBe('2026-03-05')
  })

  it('handles year boundaries', () => {
    expect(formatDateOnly(new Date(2026, 11, 31))).toBe('2026-12-31')
    expect(formatDateOnly(new Date(2027, 0, 1))).toBe('2027-01-01')
    expect(formatDateOnly(new Date(2026, 0, 0))).toBe('2025-12-31')
  })

  it('returns today local date matching its own calendar parts', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(formatDateOnly(now)).toBe(expected)
  })
})
