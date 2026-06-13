import { act, renderHook } from '@testing-library/react'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'

describe('useOnlineStatus', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when online', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
  })

  it('returns false when offline', () => {
    vi.stubGlobal('navigator', { onLine: false })
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)
  })

  it('updates to false on offline event', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)

    act(() => {
      vi.stubGlobal('navigator', { onLine: false })
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('updates to true on online event', () => {
    vi.stubGlobal('navigator', { onLine: false })
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)

    act(() => {
      vi.stubGlobal('navigator', { onLine: true })
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useOnlineStatus())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
  })
})
