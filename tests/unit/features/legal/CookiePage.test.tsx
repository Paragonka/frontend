import { render, screen } from '@testing-library/react'
import { CookiePage } from '@/features/legal/components/CookiePage'

describe('CookiePage', () => {
  it('renders Cookie Policy heading', () => {
    render(<CookiePage />)
    expect(screen.getByRole('heading', { name: 'Cookie Policy' })).toBeInTheDocument()
  })

  it('renders all sections', () => {
    render(<CookiePage />)
    expect(screen.getByText('1. What are cookies')).toBeInTheDocument()
    expect(screen.getByText('2. What cookies we use')).toBeInTheDocument()
    expect(screen.getByText('3. Third-party cookies')).toBeInTheDocument()
    expect(screen.getByText('4. Consent and management')).toBeInTheDocument()
  })

  it('lists only real cookies', () => {
    render(<CookiePage />)
    expect(
      screen.getByText(
        'We only use necessary cookies: access_token (authentication) and lang (language selection). We do not use cookies for tracking or advertising.',
      ),
    ).toBeInTheDocument()
  })

  it('renders Back link', () => {
    render(<CookiePage />)
    expect(screen.getByText('Back')).toBeInTheDocument()
  })
})
