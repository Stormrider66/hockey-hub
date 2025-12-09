import * as React from "react"
import { cn } from "@/lib/utils"

interface PaginationInfoProps {
  currentPage?: number
  pageSize?: number
  totalItems: number
  itemsOnPage?: number
  startItem?: number
  endItem?: number
  className?: string
  showPageInfo?: boolean
  itemName?: string
  itemNamePlural?: string
}

export function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  itemsOnPage,
  startItem,
  endItem,
  className,
  showPageInfo = true,
  itemName = "item",
  itemNamePlural = "items",
}: PaginationInfoProps) {
  // Calculate display values
  const calculatedStartItem = startItem ?? (currentPage && pageSize ? (currentPage - 1) * pageSize + 1 : 1)
  const calculatedEndItem = endItem ?? (
    currentPage && pageSize 
      ? Math.min(currentPage * pageSize, totalItems)
      : itemsOnPage 
        ? calculatedStartItem + itemsOnPage - 1
        : totalItems
  )

  const totalPages = pageSize ? Math.ceil(totalItems / pageSize) : 1
  const displayItemName = totalItems === 1 ? itemName : itemNamePlural

  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      {totalItems === 0 ? (
        <span>No {itemNamePlural}</span>
      ) : (
        <span>
          Showing {calculatedStartItem.toLocaleString()}-{calculatedEndItem.toLocaleString()} of{" "}
          {totalItems.toLocaleString()} {displayItemName}
          {showPageInfo && currentPage && totalPages > 1 && (
            <span className="ml-1">
              (Page {currentPage} of {totalPages})
            </span>
          )}
        </span>
      )}
    </div>
  )
}

// Simplified version for inline use
export function SimplePaginationInfo({
  current,
  total,
  className,
}: {
  current: number
  total: number
  className?: string
}) {
  return (
    <span className={cn("text-sm text-muted-foreground", className)}>
      {current.toLocaleString()} / {total.toLocaleString()}
    </span>
  )
}