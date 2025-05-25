// eslint-disable-next-line @typescript-eslint/no-var-requires
const CircuitBreaker = require('opossum');

export interface BreakerOptions {
  errorThresholdPercentage?: number;
  timeout?: number;
  resetTimeout?: number;
}

// Helper to create a breaker around any promise-returning function
export const createBreaker = <T extends (...args: any[]) => Promise<any>>(fn: T, opts?: BreakerOptions) => {
  const breaker = new CircuitBreaker(fn, {
    errorThresholdPercentage: 50,
    timeout: 10000,
    resetTimeout: 30000,
    ...opts,
  });

  breaker.on('open', () => console.warn('[CircuitBreaker] opened'));
  breaker.on('halfOpen', () => console.info('[CircuitBreaker] half-open'));
  breaker.on('close', () => console.info('[CircuitBreaker] closed'));

  return (...args: Parameters<T>): ReturnType<T> => breaker.fire(...args) as any;
}; 