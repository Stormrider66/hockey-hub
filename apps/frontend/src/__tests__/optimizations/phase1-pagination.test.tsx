import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PaginatedTable } from '../../components/performance/PaginatedTable';
import { InfiniteScrollList } from '../../components/performance/InfiniteScrollList';
import { usePaginationPreferences } from '../../hooks/performance/usePaginationPreferences';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';

// Mock API
const mockApi = {
  query: jest.fn(),
  mutation: jest.fn(),
};

// Create mock store
const createMockStore = () => configureStore({
  reducer: {
    api: (state = {}) => state,
  },
});

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('Pagination Components - Phase 1 Optimization', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('PaginatedTable Component', () => {
    const mockData = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: ['player', 'coach', 'admin'][i % 3],
    }));

    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role' },
    ];

    it('should display paginated data correctly', () => {
      render(
        <Provider store={store}>
          <PaginatedTable
            data={mockData}
            columns={columns}
            pageSize={10}
            currentPage={1}
            totalItems={100}
          />
        </Provider>
      );

      // Should show first 10 items
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 10')).toBeInTheDocument();
      expect(screen.queryByText('User 11')).not.toBeInTheDocument();
    });

    it('should handle page navigation', () => {
      const onPageChange = jest.fn();
      
      render(
        <Provider store={store}>
          <PaginatedTable
            data={mockData.slice(0, 10)}
            columns={columns}
            pageSize={10}
            currentPage={1}
            totalItems={100}
            onPageChange={onPageChange}
          />
        </Provider>
      );

      // Click next page
      fireEvent.click(screen.getByLabelText('Next page'));
      expect(onPageChange).toHaveBeenCalledWith(2);

      // Click specific page
      fireEvent.click(screen.getByText('5'));
      expect(onPageChange).toHaveBeenCalledWith(5);
    });

    it('should handle page size changes', () => {
      const onPageSizeChange = jest.fn();
      
      render(
        <Provider store={store}>
          <PaginatedTable
            data={mockData.slice(0, 10)}
            columns={columns}
            pageSize={10}
            currentPage={1}
            totalItems={100}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </Provider>
      );

      // Change page size
      const pageSizeSelect = screen.getByLabelText('Items per page');
      fireEvent.change(pageSizeSelect, { target: { value: '25' } });
      
      expect(onPageSizeChange).toHaveBeenCalledWith(25);
    });

    it('should display correct pagination info', () => {
      render(
        <Provider store={store}>
          <PaginatedTable
            data={mockData.slice(20, 30)}
            columns={columns}
            pageSize={10}
            currentPage={3}
            totalItems={100}
          />
        </Provider>
      );

      expect(screen.getByText('Showing 21-30 of 100')).toBeInTheDocument();
    });

    it('should disable navigation buttons appropriately', () => {
      const { rerender } = render(
        <Provider store={store}>
          <PaginatedTable
            data={mockData.slice(0, 10)}
            columns={columns}
            pageSize={10}
            currentPage={1}
            totalItems={100}
          />
        </Provider>
      );

      // First page - previous should be disabled
      expect(screen.getByLabelText('Previous page')).toBeDisabled();
      expect(screen.getByLabelText('Next page')).not.toBeDisabled();

      // Last page
      rerender(
        <Provider store={store}>
          <PaginatedTable
            data={mockData.slice(90, 100)}
            columns={columns}
            pageSize={10}
            currentPage={10}
            totalItems={100}
          />
        </Provider>
      );

      expect(screen.getByLabelText('Previous page')).not.toBeDisabled();
      expect(screen.getByLabelText('Next page')).toBeDisabled();
    });
  });

  describe('InfiniteScrollList Component', () => {
    const generateItems = (start: number, count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: start + i,
        content: `Item ${start + i}`,
      }));

    it('should load initial items', () => {
      const loadMore = jest.fn().mockResolvedValue({
        items: generateItems(1, 20),
        hasMore: true,
      });

      render(
        <Provider store={store}>
          <InfiniteScrollList
            loadMore={loadMore}
            renderItem={(item) => <div key={item.id}>{item.content}</div>}
          />
        </Provider>
      );

      expect(loadMore).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });

    it('should trigger load more when scrolling near bottom', async () => {
      const loadMore = jest.fn()
        .mockResolvedValueOnce({
          items: generateItems(1, 20),
          hasMore: true,
        })
        .mockResolvedValueOnce({
          items: generateItems(21, 20),
          hasMore: true,
        });

      render(
        <Provider store={store}>
          <InfiniteScrollList
            loadMore={loadMore}
            renderItem={(item) => <div key={item.id}>{item.content}</div>}
            threshold={100}
          />
        </Provider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });

      // Trigger intersection observer
      const [observerCallback] = mockIntersectionObserver.mock.calls[0];
      act(() => {
        observerCallback([{ isIntersecting: true }]);
      });

      await waitFor(() => {
        expect(loadMore).toHaveBeenCalledTimes(2);
        expect(loadMore).toHaveBeenLastCalledWith({ page: 2, pageSize: 20 });
      });
    });

    it('should show loading indicator while fetching', async () => {
      const loadMore = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          items: generateItems(1, 20),
          hasMore: true,
        }), 100))
      );

      render(
        <Provider store={store}>
          <InfiniteScrollList
            loadMore={loadMore}
            renderItem={(item) => <div key={item.id}>{item.content}</div>}
            loadingIndicator={<div>Loading more...</div>}
          />
        </Provider>
      );

      expect(screen.getByText('Loading more...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading more...')).not.toBeInTheDocument();
      });
    });

    it('should handle errors gracefully', async () => {
      const loadMore = jest.fn().mockRejectedValue(new Error('Network error'));
      const onError = jest.fn();

      render(
        <Provider store={store}>
          <InfiniteScrollList
            loadMore={loadMore}
            renderItem={(item) => <div key={item.id}>{item.content}</div>}
            onError={onError}
            errorMessage="Failed to load items"
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load items')).toBeInTheDocument();
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should stop loading when no more items', async () => {
      const loadMore = jest.fn()
        .mockResolvedValueOnce({
          items: generateItems(1, 20),
          hasMore: true,
        })
        .mockResolvedValueOnce({
          items: generateItems(21, 10),
          hasMore: false,
        });

      render(
        <Provider store={store}>
          <InfiniteScrollList
            loadMore={loadMore}
            renderItem={(item) => <div key={item.id}>{item.content}</div>}
            endMessage={<div>No more items</div>}
          />
        </Provider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });

      // Trigger load more
      const [observerCallback] = mockIntersectionObserver.mock.calls[0];
      act(() => {
        observerCallback([{ isIntersecting: true }]);
      });

      await waitFor(() => {
        expect(screen.getByText('No more items')).toBeInTheDocument();
      });

      // Should not load more after reaching end
      act(() => {
        observerCallback([{ isIntersecting: true }]);
      });

      expect(loadMore).toHaveBeenCalledTimes(2);
    });
  });

  describe('API Integration with Pagination', () => {
    it('should integrate with RTK Query for pagination', async () => {
      const useGetItemsQuery = jest.fn().mockReturnValue({
        data: {
          items: generateItems(1, 10),
          total: 100,
          page: 1,
          pageSize: 10,
        },
        isLoading: false,
        error: null,
      });

      const TestComponent = () => {
        const { data } = useGetItemsQuery({ page: 1, pageSize: 10 });
        
        return (
          <PaginatedTable
            data={data?.items || []}
            columns={[{ key: 'content', header: 'Content' }]}
            pageSize={10}
            currentPage={1}
            totalItems={data?.total || 0}
          />
        );
      };

      render(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      expect(useGetItemsQuery).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should handle loading states', () => {
      const useGetItemsQuery = jest.fn().mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const TestComponent = () => {
        const { data, isLoading } = useGetItemsQuery({ page: 1, pageSize: 10 });
        
        if (isLoading) return <div>Loading...</div>;
        
        return (
          <PaginatedTable
            data={data?.items || []}
            columns={[{ key: 'content', header: 'Content' }]}
            pageSize={10}
            currentPage={1}
            totalItems={data?.total || 0}
          />
        );
      };

      render(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Page Size Preferences', () => {
    it('should save and restore page size preferences', () => {
      const TestComponent = () => {
        const { pageSize, setPageSize } = usePaginationPreferences('test-table');
        
        return (
          <div>
            <div>Current size: {pageSize}</div>
            <button onClick={() => setPageSize(50)}>Set to 50</button>
          </div>
        );
      };

      const { rerender } = render(<TestComponent />);
      
      expect(screen.getByText('Current size: 20')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Set to 50'));
      
      expect(screen.getByText('Current size: 50')).toBeInTheDocument();
      
      // Check localStorage
      expect(localStorage.getItem('pagination-test-table')).toBe('50');
      
      // Remount component
      rerender(<TestComponent />);
      
      expect(screen.getByText('Current size: 50')).toBeInTheDocument();
    });

    it('should use different preferences for different tables', () => {
      const TestComponent = ({ tableId }: { tableId: string }) => {
        const { pageSize, setPageSize } = usePaginationPreferences(tableId);
        
        return (
          <div data-testid={tableId}>
            <div>Size: {pageSize}</div>
            <button onClick={() => setPageSize(25)}>Set 25</button>
          </div>
        );
      };

      render(
        <>
          <TestComponent tableId="table1" />
          <TestComponent tableId="table2" />
        </>
      );

      // Set different sizes
      const table1 = screen.getByTestId('table1');
      const table2 = screen.getByTestId('table2');
      
      fireEvent.click(table1.querySelector('button')!);
      
      expect(table1.textContent).toContain('Size: 25');
      expect(table2.textContent).toContain('Size: 20');
    });
  });

  describe('Performance Optimization', () => {
    it('should debounce rapid page changes', async () => {
      const onPageChange = jest.fn();
      
      render(
        <Provider store={store}>
          <PaginatedTable
            data={[]}
            columns={[]}
            pageSize={10}
            currentPage={1}
            totalItems={100}
            onPageChange={onPageChange}
            debounceMs={100}
          />
        </Provider>
      );

      // Rapid page changes
      fireEvent.click(screen.getByText('2'));
      fireEvent.click(screen.getByText('3'));
      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('5'));

      // Should only call once after debounce
      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledTimes(1);
        expect(onPageChange).toHaveBeenCalledWith(5);
      }, { timeout: 200 });
    });

    it('should cache previously loaded pages', async () => {
      const loadMore = jest.fn().mockResolvedValue({
        items: generateItems(1, 20),
        hasMore: true,
      });

      const TestComponent = () => {
        const [page, setPage] = React.useState(1);
        const cache = React.useRef(new Map());
        
        React.useEffect(() => {
          if (!cache.current.has(page)) {
            loadMore({ page, pageSize: 20 }).then(result => {
              cache.current.set(page, result);
            });
          }
        }, [page]);
        
        return (
          <div>
            <button onClick={() => setPage(2)}>Page 2</button>
            <button onClick={() => setPage(1)}>Page 1</button>
          </div>
        );
      };

      render(<TestComponent />);

      // Load page 2
      fireEvent.click(screen.getByText('Page 2'));
      await waitFor(() => {
        expect(loadMore).toHaveBeenCalledWith({ page: 2, pageSize: 20 });
      });

      // Go back to page 1 - should use cache
      fireEvent.click(screen.getByText('Page 1'));
      
      // Should not call loadMore again for page 1
      expect(loadMore).toHaveBeenCalledTimes(2);
    });
  });
});