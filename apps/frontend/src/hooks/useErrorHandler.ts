import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  validationErrors?: Array<{ field: string; message: string }>;
  details?: Record<string, unknown>;
}

export interface ErrorState {
  error: ApiError | null;
  isError: boolean;
  isRetrying: boolean;
}

export interface UseErrorHandlerOptions {
  showToast?: boolean;
  retryLimit?: number;
  retryDelay?: number;
  onError?: (error: ApiError) => void;
  onRetry?: () => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    showToast = true,
    retryLimit = 3,
    retryDelay = 1000,
    onError,
    onRetry
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    isRetrying: false
  });

  const retryCount = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Parse error from various sources
  const parseError = useCallback((error: unknown): ApiError => {
    if (!error || typeof error !== 'object') {
      return {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500
      };
    }

    // Already formatted API error
    if ('error' in error && error.error && typeof error.error === 'object') {
      return error.error as ApiError;
    }

    // Axios error
    if ('response' in error && error.response && typeof error.response === 'object') {
      const response = error.response as { data?: { error?: ApiError } };
      if (response.data?.error) {
        return response.data.error;
      }
    }

    // RTK Query error
    if ('data' in error && error.data && typeof error.data === 'object') {
      const data = error.data as { error?: ApiError };
      if (data.error) {
        return data.error;
      }
    }

    // Network error
    const errorCode = 'code' in error ? (error.code as string) : '';
    const errorMessage = 'message' in error ? (error.message as string) : '';
    
    if (errorCode === 'ERR_NETWORK' || errorMessage.includes('Network')) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        statusCode: 0
      };
    }

    // Timeout error
    if (errorCode === 'ECONNABORTED' || errorMessage.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT',
        statusCode: 408
      };
    }

    // Generic error
    const status = 'status' in error ? (error.status as number) : 
                   'statusCode' in error ? (error.statusCode as number) : 500;

    return {
      message: errorMessage || 'An unexpected error occurred',
      code: errorCode || 'UNKNOWN_ERROR',
      statusCode: status
    };
  }, []);

  // Set error
  const setError = useCallback((error: unknown) => {
    const parsedError = parseError(error);
    
    setErrorState({
      error: parsedError,
      isError: true,
      isRetrying: false
    });

    // Show toast notification
    if (showToast) {
      const toastMessage = parsedError.validationErrors?.length
        ? `${parsedError.message}: ${parsedError.validationErrors[0].message}`
        : parsedError.message;

      switch (parsedError.statusCode) {
        case 401:
          toast.error(toastMessage, { id: 'auth-error' });
          break;
        case 403:
          toast.error('You do not have permission to perform this action', { id: 'permission-error' });
          break;
        case 404:
          toast.error('The requested resource was not found', { id: 'not-found-error' });
          break;
        case 429:
          toast.error('Too many requests. Please slow down.', { id: 'rate-limit-error' });
          break;
        default:
          toast.error(toastMessage);
      }
    }

    // Call custom error handler
    onError?.(parsedError);

    // Reset retry count
    retryCount.current = 0;
  }, [parseError, showToast, onError]);

  // Clear error
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      isRetrying: false
    });
    retryCount.current = 0;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  // Retry with exponential backoff
  const retry = useCallback(async <T>(retryFn: () => Promise<T>): Promise<T | null> => {
    if (retryCount.current >= retryLimit) {
      toast.error('Maximum retry attempts reached');
      return null;
    }

    setErrorState(prev => ({ ...prev, isRetrying: true }));
    retryCount.current++;

    // Exponential backoff
    const delay = retryDelay * Math.pow(2, retryCount.current - 1);
    
    if (showToast) {
      toast.loading(`Retrying... (${retryCount.current}/${retryLimit})`, {
        id: 'retry-toast'
      });
    }

    onRetry?.();

    return new Promise<T | null>((resolve) => {
      retryTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await retryFn();
          clearError();
          if (showToast) {
            toast.success('Success!', { id: 'retry-toast' });
          }
          resolve(result);
        } catch (error) {
          setError(error);
          resolve(null);
        }
      }, delay);
    });
  }, [retryLimit, retryDelay, showToast, onRetry, clearError, setError]);

  // Handle async operations with error handling
  const handleAsync = useCallback(async <T,>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      clearError();
      const result = await asyncFn();
      return result;
    } catch (error) {
      setError(error);
      return null;
    }
  }, [clearError, setError]);

  return {
    ...errorState,
    setError,
    clearError,
    retry,
    handleAsync,
    parseError
  };
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent default browser error handling
    event.preventDefault();
    
    // Show toast for unhandled errors
    toast.error('An unexpected error occurred. Please refresh the page.', {
      duration: 5000,
      id: 'unhandled-error'
    });
  });

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Check if it's a chunk loading error
    if (event.message.includes('Loading chunk')) {
      toast.error('Application update available. Please refresh the page.', {
        duration: 10000,
        id: 'chunk-error'
      });
    }
  });
}