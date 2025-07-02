import { ExternalServiceError } from '../errors/ApplicationErrors';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  requestTimeout?: number;
  successThreshold?: number;
  volumeThreshold?: number;
  errorFilter?: (error: any) => boolean;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveSuccesses: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  totalRequests: number;
}

export class CircuitBreaker<T = any> {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private consecutiveSuccesses: number = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private totalRequests: number = 0;
  
  private readonly options: Required<CircuitBreakerOptions> = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    requestTimeout: 3000, // 3 seconds
    successThreshold: 2,
    volumeThreshold: 10,
    errorFilter: () => true
  };

  constructor(
    private readonly name: string,
    private readonly action: (...args: any[]) => Promise<T>,
    options?: CircuitBreakerOptions
  ) {
    this.options = { ...this.options, ...options };
  }

  async execute(...args: any[]): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.canAttemptReset()) {
        this.halfOpen();
      } else {
        throw new ExternalServiceError(
          this.name,
          'Circuit breaker is open',
          undefined,
          {
            state: this.state,
            nextAttemptTime: this.nextAttemptTime
          }
        );
      }
    }

    try {
      const result = await this.callWithTimeout(this.action(...args));
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private async callWithTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(
          () => reject(new Error(`Request timeout after ${this.options.requestTimeout}ms`)),
          this.options.requestTimeout
        )
      )
    ]);
  }

  private onSuccess(): void {
    this.totalRequests++;
    this.failures = 0;
    this.successes++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.options.successThreshold) {
        this.close();
      }
    }
  }

  private onFailure(error: any): void {
    this.totalRequests++;
    
    if (!this.options.errorFilter(error)) {
      return; // Don't count filtered errors
    }

    this.failures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.open();
    } else if (
      this.state === CircuitState.CLOSED &&
      this.totalRequests >= this.options.volumeThreshold &&
      this.failures >= this.options.failureThreshold
    ) {
      this.open();
    }
  }

  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout);
    console.warn(`Circuit breaker '${this.name}' opened. Next attempt at ${this.nextAttemptTime}`);
  }

  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.consecutiveSuccesses = 0;
    this.nextAttemptTime = undefined;
    console.info(`Circuit breaker '${this.name}' closed`);
  }

  private halfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.consecutiveSuccesses = 0;
    console.info(`Circuit breaker '${this.name}' half-open`);
  }

  private canAttemptReset(): boolean {
    return (
      this.nextAttemptTime !== undefined &&
      new Date() >= this.nextAttemptTime
    );
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      totalRequests: this.totalRequests
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.totalRequests = 0;
  }
}

/**
 * Circuit breaker factory for easy creation
 */
export class CircuitBreakerFactory {
  private static breakers = new Map<string, CircuitBreaker>();

  static create<T>(
    name: string,
    action: (...args: any[]) => Promise<T>,
    options?: CircuitBreakerOptions
  ): CircuitBreaker<T> {
    const existing = this.breakers.get(name);
    if (existing) {
      return existing as CircuitBreaker<T>;
    }

    const breaker = new CircuitBreaker(name, action, options);
    this.breakers.set(name, breaker);
    return breaker;
  }

  static get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  static getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  static reset(name?: string): void {
    if (name) {
      this.breakers.get(name)?.reset();
    } else {
      this.breakers.forEach(breaker => breaker.reset());
    }
  }

  static remove(name: string): boolean {
    return this.breakers.delete(name);
  }
}