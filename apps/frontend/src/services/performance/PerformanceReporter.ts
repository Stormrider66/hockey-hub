import type { WebVitalEntry, ApiTimingEntry, RenderTimingEntry, PerformanceEntry } from './PerformanceMonitor';

export interface ReportConfig {
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  enableConsoleLogging?: boolean;
  enableRemoteLogging?: boolean;
  apiKey?: string;
}

export interface PerformanceReport {
  type: 'web-vital' | 'api-timing' | 'render-timing' | 'long-task' | 'threshold-violation' | 'error';
  data: any;
  timestamp: number;
  sessionId?: string;
  userId?: string;
  device?: {
    type: string;
    viewport: { width: number; height: number };
    userAgent: string;
  };
}

export class PerformanceReporter {
  private queue: PerformanceReport[] = [];
  private config: ReportConfig;
  private flushTimer?: NodeJS.Timeout;
  private deviceInfo: PerformanceReport['device'];

  constructor(config: ReportConfig = {}) {
    this.config = {
      endpoint: process.env.NEXT_PUBLIC_PERFORMANCE_ENDPOINT || '/api/performance',
      batchSize: 20,
      flushInterval: 30000, // 30 seconds
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      ...config
    };

    this.deviceInfo = this.getDeviceInfo();
    this.startFlushTimer();

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  /**
   * Report a web vital metric
   */
  reportWebVital(vital: WebVitalEntry): void {
    this.addToQueue({
      type: 'web-vital',
      data: vital,
      timestamp: Date.now()
    });

    if (this.config.enableConsoleLogging) {
      console.log(`[Performance] Web Vital - ${vital.name}:`, vital.value, vital.rating);
    }
  }

  /**
   * Report slow API call
   */
  reportSlowApi(timing: ApiTimingEntry): void {
    this.addToQueue({
      type: 'api-timing',
      data: timing,
      timestamp: Date.now()
    });

    if (this.config.enableConsoleLogging) {
      console.warn(`[Performance] Slow API - ${timing.method} ${timing.url}: ${timing.value}ms`);
    }
  }

  /**
   * Report slow component render
   */
  reportSlowRender(timing: RenderTimingEntry): void {
    this.addToQueue({
      type: 'render-timing',
      data: timing,
      timestamp: Date.now()
    });

    if (this.config.enableConsoleLogging) {
      console.warn(`[Performance] Slow Render - ${timing.component}: ${timing.value}ms`);
    }
  }

  /**
   * Report long task
   */
  reportLongTask(task: PerformanceEntry): void {
    this.addToQueue({
      type: 'long-task',
      data: task,
      timestamp: Date.now()
    });

    if (this.config.enableConsoleLogging) {
      console.warn(`[Performance] Long Task: ${task.value}ms`);
    }
  }

  /**
   * Report threshold violation
   */
  reportThresholdViolation(metric: string, value: number, threshold: number): void {
    this.addToQueue({
      type: 'threshold-violation',
      data: {
        metric,
        value,
        threshold,
        exceedance: value - threshold
      },
      timestamp: Date.now()
    });

    if (this.config.enableConsoleLogging) {
      console.error(
        `[Performance] Threshold Violation - ${metric}: ${value} (threshold: ${threshold})`
      );
    }
  }

  /**
   * Report performance-related error
   */
  reportError(error: Error, context?: any): void {
    this.addToQueue({
      type: 'error',
      data: {
        message: error.message,
        stack: error.stack,
        context
      },
      timestamp: Date.now()
    });

    if (this.config.enableConsoleLogging) {
      console.error('[Performance] Error:', error, context);
    }
  }

  /**
   * Manually flush the queue
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.config.enableRemoteLogging) {
      return;
    }

    const reports = [...this.queue];
    this.queue = [];

    try {
      // Use sendBeacon for reliability on page unload
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ reports })], {
          type: 'application/json'
        });
        navigator.sendBeacon(this.config.endpoint!, blob);
      } else {
        // Fallback to fetch
        await this.sendReports(reports);
      }
    } catch (error) {
      // Re-add to queue on failure
      this.queue.unshift(...reports);
      console.error('[Performance] Failed to send reports:', error);
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Update reporter configuration
   */
  updateConfig(config: Partial<ReportConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart flush timer with new interval
    if (config.flushInterval) {
      this.stopFlushTimer();
      this.startFlushTimer();
    }
  }

  /**
   * Stop the reporter
   */
  stop(): void {
    this.stopFlushTimer();
    this.flush();
  }

  /**
   * Add report to queue
   */
  private addToQueue(report: Omit<PerformanceReport, 'sessionId' | 'userId' | 'device'>): void {
    const fullReport: PerformanceReport = {
      ...report,
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      device: this.deviceInfo
    };

    this.queue.push(fullReport);

    // Auto-flush if queue is full
    if (this.queue.length >= this.config.batchSize!) {
      this.flush();
    }
  }

  /**
   * Send reports via fetch
   */
  private async sendReports(reports: PerformanceReport[]): Promise<void> {
    const response = await fetch(this.config.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey })
      },
      body: JSON.stringify({ reports })
    });

    if (!response.ok) {
      throw new Error(`Failed to send reports: ${response.statusText}`);
    }
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.config.flushInterval && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  /**
   * Stop the flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): PerformanceReport['device'] {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && viewport.width >= 768;

    return {
      type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
      viewport,
      userAgent: navigator.userAgent
    };
  }

  /**
   * Get session ID (mock implementation - replace with actual session management)
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }

    // Try to get from sessionStorage
    let sessionId = sessionStorage.getItem('performance-session-id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('performance-session-id', sessionId);
    }

    return sessionId;
  }

  /**
   * Get user ID (mock implementation - replace with actual user management)
   */
  private getUserId(): string | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    // Try to get from localStorage (would be set by auth system)
    return localStorage.getItem('userId') || undefined;
  }
}

// Create a singleton instance for easy access
export const performanceReporter = new PerformanceReporter();