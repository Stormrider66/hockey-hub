/**
 * Mock Sentry Client for Development
 * 
 * This provides a Sentry-compatible interface for development
 * and makes it easy to integrate real Sentry later.
 */

import { ErrorTracker } from './ErrorTracker';
import type { ErrorContext, Breadcrumb } from './ErrorTracker';

export interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
}

export interface SentryScope {
  setUser(user: SentryUser | null): void;
  setTag(key: string, value: string): void;
  setContext(key: string, context: Record<string, any>): void;
  setLevel(level: 'debug' | 'info' | 'warning' | 'error' | 'fatal'): void;
  setFingerprint(fingerprint: string[]): void;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  clear(): void;
}

export interface SentryHub {
  withScope(callback: (scope: SentryScope) => void): void;
  captureException(exception: Error, captureContext?: any): string;
  captureMessage(message: string, level?: Breadcrumb['level']): string;
  captureEvent(event: any): string;
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
  configureScope(callback: (scope: SentryScope) => void): void;
  setUser(user: SentryUser | null): void;
  setTag(key: string, value: string): void;
  setContext(key: string, context: Record<string, any>): void;
}

/**
 * Mock Sentry implementation
 */
class MockSentry implements SentryHub {
  private globalScope: MockScope = new MockScope();
  private scopeStack: MockScope[] = [];

  init(options: any): void {
    console.log('[MockSentry] Initialized with options:', options);
    
    // Initialize our error tracker
    ErrorTracker.init({
      enabled: options.enabled !== false,
      environment: options.environment,
      release: options.release,
      sampleRate: options.sampleRate || 1.0
    });
  }

  withScope(callback: (scope: SentryScope) => void): void {
    const scope = new MockScope(this.globalScope);
    this.scopeStack.push(scope);
    
    try {
      callback(scope);
    } finally {
      this.scopeStack.pop();
    }
  }

  captureException(exception: Error, captureContext?: any): string {
    const eventId = this.generateEventId();
    
    // Get current scope data
    const scope = this.getCurrentScope();
    const context: ErrorContext = {
      ...scope.getContext(),
      ...captureContext
    };

    // Use our error tracker
    ErrorTracker.captureException(exception, context);

    if (process.env.NODE_ENV === 'development') {
      console.error('[MockSentry] Captured exception:', exception, context);
    }

    return eventId;
  }

  captureMessage(message: string, level: Breadcrumb['level'] = 'info'): string {
    const eventId = this.generateEventId();
    
    ErrorTracker.captureMessage(message, level);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[MockSentry] Captured message (${level}):`, message);
    }

    return eventId;
  }

  captureEvent(event: any): string {
    const eventId = this.generateEventId();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[MockSentry] Captured event:', event);
    }

    return eventId;
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    ErrorTracker.addBreadcrumb(breadcrumb);
  }

  configureScope(callback: (scope: SentryScope) => void): void {
    callback(this.globalScope);
  }

  setUser(user: SentryUser | null): void {
    this.globalScope.setUser(user);
  }

  setTag(key: string, value: string): void {
    this.globalScope.setTag(key, value);
  }

  setContext(key: string, context: Record<string, any>): void {
    this.globalScope.setContext(key, context);
  }

  private getCurrentScope(): MockScope {
    return this.scopeStack[this.scopeStack.length - 1] || this.globalScope;
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Mock Scope implementation
 */
class MockScope implements SentryScope {
  private user: SentryUser | null = null;
  private tags: Record<string, string> = {};
  private context: Record<string, any> = {};
  private level: Breadcrumb['level'] = 'info';
  private fingerprint: string[] = [];
  private breadcrumbs: Breadcrumb[] = [];

  constructor(parent?: MockScope) {
    if (parent) {
      // Copy parent scope data
      this.user = parent.user;
      this.tags = { ...parent.tags };
      this.context = { ...parent.context };
      this.level = parent.level;
      this.fingerprint = [...parent.fingerprint];
      this.breadcrumbs = [...parent.breadcrumbs];
    }
  }

  setUser(user: SentryUser | null): void {
    this.user = user;
    if (user) {
      ErrorTracker.setUser({
        id: user.id,
        email: user.email,
        username: user.username
      });
    } else {
      ErrorTracker.setUser(null);
    }
  }

  setTag(key: string, value: string): void {
    this.tags[key] = value;
    ErrorTracker.setContext('tags', this.tags);
  }

  setContext(key: string, context: Record<string, any>): void {
    this.context[key] = context;
    ErrorTracker.setContext(key, context);
  }

  setLevel(level: Breadcrumb['level']): void {
    this.level = level;
  }

  setFingerprint(fingerprint: string[]): void {
    this.fingerprint = fingerprint;
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb);
    ErrorTracker.addBreadcrumb(breadcrumb);
  }

  clear(): void {
    this.user = null;
    this.tags = {};
    this.context = {};
    this.level = 'info';
    this.fingerprint = [];
    this.breadcrumbs = [];
    ErrorTracker.clearBreadcrumbs();
  }

  getContext(): Record<string, any> {
    return {
      user: this.user,
      tags: this.tags,
      ...this.context,
      level: this.level,
      fingerprint: this.fingerprint
    };
  }
}

// Create singleton instance
const mockSentry = new MockSentry();

// Export Sentry-compatible API
export const Sentry = {
  init: (options: any) => mockSentry.init(options),
  captureException: (exception: Error, captureContext?: any) => 
    mockSentry.captureException(exception, captureContext),
  captureMessage: (message: string, level?: Breadcrumb['level']) => 
    mockSentry.captureMessage(message, level),
  captureEvent: (event: any) => mockSentry.captureEvent(event),
  addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => 
    mockSentry.addBreadcrumb(breadcrumb),
  configureScope: (callback: (scope: SentryScope) => void) => 
    mockSentry.configureScope(callback),
  withScope: (callback: (scope: SentryScope) => void) => 
    mockSentry.withScope(callback),
  setUser: (user: SentryUser | null) => mockSentry.setUser(user),
  setTag: (key: string, value: string) => mockSentry.setTag(key, value),
  setContext: (key: string, context: Record<string, any>) => 
    mockSentry.setContext(key, context),
  
  // Additional Sentry exports for compatibility
  Severity: {
    Debug: 'debug' as const,
    Info: 'info' as const,
    Warning: 'warning' as const,
    Error: 'error' as const,
    Fatal: 'fatal' as const
  },
  
  // Browser-specific exports
  BrowserClient: MockSentry,
  Hub: MockSentry,
  Scope: MockScope
};

// Type exports for compatibility
export type { MockSentry as BrowserClient };
export type { MockScope as Scope };
export type { MockSentry as Hub };

export default Sentry;