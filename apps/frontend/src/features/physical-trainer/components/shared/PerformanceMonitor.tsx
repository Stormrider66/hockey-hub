'use client';

import { useEffect, useRef } from 'react';

export function PerformanceMonitor({ componentName }: { componentName: string }) {
  const startTime = useRef<number>(Date.now());
  
  useEffect(() => {
    const mountTime = Date.now() - startTime.current;
    
    // Log mount time
    console.log(`⏱️ [${componentName}] Mount time: ${mountTime}ms`);
    
    // Check if we have Performance API
    if (typeof window !== 'undefined' && window.performance) {
      // Measure LCP
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`📊 [${componentName}] LCP: ${lastEntry.startTime.toFixed(0)}ms`);
      });
      
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP might not be supported
      }
      
      // Cleanup
      return () => {
        try {
          observer.disconnect();
        } catch (e) {
          // Ignore
        }
      };
    }
  }, [componentName]);
  
  return null;
}