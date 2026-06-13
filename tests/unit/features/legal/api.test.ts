import { cookieConsent } from '@/features/legal/api'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client')

describe('Legal API', () => {
  it('calls cookie consent endpoint', async () => {
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValue({ data: null })

    await cookieConsent()
    expect(mockPost).toHaveBeenCalledWith('/consent/cookie', { consent: true })
  })
})
