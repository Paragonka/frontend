export interface PaginatedResponse<T> {
  data: T[]
  next_cursor: string | null
  total: number
}
