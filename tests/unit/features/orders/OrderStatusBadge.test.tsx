import { render, screen } from '@testing-library/react'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'

describe('OrderStatusBadge', () => {
  it('renders draft status', () => {
    render(<OrderStatusBadge status="draft" />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('renders confirmed status', () => {
    render(<OrderStatusBadge status="confirmed" />)
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('renders done status', () => {
    render(<OrderStatusBadge status="done" />)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('renders cancelled status', () => {
    render(<OrderStatusBadge status="cancelled" />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })

  it('has the correct color class for draft', () => {
    const { container } = render(<OrderStatusBadge status="draft" />)
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('bg-gray')
  })

  it('has the correct color class for confirmed', () => {
    const { container } = render(<OrderStatusBadge status="confirmed" />)
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('bg-blue')
  })

  it('has the correct color class for done', () => {
    const { container } = render(<OrderStatusBadge status="done" />)
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('bg-green')
  })

  it('has the correct color class for cancelled', () => {
    const { container } = render(<OrderStatusBadge status="cancelled" />)
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('bg-red')
  })
})
