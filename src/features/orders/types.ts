export interface Order {
  id: string
  org_id: string
  client_id: string | null
  client_name: string
  status: 'draft' | 'confirmed' | 'done' | 'cancelled'
  is_deleted?: boolean
  deleted_at?: string | null
  total: number
  execution_date: string
  notes: string
  photos?: string[]
  custom_fields?: Record<string, unknown>
  local_fields?: Record<string, string>
  items?: OrderItem[]
}

export interface OrderCreate {
  client_id?: string | null
  execution_date?: string
  notes?: string
  custom_fields?: Record<string, unknown>
  local_fields?: Record<string, string>
  items?: OrderItemCreate[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  name: string
  price: number
  qty: number
}

export interface OrderItemCreate {
  product_id: string
  name: string
  price?: number
  qty?: number
}

export interface OrderItemUpdate {
  name?: string
  price?: number
  qty?: number
}

export interface WriteOffCreate {
  order_item_id: string
  qty: number
  reason?: string
}

export interface WriteOffResponse {
  id: string
  product_id: string
  qty: number
  reason?: string | null
  created_at: string
}

export interface OrderFilters {
  cursor?: string
  limit?: number
  status?: string
  execution_date_from?: string
  execution_date_to?: string
  sort?: string
  include_deleted?: boolean
}
