import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, XCircle, AlertTriangle, Info, HelpCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FormattedError, ErrorSeverity } from '../../utils/errorFormatting';

interface ErrorDisplayProps {
  error: FormattedError;
  className?: string;
  showTechnicalDetails?: boolean;
  showSupportCode?: boolean;
  onAction?: () => void;
  onDismiss?: () => void;
  inline?: boolean;
}

const severityConfig = {
  [ErrorSeverity.ERROR]: {
    icon: XCircle,
    className: 'border-destructive/50 text-destructive bg-destructive/10',
    iconClassName: 'text-destructive'
  },
  [ErrorSeverity.WARNING]: {
    icon: AlertTriangle,
    className: 'border-yellow-500/50 text-yellow-700 bg-yellow-50',
    iconClassName: 'text-yellow-600'
  },
  [ErrorSeverity.INFO]: {
    icon: Info,
    className: 'border-blue-500/50 text-blue-700 bg-blue-50',
    iconClassName: 'text-blue-600'
  }
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  className,
  showTechnicalDetails = false,
  showSupportCode = true,
  onAction,
  onDismiss,
  inline = false
}) => {
  const { t } = useTranslation('physicalTrainer');
  const config = severityConfig[error.severity];
  const Icon = config.icon;

  if (inline) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <Icon className={cn('h-4 w-4', config.iconClassName)} />
        <span className="font-medium">{error.message}</span>
        {error.helpLink && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => window.open(error.helpLink, '_blank')}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('common.learnMore')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return (
    <Alert className={cn(config.className, className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{error.message}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent"
            onClick={onDismiss}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{error.helpText}</p>
        
        {(showTechnicalDetails && error.technicalDetails) && (
          <div className="rounded bg-gray-100 p-2 font-mono text-xs">
            <p className="font-semibold">Technical Details:</p>
            <p>{error.technicalDetails}</p>
            {error.context && (
              <pre className="mt-1 overflow-x-auto">
                {JSON.stringify(error.context, null, 2)}
              </pre>
            )}
          </div>
        )}

        {showSupportCode && (
          <p className="text-xs text-gray-600">
            Support Code: <code className="font-mono">{error.supportCode}</code>
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {error.action && (onAction || error.helpLink) && (
            <Button
              size="sm"
              variant={error.severity === ErrorSeverity.ERROR ? 'destructive' : 'default'}
              onClick={onAction || (() => window.open(error.helpLink, '_blank'))}
            >
              {error.action === 'Retry the operation' && <RefreshCw className="mr-2 h-3 w-3" />}
              {error.action}
            </Button>
          )}
          {error.helpLink && !onAction && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(error.helpLink, '_blank')}
            >
              <HelpCircle className="mr-2 h-3 w-3" />
              {t('common.learnMore')}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Multiple errors display component
interface ErrorListProps {
  errors: FormattedError[];
  className?: string;
  showTechnicalDetails?: boolean;
  onDismiss?: (index: number) => void;
  maxVisible?: number;
}

export const ErrorList: React.FC<ErrorListProps> = ({
  errors,
  className,
  showTechnicalDetails = false,
  onDismiss,
  maxVisible = 3
}) => {
  const [showAll, setShowAll] = React.useState(false);
  const visibleErrors = showAll ? errors : errors.slice(0, maxVisible);
  const hasMore = errors.length > maxVisible;

  if (errors.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {visibleErrors.map((error, index) => (
        <ErrorDisplay
          key={`${error.code}-${index}`}
          error={error}
          showTechnicalDetails={showTechnicalDetails}
          onDismiss={onDismiss ? () => onDismiss(index) : undefined}
        />
      ))}
      
      {hasMore && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full"
        >
          Show {errors.length - maxVisible} more errors
        </Button>
      )}
      
      {hasMore && showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(false)}
          className="w-full"
        >
          Show less
        </Button>
      )}
    </div>
  );
};

// Field error display for forms
interface FieldErrorProps {
  field: string;
  error?: FormattedError;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({
  field,
  error,
  className
}) => {
  if (!error) return null;

  return (
    <div className={cn('mt-1', className)}>
      <ErrorDisplay
        error={error}
        inline
        showSupportCode={false}
        className="text-destructive"
      />
    </div>
  );
};