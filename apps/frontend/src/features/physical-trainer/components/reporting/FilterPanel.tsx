import React, { useState, useCallback } from 'react';
import { 
  Calendar,
  Users,
  Plus,
  X,
  Filter,
  Settings
} from '@/components/icons';
import { ReportFilters } from '../../types/report.types';

interface FilterPanelProps {
  filters: ReportFilters;
  onUpdateFilters: (filters: ReportFilters) => void;
  dataSources?: Array<{
    name: string;
    description: string;
    fields: Array<{
      name: string;
      type: string;
      label: string;
    }>;
  }>;
  className?: string;
}

interface CustomFilter {
  id: string;
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
  label?: string;
}

const operatorLabels = {
  eq: 'Equals',
  ne: 'Not Equals',
  gt: 'Greater Than',
  gte: 'Greater Than or Equal',
  lt: 'Less Than',
  lte: 'Less Than or Equal',
  in: 'In List',
  contains: 'Contains'
};

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onUpdateFilters,
  dataSources = [],
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableTeams] = useState([
    { id: 'team1', name: 'Senior Team A' },
    { id: 'team2', name: 'Senior Team B' },
    { id: 'team3', name: 'Junior Team A' },
    { id: 'team4', name: 'Junior Team B' },
    { id: 'team5', name: 'Youth Team' }
  ]);

  const [availablePlayers] = useState([
    { id: 'player1', name: 'Connor McDavid', team: 'Senior Team A' },
    { id: 'player2', name: 'Sidney Crosby', team: 'Senior Team A' },
    { id: 'player3', name: 'Nathan MacKinnon', team: 'Senior Team B' },
    { id: 'player4', name: 'Leon Draisaitl', team: 'Senior Team B' },
    { id: 'player5', name: 'Alexander Ovechkin', team: 'Junior Team A' }
  ]);

  const [availableWorkoutTypes] = useState([
    'strength',
    'conditioning',
    'hybrid',
    'agility',
    'recovery',
    'skill_development'
  ]);

  const handleDateRangeChange = useCallback((field: 'start' | 'end', value: string) => {
    const newDateRange = {
      start: filters.dateRange?.start || new Date(),
      end: filters.dateRange?.end || new Date(),
      [field]: new Date(value)
    };

    onUpdateFilters({
      ...filters,
      dateRange: newDateRange
    });
  }, [filters, onUpdateFilters]);

  const handleTeamChange = useCallback((teamIds: string[]) => {
    onUpdateFilters({
      ...filters,
      teams: teamIds
    });
  }, [filters, onUpdateFilters]);

  const handlePlayerChange = useCallback((playerIds: string[]) => {
    onUpdateFilters({
      ...filters,
      players: playerIds
    });
  }, [filters, onUpdateFilters]);

  const handleWorkoutTypeChange = useCallback((workoutTypes: string[]) => {
    onUpdateFilters({
      ...filters,
      workoutTypes
    });
  }, [filters, onUpdateFilters]);

  const handleAddCustomFilter = useCallback(() => {
    const newFilter: CustomFilter = {
      id: `filter_${Date.now()}`,
      field: '',
      operator: 'eq',
      value: ''
    };

    const customFilters = filters.customFilters || [];
    onUpdateFilters({
      ...filters,
      customFilters: [...customFilters, newFilter]
    });
  }, [filters, onUpdateFilters]);

  const handleUpdateCustomFilter = useCallback((filterId: string, updates: Partial<CustomFilter>) => {
    const customFilters = (filters.customFilters || []).map(filter =>
      filter.field === filterId || filter.id === filterId ? { ...filter, ...updates } : filter
    );

    onUpdateFilters({
      ...filters,
      customFilters
    });
  }, [filters, onUpdateFilters]);

  const handleRemoveCustomFilter = useCallback((filterId: string) => {
    const customFilters = (filters.customFilters || []).filter(filter => 
      filter.field !== filterId && filter.id !== filterId
    );

    onUpdateFilters({
      ...filters,
      customFilters
    });
  }, [filters, onUpdateFilters]);

  const getAvailableFields = useCallback(() => {
    const fields: Array<{ name: string; type: string; label: string; source: string }> = [];
    
    for (const dataSource of dataSources) {
      for (const field of dataSource.fields) {
        fields.push({
          ...field,
          source: dataSource.name
        });
      }
    }

    return fields;
  }, [dataSources]);

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className={`filter-panel p-4 space-y-6 ${className}`}>
      {/* Date Range */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
          <Calendar className="w-4 h-4 mr-2" />
          Date Range
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={formatDateForInput(filters.dateRange?.start)}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={formatDateForInput(filters.dateRange?.end)}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Team Selection */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
          <Users className="w-4 h-4 mr-2" />
          Teams
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {availableTeams.map((team) => (
            <label key={team.id} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.teams?.includes(team.id) || false}
                onChange={(e) => {
                  const currentTeams = filters.teams || [];
                  if (e.target.checked) {
                    handleTeamChange([...currentTeams, team.id]);
                  } else {
                    handleTeamChange(currentTeams.filter(id => id !== team.id));
                  }
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{team.name}</span>
            </label>
          ))}
        </div>
        {filters.teams && filters.teams.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {filters.teams.length} team{filters.teams.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Player Selection */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
          <Users className="w-4 h-4 mr-2" />
          Players
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {availablePlayers.map((player) => (
            <label key={player.id} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.players?.includes(player.id) || false}
                onChange={(e) => {
                  const currentPlayers = filters.players || [];
                  if (e.target.checked) {
                    handlePlayerChange([...currentPlayers, player.id]);
                  } else {
                    handlePlayerChange(currentPlayers.filter(id => id !== player.id));
                  }
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div className="ml-2">
                <span className="text-sm text-gray-700">{player.name}</span>
                <span className="text-xs text-gray-500 block">{player.team}</span>
              </div>
            </label>
          ))}
        </div>
        {filters.players && filters.players.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {filters.players.length} player{filters.players.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Workout Types */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
          <Settings className="w-4 h-4 mr-2" />
          Workout Types
        </label>
        <div className="space-y-2">
          {availableWorkoutTypes.map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.workoutTypes?.includes(type) || false}
                onChange={(e) => {
                  const currentTypes = filters.workoutTypes || [];
                  if (e.target.checked) {
                    handleWorkoutTypeChange([...currentTypes, type]);
                  } else {
                    handleWorkoutTypeChange(currentTypes.filter(t => t !== type));
                  }
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {type.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 focus:outline-none"
        >
          <Filter className="w-4 h-4 mr-2" />
          Advanced Filters
          <span className="ml-auto">
            {showAdvanced ? '−' : '+'}
          </span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Custom Filters</h4>
            <button
              onClick={handleAddCustomFilter}
              className="flex items-center px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700 focus:outline-none"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Filter
            </button>
          </div>

          {filters.customFilters && filters.customFilters.length > 0 ? (
            <div className="space-y-3">
              {filters.customFilters.map((filter, index) => (
                <CustomFilterRow
                  key={filter.id || index}
                  filter={filter}
                  availableFields={getAvailableFields()}
                  onUpdate={(updates) => handleUpdateCustomFilter(filter.id || filter.field, updates)}
                  onRemove={() => handleRemoveCustomFilter(filter.id || filter.field)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No custom filters added
            </div>
          )}

          {/* Categories Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {['Performance', 'Medical', 'Training', 'Analytics', 'Reports'].map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    const currentCategories = filters.categories || [];
                    const newCategories = currentCategories.includes(category)
                      ? currentCategories.filter(c => c !== category)
                      : [...currentCategories, category];
                    onUpdateFilters({ ...filters, categories: newCategories });
                  }}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    filters.categories?.includes(category)
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {(filters.dateRange || filters.teams?.length || filters.players?.length || 
        filters.workoutTypes?.length || filters.customFilters?.length) && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {filters.dateRange && (
              <div>Date: {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}</div>
            )}
            {filters.teams && filters.teams.length > 0 && (
              <div>Teams: {filters.teams.length} selected</div>
            )}
            {filters.players && filters.players.length > 0 && (
              <div>Players: {filters.players.length} selected</div>
            )}
            {filters.workoutTypes && filters.workoutTypes.length > 0 && (
              <div>Workout Types: {filters.workoutTypes.length} selected</div>
            )}
            {filters.customFilters && filters.customFilters.length > 0 && (
              <div>Custom Filters: {filters.customFilters.length} active</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Filter Row Component
interface CustomFilterRowProps {
  filter: CustomFilter;
  availableFields: Array<{ name: string; type: string; label: string; source: string }>;
  onUpdate: (updates: Partial<CustomFilter>) => void;
  onRemove: () => void;
}

const CustomFilterRow: React.FC<CustomFilterRowProps> = ({
  filter,
  availableFields,
  onUpdate,
  onRemove
}) => {
  const selectedField = availableFields.find(f => f.name === filter.field);
  const fieldType = selectedField?.type || 'string';

  const renderValueInput = () => {
    switch (fieldType) {
      case 'number':
        return (
          <input
            type="number"
            value={filter.value || ''}
            onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Value"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={filter.value || ''}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        );
      case 'boolean':
        return (
          <select
            value={filter.value || ''}
            onChange={(e) => onUpdate({ value: e.target.value === 'true' })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={filter.value || ''}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Value"
          />
        );
    }
  };

  const getOperatorOptions = () => {
    switch (fieldType) {
      case 'number':
      case 'date':
        return ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in'];
      case 'string':
        return ['eq', 'ne', 'contains', 'in'];
      case 'boolean':
        return ['eq', 'ne'];
      default:
        return ['eq', 'ne', 'contains'];
    }
  };

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
      {/* Field Selection */}
      <select
        value={filter.field}
        onChange={(e) => onUpdate({ field: e.target.value })}
        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">Select field...</option>
        {availableFields.map((field) => (
          <option key={`${field.source}.${field.name}`} value={field.name}>
            {field.label} ({field.source})
          </option>
        ))}
      </select>

      {/* Operator Selection */}
      <select
        value={filter.operator}
        onChange={(e) => onUpdate({ operator: e.target.value as any })}
        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
        disabled={!filter.field}
      >
        {getOperatorOptions().map((op) => (
          <option key={op} value={op}>
            {operatorLabels[op as keyof typeof operatorLabels]}
          </option>
        ))}
      </select>

      {/* Value Input */}
      <div className="flex-1">
        {renderValueInput()}
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-600 focus:outline-none"
        title="Remove filter"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FilterPanel;