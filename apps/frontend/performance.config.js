/**
 * Performance Budget Configuration for Hockey Hub
 * 
 * This file defines performance budgets and monitoring configuration
 * that can be used by build tools, CI/CD pipelines, and monitoring services.
 */

module.exports = {
  // Web Vitals budgets (based on Google's recommendations)
  webVitals: {
    LCP: {
      budget: 2500, // Largest Contentful Paint (ms)
      warning: 4000,
      critical: 6000
    },
    FID: {
      budget: 100, // First Input Delay (ms)
      warning: 300,
      critical: 500
    },
    CLS: {
      budget: 0.1, // Cumulative Layout Shift (unitless)
      warning: 0.25,
      critical: 0.5
    },
    FCP: {
      budget: 1800, // First Contentful Paint (ms)
      warning: 3000,
      critical: 4500
    },
    TTFB: {
      budget: 800, // Time to First Byte (ms)
      warning: 1800,
      critical: 3000
    }
  },

  // Bundle size budgets (in KB)
  bundles: {
    // Main bundles
    'main.js': {
      budget: 250,
      warning: 350,
      critical: 500
    },
    'vendor.js': {
      budget: 300,
      warning: 400,
      critical: 600
    },
    // Route-specific bundles
    'player.js': {
      budget: 150,
      warning: 200,
      critical: 300
    },
    'coach.js': {
      budget: 200,
      warning: 250,
      critical: 350
    },
    'physicaltrainer.js': {
      budget: 250,
      warning: 300,
      critical: 400
    },
    'admin.js': {
      budget: 200,
      warning: 250,
      critical: 350
    }
  },

  // Asset size budgets (in KB)
  assets: {
    images: {
      budget: 200, // Per image
      warning: 300,
      critical: 500
    },
    fonts: {
      budget: 50, // Per font file
      warning: 75,
      critical: 100
    },
    styles: {
      budget: 100, // Per CSS file
      warning: 150,
      critical: 200
    }
  },

  // API performance budgets (in ms)
  api: {
    // Critical user paths
    login: {
      budget: 200,
      warning: 500,
      critical: 1000
    },
    dashboard: {
      budget: 300,
      warning: 600,
      critical: 1200
    },
    workoutLoad: {
      budget: 500,
      warning: 1000,
      critical: 2000
    },
    calendarLoad: {
      budget: 400,
      warning: 800,
      critical: 1500
    },
    chatMessage: {
      budget: 100,
      warning: 300,
      critical: 500
    },
    search: {
      budget: 200,
      warning: 500,
      critical: 1000
    }
  },

  // Resource counts
  resources: {
    scripts: {
      budget: 10, // Max external scripts
      warning: 15,
      critical: 20
    },
    stylesheets: {
      budget: 5, // Max stylesheets
      warning: 8,
      critical: 10
    },
    fonts: {
      budget: 3, // Max custom fonts
      warning: 5,
      critical: 7
    },
    images: {
      budget: 30, // Max images per page
      warning: 50,
      critical: 75
    }
  },

  // Device-specific configurations
  devices: {
    mobile: {
      networkThrottle: '3G',
      cpuThrottle: 4,
      budgetMultiplier: 1.5 // Increase budgets by 50% for mobile
    },
    tablet: {
      networkThrottle: '4G',
      cpuThrottle: 2,
      budgetMultiplier: 1.2
    },
    desktop: {
      networkThrottle: 'none',
      cpuThrottle: 1,
      budgetMultiplier: 1
    }
  },

  // Monitoring configuration
  monitoring: {
    enabled: true,
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    reportingEndpoint: process.env.NEXT_PUBLIC_PERFORMANCE_ENDPOINT || '/api/performance',
    enableRealUserMonitoring: true,
    enableSyntheticMonitoring: false,
    alertThresholds: {
      errorRate: 0.05, // 5% error rate
      slowRequestRate: 0.1, // 10% slow requests
      apdexTarget: 0.8 // 80% satisfaction
    }
  },

  // CI/CD integration
  ci: {
    failOnBudgetExceed: false, // Don't fail builds, just warn
    generateReport: true,
    reportPath: './performance-report.json',
    lighthouse: {
      enabled: true,
      minScores: {
        performance: 85,
        accessibility: 90,
        bestPractices: 85,
        seo: 90
      }
    }
  }
};