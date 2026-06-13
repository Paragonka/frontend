import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUploadPhoto } from '../hooks/useMedia'

interface PhotoUploadProps {
  entityType: string
  entityId: string
  onUploadComplete?: () => void
}

export function PhotoUpload({ entityType, entityId, onUploadComplete }: PhotoUploadProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const uploadPhoto = useUploadPhoto()

  const { isPending, isError, error } = uploadPhoto

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    uploadPhoto.mutate({ entityType, entityId, file }, { onSuccess: () => onUploadComplete?.() })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{t('Upload photos')}</h3>
      <button
        type="button"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <p className="text-gray-500 mb-2">{t('Drag and drop photos here')}</p>
        <p className="text-sm text-gray-400">{t('or')}</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        disabled={isPending}
        aria-label={t('Select file')}
        className="hidden"
      />
      {isPending && <p className="text-sm text-blue-600 mt-2">{t('Uploading...')}</p>}
      {isError && (
        <p className="text-sm text-red-600 mt-2">{error?.message || t('Upload failed')}</p>
      )}
    </div>
  )
}
