# Virtual Scrolling Implementation Guide

## Overview

This guide documents the virtual scrolling implementation in Hockey Hub to efficiently handle lists of 500+ players using `react-window`.

## Components

### 1. VirtualizedList

A generic virtualized list component for rendering large lists efficiently.

```tsx
import { VirtualizedList } from '@/components/ui/VirtualizedList';

// Example usage
<VirtualizedList
  items={players}
  height={600}
  itemHeight={90}
  renderItem={({ item, style }) => (
    <div style={style}>
      <PlayerCard player={item} />
    </div>
  )}
  overscan={5}
  emptyMessage="No players found"
  loading={isLoading}
/>
```

**Props:**
- `items`: Array of items to render
- `height`: Height of the list container in pixels
- `itemHeight`: Height of each item (fixed size)
- `renderItem`: Function to render each item
- `overscan`: Number of items to render outside visible area (default: 3)
- `emptyMessage`: Message to show when list is empty
- `loading`: Loading state
- `getItemKey`: Optional function to generate unique keys

### 2. VirtualizedTable

A virtualized table component for displaying structured data.

```tsx
import { VirtualizedTable } from '@/components/ui/VirtualizedTable';

// Example usage
<VirtualizedTable
  items={players}
  columns={[
    { key: 'name', header: 'Name', width: 200 },
    { key: 'position', header: 'Position', width: 120 },
    { key: 'team', header: 'Team', width: 150 }
  ]}
  height={600}
  rowHeight={48}
  stickyHeader={true}
/>
```

**Props:**
- `items`: Array of data objects
- `columns`: Column configuration array
- `height`: Height of the table in pixels
- `rowHeight`: Height of each row (default: 48)
- `stickyHeader`: Whether to make header sticky (default: true)
- `onRowClick`: Optional row click handler
- `selectedRows`: Set of selected row IDs
- `sortColumn`: Column to sort by
- `onSort`: Sort handler

## Updated Components

### PlayerStatusTab
- Replaced standard map rendering with VirtualizedList
- Each player card is now a virtualized row
- Supports 500+ players with smooth scrolling

### PlayerTeamAssignment
- Both player and team lists now use VirtualizedList
- Maintains selection state during scrolling
- Medical status indicators preserved

### ExerciseLibrary
- Exercise list virtualized for better performance
- Drag-and-drop functionality maintained
- Smooth scrolling with large exercise libraries

## Performance Monitoring

Use the included performance monitoring tools:

```tsx
import { useVirtualizationPerformance } from '@/hooks/useVirtualizationPerformance';
import { VirtualizationPerformanceMonitor } from '@/components/ui/VirtualizationPerformanceMonitor';

// In your component
const { metrics, startRender, endRender } = useVirtualizationPerformance(items.length);

// Display metrics
<VirtualizationPerformanceMonitor metrics={metrics} />
```

## Testing with Large Datasets

Generate test data for performance testing:

```tsx
import { generateTestPlayers, generateTestTeams } from '@/utils/generateTestData';

// Generate 1000 test players
const testPlayers = generateTestPlayers({ count: 1000 });

// Generate 50 test teams
const testTeams = generateTestTeams(50);
```

## Best Practices

1. **Fixed Item Heights**: Use fixed item heights for best performance
2. **Memoization**: Wrap render functions with useCallback
3. **Key Management**: Provide stable keys for items
4. **Overscan**: Use appropriate overscan values (3-5 items)
5. **Loading States**: Show loading indicators during data fetching
6. **Empty States**: Provide meaningful empty messages

## Performance Targets

- Initial render: < 100ms
- Scroll performance: 60 FPS
- Memory usage: < 100MB for 1000 items
- Visible items: Only render ±5 items outside viewport

## Troubleshooting

### Scroll Jank
- Reduce overscan count
- Ensure item heights are consistent
- Memoize expensive computations

### Memory Issues
- Use React.memo for row components
- Avoid creating new objects in render
- Clean up event listeners

### Selection State
- Store selection in parent component
- Use Set for O(1) lookup performance
- Update selection through callbacks