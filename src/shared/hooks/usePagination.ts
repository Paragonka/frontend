import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const DEFAULT_LIMIT = 50

export function usePagination(limit = DEFAULT_LIMIT) {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const cursorsParam = searchParams.get('cursors') || ''
  const cursors = cursorsParam ? cursorsParam.split(',') : []
  const safePage = page > 1 && cursors.length < page - 1 ? 1 : page
  const hasScrolledRef = useRef(false)

  const currentCursor = safePage > 1 ? cursors[safePage - 2] || null : null

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on page change
  useEffect(() => {
    if (!hasScrolledRef.current) {
      hasScrolledRef.current = true
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [safePage])

  const goToPage = useCallback(
    (targetPage: number) => {
      if (targetPage > cursors.length + 1) return
      if (targetPage === safePage) return
      const params = new URLSearchParams(searchParams)
      if (targetPage <= 1) {
        params.delete('page')
        params.delete('cursors')
      } else {
        params.set('page', String(targetPage))
      }
      setSearchParams(params)
    },
    [searchParams, setSearchParams, safePage, cursors.length],
  )

  const nextPage = useCallback(
    (nextCursor: string) => {
      const params = new URLSearchParams(searchParams)
      params.set('page', String(safePage + 1))
      const newCursors = cursors.slice(0, safePage - 1)
      newCursors.push(nextCursor)
      params.set('cursors', newCursors.join(','))
      setSearchParams(params)
    },
    [searchParams, setSearchParams, cursors, safePage],
  )

  const prevPage = useCallback(() => {
    if (safePage > 1) {
      goToPage(safePage - 1)
    }
  }, [safePage, goToPage])

  const reset = useCallback(
    (force = false) => {
      if (force || safePage > 1) {
        const params = new URLSearchParams(searchParams)
        params.delete('page')
        params.delete('cursors')
        setSearchParams(params)
      }
    },
    [searchParams, setSearchParams, safePage],
  )

  const rangeStart = (safePage - 1) * limit + 1
  const visitedPages = [1]
  for (let i = 0; i < cursors.length; i++) {
    visitedPages.push(i + 2)
  }

  return {
    page: safePage,
    currentCursor,
    rangeStart,
    limit,
    visitedPages,
    nextPage,
    prevPage,
    goToPage,
    reset,
  }
}
