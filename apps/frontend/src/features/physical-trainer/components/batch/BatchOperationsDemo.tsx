/**
 * BatchOperationsDemo Component
 * 
 * Demonstrates integration of batch operations with the Sessions tab.
 * Shows how to add bulk actions to existing workflow management.
 */

import React, { useState } from 'react';
import { EllipsisVerticalIcon, Copy, Trash2, UserPlusIcon, Calendar, Plus } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { 
  BatchOperationType,
  BatchSelection
} from '../../types/batch-operations.types';
import { 
  useBatchCreateWorkouts,
  useBatchDelete,
  useBatchDuplicate,
  useBatchUpdateAssignments,
  useBatchScheduleWorkouts
} from '../../hooks/useBatchOperations';
import { 
  BatchOperationModal,
  BulkSelectionControls
} from './index';

interface BatchOperationsDemoProps {
  selectedWorkouts?: string[];
  onSelectionChange?: (selection: string[]) => void;
}

export const BatchOperationsDemo: React.FC<BatchOperationsDemoProps> = ({
  selectedWorkouts = [],
  onSelectionChange
}) => {
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<BatchOperationType>(BatchOperationType.CREATE);
  const [selection, setSelection] = useState<BatchSelection>({
    selectedIds: new Set(selectedWorkouts),
    selectAll: false
  });

  // Batch operation hooks
  const batchCreateWorkouts = useBatchCreateWorkouts();
  const batchDelete = useBatchDelete();
  const batchDuplicate = useBatchDuplicate();
  const batchUpdateAssignments = useBatchUpdateAssignments();
  const batchScheduleWorkouts = useBatchScheduleWorkouts();

  /**
   * Handle batch operation initiation
   */
  const handleBatchOperation = (operationType: BatchOperationType) => {
    setCurrentOperation(operationType);
    setShowBatchModal(true);
  };

  /**
   * Handle quick batch operations without modal
   */
  const handleQuickBulkCreate = async () => {
    // Example: Create 5 similar strength workouts
    const workoutsToCreate = Array.from({ length: 5 }, (_, i) => ({
      workout: {
        name: `Upper Body Strength ${i + 1}`,
        type: 'STRENGTH' as const,
        duration: 60,
        difficulty: 'intermediate' as const,
        description: `Focused upper body strength training session ${i + 1}`
      },
      assignments: [], // Will be assigned later
      schedule: {
        startTime: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // Next 5 days
        endTime: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour duration
        conflictResolution: 'ADJUST_TIME' as const
      }
    }));

    try {
      const response = await batchCreateWorkouts(workoutsToCreate, {
        parallel: true,
        medicalComplianceCheck: true,
        maxConcurrency: 3,
        notifyOnComplete: true
      });

      console.log('Bulk create results:', response);
    } catch (error) {
      console.error('Bulk create failed:', error);
    }
  };

  const handleQuickBulkDuplicate = async () => {
    if (selection.selectedIds.size === 0) return;

    const duplicateData = Array.from(selection.selectedIds).map(workoutId => ({
      sourceWorkoutId: workoutId,
      count: 1,
      includeAssignments: true,
      namePattern: '{original} - Copy',
      modifications: {
        // Modify dates to be 1 week later
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }));

    try {
      const response = await batchDuplicate(duplicateData, {
        parallel: true,
        maxConcurrency: 2,
        notifyOnComplete: true
      });

      console.log('Bulk duplicate results:', response);
    } catch (error) {
      console.error('Bulk duplicate failed:', error);
    }
  };

  const handleQuickBulkDelete = async () => {
    if (selection.selectedIds.size === 0) return;

    const workoutIds = Array.from(selection.selectedIds);

    try {
      const response = await batchDelete(workoutIds, false, {
        parallel: true,
        rollbackOnError: true,
        stopOnError: false,
        maxConcurrency: 5,
        notifyOnComplete: true
      });

      console.log('Bulk delete results:', response);
      
      // Clear selection after successful delete
      setSelection({
        selectedIds: new Set(),
        selectAll: false
      });
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  /**
   * Handle batch completion
   */
  const handleBatchComplete = (results: any) => {
    console.log('Batch operation completed:', results);
    setShowBatchModal(false);
    
    // Refresh selection or trigger data reload
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  /**
   * Selection change handler
   */
  const handleSelectionChange = (newSelection: BatchSelection) => {
    setSelection(newSelection);
    if (onSelectionChange) {
      onSelectionChange(Array.from(newSelection.selectedIds));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Bulk Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Batch Operations Demo
        </h3>
        
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <button
            onClick={handleQuickBulkCreate}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Quick Create (5 workouts)
          </button>

          {selection.selectedIds.size > 0 && (
            <>
              <button
                onClick={handleQuickBulkDuplicate}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Copy className="h-4 w-4" />
                Duplicate ({selection.selectedIds.size})
              </button>

              <button
                onClick={handleQuickBulkDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selection.selectedIds.size})
              </button>
            </>
          )}

          {/* Batch Operations Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              <EllipsisVerticalIcon className="h-4 w-4" />
              More Actions
            </Menu.Button>

            <Menu.Items className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleBatchOperation(BatchOperationType.CREATE)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700`}
                    >
                      <Plus className="h-4 w-4" />
                      Bulk Create Workouts
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleBatchOperation(BatchOperationType.ASSIGN)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700`}
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      Bulk Assign Players
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleBatchOperation(BatchOperationType.SCHEDULE)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700`}
                    >
                      <Calendar className="h-4 w-4" />
                      Bulk Schedule
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleBatchOperation(BatchOperationType.DUPLICATE)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700`}
                    >
                      <Copy className="h-4 w-4" />
                      Bulk Duplicate
                    </button>
                  )}
                </Menu.Item>

                <hr className="my-1" />

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleBatchOperation(BatchOperationType.DELETE)}
                      className={`${
                        active ? 'bg-red-50' : ''
                      } flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Bulk Delete
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Workout Selection
        </h4>
        <BulkSelectionControls
          selection={selection}
          onSelectionChange={handleSelectionChange}
          operationType={currentOperation}
        />
      </div>

      {/* Statistics */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Selection Statistics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Selected:</span>
            <span className="ml-2 font-semibold text-blue-600">
              {selection.selectedIds.size}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Select All:</span>
            <span className="ml-2 font-semibold">
              {selection.selectAll ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Filters Active:</span>
            <span className="ml-2 font-semibold">
              {selection.filters && Object.keys(selection.filters).length > 0 ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Operation:</span>
            <span className="ml-2 font-semibold text-purple-600">
              {currentOperation.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-blue-900 mb-3">
          How to Use Batch Operations
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Quick Actions:</strong> Use the blue "Quick Create" button to create 5 sample workouts instantly.</p>
          <p><strong>Selection:</strong> Select workouts using the checkboxes in the selection area below.</p>
          <p><strong>Bulk Operations:</strong> Once workouts are selected, use "Duplicate" or "Delete" buttons for quick actions.</p>
          <p><strong>Advanced Operations:</strong> Use the "More Actions" menu for complex batch operations with full configuration.</p>
          <p><strong>Progress Tracking:</strong> All operations show real-time progress and can be cancelled if needed.</p>
        </div>
      </div>

      {/* Batch Operation Modal */}
      <BatchOperationModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        operationType={currentOperation}
        selectedWorkouts={Array.from(selection.selectedIds)}
        onComplete={handleBatchComplete}
      />
    </div>
  );
};