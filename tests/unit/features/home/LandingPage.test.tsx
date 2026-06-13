import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from '@/features/home'

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )

describe('LandingPage', () => {
  it('renders hero heading', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Paragonka CRM' })).toBeInTheDocument()
  })

  it('renders all feature cards', () => {
    renderPage()
    expect(
      screen.getByText('Keep a client database with order history and notes'),
    ).toBeInTheDocument()
    expect(screen.getByText('Create orders with custom items')).toBeInTheDocument()
    expect(
      screen.getByText('Revenue and expense analytics with beautiful charts'),
    ).toBeInTheDocument()
  })

  it('links to register and login for guests', () => {
    renderPage()
    expect(screen.getByText('Get started')).toHaveAttribute('href', '/register')
    for (const el of screen.getAllByText('Log in')) {
      expect(el).toHaveAttribute('href', '/login')
    }
  })

  it('links to legal pages in the footer', () => {
    renderPage()
    expect(screen.getByText('Privacy Policy')).toHaveAttribute('href', '/privacy')
    expect(screen.getByText('Terms of Use')).toHaveAttribute('href', '/terms')
    expect(screen.getByText('Cookie Policy')).toHaveAttribute('href', '/cookie')
  })
})
