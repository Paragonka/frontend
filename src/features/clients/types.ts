export interface Client {
  id: string
  org_id: string
  name: string
  surname: string
  phone: string
  notes: string
  custom_fields?: Record<string, unknown>
  local_fields?: Record<string, string>
}

export interface ClientCreate {
  name: string
  surname?: string
  phone?: string
  notes?: string
  custom_fields?: Record<string, unknown>
  local_fields?: Record<string, string>
}

export interface ClientUpdate {
  name?: string
  surname?: string
  phone?: string
  notes?: string
  custom_fields?: Record<string, unknown>
  local_fields?: Record<string, string>
}

export interface ClientFilters {
  cursor?: string
  limit?: number
  name?: string
  surname?: string
  phone?: string
  sort?: string
}
