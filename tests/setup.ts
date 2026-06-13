import '@testing-library/jest-dom/vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { server } from './mocks/server'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ru = JSON.parse(readFileSync(resolve(__dirname, '../public/locales/ru.json'), 'utf-8'))
const en = JSON.parse(readFileSync(resolve(__dirname, '../public/locales/en.json'), 'utf-8'))
const pl = JSON.parse(readFileSync(resolve(__dirname, '../public/locales/pl.json'), 'utf-8'))

vi.mock('@/shared/i18n/config', () => ({
  default: i18n,
}))

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {}
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        for (const key in store) delete store[key]
      },
      get length() {
        return Object.keys(store).length
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
    },
    writable: true,
  })
}

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  resources: {
    ru: { common: ru },
    en: { common: en },
    pl: { common: pl },
  },
  interpolation: { escapeValue: false },
})
