// Check if we're in a test environment
const isTestEnvironment = typeof jest !== 'undefined';

const createMockFn = (fn: Function) => {
  if (isTestEnvironment) {
    return jest.fn(fn);
  }
  return fn;
};

const router = {
  push: createMockFn((path: string) => {
    try { window.history.pushState({}, '', path); } catch {}
  }),
  replace: createMockFn((path: string) => {
    try { window.history.replaceState({}, '', path); } catch {}
  }),
  back: createMockFn(() => {}),
  forward: createMockFn(() => {}),
  refresh: createMockFn(() => {}),
  prefetch: createMockFn(() => {}),
};

export const useRouter = () => router;
export const usePathname = () => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
};
export const useSearchParams = () => {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
};
export default { useRouter, usePathname, useSearchParams };


