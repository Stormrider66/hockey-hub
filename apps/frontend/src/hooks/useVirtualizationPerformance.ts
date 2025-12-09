import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  peakRenderTime: number;
  visibleItems: number;
  totalItems: number;
  memoryUsage?: number;
}

/**
 * Hook to monitor virtualization performance
 */
export function useVirtualizationPerformance(totalItems: number) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    peakRenderTime: 0,
    visibleItems: 0,
    totalItems,
    memoryUsage: undefined,
  });

  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef<number>(0);

  const startRender = () => {
    lastRenderTime.current = performance.now();
  };

  const endRender = (visibleItems: number) => {
    const renderTime = performance.now() - lastRenderTime.current;
    renderTimes.current.push(renderTime);

    // Keep only last 100 render times
    if (renderTimes.current.length > 100) {
      renderTimes.current.shift();
    }

    const averageRenderTime = 
      renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;
    
    const peakRenderTime = Math.max(...renderTimes.current);

    // Try to get memory usage if available
    let memoryUsage: number | undefined;
    if ('memory' in performance && (performance as any).memory) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
    }

    setMetrics(prev => ({
      renderCount: prev.renderCount + 1,
      averageRenderTime: Math.round(averageRenderTime * 100) / 100,
      peakRenderTime: Math.round(peakRenderTime * 100) / 100,
      visibleItems,
      totalItems,
      memoryUsage: memoryUsage ? Math.round(memoryUsage * 100) / 100 : undefined,
    }));
  };

  const reset = () => {
    renderTimes.current = [];
    setMetrics({
      renderCount: 0,
      averageRenderTime: 0,
      peakRenderTime: 0,
      visibleItems: 0,
      totalItems,
      memoryUsage: undefined,
    });
  };

  // Monitor FPS
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        // Update FPS every second
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        // You can add FPS to metrics if needed
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return {
    metrics,
    startRender,
    endRender,
    reset,
  };
}