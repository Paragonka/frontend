import { useTranslation } from 'react-i18next'

export function useLanguage() {
  const { i18n } = useTranslation()

  const setLanguage = (lang: string) => {
    localStorage.setItem('lang', lang)
    i18n.changeLanguage(lang)
    // biome-ignore lint/suspicious/noDocumentCookie: legacy fallback for backend lang cookie
    document.cookie = `lang=${lang};path=/;max-age=31536000`
  }

  return {
    currentLang: i18n.language,
    setLanguage,
  }
}
