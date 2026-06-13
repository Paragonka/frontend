import React from 'react'
import { useTranslation } from 'react-i18next'

export function ErrorPage({ error }: { error?: Error }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
          ⚠️
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">{t('Something went wrong')}</h1>
        <p className="max-w-md text-sm text-gray-600">
          {t(
            'The page could not be loaded. This usually happens after an application update — a simple reload helps.',
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          {t('Reload page')}
        </button>
        <a
          href="/"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          {t('Home')}
        </a>
      </div>

      {error && import.meta.env.DEV && (
        <pre className="max-w-lg overflow-auto rounded-lg bg-gray-900 p-3 text-left text-xs text-red-300">
          {error.message}
        </pre>
      )}
    </div>
  )
}

interface State {
  error: Error | null
}

export class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught app error:', error, info)
  }

  render() {
    if (this.state.error) {
      return <ErrorPage error={this.state.error} />
    }
    return this.props.children
  }
}
