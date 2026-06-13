import { HttpResponse, http } from 'msw'
import { apiClient } from '@/shared/api/client'
import { server } from '../../../mocks/server'

describe('MSW integration', () => {
  it('intercepts API requests', async () => {
    const { data } = await apiClient.get('/orgs')
    expect(data[0].name).toBe('Test Bakery')
  })

  it('allows custom handlers per test', async () => {
    server.use(
      http.get('/api/v1/orgs', () => {
        return HttpResponse.json([{ id: 'org-x', name: 'Custom Org' }])
      }),
    )
    const { data } = await apiClient.get('/orgs')
    expect(data[0].name).toBe('Custom Org')
  })
})
