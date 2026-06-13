import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { EavAttributeForm } from '@/features/eav/components/EavAttributeForm'

let mockMutate = vi.fn()
let mockCreateHook: {
  mutate: typeof mockMutate
  isPending: boolean
  isError: boolean
  error: { message: string } | null
} = {
  mutate: mockMutate,
  isPending: false,
  isError: false,
  error: null,
}

vi.mock('@/features/eav/hooks/useEavAttributes', () => ({
  useCreateEavAttribute: () => mockCreateHook,
  useDeleteEavAttribute: () => ({ mutate: vi.fn(), isPending: false }),
  useEavAttributes: () => ({ data: [], isLoading: false }),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('EavAttributeForm', () => {
  beforeEach(() => {
    mockMutate = vi.fn()
    mockCreateHook = { mutate: mockMutate, isPending: false, isError: false, error: null }
  })

  it('renders form fields', { timeout: 15000 }, () => {
    render(<EavAttributeForm />, { wrapper: Wrapper })
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Code')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('submits form with valid data', { timeout: 15000 }, async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<EavAttributeForm onSuccess={onSuccess} />, { wrapper: Wrapper })

    await user.type(screen.getByLabelText('Name'), 'Instagram')
    await user.click(screen.getByText('Create'))

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Instagram',
        code: 'instagram',
        entity_code: 'client',
        field_type: 'string',
      }),
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    )
  })

  it('allows creating an attribute for the order entity type', { timeout: 15000 }, async () => {
    const user = userEvent.setup()
    render(<EavAttributeForm defaultEntityCode="order" />, { wrapper: Wrapper })

    expect(screen.getByRole('option', { name: 'Order' })).toHaveValue('order')

    await user.type(screen.getByLabelText('Name'), 'Delivery date')
    await user.click(screen.getByText('Create'))

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Delivery date',
        entity_code: 'order',
      }),
      expect.any(Object),
    )
  })

  it('auto-generates code by transliterating Cyrillic names', { timeout: 15000 }, async () => {
    const user = userEvent.setup()
    render(<EavAttributeForm />, { wrapper: Wrapper })

    await user.type(screen.getByLabelText('Name'), 'Дата рождения')

    expect(screen.getByLabelText('Code')).toHaveValue('data_rozhdeniya')
  })

  it('auto-generates code from single-word Cyrillic names', { timeout: 15000 }, async () => {
    const user = userEvent.setup()
    render(<EavAttributeForm />, { wrapper: Wrapper })

    await user.type(screen.getByLabelText('Name'), 'Бренд')

    expect(screen.getByLabelText('Code')).toHaveValue('brend')
  })

  it('leaves code empty when transliteration produces nothing', { timeout: 15000 }, async () => {
    const user = userEvent.setup()
    render(<EavAttributeForm />, { wrapper: Wrapper })

    await user.type(screen.getByLabelText('Name'), '!!!')

    expect(screen.getByLabelText('Code')).toHaveValue('')
  })

  it('keeps a user-edited code untouched when the name changes', { timeout: 15000 }, async () => {
    const user = userEvent.setup()
    render(<EavAttributeForm />, { wrapper: Wrapper })

    await user.type(screen.getByLabelText('Name'), 'Instagram')
    expect(screen.getByLabelText('Code')).toHaveValue('instagram')

    await user.type(screen.getByLabelText('Code'), '_custom')
    await user.type(screen.getByLabelText('Name'), ' Pro')

    expect(screen.getByLabelText('Code')).toHaveValue('instagram_custom')
  })

  it('shows validation error for empty name', { timeout: 15000 }, async () => {
    const user = userEvent.setup()
    render(<EavAttributeForm />, { wrapper: Wrapper })

    await user.click(screen.getByText('Create'))

    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows validation error for whitespace-only name', { timeout: 15000 }, async () => {
    const user = userEvent.setup()
    render(<EavAttributeForm />, { wrapper: Wrapper })

    await user.type(screen.getByLabelText('Name'), '   ')
    await user.click(screen.getByText('Create'))

    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows validation error for empty code', { timeout: 15000 }, async () => {
    const user = userEvent.setup()
    render(<EavAttributeForm />, { wrapper: Wrapper })

    // Type special characters that produce an empty slug, so code stays empty
    await user.type(screen.getByLabelText('Name'), '!!!')
    await user.click(screen.getByText('Create'))

    expect(screen.getByText('Code is required')).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('surfaces server-side mutation errors', { timeout: 15000 }, async () => {
    mockCreateHook = {
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: { message: 'Attribute code already exists' },
    }
    render(<EavAttributeForm />, { wrapper: Wrapper })

    expect(screen.getByRole('alert')).toHaveTextContent('Attribute code already exists')
  })

  it('calls onSuccess after successful mutation', { timeout: 15000 }, async () => {
    mockMutate.mockImplementation((_data: unknown, options?: { onSuccess?: () => void }) => {
      options?.onSuccess?.()
    })

    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<EavAttributeForm onSuccess={onSuccess} />, { wrapper: Wrapper })

    await user.type(screen.getByLabelText('Name'), 'Instagram')
    await user.type(screen.getByLabelText('Code'), 'instagram')
    await user.click(screen.getByText('Create'))

    expect(onSuccess).toHaveBeenCalled()
  })
})
