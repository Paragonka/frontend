export function runWhenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback)
  } else {
    setTimeout(callback, 2000)
  }
}

export function prefetchOnIdle(importFn: () => Promise<unknown>) {
  window.addEventListener('load', () => {
    runWhenIdle(() => {
      importFn().catch(() => {})
    })
  })
}

export function prefetchTiered(tasks: Array<() => Promise<unknown>>) {
  for (const task of tasks) {
    prefetchOnIdle(task)
  }
}
