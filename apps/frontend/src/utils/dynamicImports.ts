import dynamic from 'next/dynamic';
import { ComponentType, createElement } from 'react';

// Loading component for auth pages
const AuthPageLoading = () => {
  return createElement(
    'div',
    { className: 'min-h-screen flex items-center justify-center' },
    createElement(
      'div',
      { className: 'text-center' },
      createElement('div', {
        className: 'inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-600 border-r-transparent'
      }),
      createElement('p', { className: 'mt-4 text-gray-600' }, 'Loading...')
    )
  );
};

// Loading component for components
const ComponentLoading = () => {
  return createElement(
    'div',
    { className: 'flex items-center justify-center p-4' },
    createElement('div', {
      className: 'animate-spin rounded-full h-8 w-8 border-2 border-solid border-blue-600 border-r-transparent'
    })
  );
};

// Dynamic import helper with loading state
export function lazyLoadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  loading?: ComponentType
): ComponentType<any> {
  return dynamic(importFunc, {
    loading: loading || ComponentLoading,
    ssr: true
  });
}

// Pre-configured lazy imports for auth components
export const LazySessionManagement = lazyLoadComponent(
  () => import('@/components/auth/SessionManagement')
);

export const LazySocialLoginButtons = lazyLoadComponent(
  () => import('@/components/auth/SocialLoginButtons')
);

// Utility to preload components
export const preloadComponent = (componentName: string) => {
  switch (componentName) {
    case 'SessionManagement':
      import('@/components/auth/SessionManagement');
      break;
    case 'SocialLoginButtons':
      import('@/components/auth/SocialLoginButtons');
      break;
  }
};