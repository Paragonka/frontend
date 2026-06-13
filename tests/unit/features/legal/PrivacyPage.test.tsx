import { render, screen } from '@testing-library/react'
import { PrivacyPage } from '@/features/legal/components/PrivacyPage'

describe('PrivacyPage', () => {
  it('renders Privacy Policy heading', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument()
  })

  it('renders all sections', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('1. What data we collect')).toBeInTheDocument()
    expect(screen.getByText('2. How we use the data')).toBeInTheDocument()
    expect(screen.getByText('3. Data storage and security')).toBeInTheDocument()
    expect(screen.getByText('4. Data retention')).toBeInTheDocument()
    expect(screen.getByText('5. Your rights')).toBeInTheDocument()
    expect(screen.getByText('6. Cookies')).toBeInTheDocument()
    expect(screen.getByText('7. Changes to the Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('8. Contacts')).toBeInTheDocument()
  })

  it('mentions EU storage and new contact email', () => {
    render(<PrivacyPage />)
    expect(
      screen.getByText('All data is stored on servers located in the European Union.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Privacy inquiries: sovwva7@gmail.com')).toBeInTheDocument()
    expect(
      screen.getByText(
        /We will notify you of material changes to the purposes, scope or legal bases of processing at least 14 days in advance by email/,
      ),
    ).toBeInTheDocument()
  })

  it('renders Back link', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('Back')).toBeInTheDocument()
  })
})
