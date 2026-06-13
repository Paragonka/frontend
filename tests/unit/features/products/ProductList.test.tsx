import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ProductList } from '@/features/products/components/ProductList'

const mockProducts = {
  data: [
    {
      id: 'p1',
      org_id: 'o1',
      name: 'Bread',
      category: 'Pastry',
      unit: 'pcs',
      product_type: 'good' as const,
      price: '10.00',
      cost_price: '5.00',
      stock_qty: null,
      track_inventory: false,
      is_sellable: true,
      is_active: true,
    },
    {
      id: 'p2',
      org_id: 'o1',
      name: 'Croissant',
      category: 'Pastry',
      unit: 'pcs',
      product_type: 'good' as const,
      price: '8.00',
      cost_price: '3.00',
      stock_qty: null,
      track_inventory: false,
      is_sellable: true,
      is_active: true,
    },
  ],
  next_cursor: null,
  total: 2,
}

const mockProductsWithMany = {
  data: [
    {
      id: 'p1',
      org_id: 'o1',
      name: 'Bread',
      category: 'Pastry',
      unit: 'pcs',
      product_type: 'good' as const,
      price: '10.00',
      cost_price: '5.00',
      stock_qty: null,
      track_inventory: false,
      is_sellable: true,
      is_active: true,
    },
  ],
  next_cursor: 'cursor-abc',
  total: 100,
}

let mockUseProducts: {
  data:
    | {
        data: Array<{
          id: string
          org_id: string
          name: string
          category: string
          unit: string
          product_type: string
          price: string
          cost_price: string
          stock_qty: number | null
          track_inventory: boolean
          is_sellable: boolean
          is_active: boolean
        }>
        next_cursor: string | null
        total: number
      }
    | undefined
  isLoading: boolean
} = {
  data: mockProducts,
  isLoading: false,
}

const mockMutateAsync = vi.fn().mockResolvedValue({})
const mockDeleteProduct = vi.fn().mockResolvedValue({})

vi.mock('@/features/products/hooks/useProducts', () => ({
  useProducts: () => mockUseProducts,
  useAllProducts: () => ({ data: [] }),
  useProduct: (id: string) => ({
    data: id
      ? {
          id,
          org_id: 'o1',
          name: 'Bread',
          category: 'Pastry',
          unit: 'pcs',
          product_type: 'good' as const,
          price: '10.00',
          cost_price: '5.00',
          stock_qty: null,
          track_inventory: false,
          is_sellable: true,
          is_active: true,
        }
      : undefined,
    isLoading: false,
  }),
  useCreateProduct: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useUpdateProduct: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteProduct: () => ({ mutate: mockDeleteProduct, isPending: false }),
}))

vi.mock('@/features/products/api', () => ({}))

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

describe('ProductList', () => {
  beforeEach(() => {
    mockUseProducts = { data: mockProducts, isLoading: false }
    mockDeleteProduct.mockClear()
  })

  it('renders page title', () => {
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.getByText('Products')).toBeInTheDocument()
  })

  it('renders product rows', () => {
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.getByText('Bread')).toBeInTheDocument()
    expect(screen.getByText('Croissant')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.getByText('New Product')).toBeInTheDocument()
  })

  it('renders edit buttons for each product', () => {
    render(<ProductList />, { wrapper: Wrapper })
    const editButtons = screen.getAllByText('Edit')
    expect(editButtons).toHaveLength(2)
  })

  it('renders delete buttons for each product', () => {
    render(<ProductList />, { wrapper: Wrapper })
    const deleteButtons = screen.getAllByText('Delete')
    expect(deleteButtons).toHaveLength(2)
  })

  it('deletes a product after confirmation', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('confirm', confirmSpy)
    render(<ProductList />, { wrapper: Wrapper })
    const deleteButtons = screen.getAllByText('Delete')
    await user.click(deleteButtons[0] as HTMLElement)
    expect(confirmSpy).toHaveBeenCalledWith('Delete product?')
    expect(mockDeleteProduct).toHaveBeenCalledWith('p1')
    vi.unstubAllGlobals()
  })

  it('does not delete a product when confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.fn().mockReturnValue(false)
    vi.stubGlobal('confirm', confirmSpy)
    render(<ProductList />, { wrapper: Wrapper })
    const deleteButtons = screen.getAllByText('Delete')
    await user.click(deleteButtons[0] as HTMLElement)
    expect(mockDeleteProduct).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('renders product type filter dropdown', () => {
    render(<ProductList />, { wrapper: Wrapper })
    const filter = screen.getByLabelText('Product type')
    expect(filter).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Good' })).toBeInTheDocument()
  })

  it('truncates long product names with full title attribute', () => {
    mockUseProducts = {
      data: {
        data: [
          {
            id: 'p-long',
            org_id: 'o1',
            name: 'x'.repeat(500),
            category: 'Pastry',
            unit: 'pcs',
            product_type: 'good' as const,
            price: '10.00',
            cost_price: '5.00',
            stock_qty: null,
            track_inventory: false,
            is_sellable: true,
            is_active: true,
          },
        ],
        next_cursor: null,
        total: 1,
      },
      isLoading: false,
    }
    render(<ProductList />, { wrapper: Wrapper })
    const nameCell = screen.getByTitle('x'.repeat(500))
    expect(nameCell).toHaveClass('truncate')
    expect(nameCell).toHaveClass('max-w-[240px]')
  })

  it('shows loading state', () => {
    mockUseProducts = { data: undefined, isLoading: true }
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows pagination when total exceeds limit', () => {
    mockUseProducts = { data: mockProductsWithMany, isLoading: false }
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.getByText(/Showing/)).toBeInTheDocument()
  })

  it('hides pagination when total <= limit', () => {
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it('updates search input', async () => {
    const user = userEvent.setup()
    render(<ProductList />, { wrapper: Wrapper })
    const searchInput = screen.getByPlaceholderText('Search by name...')
    await user.type(searchInput, 'Bread')
    expect(searchInput).toHaveValue('Bread')
  })

  it('shows Stock column header', () => {
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.getByRole('columnheader', { name: 'Stock' })).toBeInTheDocument()
  })

  it('shows infinity for products without inventory tracking', () => {
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.getByTestId('stock-p1')).toHaveTextContent('∞')
    expect(screen.getByTestId('stock-p2')).toHaveTextContent('∞')
  })

  it('shows stock quantity for tracked products', () => {
    mockUseProducts = {
      data: {
        data: [
          {
            id: 'p3',
            org_id: 'o1',
            name: 'Leather',
            category: 'Materials',
            unit: 'm',
            product_type: 'material' as const,
            price: '12.00',
            cost_price: '8.00',
            stock_qty: 25,
            track_inventory: true,
            is_sellable: true,
            is_active: true,
          },
        ],
        next_cursor: null,
        total: 1,
      },
      isLoading: false,
    }
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.getByTestId('stock-p3')).toHaveTextContent('25')
  })

  it('shows a dash for tracked products with null stock', () => {
    mockUseProducts = {
      data: {
        data: [
          {
            id: 'p4',
            org_id: 'o1',
            name: 'Tracked no count',
            category: 'Misc',
            unit: 'pcs',
            product_type: 'material' as const,
            price: '1.00',
            cost_price: '0.50',
            stock_qty: null,
            track_inventory: true,
            is_sellable: true,
            is_active: true,
          },
        ],
        next_cursor: null,
        total: 1,
      },
      isLoading: false,
    }
    render(<ProductList />, { wrapper: Wrapper })
    expect(screen.getByTestId('stock-p4')).toHaveTextContent('—')
  })
})
