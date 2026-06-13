// Must mirror ALLOWED_CURRENCIES in backend/app/features/orgs/schemas.py.
export const ALLOWED_CURRENCIES = ['RUB', 'PLN', 'USD', 'EUR', 'BYN', 'KZT', 'UAH'] as const

export type CurrencyCode = (typeof ALLOWED_CURRENCIES)[number]

export interface OrgCreate {
  name: string
  timezone?: string
}

export interface OrgUpdate {
  name: string
}

export interface OrgSettings {
  currency: string
}

export interface OrgSettingsUpdate {
  currency: CurrencyCode
}

export type OrgRole = 'owner' | 'member'

export interface OrgMember {
  user_id: string
  email: string
  full_name: string
  role: OrgRole
}

export interface InviteCreateRequest {
  email: string
}

export interface InviteCreatedResponse {
  invite_id: string
  token: string
  expires_at: string | null
}

export interface ActiveInvite {
  invite_id: string
  email: string
  token: string
  expires_at: string | null
}
