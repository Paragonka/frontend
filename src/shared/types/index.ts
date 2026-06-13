export interface User {
  id: string
  email: string
  full_name: string
}

export interface Organization {
  id: string
  name: string
  owner_id: string
  timezone: string
}

export interface OrganizationSettings {
  currency: string
}
