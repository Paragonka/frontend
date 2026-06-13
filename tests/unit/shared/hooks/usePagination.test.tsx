import { act, renderHook } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { usePagination } from '@/shared/hooks/usePagination'

function createWrapper(initialEntries: string[] = ['/']) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    const router = createMemoryRouter([{ path: '/', element: children }], {
      initialEntries,
    })
    return <RouterProvider router={router} />
  }
}

describe('usePagination', () => {
  it('returns page 1 by default', () => {
    const { result } = renderHook(() => usePagination(), {
      wrapper: createWrapper(),
    })
    expect(result.current.page).toBe(1)
    expect(result.current.currentCursor).toBeNull()
  })

  it('reads page from URL params', () => {
    const { result } = renderHook(() => usePagination(), {
      wrapper: createWrapper(['/?page=3&cursors=abc,def']),
    })
    expect(result.current.page).toBe(3)
    expect(result.current.currentCursor).toBe('def')
  })

  it('computes rangeStart correctly', () => {
    const { result } = renderHook(() => usePagination(25), {
      wrapper: createWrapper(['/?page=3&cursors=abc,def']),
    })
    expect(result.current.rangeStart).toBe(51)
  })

  it('falls back to page 1 when the cursor chain is broken', () => {
    const { result } = renderHook(() => usePagination(25), {
      wrapper: createWrapper(['/?page=5&cursors=abc,def']),
    })
    expect(result.current.page).toBe(1)
    expect(result.current.currentCursor).toBeNull()
    expect(result.current.rangeStart).toBe(1)
    expect(result.current.visitedPages).toEqual([1, 2, 3])
  })

  it('ignores goToPage beyond the collected cursor chain', () => {
    const { result } = renderHook(() => usePagination(), {
      wrapper: createWrapper(['/?page=1&cursors=abc']),
    })
    act(() => result.current.goToPage(3))
    expect(result.current.page).toBe(1)
  })

  it('goToPage navigates to a visited page', () => {
    const { result } = renderHook(() => usePagination(), {
      wrapper: createWrapper(['/?page=1&cursors=abc']),
    })
    act(() => result.current.goToPage(2))
    expect(result.current.page).toBe(2)
    expect(result.current.currentCursor).toBe('abc')
  })

  it('computes visitedPages from cursors', () => {
    const { result } = renderHook(() => usePagination(), {
      wrapper: createWrapper(['/?page=3&cursors=abc,def']),
    })
    expect(result.current.visitedPages).toEqual([1, 2, 3])
  })
})
