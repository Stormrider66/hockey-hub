/**
 * BulkSelectionControls Component
 * 
 * Advanced selection interface for batch operations with filtering,
 * search, and bulk selection capabilities.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Check, X, Calendar, Users, TagIcon } from 'lucide-react';
import { Listbox } from '@headlessui/react';
import {
  BatchSelection,
  SelectionFilters,
  BatchOperationType
} from '../../types/batch-operations.types';
import { WorkoutType } from '../../types';

interface BulkSelectionControlsProps {
  selection: BatchSelection;
  onSelectionChange: (selection: BatchSelection) => void;
  operationType: BatchOperationType;
  availableWorkouts?: any[];
  isLoading?: boolean;
}

export const BulkSelectionControls: React.FC<BulkSelectionControlsProps> = ({
  selection,
  onSelectionChange,
  operationType,
  availableWorkouts = [],
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SelectionFilters>({});

  // Mock data for demonstration - replace with actual data
  const mockWorkouts = [
    {
      id: '1',
      name: 'Upper Body Strength',
      type: WorkoutType.STRENGTH,
      assignedPlayers: ['player1', 'player2'],
      assignedTeams: ['team1'],
      tags: ['strength', 'upper-body'],
      status: 'active',
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Cardio HIIT',
      type: WorkoutType.CONDITIONING,
      assignedPlayers: ['player2', 'player3'],
      assignedTeams: ['team1', 'team2'],
      tags: ['cardio', 'hiit'],
      status: 'scheduled',
      createdAt: new Date('2024-01-20')
    },
    {
      id: '3',
      name: 'Agility Drills',
      type: WorkoutType.AGILITY,
      assignedPlayers: ['player1'],
      assignedTeams: ['team2'],
      tags: ['agility', 'speed'],
      status: 'completed',
      createdAt: new Date('2024-01-10')
    },
    {
      id: '4',
      name: 'Circuit Training',
      type: WorkoutType.HYBRID,
      assignedPlayers: ['player3', 'player4'],
      assignedTeams: ['team1'],
      tags: ['circuit', 'full-body'],
      status: 'active',
      createdAt: new Date('2024-01-25')
    }
  ];

  const workouts = availableWorkouts.length > 0 ? availableWorkouts : mockWorkouts;

  /**
   * Filter workouts based on search and filters
   */
  const filteredWorkouts = useMemo(() => {
    let filtered = workouts;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(workout =>
        workout.name.toLowerCase().includes(term) ||
        workout.tags?.some((tag: string) => tag.toLowerCase().includes(term))
      );
    }

    // Type filter
    if (filters.workoutTypes && filters.workoutTypes.length > 0) {
      filtered = filtered.filter(workout =>
        filters.workoutTypes!.includes(workout.type)
      );
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(workout => {
        const workoutDate = new Date(workout.createdAt);
        return workoutDate >= filters.dateRange!.start && workoutDate <= filters.dateRange!.end;
      });
    }

    // Assigned players filter
    if (filters.assignedPlayers && filters.assignedPlayers.length > 0) {
      filtered = filtered.filter(workout =>
        workout.assignedPlayers?.some((playerId: string) =>
          filters.assignedPlayers!.includes(playerId)
        )
      );
    }

    // Assigned teams filter
    if (filters.assignedTeams && filters.assignedTeams.length > 0) {
      filtered = filtered.filter(workout =>
        workout.assignedTeams?.some((teamId: string) =>
          filters.assignedTeams!.includes(teamId)
        )
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(workout =>
        workout.tags?.some((tag: string) =>
          filters.tags!.includes(tag)
        )
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(workout =>
        filters.status!.includes(workout.status)
      );
    }

    return filtered;
  }, [workouts, searchTerm, filters]);

  /**
   * Handle select all toggle
   */
  const handleSelectAll = () => {
    if (selection.selectAll || selection.selectedIds.size === filteredWorkouts.length) {
      // Deselect all
      onSelectionChange({
        selectedIds: new Set(),
        selectAll: false,
        filters
      });
    } else {
      // Select all filtered
      const allIds = new Set(filteredWorkouts.map(w => w.id));
      onSelectionChange({
        selectedIds: allIds,
        selectAll: true,
        filters
      });
    }
  };

  /**
   * Handle individual workout selection
   */
  const handleWorkoutToggle = (workoutId: string) => {
    const newSelection = new Set(selection.selectedIds);
    
    if (newSelection.has(workoutId)) {
      newSelection.delete(workoutId);
    } else {
      newSelection.add(workoutId);
    }

    onSelectionChange({
      selectedIds: newSelection,
      selectAll: newSelection.size === filteredWorkouts.length,
      filters
    });
  };

  /**
   * Apply filters
   */
  const handleFiltersChange = (newFilters: SelectionFilters) => {
    setFilters(newFilters);
    onSelectionChange({
      ...selection,
      filters: newFilters
    });
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    onSelectionChange({
      selectedIds: new Set(),
      selectAll: false,
      filters: {}
    });
  };

  /**
   * Get operation-specific recommendations
   */
  const getRecommendations = () => {
    switch (operationType) {
      case BatchOperationType.DELETE:
        return 'Consider selecting completed or archived workouts for deletion.';
      case BatchOperationType.DUPLICATE:
        return 'Select successful templates or frequently used workouts for duplication.';
      case BatchOperationType.ASSIGN:
        return 'Choose workouts that need player assignments or updates.';
      default:
        return null;
    }
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-md flex items-center gap-2 ${
            showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>

        {/* Clear All */}
        <button
          onClick={clearFilters}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">Advanced Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Workout Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workout Types
              </label>
              <div className="space-y-2">
                {Object.values(WorkoutType).map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.workoutTypes?.includes(type) || false}
                      onChange={(e) => {
                        const types = filters.workoutTypes || [];
                        const newTypes = e.target.checked
                          ? [...types, type]
                          : types.filter(t => t !== type);
                        handleFiltersChange({ ...filters, workoutTypes: newTypes });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {type.toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {['active', 'scheduled', 'completed', 'archived'].map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(status) || false}
                      onChange={(e) => {
                        const statuses = filters.status || [];
                        const newStatuses = e.target.checked
                          ? [...statuses, status]
                          : statuses.filter(s => s !== status);
                        handleFiltersChange({ ...filters, status: newStatuses });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created Date
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange?.start.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const start = new Date(e.target.value);
                    handleFiltersChange({
                      ...filters,
                      dateRange: {
                        start,
                        end: filters.dateRange?.end || new Date()
                      }
                    });
                  }}
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={filters.dateRange?.end.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const end = new Date(e.target.value);
                    handleFiltersChange({
                      ...filters,
                      dateRange: {
                        start: filters.dateRange?.start || new Date(0),
                        end
                      }
                    });
                  }}
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                  placeholder="End date"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> {recommendations}
          </p>
        </div>
      )}

      {/* Selection Summary and Bulk Actions */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selection.selectAll || selection.selectedIds.size === filteredWorkouts.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Select All ({filteredWorkouts.length})
            </span>
          </label>
          
          <div className="text-sm text-gray-600">
            {selection.selectedIds.size} of {filteredWorkouts.length} selected
          </div>
        </div>

        {selection.selectedIds.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => onSelectionChange({ selectedIds: new Set(), selectAll: false, filters })}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Workout List */}
      <div className="border rounded-lg">
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading workouts...
            </div>
          ) : filteredWorkouts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No workouts found matching your criteria
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${
                    selection.selectedIds.has(workout.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleWorkoutToggle(workout.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selection.selectedIds.has(workout.id)}
                      onChange={() => handleWorkoutToggle(workout.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{workout.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          workout.type === WorkoutType.STRENGTH ? 'bg-blue-100 text-blue-800' :
                          workout.type === WorkoutType.CONDITIONING ? 'bg-red-100 text-red-800' :
                          workout.type === WorkoutType.HYBRID ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {workout.type.toLowerCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          workout.status === 'active' ? 'bg-green-100 text-green-800' :
                          workout.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          workout.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {workout.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        {workout.assignedPlayers && workout.assignedPlayers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{workout.assignedPlayers.length} players</span>
                          </div>
                        )}
                        
                        {workout.tags && workout.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <TagIcon className="h-4 w-4" />
                            <span>{workout.tags.join(', ')}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(workout.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};