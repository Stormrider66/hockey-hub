import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook that throttles state updates to prevent excessive re-renders
 * Useful for slider inputs and other high-frequency updates
 */
export function useThrottledState<T>(
  initialValue: T,
  delay: number = 100
): [T, (value: T) => void, T] {
  const [state, setState] = useState<T>(initialValue);
  const [immediateValue, setImmediateValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setThrottledState = useCallback((value: T) => {
    setImmediateValue(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(value);
      timeoutRef.current = null;
    }, delay);
  }, [delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, setThrottledState, immediateValue];
}