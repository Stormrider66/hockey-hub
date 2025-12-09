'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Heart,
  AlertTriangle,
  Target,
  Search,
  Filter,
  Eye,
  GitCompare as Compare,
  Award,
  Clock,
  Zap,
  Shield,
  BarChart3,
  LineChart,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  ScatterChart,
  Scatter
} from 'recharts';

import { 
  PlayerPerformanceData, 
  TrendData,
  AnalyticsDashboardFilters
} from '../../types/performance-analytics.types';

interface IndividualPerformanceViewProps {
  players: PlayerPerformanceData[];
  selectedPlayerIds: string[];
  isLoading: boolean;
  error: string | null;
  onPlayerSelect: (playerIds: string[]) => void;
  onCompareSelect?: (playerIds: string[]) => void;
}

export function IndividualPerformanceView({
  players,
  selectedPlayerIds,
  isLoading,
  error,
  onPlayerSelect,
  onCompareSelect
}: IndividualPerformanceViewProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  // State for filters and view options
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'detailed' | 'comparison'>('grid');
  const [selectedMetric, setSelectedMetric] = useState<string>('strengthIndex');

  // Colors for charts
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      const matchesSearch = player.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.position.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPosition = positionFilter === 'all' || player.position === positionFilter;
      
      const matchesPerformance = performanceFilter === 'all' || 
        (performanceFilter === 'high-risk' && player.injuryRisk.overall === 'high') ||
        (performanceFilter === 'improving' && player.progressTrends.strength.length > 0) ||
        (performanceFilter === 'declining' && player.metrics.wellnessScore < 7);

      return matchesSearch && matchesPosition && matchesPerformance;
    });

    // Sort players
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.playerName.localeCompare(b.playerName);
        case 'performance':
          return (b.metrics.strengthIndex + b.metrics.vo2Max + b.metrics.reactionTime) - 
                 (a.metrics.strengthIndex + a.metrics.vo2Max + a.metrics.reactionTime);
        case 'attendance':
          return b.metrics.sessionAttendance - a.metrics.sessionAttendance;
        case 'wellness':
          return b.metrics.wellnessScore - a.metrics.wellnessScore;
        case 'risk':
          const riskOrder = { high: 3, moderate: 2, low: 1 };
          return riskOrder[b.injuryRisk.overall] - riskOrder[a.injuryRisk.overall];
        default:
          return 0;
      }
    });

    return filtered;
  }, [players, searchTerm, positionFilter, performanceFilter, sortBy]);

  // Get unique positions
  const positions = useMemo(() => {
    const positionSet = new Set(players.map(p => p.position));
    return Array.from(positionSet);
  }, [players]);

  // Handle player selection
  const handlePlayerToggle = (playerId: string) => {
    const newSelection = selectedPlayerIds.includes(playerId)
      ? selectedPlayerIds.filter(id => id !== playerId)
      : [...selectedPlayerIds, playerId];
    onPlayerSelect(newSelection);
  };

  // Select all filtered players
  const handleSelectAll = () => {
    const allFilteredIds = filteredPlayers.map(p => p.playerId);
    onPlayerSelect(allFilteredIds);
  };

  // Clear selection
  const handleClearSelection = () => {
    onPlayerSelect([]);
  };

  // Prepare comparison data for selected players
  const comparisonData = useMemo(() => {
    if (selectedPlayerIds.length === 0) return [];
    
    const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.playerId));
    
    return [
      {
        metric: 'Strength',
        ...selectedPlayers.reduce((acc, player, index) => ({
          ...acc,
          [player.playerName]: player.metrics.strengthIndex
        }), {})
      },
      {
        metric: 'VO2 Max',
        ...selectedPlayers.reduce((acc, player, index) => ({
          ...acc,
          [player.playerName]: player.metrics.vo2Max
        }), {})
      },
      {
        metric: 'Agility',
        ...selectedPlayers.reduce((acc, player, index) => ({
          ...acc,
          [player.playerName]: 100 - player.metrics.reactionTime // Invert for better visualization
        }), {})
      },
      {
        metric: 'Wellness',
        ...selectedPlayers.reduce((acc, player, index) => ({
          ...acc,
          [player.playerName]: player.metrics.wellnessScore * 10
        }), {})
      },
      {
        metric: 'Attendance',
        ...selectedPlayers.reduce((acc, player, index) => ({
          ...acc,
          [player.playerName]: player.metrics.sessionAttendance * 100
        }), {})
      }
    ];
  }, [players, selectedPlayerIds]);

  // Get performance level badge
  const getPerformanceBadge = (player: PlayerPerformanceData) => {
    const avgPerformance = (
      player.metrics.strengthIndex + 
      player.metrics.vo2Max + 
      player.metrics.wellnessScore * 10
    ) / 3;

    if (avgPerformance >= 80) return { label: 'Excellent', variant: 'default' as const, color: 'text-green-600' };
    if (avgPerformance >= 70) return { label: 'Good', variant: 'secondary' as const, color: 'text-blue-600' };
    if (avgPerformance >= 60) return { label: 'Average', variant: 'outline' as const, color: 'text-yellow-600' };
    return { label: 'Needs Attention', variant: 'destructive' as const, color: 'text-red-600' };
  };

  // Get risk level color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('common:loading.loadingPlayerData')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search and Filters */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('physicalTrainer:analytics.players.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('physicalTrainer:analytics.filters.position')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common:filters.all')}</SelectItem>
              {positions.map(position => (
                <SelectItem key={position} value={position}>{position}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('physicalTrainer:analytics.filters.performance')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common:filters.all')}</SelectItem>
              <SelectItem value="high-risk">{t('physicalTrainer:analytics.filters.highRisk')}</SelectItem>
              <SelectItem value="improving">{t('physicalTrainer:analytics.filters.improving')}</SelectItem>
              <SelectItem value="declining">{t('physicalTrainer:analytics.filters.declining')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder={t('physicalTrainer:analytics.filters.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t('physicalTrainer:analytics.sorting.name')}</SelectItem>
              <SelectItem value="performance">{t('physicalTrainer:analytics.sorting.performance')}</SelectItem>
              <SelectItem value="attendance">{t('physicalTrainer:analytics.sorting.attendance')}</SelectItem>
              <SelectItem value="wellness">{t('physicalTrainer:analytics.sorting.wellness')}</SelectItem>
              <SelectItem value="risk">{t('physicalTrainer:analytics.sorting.risk')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode and Selection Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('physicalTrainer:analytics.viewModes.grid')}
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('detailed')}
          >
            <Eye className="h-4 w-4 mr-2" />
            {t('physicalTrainer:analytics.viewModes.detailed')}
          </Button>
          <Button
            variant={viewMode === 'comparison' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('comparison')}
            disabled={selectedPlayerIds.length < 2}
          >
            <Compare className="h-4 w-4 mr-2" />
            {t('physicalTrainer:analytics.viewModes.comparison')}
          </Button>
        </div>
      </div>

      {/* Selection Controls */}
      {selectedPlayerIds.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedPlayerIds.length} {t('physicalTrainer:analytics.players.selected')}
                </span>
                <Button variant="outline" size="sm" onClick={handleClearSelection}>
                  <UserX className="h-4 w-4 mr-2" />
                  {t('common:actions.clearSelection')}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                {selectedPlayerIds.length >= 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCompareSelect?.(selectedPlayerIds)}
                  >
                    <Compare className="h-4 w-4 mr-2" />
                    {t('physicalTrainer:analytics.actions.compare')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => {
            const performanceBadge = getPerformanceBadge(player);
            const isSelected = selectedPlayerIds.includes(player.playerId);
            
            return (
              <Card 
                key={player.playerId}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handlePlayerToggle(player.playerId)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{player.playerName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{player.position}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant={performanceBadge.variant}>
                        {performanceBadge.label}
                      </Badge>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(player.injuryRisk.overall)}`}>
                        {player.injuryRisk.overall} risk
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {Math.round(player.metrics.strengthIndex)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('physicalTrainer:analytics.metrics.strength')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {Math.round(player.metrics.vo2Max)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('physicalTrainer:analytics.metrics.vo2max')}
                      </div>
                    </div>
                  </div>

                  {/* Wellness Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center">
                        <Heart className="h-4 w-4 mr-1 text-red-500" />
                        {t('physicalTrainer:analytics.metrics.wellness')}
                      </span>
                      <span className="text-sm font-bold">
                        {player.metrics.wellnessScore.toFixed(1)}/10
                      </span>
                    </div>
                    <Progress value={player.metrics.wellnessScore * 10} className="h-2" />
                  </div>

                  {/* Attendance */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center">
                        <UserCheck className="h-4 w-4 mr-1 text-green-500" />
                        {t('physicalTrainer:analytics.metrics.attendance')}
                      </span>
                      <span className="text-sm font-bold">
                        {Math.round(player.metrics.sessionAttendance * 100)}%
                      </span>
                    </div>
                    <Progress value={player.metrics.sessionAttendance * 100} className="h-2" />
                  </div>

                  {/* Load Management */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Weekly Load</span>
                      <span className="font-medium">{Math.round(player.metrics.weeklyLoad)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">AC Ratio</span>
                      <span className={`font-medium ${
                        player.metrics.acuteChronicRatio > 1.5 ? 'text-red-600' : 
                        player.metrics.acuteChronicRatio < 0.8 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {player.metrics.acuteChronicRatio.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {player.injuryRisk.factors.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-1">Risk Factors:</div>
                      <div className="flex flex-wrap gap-1">
                        {player.injuryRisk.factors.slice(0, 2).map((factor, index) => (
                          <span key={index} className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                            {factor}
                          </span>
                        ))}
                        {player.injuryRisk.factors.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{player.injuryRisk.factors.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detailed View */}
      {viewMode === 'detailed' && filteredPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('physicalTrainer:analytics.players.detailedView.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      <Checkbox
                        checked={selectedPlayerIds.length === filteredPlayers.length}
                        onCheckedChange={selectedPlayerIds.length === filteredPlayers.length ? handleClearSelection : handleSelectAll}
                      />
                    </th>
                    <th className="text-left p-2">{t('physicalTrainer:analytics.table.player')}</th>
                    <th className="text-left p-2">{t('physicalTrainer:analytics.table.position')}</th>
                    <th className="text-left p-2">{t('physicalTrainer:analytics.table.strength')}</th>
                    <th className="text-left p-2">{t('physicalTrainer:analytics.table.conditioning')}</th>
                    <th className="text-left p-2">{t('physicalTrainer:analytics.table.agility')}</th>
                    <th className="text-left p-2">{t('physicalTrainer:analytics.table.wellness')}</th>
                    <th className="text-left p-2">{t('physicalTrainer:analytics.table.attendance')}</th>
                    <th className="text-left p-2">{t('physicalTrainer:analytics.table.risk')}</th>
                    <th className="text-left p-2">{t('physicalTrainer:analytics.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr key={player.playerId} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Checkbox
                          checked={selectedPlayerIds.includes(player.playerId)}
                          onCheckedChange={() => handlePlayerToggle(player.playerId)}
                        />
                      </td>
                      <td className="p-2 font-medium">{player.playerName}</td>
                      <td className="p-2">{player.position}</td>
                      <td className="p-2">{Math.round(player.metrics.strengthIndex)}</td>
                      <td className="p-2">{Math.round(player.metrics.vo2Max)}</td>
                      <td className="p-2">{(100 - player.metrics.reactionTime).toFixed(1)}</td>
                      <td className="p-2">{player.metrics.wellnessScore.toFixed(1)}</td>
                      <td className="p-2">{Math.round(player.metrics.sessionAttendance * 100)}%</td>
                      <td className="p-2">
                        <Badge variant={
                          player.injuryRisk.overall === 'high' ? 'destructive' :
                          player.injuryRisk.overall === 'moderate' ? 'secondary' : 'outline'
                        }>
                          {player.injuryRisk.overall}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Activity className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && selectedPlayerIds.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('physicalTrainer:analytics.comparison.metrics.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={comparisonData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    {players
                      .filter(p => selectedPlayerIds.includes(p.playerId))
                      .map((player, index) => (
                        <Radar
                          key={player.playerId}
                          name={player.playerName}
                          dataKey={player.playerName}
                          stroke={colors[index % colors.length]}
                          fill={colors[index % colors.length]}
                          fillOpacity={0.2}
                        />
                      ))
                    }
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('physicalTrainer:analytics.comparison.bars.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {players
                      .filter(p => selectedPlayerIds.includes(p.playerId))
                      .map((player, index) => (
                        <Bar
                          key={player.playerId}
                          dataKey={player.playerName}
                          fill={colors[index % colors.length]}
                          name={player.playerName}
                        />
                      ))
                    }
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('physicalTrainer:analytics.summary.totalPlayers')}
                </p>
                <p className="text-2xl font-bold">{filteredPlayers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('physicalTrainer:analytics.summary.highRisk')}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredPlayers.filter(p => p.injuryRisk.overall === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('physicalTrainer:analytics.summary.avgAttendance')}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(
                    filteredPlayers.reduce((sum, p) => sum + p.metrics.sessionAttendance, 0) / 
                    Math.max(filteredPlayers.length, 1) * 100
                  )}%
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('physicalTrainer:analytics.summary.avgWellness')}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {(filteredPlayers.reduce((sum, p) => sum + p.metrics.wellnessScore, 0) / 
                    Math.max(filteredPlayers.length, 1)).toFixed(1)}
                </p>
              </div>
              <Heart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}