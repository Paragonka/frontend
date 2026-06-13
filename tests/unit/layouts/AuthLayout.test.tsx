import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'

const mockUseAuthStore = vi.hoisted(() => vi.fn())

vi.mock('@/shared/store/auth', () => ({
  useAuthStore: mockUseAuthStore,
}))

describe('AuthLayout', () => {
  it('renders outlet when not authenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      return selector({ user: null })
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<AuthLayout />}>
            <Route index element={<div>Login page content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login page content')).toBeInTheDocument()
  })

  it('redirects to /orgs/select when authenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      return selector({ user: { id: '1', email: 'test@test.com', full_name: 'Test' } })
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<AuthLayout />}>
            <Route index element={<div>Login page content</div>} />
          </Route>
          <Route path="/orgs/select" element={<div>Org selection page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Org selection page')).toBeInTheDocument()
  })
})
