import { act, renderHook } from '@testing-library/react'
import { useLanguage } from '@/shared/i18n/use-language'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'ru', changeLanguage: vi.fn() },
    t: (key: string) => key,
  }),
}))

describe('useLanguage', () => {
  beforeEach(() => localStorage.clear())

  it('returns current language', () => {
    const { result } = renderHook(() => useLanguage())
    expect(result.current.currentLang).toBe('ru')
  })

  it('changes language', () => {
    const { result } = renderHook(() => useLanguage())
    act(() => result.current.setLanguage('en'))
    expect(localStorage.getItem('lang')).toBe('en')
  })
})
