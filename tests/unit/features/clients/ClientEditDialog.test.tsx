import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientEditDialog } from '@/features/clients/components/ClientEditDialog'
import { useAuthStore } from '@/shared/store/auth'

const mockMutateAsync = vi.fn().mockResolvedValue({})
const mockDeleteMedia = vi.fn()

// Stable references are essential: ClientEditDialog has a useEffect keyed on
// `client`, so a fresh object per render would loop forever.
const mockClient = {
  id: 'c1',
  org_id: 'org-1',
  name: 'John',
  surname: 'Doe',
  phone: '123',
  notes: '',
  custom_fields: {},
}
const mockPhotos = [{ key: 'org-1/clients/c1/photo-1.jpg' }]

vi.mock('@/features/clients/hooks/useClients', () => ({
  useClient: () => ({ data: mockClient, isLoading: false }),
  useUpdateClient: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))

vi.mock('@/features/media/hooks/useMedia', () => ({
  useEntityPhotos: () => ({ data: mockPhotos }),
  useDeleteMedia: () => ({ mutate: mockDeleteMedia, isPending: false }),
  useUploadPhoto: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}))

vi.mock('@/features/eav/components/EavFieldsForm', async () => {
  const { forwardRef, useImperativeHandle } = await import('react')
  return {
    EavFieldsForm: forwardRef(function MockEavFieldsForm(_props, ref) {
      useImperativeHandle(ref, () => ({ validate: () => true }), [])
      return null
    }),
  }
})

vi.mock('@/shared/ui/dialog', async () => {
  const { forwardRef } = await import('react')
  type DivProps = { children?: React.ReactNode; className?: string }
  const PlainDiv = forwardRef<HTMLDivElement, DivProps>(function MockDiv(
    { children, ...props },
    ref,
  ) {
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  })
  return {
    Dialog: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    DialogContent: PlainDiv,
    DialogHeader: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    DialogTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  }
})

function renderDialog() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ClientEditDialog clientId="c1" open onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  )
}

describe('ClientEditDialog', () => {
  beforeEach(() => {
    mockMutateAsync.mockClear()
    mockDeleteMedia.mockClear()
    useAuthStore.setState({ currentOrgId: 'org-1' })
  })

  it('renders form fields and photos block', () => {
    renderDialog()
    expect(screen.getByText('Edit client')).toBeInTheDocument()
    expect(screen.getByLabelText('First name *')).toHaveValue('John')
    expect(screen.getByText('Photos')).toBeInTheDocument()
  })

  it('renders photo thumbnails with key-based src', () => {
    renderDialog()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/api/v1/media/org-1/clients/c1/photo-1.jpg?org_id=org-1')
  })

  it('deletes photo after confirmation', async () => {
    const confirmSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('confirm', confirmSpy)
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(mockDeleteMedia).toHaveBeenCalledWith('org-1/clients/c1/photo-1.jpg')
    vi.unstubAllGlobals()
  })

  it('submits updated client data', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('First name *'), 'ny')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await vi.waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    const [payload] = mockMutateAsync.mock.calls[0] as [
      {
        input: {
          name: string
          custom_fields: Record<string, unknown>
          local_fields?: Record<string, string>
        }
      },
    ]
    expect(payload.input.name).toBe('Johnny')
    expect(payload.input.custom_fields).toEqual({})
    expect(payload.input.local_fields).toEqual({})
  })
})
