export function sanitize(_options?: any) {
  return function (_req: any, _res: any, next: any) {
    // No-op sanitizer for build-time; real sanitization is provided in shared-lib when available
    next();
  };
}





