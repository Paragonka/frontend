import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { EavAttributeList } from '@/features/eav/components/EavAttributeList'

const mockAttributes = [
  {
    id: 'eav-1',
    org_id: 'o1',
    entity_code: 'client',
    code: 'instagram',
    name: 'Instagram',
    field_type: 'string',
    is_required: false,
    default_value: '',
  },
  {
    id: 'eav-2',
    org_id: 'o1',
    entity_code: 'client',
    code: 'birthday',
    name: 'Birthday',
    field_type: 'date',
    is_required: true,
    default_value: '',
  },
]

let mockUseEavAttributes: {
  data:
    | Array<{
        id: string
        org_id: string
        entity_code: string
        code: string
        name: string
        field_type: string
        is_required: boolean
        default_value: string
      }>
    | undefined
  isLoading: boolean
} = {
  data: mockAttributes,
  isLoading: false,
}

const mockDeleteMutate = vi.fn()

vi.mock('@/features/eav/hooks/useEavAttributes', () => ({
  useEavAttributes: () => mockUseEavAttributes,
  useDeleteEavAttribute: () => ({ mutate: mockDeleteMutate, isPending: false }),
  useCreateEavAttribute: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
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

describe('EavAttributeList', () => {
  beforeEach(() => {
    mockUseEavAttributes = { data: mockAttributes, isLoading: false }
    mockDeleteMutate.mockClear()
  })

  it('renders page title', () => {
    render(<EavAttributeList />, { wrapper: Wrapper })
    expect(screen.getByText('EAV Attributes')).toBeInTheDocument()
  })

  it('renders attribute rows', () => {
    render(<EavAttributeList />, { wrapper: Wrapper })
    expect(screen.getByText('Instagram')).toBeInTheDocument()
    expect(screen.getByText('Birthday')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseEavAttributes = { data: undefined, isLoading: true }
    render(<EavAttributeList />, { wrapper: Wrapper })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows empty state when no attributes', () => {
    mockUseEavAttributes = { data: [], isLoading: false }
    render(<EavAttributeList />, { wrapper: Wrapper })
    expect(screen.getByText('No attributes for this entity type')).toBeInTheDocument()
  })

  it('renders entity type filter dropdown', () => {
    render(<EavAttributeList />, { wrapper: Wrapper })
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('switches entity type on dropdown change', async () => {
    const user = userEvent.setup()
    render(<EavAttributeList />, { wrapper: Wrapper })
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'product')
    expect(select).toHaveValue('product')
  })

  it('offers orders as an entity type option', async () => {
    render(<EavAttributeList />, { wrapper: Wrapper })
    const orderOption = screen.getByRole('option', { name: 'Order' })
    expect(orderOption).toHaveValue('order')
  })

  it('switches to order entity type on dropdown change', async () => {
    const user = userEvent.setup()
    render(<EavAttributeList />, { wrapper: Wrapper })
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'order')
    expect(select).toHaveValue('order')
  })
})

describe('EavAttributeList navigation regression', () => {
  beforeEach(() => {
    mockUseEavAttributes = { data: mockAttributes, isLoading: false }
  })

  it('New Attribute button has type=button and does not submit a wrapping form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    function FormWrapper({ children }: { children: React.ReactNode }) {
      const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      return (
        <QueryClientProvider client={qc}>
          <BrowserRouter>
            {/* Simulate a form wrapping the page (e.g. layout), as in the E2E nav bug */}
            <form method="GET" action="/app/org-1/clients" onSubmit={onSubmit}>
              {children}
            </form>
          </BrowserRouter>
        </QueryClientProvider>
      )
    }

    render(<EavAttributeList />, { wrapper: FormWrapper })

    const newAttributeButton = screen.getByRole('button', { name: 'New Attribute' })
    expect(newAttributeButton).toHaveAttribute('type', 'button')

    await user.click(newAttributeButton)

    // A default-type (submit) button inside a form would fire the native GET
    // submit and navigate away. With type="button" the form must NOT submit.
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('opens the create dialog when New Attribute is clicked', async () => {
    const user = userEvent.setup()
    render(<EavAttributeList />, { wrapper: Wrapper })

    await user.click(screen.getByRole('button', { name: 'New Attribute' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  it('pre-selects the active entity tab as entity_code in the create dialog', async () => {
    const user = userEvent.setup()
    render(<EavAttributeList />, { wrapper: Wrapper })

    // Switch the list filter to "product"
    await user.selectOptions(screen.getByRole('combobox'), 'product')

    // Open the create dialog
    await user.click(screen.getByRole('button', { name: 'New Attribute' }))

    // The entity_type select (the first "Type" select in the form) must default to "product"
    const typeSelect = screen.getAllByLabelText('Type').find((el) => el.id === 'entity_code') as
      | HTMLSelectElement
      | undefined
    expect(typeSelect).toBeDefined()
    expect(typeSelect).toHaveValue('product')
  })
})
