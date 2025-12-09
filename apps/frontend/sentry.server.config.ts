let Sentry: any = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require('@sentry/nextjs');
} catch {
  Sentry = {
    init: () => {},
    Integrations: { Http: class {} },
  };
}

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release Tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  environment: process.env.NODE_ENV,
  
  // Server-specific configuration
  autoSessionTracking: true,
  
  // Integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  
  // Filtering
  beforeSend(event: any, hint: any) {
    // Filter sensitive data
    if (event.request?.cookies) {
      event.request.cookies = '[REDACTED]';
    }
    
    if (event.request?.headers) {
      // Keep only non-sensitive headers
      const allowedHeaders = ['user-agent', 'accept', 'content-type'];
      const filteredHeaders: Record<string, string> = {};
      
      for (const [key, value] of Object.entries(event.request.headers)) {
        if (allowedHeaders.includes(key.toLowerCase())) {
          filteredHeaders[key] = value as string;
        }
      }
      
      event.request.headers = filteredHeaders;
    }
    
    return event;
  },
});