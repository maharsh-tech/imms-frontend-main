export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  limit: number
}

export type PaginationParams = {
  page?: number
  limit?: number
}
