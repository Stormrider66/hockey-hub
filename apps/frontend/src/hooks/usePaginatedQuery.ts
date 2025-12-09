import * as React from "react"
import { SerializedError } from "@reduxjs/toolkit"
import { FetchBaseQueryError } from "@reduxjs/toolkit/query"

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedQueryOptions<T> {
  page?: number
  pageSize?: number
  sort?: string
  order?: 'asc' | 'desc'
  filters?: Record<string, any>
  enabled?: boolean
  refetchOnMount?: boolean
  refetchOnReconnect?: boolean
  refetchOnFocus?: boolean
  pollingInterval?: number
  onSuccess?: (data: PaginatedResponse<T>) => void
  onError?: (error: FetchBaseQueryError | SerializedError) => void
}

export interface PaginatedQueryResult<T> {
  data?: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error?: FetchBaseQueryError | SerializedError
  refetch: () => void
  // Pagination controls
  nextPage: () => void
  previousPage: () => void
  gotoPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  // Helpers
  startIndex: number
  endIndex: number
  isEmpty: boolean
}

// Generic hook for paginated RTK Query endpoints
export function usePaginatedQuery<T>(
  useQueryHook: (arg: any) => any,
  options: PaginatedQueryOptions<T> = {}
): PaginatedQueryResult<T> {
  const {
    page = 1,
    pageSize = 10,
    sort,
    order,
    filters = {},
    enabled = true,
    onSuccess,
    onError,
    ...queryOptions
  } = options

  const [currentPage, setCurrentPage] = React.useState(page)
  const [currentPageSize, setCurrentPageSize] = React.useState(pageSize)

  // Build query parameters
  const queryParams = React.useMemo(() => ({
    page: currentPage,
    limit: currentPageSize,
    pageSize: currentPageSize,
    sort,
    order,
    ...filters,
  }), [currentPage, currentPageSize, sort, order, filters])

  // Execute the query
  const queryResult = useQueryHook({
    ...queryParams,
    skip: !enabled,
    ...queryOptions,
  })

  const { data: rawData, isLoading, isFetching, isError, error, refetch } = queryResult

  // Handle pagination response formats
  const paginatedData = React.useMemo((): PaginatedResponse<T> => {
    if (!rawData) {
      return {
        data: [],
        total: 0,
        page: currentPage,
        pageSize: currentPageSize,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    }

    // Handle different response formats
    if ('data' in rawData && Array.isArray(rawData.data)) {
      // Format 1: { data: [], total: number, ... }
      return {
        data: rawData.data,
        total: rawData.total || rawData.totalCount || rawData.count || 0,
        page: rawData.page || rawData.currentPage || currentPage,
        pageSize: rawData.pageSize || rawData.limit || currentPageSize,
        totalPages: rawData.totalPages || Math.ceil((rawData.total || 0) / currentPageSize),
        hasNextPage: rawData.hasNextPage ?? currentPage < (rawData.totalPages || 1),
        hasPreviousPage: rawData.hasPreviousPage ?? currentPage > 1,
      }
    } else if ('items' in rawData && Array.isArray(rawData.items)) {
      // Format 2: { items: [], totalItems: number, ... }
      const total = rawData.totalItems || rawData.total || 0
      const totalPages = Math.ceil(total / currentPageSize)
      return {
        data: rawData.items,
        total,
        page: currentPage,
        pageSize: currentPageSize,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      }
    } else if (Array.isArray(rawData)) {
      // Format 3: Direct array (no pagination info)
      return {
        data: rawData,
        total: rawData.length,
        page: 1,
        pageSize: rawData.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    }

    // Fallback
    return {
      data: [],
      total: 0,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  }, [rawData, currentPage, currentPageSize])

  // Calculate indices
  const startIndex = (paginatedData.page - 1) * paginatedData.pageSize
  const endIndex = Math.min(startIndex + paginatedData.pageSize - 1, paginatedData.total - 1)

  // Callbacks
  React.useEffect(() => {
    if (!isLoading && !isError && paginatedData.data.length > 0) {
      onSuccess?.(paginatedData)
    }
  }, [paginatedData, isLoading, isError, onSuccess])

  React.useEffect(() => {
    if (isError && error) {
      onError?.(error)
    }
  }, [isError, error, onError])

  // Pagination controls
  const nextPage = React.useCallback(() => {
    if (paginatedData.hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [paginatedData.hasNextPage])

  const previousPage = React.useCallback(() => {
    if (paginatedData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1)
    }
  }, [paginatedData.hasPreviousPage])

  const gotoPage = React.useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, paginatedData.totalPages))
    setCurrentPage(validPage)
  }, [paginatedData.totalPages])

  const handleSetPageSize = React.useCallback((newPageSize: number) => {
    // Calculate new page to maintain position
    const firstItemIndex = (currentPage - 1) * currentPageSize
    const newPage = Math.floor(firstItemIndex / newPageSize) + 1
    
    setCurrentPageSize(newPageSize)
    setCurrentPage(newPage)
  }, [currentPage, currentPageSize])

  return {
    data: paginatedData.data,
    total: paginatedData.total,
    page: paginatedData.page,
    pageSize: paginatedData.pageSize,
    totalPages: paginatedData.totalPages,
    hasNextPage: paginatedData.hasNextPage,
    hasPreviousPage: paginatedData.hasPreviousPage,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    nextPage,
    previousPage,
    gotoPage,
    setPageSize: handleSetPageSize,
    startIndex,
    endIndex,
    isEmpty: paginatedData.data.length === 0,
  }
}

