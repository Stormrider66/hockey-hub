import { useState, useEffect, useRef } from 'react';

/**
 * Hook to debounce chart data updates to prevent excessive re-renders
 */
export function useDebouncedChartData<T>(
  data: T,
  delay: number = 300
): T {
  const [debouncedData, setDebouncedData] = useState<T>(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedData(data);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay]);

  return debouncedData;
}

/**
 * Hook to batch multiple chart updates
 */
export function useBatchedChartUpdates<T extends Record<string, any>>(
  initialData: T,
  batchDelay: number = 100
): [T, (updates: Partial<T>) => void, () => void] {
  const [data, setData] = useState<T>(initialData);
  const pendingUpdates = useRef<Partial<T>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleUpdate = (updates: Partial<T>) => {
    // Merge with pending updates
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule batch update
    timeoutRef.current = setTimeout(() => {
      setData(prevData => ({ ...prevData, ...pendingUpdates.current }));
      pendingUpdates.current = {};
    }, batchDelay);
  };

  const forceUpdate = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setData(prevData => ({ ...prevData, ...pendingUpdates.current }));
    pendingUpdates.current = {};
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [data, scheduleUpdate, forceUpdate];
}