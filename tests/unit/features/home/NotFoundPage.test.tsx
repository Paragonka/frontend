import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotFoundPage } from '@/features/home'

describe('NotFoundPage', () => {
  it('renders 404 heading', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('links back home', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Home')).toHaveAttribute('href', '/')
  })
})
