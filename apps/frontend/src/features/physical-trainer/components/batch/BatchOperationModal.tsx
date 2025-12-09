/**
 * BatchOperationModal Component
 * 
 * Modal interface for setting up and executing batch operations
 * with validation, progress tracking, and error handling.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Play, StopIcon, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  BatchOperationType,
  BatchOperation,
  BatchOptions,
  BatchValidationResult,
  BatchProgress,
  BatchSelection
} from '../../types/batch-operations.types';
import { WorkoutType } from '../../types';
import { useBatchOperations } from '../../hooks/useBatchOperations';
import { BatchProgressIndicator } from './BatchProgressIndicator';
import { BatchResultsSummary } from './BatchResultsSummary';
import { BulkSelectionControls } from './BulkSelectionControls';

interface BatchOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operationType: BatchOperationType;
  selectedWorkouts?: string[];
  onComplete?: (results: any) => void;
}

export const BatchOperationModal: React.FC<BatchOperationModalProps> = ({
  isOpen,
  onClose,
  operationType,
  selectedWorkouts = [],
  onComplete
}) => {
  const [operations, setOperations] = useState<BatchOperation[]>([]);
  const [options, setOptions] = useState<BatchOptions>({
    parallel: true,
    maxConcurrency: 5,
    stopOnError: false,
    rollbackOnError: true,
    validateBeforeExecute: true,
    medicalComplianceCheck: true,
    notifyOnComplete: true
  });
  const [validation, setValidation] = useState<BatchValidationResult | null>(null);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [results, setResults] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selection, setSelection] = useState<BatchSelection>({
    selectedIds: new Set(selectedWorkouts),
    selectAll: false
  });

  const { executeBatch, validateBatch, cancelBatch } = useBatchOperations();

  /**
   * Operation type configurations
   */
  const operationConfig = useMemo(() => {
    const configs = {
      [BatchOperationType.CREATE]: {
        title: 'Bulk Create Workouts',
        description: 'Create multiple workouts at once',
        icon: Play,
        color: 'bg-blue-600'
      },
      [BatchOperationType.UPDATE]: {
        title: 'Bulk Update Workouts',
        description: 'Update multiple workouts simultaneously',
        icon: CheckCircle,
        color: 'bg-yellow-600'
      },
      [BatchOperationType.DELETE]: {
        title: 'Bulk Delete Workouts',
        description: 'Delete multiple workouts',
        icon: XCircle,
        color: 'bg-red-600'
      },
      [BatchOperationType.ASSIGN]: {
        title: 'Bulk Assign Players',
        description: 'Assign players to multiple workouts',
        icon: CheckCircle,
        color: 'bg-green-600'
      },
      [BatchOperationType.SCHEDULE]: {
        title: 'Bulk Schedule Workouts',
        description: 'Schedule multiple workouts',
        icon: Play,
        color: 'bg-purple-600'
      },
      [BatchOperationType.DUPLICATE]: {
        title: 'Bulk Duplicate Workouts',
        description: 'Create copies of multiple workouts',
        icon: CheckCircle,
        color: 'bg-indigo-600'
      }
    };

    return configs[operationType] || configs[BatchOperationType.UPDATE];
  }, [operationType]);

  /**
   * Build operations based on type and selection
   */
  useEffect(() => {
    if (!isOpen) return;

    const buildOperations = () => {
      const selectedIds = Array.from(selection.selectedIds);
      
      switch (operationType) {
        case BatchOperationType.DELETE:
          return selectedIds.map((id, index) => ({
            id: `delete-${index}-${Date.now()}`,
            type: BatchOperationType.DELETE,
            data: {
              workoutId: id,
              permanent: false
            }
          }));

        case BatchOperationType.ASSIGN:
          return selectedIds.map((id, index) => ({
            id: `assign-${index}-${Date.now()}`,
            type: BatchOperationType.ASSIGN,
            data: {
              workoutId: id,
              assignments: [], // Will be filled by user input
              removeExisting: false,
              checkMedicalCompliance: true
            }
          }));

        case BatchOperationType.DUPLICATE:
          return selectedIds.map((id, index) => ({
            id: `duplicate-${index}-${Date.now()}`,
            type: BatchOperationType.DUPLICATE,
            data: {
              sourceWorkoutId: id,
              count: 1,
              includeAssignments: true,
              namePattern: '{original} - Copy {n}'
            }
          }));

        case BatchOperationType.SCHEDULE:
          return selectedIds.map((id, index) => ({
            id: `schedule-${index}-${Date.now()}`,
            type: BatchOperationType.SCHEDULE,
            data: {
              workoutId: id,
              startTime: new Date(),
              endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour default
              conflictResolution: 'ADJUST_TIME'
            }
          }));

        default:
          return [];
      }
    };

    setOperations(buildOperations());
  }, [operationType, selection, isOpen]);

  /**
   * Validate operations when they change
   */
  useEffect(() => {
    if (operations.length === 0) return;

    const validateOperations = async () => {
      try {
        const request = {
          operations,
          options,
          metadata: {
            requestId: `batch-${Date.now()}`,
            userId: 'current-user',
            timestamp: new Date(),
            source: 'modal'
          }
        };

        const validationResult = await validateBatch(request);
        setValidation(validationResult);
      } catch (error) {
        console.error('Validation failed:', error);
      }
    };

    const timeoutId = setTimeout(validateOperations, 300);
    return () => clearTimeout(timeoutId);
  }, [operations, options, validateBatch]);

  /**
   * Execute batch operation
   */
  const handleExecute = async () => {
    if (!validation?.valid || operations.length === 0) return;

    setIsExecuting(true);
    setProgress(null);
    setResults(null);

    try {
      const request = {
        operations,
        options: {
          ...options,
          progressCallback: setProgress
        },
        metadata: {
          requestId: `batch-${Date.now()}`,
          userId: 'current-user',
          timestamp: new Date(),
          source: 'modal',
          description: `${operationConfig.title} - ${operations.length} operations`
        }
      };

      const response = await executeBatch(request);
      setResults(response);
      
      if (onComplete) {
        onComplete(response);
      }

      toast.success(`Batch operation completed: ${response.summary.successful} successful, ${response.summary.failed} failed`);
    } catch (error) {
      toast.error(`Batch operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Cancel execution
   */
  const handleCancel = () => {
    if (progress) {
      cancelBatch(progress.requestId);
    }
    setIsExecuting(false);
  };

  /**
   * Close modal
   */
  const handleClose = () => {
    if (isExecuting) {
      handleCancel();
    }
    setProgress(null);
    setResults(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className={`${operationConfig.color} px-6 py-4 rounded-t-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <operationConfig.icon className="h-6 w-6 text-white" />
                <div>
                  <Dialog.Title className="text-lg font-semibold text-white">
                    {operationConfig.title}
                  </Dialog.Title>
                  <p className="text-sm text-white/80">
                    {operationConfig.description}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white"
                disabled={isExecuting}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Selection Controls */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Select Workouts
              </h3>
              <BulkSelectionControls
                selection={selection}
                onSelectionChange={setSelection}
                operationType={operationType}
              />
              
              {selection.selectedIds.size > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {selection.selectedIds.size} workout(s) selected
                </p>
              )}
            </div>

            {/* Options */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Operation Options
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.parallel}
                    onChange={(e) => setOptions(prev => ({ ...prev, parallel: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Parallel execution</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.stopOnError}
                    onChange={(e) => setOptions(prev => ({ ...prev, stopOnError: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Stop on error</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.rollbackOnError}
                    onChange={(e) => setOptions(prev => ({ ...prev, rollbackOnError: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Rollback on error</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.medicalComplianceCheck}
                    onChange={(e) => setOptions(prev => ({ ...prev, medicalComplianceCheck: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Medical compliance check</span>
                </label>
              </div>

              {options.parallel && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Max Concurrency
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={options.maxConcurrency}
                    onChange={(e) => setOptions(prev => ({ ...prev, maxConcurrency: parseInt(e.target.value) }))}
                    className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              )}
            </div>

            {/* Validation Results */}
            {validation && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Validation
                </h3>
                
                {validation.valid ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Ready to execute
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Estimated duration: {Math.round(validation.estimatedDuration / 1000)}s</p>
                          <p>API calls: {validation.resourceRequirements.estimatedApiCalls}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <XCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Validation failed
                        </h3>
                        <div className="mt-2">
                          {validation.errors.map((error, index) => (
                            <p key={index} className="text-sm text-red-700">
                              {error.message}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-yellow-800">Warnings:</h4>
                    {validation.warnings.map((warning, index) => (
                      <p key={index} className="text-sm text-yellow-700 mt-1">
                        {warning.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Progress */}
            {progress && (
              <div className="mb-6">
                <BatchProgressIndicator progress={progress} />
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="mb-6">
                <BatchResultsSummary results={results} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 rounded-b-lg flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isExecuting}
            >
              {results ? 'Close' : 'Cancel'}
            </button>
            
            {!results && (
              <>
                {isExecuting ? (
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                  >
                    <StopIcon className="h-4 w-4 mr-2 inline" />
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={handleExecute}
                    disabled={!validation?.valid || operations.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="h-4 w-4 mr-2 inline" />
                    Execute ({operations.length} operations)
                  </button>
                )}
              </>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};