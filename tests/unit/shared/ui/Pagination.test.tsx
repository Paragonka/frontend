import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '@/shared/ui/pagination'

describe('Pagination', () => {
  const defaultProps = {
    page: 1,
    total: 100,
    limit: 50,
    visitedPages: [1],
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onGoToPage: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when total <= limit', () => {
    render(<Pagination {...defaultProps} total={30} />)
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it('renders range text', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByText(/Showing/)).toBeInTheDocument()
    expect(screen.getByText(/1–50/)).toBeInTheDocument()
    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it('renders prev/next buttons', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByText('←')).toBeInTheDocument()
    expect(screen.getByText('→')).toBeInTheDocument()
  })

  it('disables prev button on first page', () => {
    render(<Pagination {...defaultProps} page={1} />)
    expect(screen.getByText('←')).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<Pagination {...defaultProps} page={2} />)
    expect(screen.getByText('→')).toBeDisabled()
  })

  it('calls onNext when clicking next button', async () => {
    const user = userEvent.setup()
    render(<Pagination {...defaultProps} />)
    await user.click(screen.getByText('→'))
    expect(defaultProps.onNext).toHaveBeenCalled()
  })

  it('calls onPrev when clicking prev button', async () => {
    const user = userEvent.setup()
    render(<Pagination {...defaultProps} page={2} />)
    await user.click(screen.getByText('←'))
    expect(defaultProps.onPrev).toHaveBeenCalled()
  })

  it('calls onGoToPage when clicking a page number', async () => {
    const user = userEvent.setup()
    render(<Pagination {...defaultProps} page={1} visitedPages={[1, 2]} total={150} />)
    await user.click(screen.getByText('2'))
    expect(defaultProps.onGoToPage).toHaveBeenCalledWith(2)
  })

  it('does not call onGoToPage for current page', async () => {
    const user = userEvent.setup()
    render(<Pagination {...defaultProps} page={1} />)
    await user.click(screen.getByText('1'))
    expect(defaultProps.onGoToPage).not.toHaveBeenCalled()
  })

  it('shows ellipsis for large page counts', () => {
    render(<Pagination {...defaultProps} page={5} total={500} visitedPages={[1, 5]} />)
    expect(screen.getAllByText('…').length).toBeGreaterThan(0)
  })

  it('does not render unvisited page numbers', () => {
    render(<Pagination {...defaultProps} total={150} />)
    expect(screen.queryByText('2')).not.toBeInTheDocument()
    expect(screen.queryByText('3')).not.toBeInTheDocument()
  })

  it('shows correct range for page 2', () => {
    render(<Pagination {...defaultProps} page={2} />)
    expect(screen.getByText(/51–100/)).toBeInTheDocument()
  })
})
