import { act, renderHook } from '@testing-library/react'
import { useDebounce } from '@/shared/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500))
    expect(result.current).toBe('hello')
  })

  it('updates value after delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'hello' },
    })

    rerender({ value: 'world' })
    expect(result.current).toBe('hello')

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('world')
  })

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: 'c' })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('c')
  })
})