// Hook for infinite scroll with RTK Query
export function useInfiniteQuery<T>(
  useQueryHook: (arg: any) => any,
  options: Omit<PaginatedQueryOptions<T>, 'page' | 'pageSize'> & {
    pageSize?: number
    getNextPageParam?: (lastPage: PaginatedResponse<T>) => number | undefined
  } = {}
) {
  const { pageSize = 10, getNextPageParam, ...restOptions } = options
  const [pages, setPages] = React.useState<PaginatedResponse<T>[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [hasNextPage, setHasNextPage] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)

  const queryResult = usePaginatedQuery<T>(useQueryHook, {
    ...restOptions,
    page: currentPage,
    pageSize,
  })

  // Accumulate pages
  React.useEffect(() => {
    if (queryResult.data && !queryResult.isLoading) {
      setPages(prev => {
        const newPages = [...prev]
        newPages[currentPage - 1] = {
          data: queryResult.data!,
          total: queryResult.total,
          page: queryResult.page,
          pageSize: queryResult.pageSize,
          totalPages: queryResult.totalPages,
          hasNextPage: queryResult.hasNextPage,
          hasPreviousPage: queryResult.hasPreviousPage,
        }
        return newPages
      })
      setHasNextPage(queryResult.hasNextPage)
      setIsLoadingMore(false)
    }
  }, [queryResult.data, queryResult.isLoading, currentPage, queryResult.hasNextPage, queryResult.total, queryResult.page, queryResult.pageSize, queryResult.totalPages, queryResult.hasPreviousPage])

  const fetchNextPage = React.useCallback(() => {
    if (hasNextPage && !isLoadingMore) {
      setIsLoadingMore(true)
      if (getNextPageParam) {
        const lastPage = pages[pages.length - 1]
        const nextPage = getNextPageParam(lastPage)
        if (nextPage) {
          setCurrentPage(nextPage)
        }
      } else {
        setCurrentPage(prev => prev + 1)
      }
    }
  }, [hasNextPage, isLoadingMore, pages, getNextPageParam])

  // Flatten all pages data
  const data = React.useMemo(() => {
    return pages.flatMap(page => page.data)
  }, [pages])

  const total = pages[0]?.total || 0

  return {
    data,
    pages,
    total,
    hasNextPage,
    fetchNextPage,
    isLoading: queryResult.isLoading && currentPage === 1,
    isLoadingMore,
    isFetchingNextPage: isLoadingMore,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: () => {
      setPages([])
      setCurrentPage(1)
      setHasNextPage(true)
      queryResult.refetch()
    },
  }
}