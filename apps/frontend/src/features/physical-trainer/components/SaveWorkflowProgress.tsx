import React from 'react';
import { 
  SaveStep, 
  StepStatus,
  type StepResult,
  type UseSaveWorkflowReturn 
} from '../hooks/useSaveWorkflow';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  FileCheck,
  Users,
  Heart,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SaveWorkflowProgressProps {
  workflow: UseSaveWorkflowReturn;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

const stepConfig = {
  [SaveStep.VALIDATE_CONTENT]: {
    label: 'Validating Workout Content',
    icon: FileCheck,
    description: 'Checking exercises, sets, and parameters'
  },
  [SaveStep.VALIDATE_ASSIGNMENTS]: {
    label: 'Validating Player Assignments',
    icon: Users,
    description: 'Verifying player and team selections'
  },
  [SaveStep.CHECK_MEDICAL]: {
    label: 'Checking Medical Compliance',
    icon: Heart,
    description: 'Ensuring workout is safe for all participants'
  },
  [SaveStep.SAVE_DATA]: {
    label: 'Saving Workout',
    icon: Save,
    description: 'Creating workout sessions'
  }
};

const statusIcons: Record<StepStatus, React.ElementType> = {
  pending: () => null,
  processing: Loader2,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle
};

const statusColors: Record<StepStatus, string> = {
  pending: 'text-muted-foreground',
  processing: 'text-blue-600',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600'
};

export const SaveWorkflowProgress: React.FC<SaveWorkflowProgressProps> = ({
  workflow,
  onRetry,
  onCancel,
  className
}) => {
  const {
    currentStep,
    progress,
    stepResults,
    getStepStatus,
    hasErrors,
    hasWarnings,
    getErrorSummary,
    isValidating,
    isSaving
  } = workflow;

  const isActive = isValidating || isSaving;

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="space-y-6 p-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Save Progress</h3>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Progress */}
        <div className="space-y-4">
          {Object.entries(stepConfig).map(([stepKey, config]) => {
            const step = parseInt(stepKey) as SaveStep;
            const status = getStepStatus(step);
            const result = stepResults.find(r => r.step === step);
            const StatusIcon = statusIcons[status];
            const StepIcon = config.icon;
            const isCurrentStep = currentStep === step;
            
            return (
              <div
                key={step}
                className={cn(
                  'flex items-start space-x-3 p-3 rounded-lg transition-colors',
                  isCurrentStep && 'bg-muted/50',
                  status === 'error' && 'bg-red-50',
                  status === 'warning' && 'bg-yellow-50'
                )}
              >
                {/* Step Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {status === 'processing' ? (
                    <StatusIcon className={cn('w-5 h-5 animate-spin', statusColors[status])} />
                  ) : StatusIcon ? (
                    <StatusIcon className={cn('w-5 h-5', statusColors[status])} />
                  ) : (
                    <StepIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      'font-medium',
                      status === 'pending' && 'text-muted-foreground'
                    )}>
                      {config.label}
                    </h4>
                    {isCurrentStep && status === 'processing' && (
                      <span className="text-xs text-muted-foreground animate-pulse">
                        In progress...
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {result?.message || config.description}
                  </p>

                  {/* Errors and Warnings */}
                  {result && (result.errors?.length || result.warnings?.length) ? (
                    <div className="mt-2 space-y-1">
                      {result.errors?.map((error, index) => (
                        <p key={index} className="text-sm text-red-600">
                          • {error}
                        </p>
                      ))}
                      {result.warnings?.map((warning, index) => (
                        <p key={index} className="text-sm text-yellow-600">
                          • {warning}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Summary */}
        {hasErrors && !isActive && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {getErrorSummary()}
            </AlertDescription>
          </Alert>
        )}

        {/* Warning Summary */}
        {hasWarnings && !hasErrors && !isActive && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Some warnings were found but you can proceed with saving.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        {!isActive && (hasErrors || onCancel) && (
          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            {hasErrors && onRetry && (
              <Button
                variant="default"
                size="sm"
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};