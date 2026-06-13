export interface Receipt {
  id: string
  org_id: string
  client_id: string | null
  order_id: string | null
  receipt_date: string
  total: number
  source: string | null
  raw_data: Record<string, unknown> | null
  notes: string | null
}

export interface ReceiptCreate {
  client_id?: string | null
  order_id?: string | null
  receipt_date?: string
  source?: string | null
  raw_data?: Record<string, unknown> | null
  notes?: string | null
  items: ReceiptItemCreate[]
}

export interface ReceiptItem {
  id: string
  receipt_id: string
  product_id: string | null
  name: string
  price: number
  qty: number
}

export interface ReceiptItemCreate {
  product_id?: string | null
  name: string
  price?: number
  qty?: number
  discount?: number
  original_total?: number
  vat_rate?: string
  vat_percent?: number
}

export type ManualReceiptItemCreate = Pick<ReceiptItemCreate, 'name'> & {
  product_id?: string | null
  price: number
  qty: number
}

export interface ReceiptFilters {
  cursor?: string
  limit?: number
  date_from?: string
  date_to?: string
  source?: string
  client_id?: string
}
