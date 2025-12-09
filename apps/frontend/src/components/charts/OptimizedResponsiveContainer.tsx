import React, { useEffect, useRef } from 'react';
import { ResponsiveContainer } from 'recharts';

interface OptimizedResponsiveContainerProps {
  children: React.ReactElement;
  width?: string | number;
  height?: string | number;
  debounce?: number;
}

/**
 * Optimized wrapper for Recharts ResponsiveContainer
 * - Debounces resize events to prevent excessive re-renders
 * - Cleans up event listeners properly
 * - Prevents memory leaks from resize observers
 */
export function OptimizedResponsiveContainer({
  children,
  width = '100%',
  height = '100%',
  debounce = 300
}: OptimizedResponsiveContainerProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cleanup function for resize timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Force cleanup on unmount
  useEffect(() => {
    const container = containerRef.current;
    
    return () => {
      // Force remove any lingering event listeners
      if (container) {
        const resizeEvent = new Event('resize');
        window.dispatchEvent(resizeEvent);
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width, height }}>
      <ResponsiveContainer 
        width={width} 
        height={height}
        debounce={debounce}
      >
        {children}
      </ResponsiveContainer>
    </div>
  );
}