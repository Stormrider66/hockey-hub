import React, { useEffect, useRef, useState } from 'react';

interface LazyChartProps {
  children: React.ReactNode;
  height?: string;
  className?: string;
  threshold?: number;
}

/**
 * Lazy loading wrapper for charts to prevent rendering when not in viewport
 * Helps reduce memory usage by only rendering visible charts
 */
export function LazyChart({ 
  children, 
  height = '100%', 
  className = '',
  threshold = 0.1 
}: LazyChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, we can disconnect the observer
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: '50px' // Start loading slightly before it's visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <div 
      ref={containerRef} 
      style={{ height, minHeight: height }} 
      className={className}
    >
      {isVisible ? (
        children
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse bg-gray-200 rounded w-full h-full" />
        </div>
      )}
    </div>
  );
}