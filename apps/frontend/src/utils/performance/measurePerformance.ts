import { PerformanceMonitor } from '@/services/performance/PerformanceMonitor';

/**
 * Decorator to measure function execution time
 * @param target Class prototype
 * @param propertyKey Method name
 * @param descriptor Method descriptor
 */
export function measurePerformance(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startMark = `${target.constructor.name}.${propertyKey}-start`;
    const endMark = `${target.constructor.name}.${propertyKey}-end`;
    const measureName = `${target.constructor.name}.${propertyKey}`;

    PerformanceMonitor.mark(startMark, {
      class: target.constructor.name,
      method: propertyKey,
      args: args.length
    });

    try {
      const result = await originalMethod.apply(this, args);
      
      PerformanceMonitor.mark(endMark);
      const duration = PerformanceMonitor.measure(measureName, startMark, endMark);

      if (duration && duration > 100) {
        console.warn(`[Performance] ${measureName} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      PerformanceMonitor.mark(endMark, { error: true });
      PerformanceMonitor.measure(measureName, startMark, endMark);
      throw error;
    }
  };

  return descriptor;
}

/**
 * Higher-order function to measure async function performance
 */
export function withPerformanceMeasure<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const measureName = name || fn.name || 'anonymous';
    const startMark = `${measureName}-start`;
    const endMark = `${measureName}-end`;

    PerformanceMonitor.mark(startMark, {
      function: measureName,
      args: args.length
    });

    try {
      const result = await fn(...args);
      
      PerformanceMonitor.mark(endMark);
      const duration = PerformanceMonitor.measure(measureName, startMark, endMark);

      return result;
    } catch (error) {
      PerformanceMonitor.mark(endMark, { error: true });
      PerformanceMonitor.measure(measureName, startMark, endMark);
      throw error;
    }
  }) as T;
}

/**
 * Measure a code block's execution time
 */
export async function measureBlock<T>(
  name: string,
  block: () => T | Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startMark = `block:${name}-start`;
  const endMark = `block:${name}-end`;

  PerformanceMonitor.mark(startMark, metadata);

  try {
    const result = await block();
    
    PerformanceMonitor.mark(endMark);
    const duration = PerformanceMonitor.measure(`block:${name}`, startMark, endMark);

    if (process.env.NODE_ENV === 'development' && duration && duration > 50) {
      console.log(`[Performance] Block "${name}" took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    PerformanceMonitor.mark(endMark, { error: true });
    PerformanceMonitor.measure(`block:${name}`, startMark, endMark);
    throw error;
  }
}

/**
 * Create a performance timer for manual timing
 */
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
    PerformanceMonitor.mark(`timer:${name}-start`);
  }

  /**
   * Add a mark at the current time
   */
  mark(label: string): void {
    const now = performance.now();
    this.marks.set(label, now);
    PerformanceMonitor.mark(`timer:${this.name}:${label}`, {
      elapsed: now - this.startTime
    });
  }

  /**
   * Get elapsed time since start
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Get time between two marks
   */
  between(mark1: string, mark2: string): number | null {
    const time1 = mark1 === 'start' ? this.startTime : this.marks.get(mark1);
    const time2 = mark2 === 'now' ? performance.now() : this.marks.get(mark2);

    if (time1 === undefined || time2 === undefined) {
      return null;
    }

    return time2 - time1;
  }

  /**
   * End the timer and return total duration
   */
  end(): number {
    const duration = performance.now() - this.startTime;
    PerformanceMonitor.mark(`timer:${this.name}-end`);
    PerformanceMonitor.measure(`timer:${this.name}`, `timer:${this.name}-start`, `timer:${this.name}-end`);

    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log(`[Performance] Timer "${this.name}" completed in ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Get a summary of all marks
   */
  summary(): { mark: string; elapsed: number }[] {
    const summary: { mark: string; elapsed: number }[] = [
      { mark: 'start', elapsed: 0 }
    ];

    this.marks.forEach((time, mark) => {
      summary.push({ mark, elapsed: time - this.startTime });
    });

    summary.push({ mark: 'end', elapsed: this.elapsed() });

    return summary;
  }
}