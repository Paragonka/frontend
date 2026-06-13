import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { useState } from 'react'
import { EavFieldsForm, type EavFieldsFormHandle } from '@/features/eav/components/EavFieldsForm'
import { useAuthStore } from '@/shared/store/auth'
import { server } from '../../../mocks/server'

const allTypesAttributes = [
  {
    id: 'a-string',
    org_id: 'org-1',
    entity_code: 'client',
    code: 'city',
    name: 'City',
    field_type: 'string',
    is_required: false,
    default_value: '',
  },
  {
    id: 'a-text',
    org_id: 'org-1',
    entity_code: 'client',
    code: 'bio',
    name: 'Bio',
    field_type: 'text',
    is_required: false,
    default_value: '',
  },
  {
    id: 'a-number',
    org_id: 'org-1',
    entity_code: 'client',
    code: 'age',
    name: 'Age',
    field_type: 'number',
    is_required: false,
    default_value: '',
  },
  {
    id: 'a-boolean',
    org_id: 'org-1',
    entity_code: 'client',
    code: 'vip',
    name: 'VIP',
    field_type: 'boolean',
    is_required: false,
    default_value: '',
  },
  {
    id: 'a-date',
    org_id: 'org-1',
    entity_code: 'client',
    code: 'birthday',
    name: 'Birthday',
    field_type: 'date',
    is_required: false,
    default_value: '',
  },
]

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

function Harness({
  entityCode,
  initialValue = {},
  onChangeSpy,
}: {
  entityCode: 'client' | 'product' | 'order'
  initialValue?: Record<string, unknown>
  onChangeSpy?: (value: Record<string, unknown>) => void
}) {
  const [value, setValue] = useState(initialValue)
  const [valid, setValid] = useState<boolean | null>(null)
  return (
    <div>
      <EavFieldsForm
        ref={(el: EavFieldsFormHandle | null) => {
          if (el) {
            ;(globalThis as Record<string, unknown>).__eavFieldsHandle = el
          }
        }}
        entityCode={entityCode}
        value={value}
        onChange={onChangeSpy ?? setValue}
      />
      <button
        type="button"
        onClick={() =>
          setValid(
            (globalThis as Record<string, unknown>).__eavFieldsHandle
              ? (
                  globalThis as unknown as { __eavFieldsHandle: EavFieldsFormHandle }
                ).__eavFieldsHandle.validate()
              : true,
          )
        }
      >
        Check
      </button>
      <output data-testid="validity">{valid === null ? '' : String(valid)}</output>
    </div>
  )
}

describe('EavFieldsForm', () => {
  beforeEach(() => {
    useAuthStore.getState().setCurrentOrg('org-1')
    ;(globalThis as Record<string, unknown>).__eavFieldsHandle = null
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('renders null when the attribute list is empty', async () => {
    server.use(
      http.get('/api/v1/eav/attributes', () => {
        return HttpResponse.json([])
      }),
    )
    render(<Harness entityCode="client" />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.queryByText('Additional fields')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('City')).not.toBeInTheDocument()
  })

  it('renders the right input type for each attribute field type', async () => {
    server.use(
      http.get('/api/v1/eav/attributes', () => {
        return HttpResponse.json(allTypesAttributes)
      }),
    )
    render(<Harness entityCode="client" />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByLabelText('City')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('City')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Bio').tagName).toBe('TEXTAREA')
    expect(screen.getByLabelText('Age')).toHaveAttribute('type', 'number')
    expect(screen.getByLabelText('VIP')).toHaveAttribute('type', 'checkbox')
    expect(screen.getByLabelText('Birthday')).toHaveAttribute('type', 'date')
  })

  it('shows a required marker on required fields', async () => {
    render(<Harness entityCode="client" />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Birthday *')).toBeInTheDocument()
    })
    expect(screen.getByText('Instagram')).toBeInTheDocument()
  })

  it('pre-fills empty values with default_value', async () => {
    render(<Harness entityCode="product" />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByLabelText('Weight')).toHaveValue(0)
    })
  })

  it('reports missing required fields via validate() and shows the error', async () => {
    render(<Harness entityCode="client" />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Birthday *')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Check'))

    expect(screen.getByTestId('validity')).toHaveTextContent('false')
    expect(screen.getByText('Fill in the required field')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Birthday *'), {
      target: { value: '2025-01-01' },
    })
    fireEvent.click(screen.getByText('Check'))

    expect(screen.getByTestId('validity')).toHaveTextContent('true')
    expect(screen.queryByText('Fill in the required field')).not.toBeInTheDocument()
  })

  it('passes valid required checks for a filled required field', async () => {
    render(<Harness entityCode="client" initialValue={{ birthday: '1990-05-05' }} />, {
      wrapper: Wrapper,
    })

    fireEvent.click(screen.getByText('Check'))

    expect(screen.getByTestId('validity')).toHaveTextContent('true')
  })

  it('renders attributes for the order entity type', async () => {
    server.use(
      http.get('/api/v1/eav/attributes', ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('entity_code') === 'order') {
          return HttpResponse.json([
            {
              id: 'eav-o1',
              org_id: 'org-1',
              entity_code: 'order',
              code: 'delivery_date',
              name: 'Delivery date',
              field_type: 'date',
              is_required: false,
              default_value: '',
            },
          ])
        }
        return HttpResponse.json([])
      }),
    )
    render(<Harness entityCode="order" />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByLabelText('Delivery date')).toBeInTheDocument()
    })
    expect(screen.getByText('Additional fields')).toBeInTheDocument()
  })

  it('calls onChange with the field code when the user types', async () => {
    const onChangeSpy = vi.fn()
    render(<Harness entityCode="client" onChangeSpy={onChangeSpy} />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Instagram'), { target: { value: '@cake' } })

    expect(onChangeSpy).toHaveBeenCalledWith({ instagram: '@cake' })
  })
})
