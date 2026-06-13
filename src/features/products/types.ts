import type { PRODUCT_TYPES } from '@/shared/constants'

export type ProductType = (typeof PRODUCT_TYPES)[number]

export interface ProductComponentInput {
  product_id: string
  quantity: number
}

export interface Product {
  id: string
  org_id: string
  category: string
  name: string
  unit: string
  product_type: ProductType
  price: number
  cost_price: number
  stock_qty: number | null
  track_inventory: boolean
  is_sellable: boolean
  is_active: boolean
  custom_fields?: Record<string, unknown>
  local_fields?: Record<string, string>
  components?: ProductComponentInput[]
}

export interface ProductCreate {
  name: string
  category?: string
  unit?: string
  product_type?: ProductType
  price?: number
  cost_price?: number
  stock_qty?: number | null
  track_inventory?: boolean
  is_sellable?: boolean
  is_active?: boolean
  custom_fields?: Record<string, unknown>
  local_fields?: Record<string, string>
  components?: ProductComponentInput[]
}

export interface ProductUpdate {
  name?: string
  category?: string
  unit?: string
  product_type?: ProductType
  price?: number
  cost_price?: number
  stock_qty?: number | null
  track_inventory?: boolean
  is_sellable?: boolean
  is_active?: boolean
  custom_fields?: Record<string, unknown>
  local_fields?: Record<string, string>
}

export interface ProductFilters {
  cursor?: string
  limit?: number
  name?: string
  category?: string
  product_type?: string
  is_active?: boolean
  sort?: string
}
