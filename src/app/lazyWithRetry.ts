import React from 'react'

const RELOAD_FLAG = 'paragonka-chunk-reload-attempted'

export function lazyWithRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const module = await factory()
      sessionStorage.removeItem(RELOAD_FLAG)
      return module
    } catch (error) {
      const isChunkError =
        error instanceof Error && /import|fetch|dynamic|module|loading chunk/i.test(error.message)

      if (isChunkError && typeof window !== 'undefined' && !sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1')
        window.location.reload()
      }

      throw error
    }
  })
}
