import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterPage } from '@/features/auth/components/RegisterPage'

const mockMutate = vi.fn()

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useRegister: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    mockMutate.mockClear()
  })

  it('renders register form', () => {
    render(<RegisterPage />)

    expect(screen.getByPlaceholderText('First name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument()
    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
    })
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(
      screen.getByText('You must agree to the privacy policy and terms of use'),
    ).toBeInTheDocument()
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByPlaceholderText('Password'), '1234567')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })

  it('calls mutate on valid submission', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByPlaceholderText('First name'), 'John Doe')
    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByLabelText('I agree to the privacy policy and terms of use'))
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        full_name: 'John Doe',
        email: 'test@test.com',
        password: 'password123',
        consent_to_processing: true,
      })
    })
  })

  it('renders submit button enabled by default', () => {
    render(<RegisterPage />)

    expect(screen.getByRole('button', { name: 'Sign up' })).not.toBeDisabled()
  })
})
