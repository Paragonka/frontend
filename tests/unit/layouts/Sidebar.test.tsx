import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/layouts/Sidebar'

const mockUseAuthStore = vi.hoisted(() => vi.fn())

vi.mock('@/shared/store/auth', () => ({
  useAuthStore: mockUseAuthStore,
}))

describe('Sidebar', () => {
  beforeEach(() => {
    mockUseAuthStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      return selector({ currentOrgId: 'org-1' })
    })
  })

  it('renders navigation items', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={false} onClose={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByText('Finances')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders all 8 navigation items', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={false} onClose={() => {}} />
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(8)
    expect(screen.queryByText('Reports')).not.toBeInTheDocument()
  })

  it('links settings to the current org', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={false} onClose={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Settings/ })).toHaveAttribute(
      'href',
      '/app/org-1/settings',
    )
  })
})
