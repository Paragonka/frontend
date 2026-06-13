import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '@/features/auth/components/LoginPage'

const mockMutate = vi.fn()

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useLogin: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    mockMutate.mockClear()
  })

  it('renders login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByText('No account?')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Enter your password')).toBeInTheDocument()
    })
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    })
  })

  it('calls mutate on valid submission', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      })
    })
  })

  it('renders submit button enabled by default', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled()
  })
})
