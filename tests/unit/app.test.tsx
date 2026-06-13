import { render, screen } from '@testing-library/react'

describe('App', () => {
  it('renders login page at /login', async () => {
    window.location.href = 'http://localhost:3000/login'
    const { default: App } = await import('../../src/App')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  }, 30000)
})
