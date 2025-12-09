import { useRef, useCallback } from 'react';

interface UsePreloadDebounceOptions {
  delay?: number;
}

export const usePreloadDebounce = (options: UsePreloadDebounceOptions = {}) => {
  const { delay = 100 } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const preloadedRef = useRef<Set<string>>(new Set());

  const debouncedPreload = useCallback((tabName: string, preloadFn: (tab: string) => void) => {
    // Skip if already preloaded
    if (preloadedRef.current.has(tabName)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      preloadFn(tabName);
      preloadedRef.current.add(tabName);
    }, delay);
  }, [delay]);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { debouncedPreload, cleanup };
};