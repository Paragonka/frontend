import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { JpkUploadZone } from '@/features/receipts/components/JpkUploadZone'

const mockOnParsed = vi.fn()

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  mockOnParsed.mockClear()
})

describe('JpkUploadZone', () => {
  it('renders upload zone', () => {
    render(
      <Wrapper>
        <JpkUploadZone onParsed={mockOnParsed} />
      </Wrapper>,
    )
    expect(screen.getByText('Drag and drop the receipt JSON file here')).toBeInTheDocument()
  })

  it('shows error for non-JSON file', () => {
    render(
      <Wrapper>
        <JpkUploadZone onParsed={mockOnParsed} />
      </Wrapper>,
    )

    const file = new File(['not json'], 'receipt.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/Drag and drop/)
    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByText('Format: JSON file')).toBeInTheDocument()
  })
})
