import { TFunction } from 'i18next';
import {
  ErrorMessage,
  ERROR_MESSAGES,
  ERROR_CODE_PREFIX,
  HELP_BASE_URL,
  ErrorCategory,
  ErrorSeverity
} from '../constants/errorMessages';
// Re-export enums for tests and consumers
export { ErrorCategory, ErrorSeverity } from '../constants/errorMessages';

interface ErrorContext {
  field?: string;
  value?: any;
  details?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

interface FormattedError {
  code: string;
  supportCode: string;
  message: string;
  technicalDetails?: string;
  helpText: string;
  action: string;
  helpLink?: string;
  severity: ErrorSeverity;
  context?: ErrorContext;
}

/**
 * Get an error message by code with optional context
 */
export function getErrorMessage(
  code: string,
  context?: ErrorContext,
  t?: TFunction
): FormattedError | null {
  const errorDef = ERROR_MESSAGES[code];
  if (!errorDef) {
    console.error(`Unknown error code: ${code}`);
    return getErrorMessage('UNKNOWN_ERROR', context, t);
  }

  const supportCode = generateSupportCode(errorDef);
  
  // Use translation if available, fallback to default message
  const message = t 
    ? t(`physicalTrainer:errors.${code}.message`, { 
        defaultValue: errorDef.userMessage,
        ...context?.details 
      })
    : errorDef.userMessage;

  const helpText = t
    ? t(`physicalTrainer:errors.${code}.helpText`, { 
        defaultValue: errorDef.helpText,
        ...context?.details 
      })
    : errorDef.helpText;

  const action = t
    ? t(`physicalTrainer:errors.${code}.action`, { 
        defaultValue: errorDef.action,
        ...context?.details 
      })
    : errorDef.action;

  return {
    code: errorDef.code,
    supportCode,
    message,
    technicalDetails: shouldShowTechnicalDetails() ? errorDef.technicalMessage : undefined,
    helpText,
    action,
    helpLink: errorDef.helpLink ? `${HELP_BASE_URL}${errorDef.helpLink}` : getHelpLink(code),
    severity: errorDef.severity,
    context
  };
}

/**
 * Format a field-specific validation error
 */
export function formatFieldError(
  field: string,
  error: string | { code: string; context?: ErrorContext },
  t?: TFunction
): FormattedError | null {
  const errorCode = typeof error === 'string' ? error : error.code;
  const context = typeof error === 'object' ? error.context : { field };

  return getErrorMessage(errorCode, { ...context, field }, t);
}

/**
 * Generate a unique support code for error tracking
 */
function generateSupportCode(error: ErrorMessage): string {
  const prefix = ERROR_CODE_PREFIX[error.category] || 'UNK';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Check if technical details should be shown (dev mode)
 */
export function shouldShowTechnicalDetails(): boolean {
  return process.env.NODE_ENV === 'development' || 
         localStorage.getItem('showTechnicalErrors') === 'true';
}

/**
 * Get help link for an error code
 */
export function getHelpLink(errorCode: string): string {
  const error = ERROR_MESSAGES[errorCode];
  if (!error) return `${HELP_BASE_URL}/errors/unknown`;

  // Generate help link based on category and code
  const category = error.category.toLowerCase().replace('_', '-');
  const code = errorCode.toLowerCase().replace(/_/g, '-');
  
  return `${HELP_BASE_URL}/errors/${category}/${code}`;
}

/**
 * Format multiple errors into a summary
 */
export function formatErrorSummary(
  errors: Array<string | FormattedError>,
  t?: TFunction
): {
  summary: string;
  errors: FormattedError[];
  hasErrors: boolean;
  hasWarnings: boolean;
} {
  const formattedErrors = errors.map(error => {
    if (typeof error === 'string') {
      return getErrorMessage(error, undefined, t);
    }
    return error;
  }).filter(Boolean) as FormattedError[];

  const errorCount = formattedErrors.filter(e => e.severity === ErrorSeverity.ERROR).length;
  const warningCount = formattedErrors.filter(e => e.severity === ErrorSeverity.WARNING).length;

  let summary = '';
  if (errorCount > 0 && warningCount > 0) {
    summary = t 
      ? t('physicalTrainer:errors.summary.mixed', { errorCount, warningCount })
      : `${errorCount} errors and ${warningCount} warnings found`;
  } else if (errorCount > 0) {
    summary = t
      ? t('physicalTrainer:errors.summary.errors', { count: errorCount })
      : `${errorCount} error${errorCount > 1 ? 's' : ''} found`;
  } else if (warningCount > 0) {
    summary = t
      ? t('physicalTrainer:errors.summary.warnings', { count: warningCount })
      : `${warningCount} warning${warningCount > 1 ? 's' : ''} found`;
  }

  return {
    summary,
    errors: formattedErrors,
    hasErrors: errorCount > 0,
    hasWarnings: warningCount > 0
  };
}

/**
 * Parse API error response and format it
 */
export function parseApiError(
  error: any,
  fallbackCode: string = 'UNKNOWN_ERROR',
  t?: TFunction
): FormattedError {
  // Handle RTK Query errors
  if (error?.data?.error) {
    const apiError = error.data.error;
    const code = apiError.code || fallbackCode;
    const context: ErrorContext = {
      details: apiError.details || {},
      timestamp: new Date(apiError.timestamp || Date.now())
    };
    
    return getErrorMessage(code, context, t) || getErrorMessage(fallbackCode, undefined, t)!;
  }

  // Handle standard HTTP errors
  if (error?.status) {
    switch (error.status) {
      case 400:
        return getErrorMessage('VALIDATION_ERROR', { details: error.data }, t)!;
      case 401:
        return getErrorMessage('UNAUTHORIZED', undefined, t)!;
      case 403:
        return getErrorMessage('FORBIDDEN', undefined, t)!;
      case 404:
        return getErrorMessage('NOT_FOUND', undefined, t)!;
      case 409:
        return getErrorMessage('SCHEDULE_CONFLICT', { details: error.data }, t)!;
      case 500:
        return getErrorMessage('SERVER_ERROR', undefined, t)!;
      default:
        return getErrorMessage(fallbackCode, { details: { status: error.status } }, t)!;
    }
  }

  // Handle network errors
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return getErrorMessage('CONNECTION_FAILED', undefined, t)!;
  }

  // Fallback: honor custom fallback code even if not defined in catalog
  const fallback = getErrorMessage(fallbackCode, { details: { error: error?.message } }, t)
    || getErrorMessage('UNKNOWN_ERROR', { details: { error: error?.message } }, t)!;
  return { ...fallback, code: fallbackCode };
}

/**
 * Create a validation error for a specific field
 */
export function createFieldValidationError(
  field: string,
  code: string,
  value?: any
): { field: string; error: { code: string; context: ErrorContext } } {
  return {
    field,
    error: {
      code,
      context: { field, value }
    }
  };
}

/**
 * Check if an error is a specific type
 */
export function isErrorType(error: FormattedError | null, category: ErrorCategory): boolean {
  if (!error) return false;
  const errorDef = ERROR_MESSAGES[error.code];
  return errorDef?.category === category;
}

/**
 * Get user-friendly error notification options
 */
export function getErrorNotificationOptions(error: FormattedError): {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
  action?: {
    label: string;
    onClick: () => void;
  };
} {
  const variant = error.severity === ErrorSeverity.ERROR ? 'destructive' : 'default';
  
  return {
    title: error.message,
    description: error.helpText,
    variant,
    action: error.action ? {
      label: error.action,
      onClick: () => {
        if (error.helpLink) {
          window.open(error.helpLink, '_blank');
        }
      }
    } : undefined
  };
}