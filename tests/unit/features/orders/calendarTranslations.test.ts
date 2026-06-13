import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import i18n from '@/shared/i18n/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pl = JSON.parse(
  readFileSync(resolve(__dirname, '../../../../public/locales/pl.json'), 'utf-8'),
) as Record<string, string>

describe('OrderCalendar translations', () => {
  it('RU "Previous month" label navigates backward, not forward', () => {
    expect(i18n.t('Previous month', { lng: 'ru' })).toBe('Предыдущий месяц')
  })

  it('other locales keep a backward-navigation label', () => {
    expect(i18n.t('Previous month', { lng: 'en' })).toBe('Previous month')
    expect(pl['Previous month']).toBe('Poprzedni miesiąc')
  })
})
