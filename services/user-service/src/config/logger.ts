import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Configure pino-pretty for development
const transport = isDevelopment ? {
  target: 'pino-pretty',
  options: {
    colorize: true,
    levelFirst: true,
    translateTime: 'SYS:standard',
  }
} : undefined;

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // Use pino-pretty transport in development, default JSON in production
  ...(transport && { transport })
});

export default logger; 