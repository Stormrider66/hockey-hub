import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LoadMoreButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => void
  isLoading?: boolean
  hasMore?: boolean
  loadingText?: string
  endText?: string
  itemsCount?: number
  totalCount?: number
}

export function LoadMoreButton({
  onClick,
  isLoading = false,
  hasMore = true,
  loadingText = "Loading more...",
  endText = "No more items",
  itemsCount,
  totalCount,
  className,
  children,
  disabled,
  ...props
}: LoadMoreButtonProps) {
  if (!hasMore && !isLoading) {
    return (
      <div className={cn("text-center text-sm text-muted-foreground p-4", className)}>
        {endText}
      </div>
    )
  }

  const showCount = itemsCount !== undefined && totalCount !== undefined
  const defaultText = showCount 
    ? `Load more (${itemsCount} of ${totalCount})`
    : "Load more"

  return (
    <div className={cn("flex justify-center p-4", className)}>
      <Button
        onClick={onClick}
        disabled={isLoading || disabled || !hasMore}
        variant="outline"
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          children || defaultText
        )}
      </Button>
    </div>
  )
}