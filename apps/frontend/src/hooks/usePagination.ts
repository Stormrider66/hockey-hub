import * as React from "react"

export interface PaginationState {
  pageIndex: number
  pageSize: number
}

export interface PaginationOptions {
  pageCount?: number
  totalItems?: number
  initialPageIndex?: number
  initialPageSize?: number
  pageSizeOptions?: number[]
  onPageChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export interface PaginationResult {
  pageIndex: number
  pageSize: number
  pageCount: number
  canPreviousPage: boolean
  canNextPage: boolean
  pageOptions: number[]
  pageSizeOptions: number[]
  gotoPage: (pageIndex: number) => void
  nextPage: () => void
  previousPage: () => void
  setPageSize: (pageSize: number) => void
  getPageNumbers: (options?: GetPageNumbersOptions) => (number | string)[]
  startIndex: number
  endIndex: number
}

interface GetPageNumbersOptions {
  boundaryCount?: number
  siblingCount?: number
}

export function usePagination(options: PaginationOptions = {}): PaginationResult {
  const {
    pageCount: controlledPageCount,
    totalItems,
    initialPageIndex = 0,
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 30, 40, 50],
    onPageChange,
    onPageSizeChange,
  } = options

  const [pageIndex, setPageIndex] = React.useState(initialPageIndex)
  const [pageSize, setPageSize] = React.useState(initialPageSize)

  // Calculate page count
  const pageCount = React.useMemo(() => {
    if (controlledPageCount !== undefined) {
      return controlledPageCount
    }
    if (totalItems !== undefined) {
      return Math.ceil(totalItems / pageSize)
    }
    return 0
  }, [controlledPageCount, totalItems, pageSize])

  // Calculate page options
  const pageOptions = React.useMemo(() => {
    return Array.from({ length: pageCount }, (_, i) => i)
  }, [pageCount])

  // Pagination state
  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex < pageCount - 1

  // Calculate start and end indices for current page
  const startIndex = pageIndex * pageSize
  const endIndex = Math.min(startIndex + pageSize - 1, (totalItems || 0) - 1)

  // Page navigation functions
  const gotoPage = React.useCallback((newPageIndex: number) => {
    const page = Math.max(0, Math.min(newPageIndex, pageCount - 1))
    setPageIndex(page)
    onPageChange?.(page)
  }, [pageCount, onPageChange])

  const nextPage = React.useCallback(() => {
    if (canNextPage) {
      gotoPage(pageIndex + 1)
    }
  }, [canNextPage, gotoPage, pageIndex])

  const previousPage = React.useCallback(() => {
    if (canPreviousPage) {
      gotoPage(pageIndex - 1)
    }
  }, [canPreviousPage, gotoPage, pageIndex])

  const handleSetPageSize = React.useCallback((newPageSize: number) => {
    // Calculate new page index to maintain roughly the same position
    const topRowIndex = pageIndex * pageSize
    const newPageIndex = Math.floor(topRowIndex / newPageSize)
    
    setPageSize(newPageSize)
    setPageIndex(newPageIndex)
    onPageSizeChange?.(newPageSize)
    onPageChange?.(newPageIndex)
  }, [pageIndex, pageSize, onPageSizeChange, onPageChange])

  // Generate page numbers with ellipsis
  const getPageNumbers = React.useCallback((options: GetPageNumbersOptions = {}) => {
    const { boundaryCount = 1, siblingCount = 1 } = options
    const pages: (number | string)[] = []

    if (pageCount <= 0) return pages

    // Always show first page
    pages.push(0)

    // Calculate range around current page
    const leftSiblingIndex = Math.max(pageIndex - siblingCount, 1)
    const rightSiblingIndex = Math.min(pageIndex + siblingCount, pageCount - 2)

    // Show left ellipsis
    if (leftSiblingIndex > boundaryCount + 1) {
      pages.push('...')
    } else {
      // Fill in pages between boundary and siblings
      for (let i = 1; i < leftSiblingIndex; i++) {
        pages.push(i)
      }
    }

    // Show sibling pages
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      pages.push(i)
    }

    // Show right ellipsis
    if (rightSiblingIndex < pageCount - boundaryCount - 2) {
      pages.push('...')
    } else {
      // Fill in pages between siblings and boundary
      for (let i = rightSiblingIndex + 1; i < pageCount - 1; i++) {
        pages.push(i)
      }
    }

    // Always show last page (if more than one page)
    if (pageCount > 1) {
      pages.push(pageCount - 1)
    }

    return pages
  }, [pageCount, pageIndex])

  // Reset page index when page count changes
  React.useEffect(() => {
    if (pageIndex >= pageCount && pageCount > 0) {
      gotoPage(pageCount - 1)
    }
  }, [pageCount, pageIndex, gotoPage])

  return {
    pageIndex,
    pageSize,
    pageCount,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageSizeOptions,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize: handleSetPageSize,
    getPageNumbers,
    startIndex,
    endIndex,
  }
}

// Hook for managing pagination with URL state
export function useURLPagination(
  options: PaginationOptions & { 
    paramNames?: { 
      page?: string
      pageSize?: string 
    }
  } = {}
) {
  const {
    paramNames = { page: 'page', pageSize: 'pageSize' },
    ...paginationOptions
  } = options

  // This would integrate with your routing solution
  // For now, returning regular pagination
  return usePagination(paginationOptions)
}