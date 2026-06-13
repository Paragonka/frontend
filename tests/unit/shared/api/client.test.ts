import { apiClient } from '@/shared/api/client'

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('has correct base URL', () => {
    expect(apiClient.defaults.baseURL).toBe('/api/v1')
  })

  it('has JSON content type header', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('has response interceptor', () => {
    expect(apiClient.interceptors.response).toBeDefined()
  })

  it('has request interceptor', () => {
    expect(apiClient.interceptors.request).toBeDefined()
  })

  it('blocks POST request when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false })

    await expect(apiClient.post('/test', {})).rejects.toThrow(
      'You are offline. Create, update, and delete operations are unavailable.',
    )
  })

  it('blocks PUT request when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false })

    await expect(apiClient.put('/test/1', {})).rejects.toThrow(
      'You are offline. Create, update, and delete operations are unavailable.',
    )
  })

  it('blocks DELETE request when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false })

    await expect(apiClient.delete('/test/1')).rejects.toThrow(
      'You are offline. Create, update, and delete operations are unavailable.',
    )
  })

  it('allows GET request when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false })

    // get should not throw offline error
    const promise = apiClient.get('/test')
    await expect(promise).rejects.not.toThrow(
      'You are offline. Create, update, and delete operations are unavailable.',
    )
  })

  describe('error detail extraction', () => {
    const originalAdapter = apiClient.defaults.adapter

    afterEach(() => {
      apiClient.defaults.adapter = originalAdapter
    })

    function rejectWith(response: {
      status: number
      data: Record<string, unknown> | string
      message?: string
    }) {
      apiClient.defaults.adapter = async () =>
        Promise.reject({
          message: response.message,
          response: { status: response.status, data: response.data },
        })
    }

    it('maps array detail (FastAPI validation errors) to a readable message', async () => {
      rejectWith({
        status: 422,
        data: {
          detail: [
            { loc: ['body', 'name'], msg: 'Field required', type: 'missing' },
            { loc: ['body', 'email'], msg: 'Not a valid email address', type: 'value_error' },
          ],
        },
      })

      const promise = apiClient.get('/test')
      await expect(promise).rejects.toMatchObject({
        status: 422,
        message: 'Field required, Not a valid email address',
      })
    })

    it('falls back to the `message` field of items lacking `msg`', async () => {
      rejectWith({
        status: 400,
        data: {
          detail: [{ message: 'Bad payload' }],
        },
      })

      await expect(apiClient.get('/test')).rejects.toMatchObject({
        status: 400,
        message: 'Bad payload',
      })
    })

    it('uses string detail as-is', async () => {
      rejectWith({ status: 409, data: { detail: 'Order already exists' } })

      await expect(apiClient.get('/test')).rejects.toMatchObject({
        status: 409,
        message: 'Order already exists',
      })
    })

    it('falls back to error.message when no detail is present', async () => {
      rejectWith({ status: 500, data: {}, message: 'Network Error' })

      await expect(apiClient.get('/test')).rejects.toMatchObject({
        status: 500,
        message: 'Network Error',
      })
    })
  })
})
