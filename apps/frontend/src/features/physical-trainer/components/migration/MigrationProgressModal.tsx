import React, { useEffect, useState } from 'react';
import { X, Play, Pause, Square, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react';
import { useMigration, MigrationProgressSummary } from '../../hooks/useMigration';
import { BatchMigrationOptions } from '../../utils/dataMigration';

interface MigrationProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  workouts: any[];
  options: BatchMigrationOptions;
  onComplete: (results: any) => void;
}

export function MigrationProgressModal({
  isOpen,
  onClose,
  workouts,
  options,
  onComplete
}: MigrationProgressModalProps) {
  const { 
    state, 
    startMigration, 
    pauseMigration, 
    resumeMigration, 
    cancelMigration,
    getProgressSummary,
    exportResults
  } = useMigration();
  
  const [hasStarted, setHasStarted] = useState(false);
  const progressSummary = getProgressSummary();

  // Auto-start migration when modal opens
  useEffect(() => {
    if (isOpen && !hasStarted && !state.isRunning) {
      setHasStarted(true);
      startMigration(workouts, options);
    }
  }, [isOpen, hasStarted, state.isRunning, startMigration, workouts, options]);

  // Handle completion
  useEffect(() => {
    if (state.endTime && !state.isRunning) {
      const results = exportResults();
      onComplete(results);
    }
  }, [state.endTime, state.isRunning, exportResults, onComplete]);

  const handleClose = () => {
    if (state.isRunning) {
      const confirmCancel = window.confirm(
        'Migration is still running. Are you sure you want to cancel?'
      );
      if (confirmCancel) {
        cancelMigration();
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handlePause = () => {
    if (state.isPaused) {
      resumeMigration();
    } else {
      pauseMigration();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Data Migration Progress
              </h2>
              <p className="text-sm text-gray-500">
                Converting {workouts.length} workouts to unified format
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Overall Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Overall Progress</h3>
              <div className="flex items-center space-x-2">
                {state.isRunning && (
                  <button
                    onClick={handlePause}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
                  >
                    {state.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    <span>{state.isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                )}
                {state.isRunning && (
                  <button
                    onClick={cancelMigration}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                  >
                    <Square className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {progressSummary && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {progressSummary.processedCount} of {progressSummary.processedCount + progressSummary.remainingCount} processed
                  </span>
                  <span>{progressSummary.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 relative overflow-hidden"
                    style={{ width: `${progressSummary.percentage}%` }}
                  >
                    {state.isPaused && (
                      <div className="absolute inset-0 bg-yellow-400 opacity-30 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Current Operation */}
            {state.currentOperation && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span>{state.currentOperation}</span>
              </div>
            )}
          </div>

          {/* Statistics */}
          {progressSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Success</span>
                </div>
                <div className="mt-1">
                  <div className="text-2xl font-bold text-green-900">
                    {progressSummary.successRate}%
                  </div>
                  <div className="text-xs text-green-600">
                    {state.progress?.successful || 0} items
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Errors</span>
                </div>
                <div className="mt-1">
                  <div className="text-2xl font-bold text-red-900">
                    {progressSummary.errorRate}%
                  </div>
                  <div className="text-xs text-red-600">
                    {state.progress?.failed || 0} items
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Warnings</span>
                </div>
                <div className="mt-1">
                  <div className="text-2xl font-bold text-yellow-900">
                    {state.progress?.warnings || 0}
                  </div>
                  <div className="text-xs text-yellow-600">
                    Total warnings
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">ETA</span>
                </div>
                <div className="mt-1">
                  <div className="text-lg font-bold text-blue-900">
                    {progressSummary.estimatedTimeRemaining}
                  </div>
                  <div className="text-xs text-blue-600">
                    Remaining
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Batch Progress */}
          {state.progress && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Batch Progress</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Batch {state.progress.currentBatch}</span>
                  <span>
                    {Math.round((state.progress.processed / options.batchSize) * 100)}% of current batch
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, (state.progress.processed % options.batchSize) / options.batchSize * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h4 className="font-medium text-red-800">Migration Error</h4>
              </div>
              <p className="mt-2 text-sm text-red-700">{state.error}</p>
            </div>
          )}

          {/* Warnings */}
          {state.warnings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Warnings</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {state.warnings.slice(0, 10).map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-800">
                      <span className="font-medium">{warning.field}:</span> {warning.message}
                      {warning.suggestion && (
                        <div className="text-yellow-600 ml-2">
                          Suggestion: {warning.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                  {state.warnings.length > 10 && (
                    <div className="text-sm text-yellow-600">
                      ... and {state.warnings.length - 10} more warnings
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {progressSummary && progressSummary.averageTimePerItem > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Performance</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Average time per item:</span>
                    <div className="font-medium">
                      {Math.round(progressSummary.averageTimePerItem)}ms
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Current batch:</span>
                    <div className="font-medium">
                      {state.progress?.currentBatch || 1}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {state.startTime && (
                <span>
                  Started at {state.startTime.toLocaleTimeString()}
                  {state.endTime && (
                    <span className="ml-2">
                      • Completed at {state.endTime.toLocaleTimeString()}
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              {!state.isRunning && state.endTime && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MigrationProgressModal;