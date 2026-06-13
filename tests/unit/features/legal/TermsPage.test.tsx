import { render, screen } from '@testing-library/react'
import { TermsPage } from '@/features/legal/components/TermsPage'

describe('TermsPage', () => {
  it('renders Terms of Use heading', () => {
    render(<TermsPage />)
    expect(screen.getByRole('heading', { name: 'Terms of Use' })).toBeInTheDocument()
  })

  it('renders all sections', () => {
    render(<TermsPage />)
    expect(screen.getByText('1. Acceptance of Terms')).toBeInTheDocument()
    expect(screen.getByText('2. About the Service')).toBeInTheDocument()
    expect(screen.getByText('3. Accounts and Registration')).toBeInTheDocument()
    expect(screen.getByText('4. User Obligations')).toBeInTheDocument()
    expect(screen.getByText('5. Data and Privacy')).toBeInTheDocument()
    expect(screen.getByText('6. Intellectual Property')).toBeInTheDocument()
    expect(screen.getByText('7. Service Availability')).toBeInTheDocument()
    expect(screen.getByText('8. Limitation of Liability')).toBeInTheDocument()
    expect(screen.getByText('9. Suspension and Termination')).toBeInTheDocument()
    expect(screen.getByText('10. Changes to the Terms')).toBeInTheDocument()
    expect(screen.getByText('11. Governing Law')).toBeInTheDocument()
    expect(screen.getByText('12. Contacts')).toBeInTheDocument()
    expect(
      screen.getByText(
        /We will notify you of material changes at least 14 days before the new version takes effect by email/,
      ),
    ).toBeInTheDocument()
  })

  it('mentions EU law and new contact email', () => {
    render(<TermsPage />)
    expect(
      screen.getByText(
        'These Terms are governed by the law of the European Union. Disputes are subject to the jurisdiction of the courts of Poland.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Questions about the Terms: sovwva7@gmail.com')).toBeInTheDocument()
  })

  it('renders Back link', () => {
    render(<TermsPage />)
    expect(screen.getByText('Back')).toBeInTheDocument()
  })
})
