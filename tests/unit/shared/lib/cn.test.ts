import { cn } from '@/shared/lib/cn'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('handles undefined values', () => {
    expect(cn('text-lg', undefined, 'font-bold')).toBe('text-lg font-bold')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})
