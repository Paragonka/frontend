import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/shared/store/auth'
import { getMediaUrl } from '../api'
import { useDeleteMedia } from '../hooks/useMedia'
import type { Photo } from '../types'

interface PhotoGalleryProps {
  photos: Photo[]
  onDelete?: (key: string) => void
}

export function PhotoGallery({ photos, onDelete }: PhotoGalleryProps) {
  const { t } = useTranslation()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  const deleteMedia = useDeleteMedia()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), [])
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i))
  }, [photos.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, goPrev, goNext])

  if (photos.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('Photos')}</h3>
        <p className="text-gray-500 text-sm">{t('No photos yet')}</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{t('Photos')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div key={photo.key} className="relative group">
            <button
              type="button"
              onClick={() => openLightbox(index)}
              aria-label={t('Open photo')}
              className="block w-full"
            >
              <img
                src={getMediaUrl(photo.key, orgId)}
                alt={t('Photo')}
                className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                loading="lazy"
                decoding="async"
              />
            </button>
            <button
              type="button"
              onClick={() => (onDelete ?? deleteMedia.mutate)(photo.key)}
              className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {t('Delete')}
            </button>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('Photo viewer')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeLightbox()
          }}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
          >
            <X className="h-8 w-8" />
          </button>

          {lightboxIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              className="absolute left-4 text-white/70 hover:text-white transition-colors z-10"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}

          {lightboxIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              className="absolute right-4 text-white/70 hover:text-white transition-colors z-10"
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}

          <img
            src={getMediaUrl(photos[lightboxIndex]?.key ?? '', orgId)}
            alt={t('Photo')}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded"
          />

          {photos.length > 1 && (
            <div className="absolute bottom-4 text-white/60 text-sm">
              {lightboxIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
