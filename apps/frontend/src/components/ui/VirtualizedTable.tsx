import React, { useCallback, useRef, CSSProperties } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';

export interface Column<T = any> {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
}

export interface VirtualizedTableProps<T = any> {
  items: T[];
  columns: Column<T>[];
  height: number;
  rowHeight?: number;
  headerHeight?: number;
  width?: number | string;
  className?: string;
  overscan?: number;
  onRowClick?: (item: T, index: number) => void;
  selectedRows?: Set<string | number>;
  getRowKey?: (item: T, index: number) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  stickyHeader?: boolean;
}

interface TableRowProps<T> {
  item: T;
  index: number;
  columns: Column<T>[];
  style: CSSProperties;
  isSelected?: boolean;
  onRowClick?: (item: T, index: number) => void;
}

function TableRow<T>({
  item,
  index,
  columns,
  style,
  isSelected,
  onRowClick,
}: TableRowProps<T>) {
  return (
    <div
      style={style}
      className={cn(
        'flex items-center border-b border-border hover:bg-muted/50 cursor-pointer',
        isSelected && 'bg-primary/10'
      )}
      onClick={() => onRowClick?.(item, index)}
    >
      {columns.map((column) => {
        const value = (item as any)[column.key];
        const content = column.render ? column.render(value, item, index) : value;
        
        return (
          <div
            key={column.key}
            className={cn(
              'px-4 py-2 truncate',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right'
            )}
            style={{ 
              width: column.width || `${100 / columns.length}%`,
              minWidth: column.width 
            }}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function VirtualizedTable<T = any>({
  items,
  columns,
  height,
  rowHeight = 48,
  headerHeight = 48,
  width = '100%',
  className,
  overscan = 3,
  onRowClick,
  selectedRows,
  getRowKey,
  emptyMessage = 'No data found',
  loading = false,
  sortColumn,
  sortDirection,
  onSort,
  stickyHeader = true,
}: VirtualizedTableProps<T>) {
  const listRef = useRef<List>(null);

  const Row = useCallback(
    ({ index, style, data }: ListChildComponentProps<T[]>) => {
      const item = data[index];
      const key = getRowKey ? getRowKey(item, index) : index;
      const isSelected = selectedRows?.has(key);

      return (
        <TableRow
          item={item}
          index={index}
          columns={columns}
          style={style}
          isSelected={isSelected}
          onRowClick={onRowClick}
        />
      );
    },
    [columns, onRowClick, selectedRows, getRowKey]
  );

  const renderHeader = () => (
    <div
      className={cn(
        'flex items-center border-b border-border bg-muted/50 font-medium',
        stickyHeader && 'sticky top-0 z-10'
      )}
      style={{ height: headerHeight }}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          className={cn(
            'px-4 py-2 flex items-center gap-2',
            column.align === 'center' && 'justify-center',
            column.align === 'right' && 'justify-end',
            column.sortable && 'cursor-pointer hover:bg-muted'
          )}
          style={{ 
            width: column.width || `${100 / columns.length}%`,
            minWidth: column.width 
          }}
          onClick={() => column.sortable && onSort?.(column.key)}
        >
          <span>{column.header}</span>
          {column.sortable && (
            <span className="ml-1">
              {sortColumn === column.key ? (
                sortDirection === 'asc' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )
              ) : (
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ height, width }}
      >
        <LoadingSpinner 
          size="lg" 
          variant="muted" 
          text="Loading table data..."
          center={false}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card
        className={cn('overflow-hidden', className)}
        style={{ height, width }}
      >
        {renderHeader()}
        <div className="flex items-center justify-center" style={{ height: height - headerHeight }}>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  const listHeight = stickyHeader ? height - headerHeight : height;

  return (
    <Card
      className={cn('overflow-hidden', className)}
      style={{ width }}
    >
      {renderHeader()}
      <List
        ref={listRef}
        height={listHeight}
        itemCount={items.length}
        itemSize={rowHeight}
        width={width}
        className="scrollbar-thin scrollbar-thumb-gray-300"
        overscanCount={overscan}
        itemData={items}
      >
        {Row}
      </List>
    </Card>
  );
}

// Memoized version for performance
export const MemoizedVirtualizedTable = React.memo(VirtualizedTable) as typeof VirtualizedTable;