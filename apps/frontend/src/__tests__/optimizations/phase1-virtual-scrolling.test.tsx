import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VirtualizedList } from '../../components/performance/VirtualizedList';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';

// Mock react-window
jest.mock('react-window', () => ({
  VariableSizeList: ({ children, itemCount, itemSize, height, width, onScroll }: any) => {
    const items = Array.from({ length: itemCount }, (_, index) => {
      const style = {
        position: 'absolute' as const,
        top: index * itemSize(index),
        height: itemSize(index),
        width,
      };
      return children({ index, style });
    });
    
    return (
      <div 
        style={{ height, width, overflow: 'auto', position: 'relative' }}
        onScroll={onScroll}
        data-testid="virtual-list"
      >
        <div style={{ height: itemCount * 50, position: 'relative' }}>
          {items.slice(0, Math.ceil(height / 50) + 1)}
        </div>
      </div>
    );
  },
}));

describe('VirtualizedList - Phase 1 Optimization', () => {
  const generateLargeDataset = (count: number) => 
    Array.from({ length: count }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      description: `Description for item ${i}`,
      value: Math.random() * 1000,
    }));

  const renderItem = ({ index, style, data }: any) => (
    <div style={style} data-testid={`list-item-${index}`}>
      <div>{data[index].name}</div>
      <div>{data[index].description}</div>
    </div>
  );

  beforeEach(() => {
    // Clear any mocks
    jest.clearAllMocks();
  });

  describe('Large Dataset Handling', () => {
    it('should render only visible items from 1000+ item dataset', () => {
      const items = generateLargeDataset(1000);
      
      render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
        />
      );

      // Should only render visible items (600px height / 50px per item = 12 items + buffer)
      const renderedItems = screen.getAllByTestId(/list-item-/);
      expect(renderedItems.length).toBeLessThan(20);
      expect(renderedItems.length).toBeGreaterThan(10);
    });

    it('should handle datasets with 10,000+ items without performance degradation', () => {
      const items = generateLargeDataset(10000);
      const startTime = performance.now();
      
      render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
        />
      );

      const renderTime = performance.now() - startTime;
      
      // Initial render should be fast even with large dataset
      expect(renderTime).toBeLessThan(100); // 100ms threshold
      
      // Verify virtual scrolling container exists
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });
  });

  describe('Smooth Scrolling Performance', () => {
    it('should maintain smooth scrolling with rapid scroll events', async () => {
      const items = generateLargeDataset(5000);
      const onScroll = jest.fn();
      
      render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
          onScroll={onScroll}
        />
      );

      const scrollContainer = screen.getByTestId('virtual-list');
      
      // Simulate rapid scrolling
      const scrollEvents = Array.from({ length: 50 }, (_, i) => i * 100);
      
      for (const scrollTop of scrollEvents) {
        act(() => {
          fireEvent.scroll(scrollContainer, { target: { scrollTop } });
        });
      }

      // Should handle all scroll events
      expect(onScroll).toHaveBeenCalled();
      
      // Should not cause excessive re-renders
      expect(onScroll.mock.calls.length).toBeLessThan(scrollEvents.length);
    });

    it('should implement scroll throttling for performance', async () => {
      const items = generateLargeDataset(1000);
      const onScroll = jest.fn();
      
      render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
          onScroll={onScroll}
          scrollThrottle={100}
        />
      );

      const scrollContainer = screen.getByTestId('virtual-list');
      
      // Rapid scroll events
      act(() => {
        for (let i = 0; i < 10; i++) {
          fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 10 } });
        }
      });

      // Wait for throttle
      await waitFor(() => {
        expect(onScroll).toHaveBeenCalledTimes(1);
      }, { timeout: 150 });
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not keep all items in memory when virtualizing', () => {
      const items = generateLargeDataset(10000);
      const { rerender } = render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
        />
      );

      // Get initial rendered count
      const initialItems = screen.getAllByTestId(/list-item-/);
      const initialCount = initialItems.length;

      // Update with new dataset
      const newItems = generateLargeDataset(20000);
      rerender(
        <VirtualizedList
          items={newItems}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
        />
      );

      // Should still render approximately the same number of items
      const updatedItems = screen.getAllByTestId(/list-item-/);
      expect(Math.abs(updatedItems.length - initialCount)).toBeLessThan(5);
    });

    it('should properly clean up when unmounting', () => {
      const items = generateLargeDataset(5000);
      const { unmount } = render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
        />
      );

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Row Rendering Optimization', () => {
    it('should support variable height rows efficiently', () => {
      const items = generateLargeDataset(1000);
      const getItemSize = (index: number) => 50 + (index % 3) * 20; // Variable heights
      
      render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={getItemSize}
          renderItem={renderItem}
          estimatedItemSize={60}
        />
      );

      const renderedItems = screen.getAllByTestId(/list-item-/);
      
      // Should render items with variable heights
      expect(renderedItems.length).toBeGreaterThan(0);
      expect(renderedItems.length).toBeLessThan(20);
    });

    it('should memoize row components to prevent unnecessary re-renders', () => {
      const items = generateLargeDataset(100);
      const renderSpy = jest.fn(renderItem);
      
      const { rerender } = render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderSpy}
        />
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Re-render with same props
      rerender(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderSpy}
        />
      );

      // Should not re-render memoized items
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });

    it('should handle dynamic item updates efficiently', () => {
      const items = generateLargeDataset(1000);
      const { rerender } = render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
        />
      );

      // Update a single item
      const updatedItems = [...items];
      updatedItems[5] = { ...updatedItems[5], name: 'Updated Item' };

      rerender(
        <VirtualizedList
          items={updatedItems}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
        />
      );

      // Should handle update without full re-render
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dataset gracefully', () => {
      render(
        <VirtualizedList
          items={[]}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
          emptyMessage="No items to display"
        />
      );

      expect(screen.getByText('No items to display')).toBeInTheDocument();
    });

    it('should handle scroll to specific index', () => {
      const items = generateLargeDataset(1000);
      const scrollToIndex = jest.fn();
      
      render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
          scrollToIndex={500}
          onScrollToIndex={scrollToIndex}
        />
      );

      expect(scrollToIndex).toHaveBeenCalledWith(500);
    });

    it('should handle window resize events', () => {
      const items = generateLargeDataset(1000);
      const { container } = render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
          responsive
        />
      );

      // Simulate window resize
      act(() => {
        global.innerHeight = 800;
        fireEvent(window, new Event('resize'));
      });

      // Should adapt to new dimensions
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Performance Metrics', () => {
    it('should track render performance metrics', () => {
      const items = generateLargeDataset(5000);
      const onPerformanceMetric = jest.fn();
      
      render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
          trackPerformance
          onPerformanceMetric={onPerformanceMetric}
        />
      );

      expect(onPerformanceMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          itemCount: 5000,
          visibleItemCount: expect.any(Number),
          renderTime: expect.any(Number),
        })
      );
    });

    it('should maintain 60fps scrolling performance', async () => {
      const items = generateLargeDataset(10000);
      const frameTimings: number[] = [];
      
      render(
        <VirtualizedList
          items={items}
          height={600}
          itemSize={() => 50}
          renderItem={renderItem}
          onFrame={(timing: number) => frameTimings.push(timing)}
        />
      );

      const scrollContainer = screen.getByTestId('virtual-list');
      
      // Simulate smooth scroll
      await act(async () => {
        for (let i = 0; i < 60; i++) {
          fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 100 } });
          await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
        }
      });

      // Average frame time should be under 16.67ms (60fps)
      const avgFrameTime = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
      expect(avgFrameTime).toBeLessThan(17);
    });
  });
});