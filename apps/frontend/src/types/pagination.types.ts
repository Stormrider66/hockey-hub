export interface PaginationParams {
  page?: number
  pageSize?: number
  limit?: number
  offset?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedApiResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface CursorPaginationParams {
  cursor?: string
  limit?: number
  direction?: 'forward' | 'backward'
}

export interface CursorPaginatedResponse<T> {
  data: T[]
  cursor: {
    next?: string
    previous?: string
    hasNext: boolean
    hasPrevious: boolean
  }
  meta?: {
    total?: number
  }
}

export interface PaginationPreferences {
  defaultPageSize: number
  pageSizeOptions: number[]
  style: 'numbers' | 'infinite' | 'loadMore'
  showItemCount: boolean
  rememberPageSize: boolean
}

export const DEFAULT_PAGINATION: PaginationPreferences = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  style: 'numbers',
  showItemCount: true,
  rememberPageSize: true,
}