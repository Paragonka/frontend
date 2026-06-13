import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'

interface PaginationProps {
  page: number
  total: number
  limit: number
  visitedPages: number[]
  onNext: () => void
  onPrev: () => void
  onGoToPage: (page: number) => void
}

function getPageNumbers(totalPages: number, visited: Set<number>): (number | '...')[] {
  const visitedSorted = Array.from(visited).sort((a, b) => a - b)
  const pages: (number | '...')[] = []
  let previous: number | null = null
  for (const p of visitedSorted) {
    if (previous !== null && p - previous > 1) {
      pages.push('...')
    }
    pages.push(p)
    previous = p
  }
  const maxVisited = visitedSorted.at(-1) ?? 0
  if (maxVisited < totalPages) {
    pages.push('...')
  }
  return pages
}

export const Pagination = memo(function Pagination({
  page,
  total,
  limit,
  visitedPages,
  onNext,
  onPrev,
  onGoToPage,
}: PaginationProps) {
  const { t } = useTranslation()
  const totalPages = Math.ceil(total / limit)
  const rangeEnd = Math.min(page * limit, total)
  const visited = new Set(visitedPages)
  const pages = getPageNumbers(totalPages, visited)

  if (total <= limit) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
      <span className="text-sm text-gray-500">
        {t('Showing')} {(page - 1) * limit + 1}–{rangeEnd} {t('of')} {total}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
          ←
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: static dots separator
            <span key={`dots-${i}`} className="px-2 text-gray-400">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (p !== page) onGoToPage(p)
              }}
              disabled={p === page}
            >
              {p}
            </Button>
          ),
        )}
        <Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages}>
          →
        </Button>
      </div>
    </div>
  )
})
