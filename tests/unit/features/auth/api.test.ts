import {
  changePassword,
  listSessions,
  login,
  register,
  revokeAllSessions,
  revokeSession,
} from '@/features/auth/api'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client')

describe('Auth API', () => {
  it('calls login endpoint', async () => {
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValue({
      data: {
        access_token: 'tok',
        refresh_token: 'ref',
        token_type: 'bearer',
        user: null,
      },
    })

    await login({ email: 'a@b.com', password: '12345678' })
    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.com',
      password: '12345678',
    })
  })

  it('calls register endpoint', async () => {
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValue({
      data: {
        access_token: 'tok',
        refresh_token: 'ref',
        token_type: 'bearer',
        user: null,
      },
    })

    await register({
      email: 'a@b.com',
      password: '12345678',
      full_name: 'Test',
      consent_to_processing: true,
    })
    expect(mockPost).toHaveBeenCalledWith('/auth/register', {
      email: 'a@b.com',
      password: '12345678',
      full_name: 'Test',
      consent_to_processing: true,
    })
  })

  it('sends change-password payload', async () => {
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValue({ data: { status: 'ok' } })

    await changePassword({ current_password: 'old-pass-1', new_password: 'new-pass-1' })
    expect(mockPost).toHaveBeenCalledWith('/auth/change-password', {
      current_password: 'old-pass-1',
      new_password: 'new-pass-1',
    })
  })

  it('lists active sessions', async () => {
    const sessions = [
      {
        id: 's1',
        created_at: '2026-08-20T09:30:00Z',
        expires_at: '2026-09-19T09:30:00Z',
        last_used_at: null,
        ip: '192.168.0.10',
        user_agent: 'Mozilla/5.0',
        is_current: true,
      },
    ]
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: sessions })

    await expect(listSessions()).resolves.toEqual(sessions)
    expect(mockGet).toHaveBeenCalledWith('/auth/sessions')
  })

  it('revokes a single session by id', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({ data: { status: 'ok' } })

    await revokeSession('s2')
    expect(mockDelete).toHaveBeenCalledWith('/auth/sessions/s2')
  })

  it('revokes all sessions', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({ data: { status: 'ok' } })

    await revokeAllSessions()
    expect(mockDelete).toHaveBeenCalledWith('/auth/sessions')
  })
})
