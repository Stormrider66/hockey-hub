import React, { useCallback, useRef, useEffect, CSSProperties } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';

export interface VirtualizedListProps<T = any> {
  items: T[];
  height: number;
  itemHeight: number;
  width?: number | string;
  className?: string;
  overscan?: number;
  onScroll?: (scrollOffset: number) => void;
  renderItem: (props: {
    item: T;
    index: number;
    isScrolling?: boolean;
    style: CSSProperties;
  }) => React.ReactNode;
  getItemKey?: (index: number, data: T[]) => string;
  emptyMessage?: string;
  loading?: boolean;
  initialScrollOffset?: number;
  onItemsRendered?: (props: {
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => void;
}

export function VirtualizedList<T = any>({
  items,
  height,
  itemHeight,
  width = '100%',
  className,
  overscan = 3,
  onScroll,
  renderItem,
  getItemKey,
  emptyMessage = 'No items found',
  loading = false,
  initialScrollOffset = 0,
  onItemsRendered,
}: VirtualizedListProps<T>) {
  const listRef = useRef<List>(null);

  // Restore scroll position
  useEffect(() => {
    if (listRef.current && initialScrollOffset > 0) {
      listRef.current.scrollTo(initialScrollOffset);
    }
  }, [initialScrollOffset]);

  const Row = useCallback(
    ({ index, style, isScrolling, data }: ListChildComponentProps<T[]>) => {
      const item = data[index];
      return renderItem({ item, index, isScrolling, style });
    },
    [renderItem]
  );

  const itemKey = useCallback(
    (index: number, data: T[]) => {
      if (getItemKey) {
        return getItemKey(index, data);
      }
      // Default key generation - assumes items have an id property
      const item = data[index] as any;
      return item?.id ? `item-${item.id}` : `item-${index}`;
    },
    [getItemKey]
  );

  if (loading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          className
        )}
        style={{ height, width }}
      >
        <LoadingSpinner 
          size="lg" 
          variant="muted" 
          text="Loading items..."
          center={false}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card
        className={cn(
          'flex items-center justify-center',
          className
        )}
        style={{ height, width }}
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      className={cn('scrollbar-thin scrollbar-thumb-gray-300', className)}
      overscanCount={overscan}
      onScroll={({ scrollOffset }) => onScroll?.(scrollOffset)}
      itemKey={itemKey}
      itemData={items}
      onItemsRendered={onItemsRendered}
    >
      {Row}
    </List>
  );
}

// Memoized version for performance
export const MemoizedVirtualizedList = React.memo(VirtualizedList) as typeof VirtualizedList;