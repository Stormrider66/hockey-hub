'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DatePickerWithRange } from '@/components/ui/date-picker';
import { 
  Filter,
  X,
  Calendar,
  Users,
  User,
  Activity,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';

import { 
  AnalyticsDashboardFilters,
  PlayerPerformanceData,
  TeamPerformanceData,
  WorkoutType,
  DateRange
} from '../../types/performance-analytics.types';

interface PerformanceFiltersPanelProps {
  filters: AnalyticsDashboardFilters;
  onChange: (filters: Partial<AnalyticsDashboardFilters>) => void;
  onClose: () => void;
  teams: TeamPerformanceData[];
  players: PlayerPerformanceData[];
}

export function PerformanceFiltersPanel({
  filters,
  onChange,
  onClose,
  teams,
  players
}: PerformanceFiltersPanelProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Available filter options
  const workoutTypes: { key: WorkoutType; label: string; color: string }[] = [
    { key: 'strength', label: 'Strength', color: '#3b82f6' },
    { key: 'conditioning', label: 'Conditioning', color: '#ef4444' },
    { key: 'hybrid', label: 'Hybrid', color: '#8b5cf6' },
    { key: 'agility', label: 'Agility', color: '#f59e0b' }
  ];

  const availableMetrics = [
    { key: 'strength', label: 'Strength Metrics', category: 'strength' },
    { key: 'conditioning', label: 'Conditioning Metrics', category: 'conditioning' },
    { key: 'agility', label: 'Agility Metrics', category: 'agility' },
    { key: 'recovery', label: 'Recovery Metrics', category: 'recovery' },
    { key: 'attendance', label: 'Attendance Metrics', category: 'attendance' },
    { key: 'load', label: 'Load Metrics', category: 'load' }
  ];

  const datePresets = [
    { key: 'week' as const, label: 'Last Week', days: 7 },
    { key: 'month' as const, label: 'Last Month', days: 30 },
    { key: 'quarter' as const, label: 'Last Quarter', days: 90 },
    { key: 'year' as const, label: 'Last Year', days: 365 }
  ];

  const groupByOptions = [
    { key: 'player' as const, label: 'Player', icon: User },
    { key: 'team' as const, label: 'Team', icon: Users },
    { key: 'position' as const, label: 'Position', icon: Target },
    { key: 'workout-type' as const, label: 'Workout Type', icon: Activity }
  ];

  const aggregationOptions = [
    { key: 'average' as const, label: 'Average' },
    { key: 'median' as const, label: 'Median' },
    { key: 'total' as const, label: 'Total' },
    { key: 'max' as const, label: 'Maximum' },
    { key: 'min' as const, label: 'Minimum' }
  ];

  // Handle date preset selection
  const handleDatePreset = useCallback((preset: DateRange['preset']) => {
    const to = new Date();
    const from = new Date();
    const daysToSubtract = datePresets.find(p => p.key === preset)?.days || 30;
    from.setDate(to.getDate() - daysToSubtract);

    onChange({
      dateRange: {
        from,
        to,
        preset
      }
    });
  }, [onChange]);

  // Handle team selection
  const handleTeamToggle = useCallback((teamId: string) => {
    const newTeams = filters.teams.includes(teamId)
      ? filters.teams.filter(id => id !== teamId)
      : [...filters.teams, teamId];
    
    onChange({ teams: newTeams });
  }, [filters.teams, onChange]);

  // Handle player selection
  const handlePlayerToggle = useCallback((playerId: string) => {
    const newPlayers = filters.players.includes(playerId)
      ? filters.players.filter(id => id !== playerId)
      : [...filters.players, playerId];
    
    onChange({ players: newPlayers });
  }, [filters.players, onChange]);

  // Handle workout type selection
  const handleWorkoutTypeToggle = useCallback((workoutType: WorkoutType) => {
    const newWorkoutTypes = filters.workoutTypes.includes(workoutType)
      ? filters.workoutTypes.filter(type => type !== workoutType)
      : [...filters.workoutTypes, workoutType];
    
    onChange({ workoutTypes: newWorkoutTypes });
  }, [filters.workoutTypes, onChange]);

  // Handle metric selection
  const handleMetricToggle = useCallback((metric: string) => {
    const newMetrics = filters.metrics.includes(metric)
      ? filters.metrics.filter(m => m !== metric)
      : [...filters.metrics, metric];
    
    onChange({ metrics: newMetrics });
  }, [filters.metrics, onChange]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    onChange({
      teams: [],
      players: [],
      workoutTypes: [],
      metrics: ['strength', 'conditioning', 'agility', 'recovery', 'attendance', 'load'],
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
        preset: 'month'
      }
    });
  }, [onChange]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    onChange({
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
        preset: 'month'
      },
      teams: [],
      players: [],
      workoutTypes: [],
      metrics: ['strength', 'conditioning', 'agility', 'recovery', 'attendance', 'load'],
      groupBy: 'player',
      aggregation: 'average'
    });
  }, [onChange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('physicalTrainer:analytics.filters.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common:actions.clear')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              {t('common:actions.reset')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('physicalTrainer:analytics.filters.dateRange')}
          </h3>
          <div className="space-y-3">
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              {datePresets.map(preset => (
                <Button
                  key={preset.key}
                  variant={filters.dateRange.preset === preset.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDatePreset(preset.key)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            
            {/* Custom Date Picker */}
            <div className="pt-2">
              <div className="text-xs text-gray-500">
                Current range: {filters.dateRange.from.toLocaleDateString()} - {filters.dateRange.to.toLocaleDateString()}
              </div>
              {/* Note: DatePickerWithRange component can be added when needed */}
            </div>
          </div>
        </div>

        {/* Teams */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('physicalTrainer:analytics.filters.teams')} 
            {filters.teams.length > 0 && (
              <Badge variant="secondary">{filters.teams.length}</Badge>
            )}
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {teams.map(team => (
              <div key={team.teamId} className="flex items-center space-x-2">
                <Checkbox
                  id={`team-${team.teamId}`}
                  checked={filters.teams.includes(team.teamId)}
                  onCheckedChange={() => handleTeamToggle(team.teamId)}
                />
                <label 
                  htmlFor={`team-${team.teamId}`}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {team.teamName}
                  <span className="text-muted-foreground ml-2">
                    ({team.playerCount} players)
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Players */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('physicalTrainer:analytics.filters.players')}
            {filters.players.length > 0 && (
              <Badge variant="secondary">{filters.players.length}</Badge>
            )}
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {players.slice(0, 20).map(player => (
              <div key={player.playerId} className="flex items-center space-x-2">
                <Checkbox
                  id={`player-${player.playerId}`}
                  checked={filters.players.includes(player.playerId)}
                  onCheckedChange={() => handlePlayerToggle(player.playerId)}
                />
                <label 
                  htmlFor={`player-${player.playerId}`}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {player.playerName}
                  <span className="text-muted-foreground ml-2">
                    ({player.position})
                  </span>
                </label>
              </div>
            ))}
            {players.length > 20 && (
              <p className="text-xs text-muted-foreground">
                Showing first 20 players. Use search to find specific players.
              </p>
            )}
          </div>
        </div>

        {/* Workout Types */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('physicalTrainer:analytics.filters.workoutTypes')}
            {filters.workoutTypes.length > 0 && (
              <Badge variant="secondary">{filters.workoutTypes.length}</Badge>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {workoutTypes.map(workoutType => (
              <Button
                key={workoutType.key}
                variant={filters.workoutTypes.includes(workoutType.key) ? "default" : "outline"}
                size="sm"
                onClick={() => handleWorkoutTypeToggle(workoutType.key)}
                className="justify-start"
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: workoutType.color }}
                />
                {workoutType.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('physicalTrainer:analytics.filters.metrics')}
            {filters.metrics.length > 0 && (
              <Badge variant="secondary">{filters.metrics.length}</Badge>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {availableMetrics.map(metric => (
              <div key={metric.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`metric-${metric.key}`}
                  checked={filters.metrics.includes(metric.key)}
                  onCheckedChange={() => handleMetricToggle(metric.key)}
                />
                <label 
                  htmlFor={`metric-${metric.key}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {metric.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Group By */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('physicalTrainer:analytics.filters.groupBy')}
          </h3>
          <Select 
            value={filters.groupBy} 
            onValueChange={(value: any) => onChange({ groupBy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groupByOptions.map(option => (
                <SelectItem key={option.key} value={option.key}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aggregation */}
        <div>
          <h3 className="text-sm font-medium mb-3">
            {t('physicalTrainer:analytics.filters.aggregation')}
          </h3>
          <Select 
            value={filters.aggregation} 
            onValueChange={(value: any) => onChange({ aggregation: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {aggregationOptions.map(option => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Summary */}
        {(filters.teams.length > 0 || filters.players.length > 0 || filters.workoutTypes.length > 0) && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3">Active Filters</h3>
            <div className="space-y-2">
              {filters.teams.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground">Teams:</span>
                  {filters.teams.map(teamId => {
                    const team = teams.find(t => t.teamId === teamId);
                    return (
                      <Badge key={teamId} variant="secondary" className="text-xs">
                        {team?.teamName}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => handleTeamToggle(teamId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              {filters.players.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground">Players:</span>
                  {filters.players.slice(0, 5).map(playerId => {
                    const player = players.find(p => p.playerId === playerId);
                    return (
                      <Badge key={playerId} variant="secondary" className="text-xs">
                        {player?.playerName}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => handlePlayerToggle(playerId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                  {filters.players.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{filters.players.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
              
              {filters.workoutTypes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground">Workout Types:</span>
                  {filters.workoutTypes.map(workoutType => {
                    const type = workoutTypes.find(t => t.key === workoutType);
                    return (
                      <Badge key={workoutType} variant="secondary" className="text-xs">
                        {type?.label}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => handleWorkoutTypeToggle(workoutType)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}