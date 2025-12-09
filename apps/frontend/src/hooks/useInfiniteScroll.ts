import * as React from "react"

export interface InfiniteScrollOptions {
  threshold?: number
  rootMargin?: string
  root?: Element | null
  initialLoad?: boolean
  hasMore?: boolean
  isLoading?: boolean
  onLoadMore?: () => void | Promise<void>
}

export interface InfiniteScrollResult {
  sentinelRef: React.RefObject<HTMLDivElement>
  containerRef: React.RefObject<HTMLDivElement>
  isIntersecting: boolean
  observe: (element: Element) => void
  unobserve: (element: Element) => void
  disconnect: () => void
}

export function useInfiniteScroll(options: InfiniteScrollOptions = {}): InfiniteScrollResult {
  const {
    threshold = 0.1,
    rootMargin = "100px",
    root = null,
    initialLoad = true,
    hasMore = true,
    isLoading = false,
    onLoadMore,
  } = options

  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const observerRef = React.useRef<IntersectionObserver | null>(null)
  const [isIntersecting, setIsIntersecting] = React.useState(false)
  const hasLoadedRef = React.useRef(false)

  // Create intersection observer
  React.useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      root: root || containerRef.current,
      rootMargin,
      threshold,
    }

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      setIsIntersecting(entry.isIntersecting)

      if (entry.isIntersecting && hasMore && !isLoading && onLoadMore) {
        onLoadMore()
      }
    }

    observerRef.current = new IntersectionObserver(handleIntersection, observerOptions)

    // Observe sentinel element
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, onLoadMore, root, rootMargin, threshold])

  // Initial load
  React.useEffect(() => {
    if (initialLoad && !hasLoadedRef.current && onLoadMore) {
      hasLoadedRef.current = true
      onLoadMore()
    }
  }, [initialLoad, onLoadMore])

  // Observer control methods
  const observe = React.useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.observe(element)
    }
  }, [])

  const unobserve = React.useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element)
    }
  }, [])

  const disconnect = React.useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }, [])

  return {
    sentinelRef,
    containerRef,
    isIntersecting,
    observe,
    unobserve,
    disconnect,
  }
}

// Hook for virtual scrolling with large datasets
export interface VirtualScrollOptions {
  itemCount: number
  itemHeight: number | ((index: number) => number)
  containerHeight: number
  overscan?: number
  scrollingDelay?: number
}

export interface VirtualScrollResult {
  virtualItems: Array<{
    index: number
    start: number
    size: number
    end: number
  }>
  totalSize: number
  scrollToIndex: (index: number, options?: ScrollToOptions) => void
  scrollToOffset: (offset: number, options?: ScrollToOptions) => void
}

export function useVirtualScroll(options: VirtualScrollOptions): VirtualScrollResult {
  const {
    itemCount,
    itemHeight,
    containerHeight,
    overscan = 3,
    scrollingDelay = 150,
  } = options

  const [scrollTop, setScrollTop] = React.useState(0)
  const scrollingRef = React.useRef<number | null>(null)
  const isScrollingRef = React.useRef(false)

  // Calculate item heights
  const getItemHeight = React.useCallback((index: number) => {
    return typeof itemHeight === "function" ? itemHeight(index) : itemHeight
  }, [itemHeight])

  // Calculate virtual items
  const virtualItems = React.useMemo(() => {
    const items = []
    let accumulatedHeight = 0
    let startIndex = 0
    let endIndex = itemCount - 1

    // Find start index
    for (let i = 0; i < itemCount; i++) {
      const height = getItemHeight(i)
      if (accumulatedHeight + height > scrollTop - overscan * height) {
        startIndex = Math.max(0, i - overscan)
        break
      }
      accumulatedHeight += height
    }

    // Calculate accumulated height up to start index
    accumulatedHeight = 0
    for (let i = 0; i < startIndex; i++) {
      accumulatedHeight += getItemHeight(i)
    }

    // Find visible items
    let visibleHeight = 0
    for (let i = startIndex; i < itemCount; i++) {
      const height = getItemHeight(i)
      items.push({
        index: i,
        start: accumulatedHeight,
        size: height,
        end: accumulatedHeight + height,
      })
      accumulatedHeight += height
      visibleHeight += height

      if (visibleHeight > containerHeight + overscan * height) {
        endIndex = Math.min(itemCount - 1, i + overscan)
        break
      }
    }

    return items.slice(0, endIndex - startIndex + 1)
  }, [itemCount, getItemHeight, scrollTop, containerHeight, overscan])

  // Calculate total size
  const totalSize = React.useMemo(() => {
    let total = 0
    for (let i = 0; i < itemCount; i++) {
      total += getItemHeight(i)
    }
    return total
  }, [itemCount, getItemHeight])

  // Scroll handlers
  const scrollToIndex = React.useCallback((index: number, options?: ScrollToOptions) => {
    let offset = 0
    for (let i = 0; i < Math.min(index, itemCount); i++) {
      offset += getItemHeight(i)
    }
    // Implement actual scrolling logic here
    setScrollTop(offset)
  }, [itemCount, getItemHeight])

  const scrollToOffset = React.useCallback((offset: number, options?: ScrollToOptions) => {
    setScrollTop(Math.max(0, Math.min(offset, totalSize)))
  }, [totalSize])

  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
  }
}