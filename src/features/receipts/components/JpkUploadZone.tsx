import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseJpkFile } from '../lib/parseJpk'
import type { ReceiptItemCreate } from '../types'

interface JpkUploadZoneProps {
  onParsed: (data: {
    items: ReceiptItemCreate[]
    source: string
    receiptDate: string
    notes: string
    total: number
    storeName?: string
    tin?: string
    docNumber?: string
  }) => void
}

export function JpkUploadZone({ onParsed }: JpkUploadZoneProps) {
  const { t } = useTranslation()
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (file: File) => {
    setError('')

    if (!file.name.endsWith('.json')) {
      setError(t('Format: JSON file'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        const result = parseJpkFile(json)
        onParsed({
          items: result.items,
          source: result.source,
          receiptDate: result.receiptDate,
          notes: result.notes,
          total: result.total,
          storeName: result.storeName,
          tin: result.tin,
          docNumber: result.docNumber,
        })
      } catch {
        setError(t('Error'))
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors bg-transparent ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleChange}
          className="hidden"
          id="jpk-file-input"
        />
        <label htmlFor="jpk-file-input" className="cursor-pointer block">
          <p className="text-gray-600 mb-1">{t('Drag and drop the receipt JSON file here')}</p>
          <p className="text-blue-600 underline text-sm">{t('Click to select a file')}</p>
        </label>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </button>
    </div>
  )
}
