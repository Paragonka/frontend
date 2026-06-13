import { apiClient } from '@/shared/api/client'
import type {
  AcceptInviteRequest,
  AcceptInviteResponse,
  AuthSession,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  TokenResponse,
} from './types'

export async function register(input: RegisterRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post('/auth/register', input)
  return data
}

export async function login(input: LoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post('/auth/login', input)
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function changePassword(input: ChangePasswordRequest): Promise<void> {
  await apiClient.post('/auth/change-password', input)
}

export async function forgotPassword(
  input: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post('/auth/forgot-password', input)
  return data
}

export async function resetPassword(input: ResetPasswordRequest): Promise<void> {
  await apiClient.post('/auth/reset-password', input)
}

export async function acceptInvite(input: AcceptInviteRequest): Promise<AcceptInviteResponse> {
  const { data } = await apiClient.post('/auth/invites/accept', input)
  return data
}

export async function listSessions(): Promise<AuthSession[]> {
  const { data } = await apiClient.get('/auth/sessions')
  return data
}

export async function revokeSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/auth/sessions/${sessionId}`)
}

export async function revokeAllSessions(): Promise<void> {
  await apiClient.delete('/auth/sessions')
}
