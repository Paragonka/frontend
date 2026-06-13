import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChangePasswordSection } from '@/features/auth/components/ChangePasswordSection'
import { ApiError } from '@/shared/api/errors'

const mockMutate = vi.fn()

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useChangePassword: () => ({
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    error: changePasswordError,
  }),
}))

let changePasswordError: unknown = null

function fillAndSubmit(current: string, next: string, confirm: string) {
  return async () => {
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Current password'), current)
    await user.type(screen.getByPlaceholderText('New password'), next)
    await user.type(screen.getByPlaceholderText('Confirm new password'), confirm)
    await user.click(screen.getByRole('button', { name: 'Change password' }))
  }
}

describe('ChangePasswordSection', () => {
  beforeEach(() => {
    changePasswordError = null
    mockMutate.mockClear()
  })

  it('renders the three password fields', () => {
    render(<ChangePasswordSection />)

    expect(screen.getByPlaceholderText('Current password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('New password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change password' })).toBeInTheDocument()
  })

  it('sends current_password and new_password payload on valid submit', async () => {
    render(<ChangePasswordSection />)
    await fillAndSubmit('old-secret-1', 'new-secret-1', 'new-secret-1')()

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        current_password: 'old-secret-1',
        new_password: 'new-secret-1',
      })
    })
  })

  it('shows validation error when new passwords do not match', async () => {
    render(<ChangePasswordSection />)
    await fillAndSubmit('old-secret-1', 'new-secret-1', 'different-1')()

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows validation error for a short new password', async () => {
    render(<ChangePasswordSection />)
    await fillAndSubmit('old-secret-1', 'short', 'short')()

    await waitFor(() => {
      expect(screen.getByText('New password must be at least 8 characters')).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('requires the current password', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordSection />)

    await user.type(screen.getByPlaceholderText('New password'), 'new-secret-1')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'new-secret-1')
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    await waitFor(() => {
      expect(screen.getByText('Enter your current password')).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows backend rejection (wrong current password) via role=alert', async () => {
    changePasswordError = new ApiError(400, 'UNKNOWN', 'Unable to change password')

    render(<ChangePasswordSection />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Current password is incorrect')
  })
})
