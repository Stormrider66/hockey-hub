import { PerformanceReporter } from '../performance/PerformanceReporter';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface Breadcrumb {
  timestamp: number;
  type: 'navigation' | 'click' | 'console' | 'http' | 'error' | 'custom';
  category?: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface ErrorReport {
  error: {
    message: string;
    stack?: string;
    type?: string;
  };
  context: ErrorContext;
  breadcrumbs: Breadcrumb[];
  timestamp: number;
  fingerprint: string;
  environment: string;
  release?: string;
}

export interface ErrorTrackerConfig {
  enabled?: boolean;
  environment?: string;
  release?: string;
  maxBreadcrumbs?: number;
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
  ignoreErrors?: (string | RegExp)[];
  allowedUrls?: (string | RegExp)[];
  sampleRate?: number;
}

/**
 * Error tracking service (Sentry-like interface for easy migration)
 */
export class ErrorTracker {
  private static instance: ErrorTracker;
  private config: Required<ErrorTrackerConfig>;
  private breadcrumbs: Breadcrumb[] = [];
  private context: ErrorContext = {};
  private reporter: PerformanceReporter;

  private constructor(config: ErrorTrackerConfig = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      environment: process.env.NODE_ENV || 'development',
      release: process.env.NEXT_PUBLIC_APP_VERSION,
      maxBreadcrumbs: 100,
      beforeSend: (report) => report,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        /^TypeError: Failed to fetch/i,
        /^NetworkError/i,
        /^Load failed/i
      ],
      allowedUrls: [],
      sampleRate: 1.0,
      ...config
    };

    this.reporter = new PerformanceReporter();
    this.setupGlobalHandlers();
  }

  static getInstance(config?: ErrorTrackerConfig): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker(config);
    } else if (config) {
      ErrorTracker.instance.updateConfig(config);
    }
    return ErrorTracker.instance;
  }

  /**
   * Initialize error tracking
   */
  static init(config?: ErrorTrackerConfig): void {
    ErrorTracker.getInstance(config);
  }

  /**
   * Capture an exception
   */
  static captureException(error: Error | string, context?: ErrorContext): void {
    ErrorTracker.getInstance().captureException(error, context);
  }

  /**
   * Capture a message
   */
  static captureMessage(message: string, level: Breadcrumb['level'] = 'info', context?: ErrorContext): void {
    ErrorTracker.getInstance().captureMessage(message, level, context);
  }

  /**
   * Add a breadcrumb
   */
  static addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    ErrorTracker.getInstance().addBreadcrumb(breadcrumb);
  }

  /**
   * Set user context
   */
  static setUser(user: { id?: string; email?: string; username?: string } | null): void {
    ErrorTracker.getInstance().setUser(user);
  }

  /**
   * Set extra context
   */
  static setContext(key: string, value: any): void {
    ErrorTracker.getInstance().setContext(key, value);
  }

  /**
   * Clear breadcrumbs
   */
  static clearBreadcrumbs(): void {
    ErrorTracker.getInstance().clearBreadcrumbs();
  }

  // Instance methods
  captureException(error: Error | string, context?: ErrorContext): void {
    if (!this.config.enabled) return;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Check if should ignore
    if (this.shouldIgnoreError(errorObj)) return;

    // Check sample rate
    if (Math.random() > this.config.sampleRate) return;

    const report = this.createErrorReport(errorObj, context);
    
    // Apply beforeSend
    const finalReport = this.config.beforeSend(report);
    if (!finalReport) return;

    // Send report
    this.sendReport(finalReport);

    // Also report to performance monitor
    this.reporter.reportError(errorObj, context);
  }

  captureMessage(message: string, level: Breadcrumb['level'] = 'info', context?: ErrorContext): void {
    if (!this.config.enabled) return;

    this.addBreadcrumb({
      type: 'custom',
      category: 'message',
      message,
      level
    });

    if (level === 'error' || level === 'warning') {
      const error = new Error(message);
      this.captureException(error, context);
    }
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now()
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Trim breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  setUser(user: { id?: string; email?: string; username?: string } | null): void {
    if (user) {
      this.context.userId = user.id;
      this.context.metadata = {
        ...this.context.metadata,
        userEmail: user.email,
        username: user.username
      };
    } else {
      delete this.context.userId;
      if (this.context.metadata) {
        delete this.context.metadata.userEmail;
        delete this.context.metadata.username;
      }
    }
  }

  setContext(key: string, value: any): void {
    this.context.metadata = {
      ...this.context.metadata,
      [key]: value
    };
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  updateConfig(config: Partial<ErrorTrackerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        url: event.filename,
        metadata: {
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(`Unhandled Promise Rejection: ${event.reason}`);
      
      this.captureException(error, {
        metadata: {
          promise: true,
          reason: event.reason
        }
      });
    });

    // Console breadcrumbs
    this.instrumentConsole();

    // Navigation breadcrumbs
    this.instrumentNavigation();

    // Click breadcrumbs
    this.instrumentClicks();

    // HTTP breadcrumbs
    this.instrumentFetch();
  }

  private instrumentConsole(): void {
    const methods: Array<keyof Console> = ['log', 'warn', 'error', 'info', 'debug'];
    
    methods.forEach(method => {
      const original = console[method] as Function;
      
      // Check if we can modify the console object
      if (!original || typeof original !== 'function') return;
      
      try {
        // Use defineProperty for safer property modification
        Object.defineProperty(console, method, {
          value: (...args: any[]) => {
            // Safely handle arguments
            try {
              const message = args.map(arg => {
                if (arg === null || arg === undefined) return String(arg);
                if (typeof arg === 'object') {
                  try {
                    return JSON.stringify(arg);
                  } catch {
                    return '[Circular or Complex Object]';
                  }
                }
                return String(arg);
              }).join(' ');
              
              this.addBreadcrumb({
                type: 'console',
                category: 'console',
                message: message.substring(0, 1000), // Limit message length
                level: method === 'error' ? 'error' : 
                       method === 'warn' ? 'warning' : 
                       'info',
                data: { method }
              });
            } catch (breadcrumbError) {
              // Silently fail if breadcrumb creation fails
            }
            
            // Always call the original method
            return original.apply(console, args);
          },
          configurable: true,
          writable: true
        });
      } catch (error) {
        // If we can't instrument console, continue without it
        console.warn('Failed to instrument console method:', method, error);
      }
    });
  }

  private instrumentNavigation(): void {
    if (typeof window === 'undefined') return;

    // Page load
    this.addBreadcrumb({
      type: 'navigation',
      category: 'navigation',
      message: `Page loaded: ${window.location.href}`,
      level: 'info'
    });

    // Listen to route changes (Next.js specific)
    if (typeof window !== 'undefined' && (window as any).next?.router) {
      const router = (window as any).next.router;
      
      router.events?.on('routeChangeStart', (url: string) => {
        this.addBreadcrumb({
          type: 'navigation',
          category: 'navigation',
          message: `Navigating to: ${url}`,
          level: 'info'
        });
      });
    }
  }

  private instrumentClicks(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const selector = this.getElementSelector(target);
      
      this.addBreadcrumb({
        type: 'click',
        category: 'ui',
        message: `Click on ${selector}`,
        level: 'info',
        data: {
          selector,
          tagName: target.tagName,
          innerText: target.innerText?.substring(0, 100)
        }
      });
    }, true);
  }

  private instrumentFetch(): void {
    if (typeof window === 'undefined' || !window.fetch) return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [input, init] = args;
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method || 'GET';

      this.addBreadcrumb({
        type: 'http',
        category: 'fetch',
        message: `${method} ${url}`,
        level: 'info',
        data: { method, url }
      });

      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.addBreadcrumb({
            type: 'http',
            category: 'fetch',
            message: `${method} ${url} failed with ${response.status}`,
            level: 'error',
            data: { 
              method, 
              url, 
              status: response.status,
              statusText: response.statusText
            }
          });
        }

        return response;
      } catch (error) {
        this.addBreadcrumb({
          type: 'http',
          category: 'fetch',
          message: `${method} ${url} failed`,
          level: 'error',
          data: { method, url, error: String(error) }
        });
        throw error;
      }
    };
  }

  private shouldIgnoreError(error: Error): boolean {
    return this.config.ignoreErrors.some(pattern => {
      if (typeof pattern === 'string') {
        return error.message.includes(pattern);
      }
      return pattern.test(error.message);
    });
  }

  private createErrorReport(error: Error, context?: ErrorContext): ErrorReport {
    return {
      error: {
        message: error.message,
        stack: error.stack,
        type: error.name
      },
      context: {
        ...this.context,
        ...context,
        url: window?.location?.href,
        sessionId: this.getSessionId()
      },
      breadcrumbs: [...this.breadcrumbs],
      timestamp: Date.now(),
      fingerprint: this.generateFingerprint(error),
      environment: this.config.environment,
      release: this.config.release
    };
  }

  private sendReport(report: ErrorReport): void {
    // In production, this would send to a real error tracking service
    // For now, we'll log to console and use the performance reporter
    
    if (process.env.NODE_ENV === 'development') {
      console.group(`[Error Tracker] ${report.error.message}`);
      console.error('Error:', report.error);
      console.log('Context:', report.context);
      console.log('Breadcrumbs:', report.breadcrumbs);
      console.groupEnd();
    }

    // You can implement actual sending logic here
    // For example, sending to your own endpoint:
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(report)
    // });
  }

  private generateFingerprint(error: Error): string {
    const key = `${error.name}-${error.message}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('error-session-id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error-session-id', sessionId);
    }
    return sessionId;
  }

  private getElementSelector(element: HTMLElement): string {
    try {
      const parts: string[] = [];
      let current: HTMLElement | null = element;

      while (current && current !== document.body) {
        // Safely get tag name
        let selector = '';
        try {
          selector = (current.tagName || 'unknown').toLowerCase();
        } catch {
          selector = 'unknown';
        }
        
        if (current.id) {
          selector += `#${current.id}`;
          parts.unshift(selector);
          break;
        } else if (current.className !== undefined && current.className !== null) {
          // Handle both regular elements and SVG elements
          let classNames = '';
          
          try {
            if (typeof current.className === 'string') {
              // Regular HTML element
              classNames = current.className;
            } else if (typeof current.className === 'object' && current.className.baseVal !== undefined) {
              // SVG element with SVGAnimatedString
              classNames = current.className.baseVal || '';
            } else if (typeof current.className === 'object' && typeof current.className.toString === 'function') {
              // Some other object with toString method
              classNames = current.className.toString();
            }
          } catch {
            // If accessing className throws an error, just skip it
            classNames = '';
          }
          
          // Only process if we have a valid string
          if (classNames && typeof classNames === 'string') {
            try {
              const validClasses = classNames
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .filter(cls => /^[a-zA-Z][\w-]*$/.test(cls)); // Only valid CSS class names
              
              if (validClasses.length > 0) {
                selector += `.${validClasses.join('.')}`;
              }
            } catch {
              // If split or filter fails, just continue without classes
            }
          }
        }
        
        parts.unshift(selector);
        current = current.parentElement;
      }

      return parts.length > 0 ? parts.join(' > ') : 'unknown';
    } catch (error) {
      // If anything fails, return a safe default
      return 'unknown';
    }
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();