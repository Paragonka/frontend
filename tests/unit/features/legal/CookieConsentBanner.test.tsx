import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CookieConsentBanner } from '@/features/legal/components/CookieConsentBanner'

const STORAGE_KEY = 'paragonka-cookie-consent'

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    // biome-ignore lint/suspicious/noDocumentCookie: test must clear the consent cookie
    document.cookie = 'cookie_consent=;path=/;max-age=0'
  })

  it('shows banner when no consent in localStorage or cookie', () => {
    render(<CookieConsentBanner />)
    expect(
      screen.getByText('This website uses cookies for authentication and language selection.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Accept')).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
  })

  it('hides banner when consent is in localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    render(<CookieConsentBanner />)
    expect(
      screen.queryByText('This website uses cookies for authentication and language selection.'),
    ).not.toBeInTheDocument()
  })

  it('hides banner when consent cookie is present', () => {
    // biome-ignore lint/suspicious/noDocumentCookie: test must set the consent cookie
    document.cookie = 'cookie_consent=accepted;path=/'
    render(<CookieConsentBanner />)
    expect(
      screen.queryByText('This website uses cookies for authentication and language selection.'),
    ).not.toBeInTheDocument()
  })

  it('sets localStorage and cookie on accept', async () => {
    const user = userEvent.setup()
    render(<CookieConsentBanner />)

    await user.click(screen.getByText('Accept'))

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
    })
    expect(document.cookie).toContain('cookie_consent=accepted')
    expect(
      screen.queryByText('This website uses cookies for authentication and language selection.'),
    ).not.toBeInTheDocument()
  })
})
