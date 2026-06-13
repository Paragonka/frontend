import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { usePagination } from '@/shared/hooks/usePagination'
import { Button } from '@/shared/ui/button'
import { Pagination } from '@/shared/ui/pagination'
import { useClients, useDeleteClient } from '../hooks/useClients'
import { ClientCreateDialog } from './ClientCreateDialog'
import { ClientEditDialog } from './ClientEditDialog'

const SORT_OPTIONS = [
  { value: '', label: 'Name', arrow: ' ↑' },
  { value: '-name', label: 'Name', arrow: ' ↓' },
  { value: '-created_at', label: 'Newest' },
  { value: 'created_at', label: 'Oldest' },
]

export function ClientList() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [editClientId, setEditClientId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const deleteClient = useDeleteClient()
  const debouncedSearch = useDebounce(search)
  const { page, currentCursor, limit, visitedPages, nextPage, prevPage, goToPage, reset } =
    usePagination()

  const { data, isLoading, isError, error, refetch } = useClients({
    name: debouncedSearch || undefined,
    cursor: currentCursor || undefined,
    sort: sort || undefined,
    limit,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <span className="text-sm text-gray-500">{t('Loading...')}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center max-w-md">
          <p className="text-red-700 font-medium">{t('Failed to load clients')}</p>
          <p className="text-sm text-red-500 mt-1">
            {error instanceof Error
              ? error.message
              : t('Server unavailable. Please try again later.')}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          {t('Retry')}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">{t('Clients')}</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreate(true)}>{t('New Client')}</Button>
        </div>
      </div>

      <input
        type="text"
        placeholder={t('Search by name...')}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          reset(true)
        }}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      <div className="flex items-center justify-between mb-3">
        <div />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            reset(true)
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.label)}
              {opt.arrow ?? ''}
            </option>
          ))}
        </select>
      </div>

      {deleteClient.error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
        >
          {deleteClient.error instanceof Error
            ? deleteClient.error.message
            : t('An unexpected error occurred')}
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">{t('First name')}</th>
              <th className="text-left p-3">{t('Last name')}</th>
              <th className="text-left p-3">{t('Phone')}</th>
              <th className="text-left p-3">{t('Notes')}</th>
              <th className="text-left p-3">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((client) => (
              <tr key={client.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <Link
                    to={client.id}
                    title={t('View client details')}
                    className="text-blue-600 hover:underline"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="p-3">{client.surname}</td>
                <td className="p-3">{client.phone}</td>
                <td className="p-3 text-sm text-gray-600">
                  {client.notes ? (
                    <span title={client.notes} className="block max-w-[220px] truncate">
                      {client.notes}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setEditClientId(client.id)}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    {t('Edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('Delete client?'))) {
                        deleteClient.mutate(client.id)
                      }
                    }}
                    className="text-red-600 hover:underline"
                  >
                    {t('Delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={data?.total ?? 0}
        limit={limit}
        visitedPages={visitedPages}
        onNext={() => {
          if (data?.next_cursor) nextPage(data.next_cursor)
        }}
        onPrev={prevPage}
        onGoToPage={goToPage}
      />

      <ClientCreateDialog open={showCreate} onOpenChange={(open) => setShowCreate(open)} />
      <ClientEditDialog
        clientId={editClientId ?? ''}
        open={!!editClientId}
        onOpenChange={(open) => {
          if (!open) setEditClientId(null)
        }}
      />
    </div>
  )
}
