let Sentry: any = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require('@sentry/nextjs');
} catch {
  Sentry = {
    init: () => {},
    BrowserTracing: class {},
    Replay: class {},
    nextRouterInstrumentation: () => {},
  };
}

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release Tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  environment: process.env.NODE_ENV,
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Filtering
  beforeSend(event: any, hint: any) {
    // Filter out non-error events in production
    if (process.env.NODE_ENV === 'production' && event.level !== 'error') {
      return null;
    }
    
    // Don't send events for certain errors
    const error = hint.originalException;
    if (error && error instanceof Error) {
      // Ignore network errors that are expected
      if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        return null;
      }
      
      // Ignore user-cancelled requests
      if (error.name === 'AbortError') {
        return null;
      }
    }
    
    return event;
  },
  
  // Privacy
  beforeBreadcrumb(breadcrumb: any) {
    // Don't log sensitive form data
    if (breadcrumb.category === 'ui.input' && breadcrumb.message?.includes('password')) {
      return null;
    }
    
    // Sanitize chat messages
    if (breadcrumb.data?.message && breadcrumb.category === 'chat') {
      breadcrumb.data.message = '[REDACTED]';
    }
    
    return breadcrumb;
  },
});