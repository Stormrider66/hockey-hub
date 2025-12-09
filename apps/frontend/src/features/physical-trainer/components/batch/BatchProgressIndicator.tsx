/**
 * BatchProgressIndicator Component
 * 
 * Visual progress indicator for batch operations with detailed metrics,
 * cancellation support, and real-time updates.
 */

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, StopIcon } from 'lucide-react';
import { BatchProgress } from '../../types/batch-operations.types';

interface BatchProgressIndicatorProps {
  progress: BatchProgress;
  onCancel?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

export const BatchProgressIndicator: React.FC<BatchProgressIndicatorProps> = ({
  progress,
  onCancel,
  showDetails = true,
  compact = false
}) => {
  const formatDuration = (milliseconds?: number): string => {
    if (!milliseconds) return '--';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (failed: number, completed: number, total: number): string => {
    if (failed > 0) return 'text-red-600';
    if (completed === total) return 'text-green-600';
    return 'text-blue-600';
  };

  const getProgressBarColor = (failed: number): string => {
    if (failed > 0) return 'bg-red-500';
    return 'bg-blue-500';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        {/* Progress Bar */}
        <div className="flex-1">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Processing...</span>
            <span>{progress.percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${getProgressBarColor(progress.failed)} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Cancel Button */}
        {progress.canCancel && onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Cancel operation"
          >
            <StopIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Batch Operation Progress
        </h3>
        {progress.canCancel && onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            <StopIcon className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>

      {/* Progress Overview */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span className={getStatusColor(progress.failed, progress.completed, progress.total)}>
            {progress.completed + progress.failed} of {progress.total} completed
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="flex h-3 rounded-full overflow-hidden">
            {/* Completed (Success) */}
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
            {/* Failed */}
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${(progress.failed / progress.total) * 100}%` }}
            />
            {/* In Progress */}
            <div
              className="bg-blue-500 animate-pulse transition-all duration-300"
              style={{ width: `${(progress.inProgress / progress.total) * 100}%` }}
            />
            {/* Remaining */}
            <div
              className="bg-gray-200"
              style={{ 
                width: `${((progress.total - progress.completed - progress.failed - progress.inProgress) / progress.total) * 100}%` 
              }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span className="font-medium">{progress.percentComplete}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Completed */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-900">Completed</p>
                <p className="text-2xl font-bold text-green-600">{progress.completed}</p>
              </div>
            </div>
          </div>

          {/* Failed */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-red-900">Failed</p>
                <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="h-5 w-5 mr-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{progress.inProgress}</p>
              </div>
            </div>
          </div>

          {/* Remaining */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">Remaining</p>
                <p className="text-2xl font-bold text-gray-600">
                  {progress.total - progress.completed - progress.failed - progress.inProgress}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Information */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center gap-4">
          {progress.estimatedTimeRemaining && (
            <span>
              <span className="font-medium">ETA:</span> {formatDuration(progress.estimatedTimeRemaining)}
            </span>
          )}
        </div>
        
        {progress.currentOperation && (
          <div className="text-right">
            <p className="font-medium text-gray-900">Current Operation:</p>
            <p className="text-gray-600 truncate max-w-md" title={progress.currentOperation}>
              {progress.currentOperation}
            </p>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {progress.failed > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                {progress.failed} operation(s) failed
              </h4>
              <p className="text-sm text-red-700 mt-1">
                Check the results summary for detailed error information.
              </p>
            </div>
          </div>
        </div>
      )}

      {progress.completed === progress.total && progress.failed === 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                All operations completed successfully!
              </h4>
              <p className="text-sm text-green-700 mt-1">
                {progress.total} operation(s) processed without errors.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};