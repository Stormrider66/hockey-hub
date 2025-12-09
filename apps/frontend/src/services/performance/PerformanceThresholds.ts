export interface Threshold {
  good: number;
  needsImprovement: number;
  critical: number;
}

export interface PerformanceBudget {
  webVitals: {
    LCP: Threshold;
    FID: Threshold;
    CLS: Threshold;
    FCP: Threshold;
    TTFB: Threshold;
  };
  api: {
    fast: number;
    acceptable: number;
    slow: number;
  };
  render: {
    fast: number;
    acceptable: number;
    slow: number;
  };
  resources: {
    bundleSize: number;
    imageSize: number;
    fontCount: number;
    scriptCount: number;
  };
  custom: Record<string, Threshold>;
}

/**
 * Performance thresholds based on Google's Core Web Vitals recommendations
 * and custom application requirements
 */
export class PerformanceThresholds {
  // Core Web Vitals thresholds (in milliseconds)
  static readonly WEB_VITALS: PerformanceBudget['webVitals'] = {
    // Largest Contentful Paint
    LCP: {
      good: 2500,
      needsImprovement: 4000,
      critical: 6000
    },
    // First Input Delay
    FID: {
      good: 100,
      needsImprovement: 300,
      critical: 500
    },
    // Cumulative Layout Shift (unitless)
    CLS: {
      good: 0.1,
      needsImprovement: 0.25,
      critical: 0.5
    },
    // First Contentful Paint
    FCP: {
      good: 1800,
      needsImprovement: 3000,
      critical: 4500
    },
    // Time to First Byte
    TTFB: {
      good: 800,
      needsImprovement: 1800,
      critical: 3000
    }
  };

  // API response time thresholds
  static readonly API: PerformanceBudget['api'] = {
    fast: 200,        // Excellent
    acceptable: 1000, // Good
    slow: 3000       // Poor
  };

  // Component render time thresholds
  static readonly RENDER: PerformanceBudget['render'] = {
    fast: 16,        // 60fps
    acceptable: 50,  // Noticeable
    slow: 100       // Janky
  };

  // Resource size budgets (in KB)
  static readonly RESOURCES: PerformanceBudget['resources'] = {
    bundleSize: 500,      // Per chunk
    imageSize: 200,       // Per image
    fontCount: 3,         // Max custom fonts
    scriptCount: 10       // Max external scripts
  };

  // Custom thresholds for specific operations
  private static customThresholds: Record<string, Threshold> = {
    'workout-load': {
      good: 500,
      needsImprovement: 1000,
      critical: 2000
    },
    'chat-message-send': {
      good: 100,
      needsImprovement: 300,
      critical: 1000
    },
    'calendar-render': {
      good: 300,
      needsImprovement: 600,
      critical: 1200
    },
    'search-results': {
      good: 200,
      needsImprovement: 500,
      critical: 1000
    },
    'dashboard-load': {
      good: 1000,
      needsImprovement: 2000,
      critical: 3000
    },
    'api-response': {
      good: 200,
      needsImprovement: 1000,
      critical: 3000
    }
  };

  /**
   * Get threshold for a specific metric
   */
  static getThreshold(metric: string): Threshold | null {
    // Check web vitals
    if (metric in this.WEB_VITALS) {
      return this.WEB_VITALS[metric as keyof typeof this.WEB_VITALS];
    }

    // Check custom thresholds
    if (metric in this.customThresholds) {
      return this.customThresholds[metric];
    }

    return null;
  }

  /**
   * Set a custom threshold
   */
  static setCustomThreshold(metric: string, threshold: Threshold): void {
    this.customThresholds[metric] = threshold;
  }

  /**
   * Get all thresholds
   */
  static getAllThresholds(): PerformanceBudget {
    return {
      webVitals: this.WEB_VITALS,
      api: this.API,
      render: this.RENDER,
      resources: this.RESOURCES,
      custom: { ...this.customThresholds }
    };
  }

  /**
   * Check if a value exceeds threshold
   */
  static checkThreshold(metric: string, value: number): {
    status: 'good' | 'needs-improvement' | 'critical';
    threshold: Threshold | null;
    exceedance?: number;
  } {
    const threshold = this.getThreshold(metric);
    
    if (!threshold) {
      return { status: 'good', threshold: null };
    }

    if (value <= threshold.good) {
      return { status: 'good', threshold };
    } else if (value <= threshold.needsImprovement) {
      return { status: 'needs-improvement', threshold };
    } else {
      return {
        status: 'critical',
        threshold,
        exceedance: value - threshold.critical
      };
    }
  }

  /**
   * Get performance budget summary
   */
  static getBudgetSummary(): {
    metric: string;
    budget: Threshold;
    unit: string;
  }[] {
    const summary: { metric: string; budget: Threshold; unit: string }[] = [];

    // Add web vitals
    Object.entries(this.WEB_VITALS).forEach(([metric, threshold]) => {
      summary.push({
        metric,
        budget: threshold,
        unit: metric === 'CLS' ? '' : 'ms'
      });
    });

    // Add custom metrics
    Object.entries(this.customThresholds).forEach(([metric, threshold]) => {
      summary.push({
        metric,
        budget: threshold,
        unit: 'ms'
      });
    });

    return summary;
  }

  /**
   * Export thresholds for external tools
   */
  static exportThresholds(): string {
    return JSON.stringify(this.getAllThresholds(), null, 2);
  }

  /**
   * Import thresholds from JSON
   */
  static importThresholds(json: string): void {
    try {
      const imported = JSON.parse(json);
      
      if (imported.custom) {
        Object.entries(imported.custom).forEach(([metric, threshold]) => {
          if (this.isValidThreshold(threshold)) {
            this.customThresholds[metric] = threshold as Threshold;
          }
        });
      }
    } catch (error) {
      console.error('Failed to import thresholds:', error);
    }
  }

  /**
   * Validate threshold object
   */
  private static isValidThreshold(obj: any): boolean {
    return (
      typeof obj === 'object' &&
      typeof obj.good === 'number' &&
      typeof obj.needsImprovement === 'number' &&
      typeof obj.critical === 'number' &&
      obj.good <= obj.needsImprovement &&
      obj.needsImprovement <= obj.critical
    );
  }
}