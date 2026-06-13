import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useChangePassword } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/shared/store/auth'
import { server } from '../../../mocks/server'

const testUser = { id: 'u1', email: 'test@test.com', full_name: 'Test User' }

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/account']}>
          <Routes>
            <Route path="/account" element={children} />
            <Route path="/login" element={<div data-testid="login-page">Log in</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('useChangePassword', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAuthStore.setState({ user: { ...testUser }, currentOrgId: null })
  })

  it('logs out and redirects to /login after success', async () => {
    const { result } = renderHook(() => useChangePassword(), { wrapper: makeWrapper() })

    result.current.mutate({ current_password: 'old-secret-1', new_password: 'new-secret-1' })

    await waitFor(
      () => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('keeps the session when the current password is rejected (400)', async () => {
    server.use(
      http.post('/api/v1/auth/change-password', () =>
        HttpResponse.json({ detail: 'Unable to change password' }, { status: 400 }),
      ),
    )

    const { result } = renderHook(() => useChangePassword(), { wrapper: makeWrapper() })

    result.current.mutate({ current_password: 'wrong-pass-1', new_password: 'new-secret-1' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error?.message).toBe('Unable to change password')
    expect(useAuthStore.getState().user).toEqual(testUser)
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })
})
