import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

interface LoadingComponentProps {
  error?: Error;
  retry?: () => void;
}

// Default loading component
const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

// Default error component
const DefaultErrorComponent = ({ error, retry }: LoadingComponentProps) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
    <p className="text-red-600 mb-4">Failed to load component</p>
    {retry && (
      <button
        onClick={retry}
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        Retry
      </button>
    )}
  </div>
);

interface DynamicImportOptions {
  loading?: ComponentType<{}>;
  error?: ComponentType<LoadingComponentProps>;
  ssr?: boolean;
  suspense?: boolean;
}

/**
 * Standardized dynamic import wrapper with consistent loading and error states
 * @param importFunc - Function that returns the import promise
 * @param options - Options for loading component, error handling, and SSR
 * @returns Dynamically imported component
 */
export function createDynamicImport<P = {}>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: DynamicImportOptions = {}
) {
  const {
    loading = DefaultLoadingComponent,
    error = DefaultErrorComponent,
    ssr = false,
    suspense = false
  } = options;

  return dynamic(importFunc, {
    loading,
    ssr,
    suspense,
    // Error boundary for failed imports
    onError: (error, errorInfo) => {
      console.error('Dynamic import error:', error, errorInfo);
    }
  });
}

// NOTE: The following helper functions have been removed because they use
// dynamic template literal imports which cause webpack to scan entire directories
// and include test files and other unwanted modules.
// 
// If you need to lazy load components, use createDynamicImport with static imports:
// 
// const MyComponent = createDynamicImport(
//   () => import('./MyComponent'),
//   { loading: CustomLoadingComponent }
// );
//
// DO NOT use template literals in dynamic imports like:
// () => import(`@/features/${path}`)
// as this creates webpack context modules that include all files.

/**
 * Preload a dynamic component
 */
export const preloadComponent = (
  importFunc: () => Promise<any>
) => {
  // Trigger the import to start loading
  importFunc().catch(err => {
    console.error('Failed to preload component:', err);
  });
};

/**
 * Utility to retry failed dynamic imports
 */
export const retryDynamicImport = async (
  importFunc: () => Promise<any>,
  retries = 3,
  delay = 1000
): Promise<any> => {
  try {
    return await importFunc();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryDynamicImport(importFunc, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Backward compatibility exports
export const lazyLoadComponent = createDynamicImport;

// Pre-configured lazy imports for auth components
export const LazySessionManagement = createDynamicImport(
  () => import(
    /* webpackChunkName: "auth-session-management" */
    '@/components/auth/SessionManagement'
  )
);

export const LazySocialLoginButtons = createDynamicImport(
  () => import(
    /* webpackChunkName: "auth-social-login" */
    '@/components/auth/SocialLoginButtons'
  )
);