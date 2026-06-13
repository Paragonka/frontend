import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'

export type LocalFieldsValue = Record<string, string>

interface LocalFieldsRow {
  id: number
  key: string
  value: string
}

interface LocalFieldsEditorProps {
  value: LocalFieldsValue
  onChange: (value: LocalFieldsValue) => void
}

let nextRowId = 1

function makeRow(key: string, value: string): LocalFieldsRow {
  nextRowId += 1
  return { id: nextRowId, key, value }
}

function toRows(value: LocalFieldsValue | null | undefined): LocalFieldsRow[] {
  return Object.entries(value ?? {}).map(([key, fieldValue]) => makeRow(key, fieldValue ?? ''))
}

function emitValue(rows: LocalFieldsRow[]): LocalFieldsValue {
  const result: LocalFieldsValue = {}
  for (const row of rows) {
    if (row.key.trim() === '') continue
    result[row.key] = row.value
  }
  return result
}

export function normalizeLocalFields(value: LocalFieldsValue | null | undefined): LocalFieldsValue {
  const result: LocalFieldsValue = {}
  for (const [rawKey, rawValue] of Object.entries(value ?? {})) {
    const key = rawKey.trim()
    if (!key) continue
    result[key] = (rawValue ?? '').trim()
  }
  return result
}

export function LocalFieldsEditor({ value, onChange }: LocalFieldsEditorProps) {
  const { t } = useTranslation()
  const [rows, setRows] = useState<LocalFieldsRow[]>(() => toRows(value))

  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (JSON.stringify(emitValue(rowsRef.current)) === JSON.stringify(value)) return
    setRows(toRows(value))
  }, [value])

  const updateRows = (next: LocalFieldsRow[]) => {
    setRows(next)
    onChangeRef.current(emitValue(next))
  }

  const addRow = () => {
    updateRows([...rowsRef.current, makeRow('', '')])
  }

  const removeRow = (id: number) => {
    updateRows(rowsRef.current.filter((row) => row.id !== id))
  }

  const updateRow = (id: number, patch: Partial<Omit<LocalFieldsRow, 'id'>>) => {
    updateRows(rowsRef.current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{t('Local fields')}</h3>
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <input
            aria-label={t('Key')}
            placeholder={t('Key')}
            value={row.key}
            onChange={(e) => updateRow(row.id, { key: e.target.value })}
            className="w-1/3 border rounded px-3 py-2"
          />
          <input
            aria-label={t('Value')}
            placeholder={t('Value')}
            value={row.value}
            onChange={(e) => updateRow(row.id, { value: e.target.value })}
            className="flex-1 border rounded px-3 py-2"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => removeRow(row.id)}>
            {t('Remove')}
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        {t('Add field')}
      </Button>
    </div>
  )
}
