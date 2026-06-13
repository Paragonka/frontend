import type { User } from '@/shared/types'

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  consent_to_processing: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User | null
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  detail?: string
  reset_token?: string
  reset_url?: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface AcceptInviteRequest {
  token: string
}

export interface AcceptInviteResponse {
  org_id: string
  org_name: string
  role: string
}

/** Active refresh session as returned by GET /auth/sessions. */
export interface AuthSession {
  id: string
  created_at: string | null
  expires_at: string | null
  last_used_at: string | null
  ip: string | null
  user_agent: string | null
  is_current: boolean
}
