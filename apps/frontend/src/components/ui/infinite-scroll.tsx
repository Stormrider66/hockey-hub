import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface InfiniteScrollProps {
  children: React.ReactNode
  hasMore: boolean
  isLoading: boolean
  next: () => void
  loader?: React.ReactNode
  endMessage?: React.ReactNode
  threshold?: number
  useWindow?: boolean
  scrollableTarget?: string
  className?: string
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  next,
  loader,
  endMessage,
  threshold = 0.8,
  useWindow = true,
  scrollableTarget,
  className,
}: InfiniteScrollProps) {
  const observerRef = React.useRef<IntersectionObserver | null>(null)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const options: IntersectionObserverInit = {
      root: useWindow ? null : containerRef.current,
      rootMargin: '20px',
      threshold: threshold,
    }

    if (scrollableTarget) {
      const target = document.getElementById(scrollableTarget)
      if (target) {
        options.root = target
      }
    }

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target.isIntersecting && hasMore && !isLoading) {
        next()
      }
    }

    observerRef.current = new IntersectionObserver(handleObserver, options)

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, next, threshold, useWindow, scrollableTarget])

  const defaultLoader = (
    <div className="flex justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )

  const defaultEndMessage = (
    <div className="text-center text-sm text-muted-foreground p-4">
      No more items to load
    </div>
  )

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="h-1" />
      )}
      {isLoading && (loader || defaultLoader)}
      {!hasMore && !isLoading && (endMessage || defaultEndMessage)}
    </div>
  )
}

// Hook for infinite scroll with manual trigger
export function useInfiniteScrollTrigger(callback: () => void, options?: {
  enabled?: boolean
  threshold?: number
}) {
  const { enabled = true, threshold = 0.8 } = options || {}
  const observerRef = React.useRef<IntersectionObserver | null>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!enabled) return

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target.isIntersecting) {
        callback()
      }
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: threshold,
    })

    if (triggerRef.current) {
      observerRef.current.observe(triggerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [callback, enabled, threshold])

  return triggerRef
}