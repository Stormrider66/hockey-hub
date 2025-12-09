import * as React from "react"
import { PaginationPreferences, DEFAULT_PAGINATION } from "@/types/pagination.types"

const STORAGE_KEY = "hockey-hub-pagination-preferences"

export function usePaginationPreferences(
  contextKey?: string
): [PaginationPreferences, (updates: Partial<PaginationPreferences>) => void] {
  const storageKey = contextKey ? `${STORAGE_KEY}-${contextKey}` : STORAGE_KEY

  const [preferences, setPreferences] = React.useState<PaginationPreferences>(() => {
    if (typeof window === "undefined") return DEFAULT_PAGINATION
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        return { ...DEFAULT_PAGINATION, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error("Failed to load pagination preferences:", error)
    }
    
    return DEFAULT_PAGINATION
  })

  const updatePreferences = React.useCallback(
    (updates: Partial<PaginationPreferences>) => {
      setPreferences((current) => {
        const newPreferences = { ...current, ...updates }
        
        try {
          localStorage.setItem(storageKey, JSON.stringify(newPreferences))
        } catch (error) {
          console.error("Failed to save pagination preferences:", error)
        }
        
        return newPreferences
      })
    },
    [storageKey]
  )

  return [preferences, updatePreferences]
}

// Hook for managing page size across different views
export function usePageSize(
  defaultSize: number = 20,
  contextKey?: string
): [number, (size: number) => void] {
  const storageKey = contextKey
    ? `${STORAGE_KEY}-pageSize-${contextKey}`
    : `${STORAGE_KEY}-pageSize`

  const [pageSize, setPageSizeState] = React.useState<number>(() => {
    if (typeof window === "undefined") return defaultSize
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const size = parseInt(stored, 10)
        if (!isNaN(size) && size > 0) {
          return size
        }
      }
    } catch (error) {
      console.error("Failed to load page size:", error)
    }
    
    return defaultSize
  })

  const setPageSize = React.useCallback(
    (size: number) => {
      setPageSizeState(size)
      
      try {
        localStorage.setItem(storageKey, size.toString())
      } catch (error) {
        console.error("Failed to save page size:", error)
      }
    },
    [storageKey]
  )

  return [pageSize, setPageSize]
}

// Hook for URL-based pagination
export function useURLPagination(options?: {
  pageParam?: string
  pageSizeParam?: string
  defaultPage?: number
  defaultPageSize?: number
}) {
  const {
    pageParam = "page",
    pageSizeParam = "pageSize",
    defaultPage = 1,
    defaultPageSize = 20,
  } = options || {}

  // This is a simplified version - in a real app, you'd use your routing library
  const getURLParam = (param: string, defaultValue: number): number => {
    if (typeof window === "undefined") return defaultValue
    
    const params = new URLSearchParams(window.location.search)
    const value = params.get(param)
    if (value) {
      const parsed = parseInt(value, 10)
      if (!isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
    return defaultValue
  }

  const setURLParam = (param: string, value: number) => {
    if (typeof window === "undefined") return
    
    const params = new URLSearchParams(window.location.search)
    params.set(param, value.toString())
    const newURL = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, "", newURL)
  }

  const [page, setPageState] = React.useState(() => getURLParam(pageParam, defaultPage))
  const [pageSize, setPageSizeState] = React.useState(() => getURLParam(pageSizeParam, defaultPageSize))

  const setPage = React.useCallback(
    (newPage: number) => {
      setPageState(newPage)
      setURLParam(pageParam, newPage)
    },
    [pageParam]
  )

  const setPageSize = React.useCallback(
    (newPageSize: number) => {
      setPageSizeState(newPageSize)
      setURLParam(pageSizeParam, newPageSize)
      // Reset to page 1 when changing page size
      setPage(1)
    },
    [pageSizeParam, setPage]
  )

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
  }
}