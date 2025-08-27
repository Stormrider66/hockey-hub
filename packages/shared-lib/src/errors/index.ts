export * from './BaseError';
export * from './ApplicationErrors';
export * from './ErrorHandler';
// Backward-compat: re-export a named errorHandler symbol if tests import it
export { errorHandler } from './ErrorHandler';