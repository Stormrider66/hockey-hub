'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  FileDown,
  Filter,
  Calendar,
  AlertTriangle,
  Target,
  Brain,
  Heart,
  RefreshCw,
  Settings,
  Bell,
  Download,
  Zap,
  Shield,
  TrendingDown
} from 'lucide-react';

// Import components
import { TeamPerformanceView } from './TeamPerformanceView';
import { IndividualPerformanceView } from './IndividualPerformanceView';
import { WorkoutEffectivenessMetrics } from './WorkoutEffectivenessMetrics';
import { PerformanceComparisonTool } from './PerformanceComparisonTool';
import { PerformanceTrendsChart } from './PerformanceTrendsChart';
import { LoadManagementPanel } from './LoadManagementPanel';
import { PerformanceFiltersPanel } from './PerformanceFiltersPanel';
import { PerformanceInsightsList } from './PerformanceInsightsList';
import { PerformanceAlertsPanel } from './PerformanceAlertsPanel';
import { ExportOptionsModal } from './ExportOptionsModal';

// Import hooks and types
import { usePerformanceAnalytics } from '../../hooks/usePerformanceAnalytics';
import { 
  AnalyticsDashboardFilters,
  PerformanceAnalyticsState,
  ExportOptions,
  DateRange,
  PerformanceInsight,
  PerformanceRecommendation
} from '../../types/performance-analytics.types';

interface PerformanceAnalyticsDashboardProps {
  teamId?: string;
  playerId?: string;
  initialView?: PerformanceAnalyticsState['selectedView'];
  className?: string;
}

export function PerformanceAnalyticsDashboard({ 
  teamId, 
  playerId,
  initialView = 'overview',
  className = ''
}: PerformanceAnalyticsDashboardProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  // State management
  const [selectedView, setSelectedView] = useState<PerformanceAnalyticsState['selectedView']>(initialView);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  
  // Initialize filters
  const [filters, setFilters] = useState<AnalyticsDashboardFilters>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date(),
      preset: 'month'
    },
    teams: teamId ? [teamId] : [],
    players: playerId ? [playerId] : [],
    workoutTypes: [],
    metrics: ['strength', 'conditioning', 'agility', 'recovery', 'attendance', 'load'],
    groupBy: 'player',
    aggregation: 'average'
  });

  // Fetch analytics data using custom hook
  const { 
    data, 
    isLoading, 
    error, 
    insights,
    recommendations,
    alerts,
    refresh,
    exportData
  } = usePerformanceAnalytics(filters);

  // Calculate header metrics
  const headerMetrics = useMemo(() => {
    if (!data) return null;
    
    const activeAlerts = alerts.filter(alert => !alert.acknowledged).length;
    const highPriorityInsights = insights.filter(insight => insight.impact === 'high').length;
    
    return {
      totalPlayers: data.players?.length || 0,
      activePlayers: data.players?.filter(p => p.metrics.sessionAttendance > 0.8).length || 0,
      avgTeamReadiness: data.teams?.reduce((acc, team) => acc + team.metrics.teamReadiness, 0) / (data.teams?.length || 1) || 0,
      totalWorkouts: data.teams?.reduce((acc, team) => acc + team.metrics.totalWorkouts, 0) || 0,
      alertsCount: activeAlerts,
      insightsCount: highPriorityInsights,
      injuryRisk: data.players?.filter(p => p.injuryRisk.overall === 'high').length || 0,
      overallTrend: 'up' as const // TODO: Calculate from actual data
    };
  }, [data, alerts, insights]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<AnalyticsDashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle export
  const handleExport = useCallback(async (options: ExportOptions) => {
    try {
      await exportData(options);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportData]);

  // Handle view navigation
  const handleViewChange = useCallback((view: PerformanceAnalyticsState['selectedView']) => {
    setSelectedView(view);
  }, []);

  // Quick action handlers
  const handleQuickAction = useCallback((action: string, params?: any) => {
    switch (action) {
      case 'view-player':
        setFilters(prev => ({ ...prev, players: [params.playerId] }));
        setSelectedView('players');
        break;
      case 'view-team':
        setFilters(prev => ({ ...prev, teams: [params.teamId] }));
        setSelectedView('teams');
        break;
      case 'view-workout-type':
        setFilters(prev => ({ ...prev, workoutTypes: [params.workoutType] }));
        setSelectedView('workouts');
        break;
      case 'compare-players':
        setFilters(prev => ({ ...prev, players: params.playerIds }));
        setSelectedView('comparison');
        break;
      default:
        console.log('Unknown action:', action, params);
    }
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with key metrics and controls */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t('physicalTrainer:analytics.title')}
            </h1>
            <p className="text-blue-100 text-lg">
              {t('physicalTrainer:analytics.subtitle')}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAlerts(!showAlerts)}
              className="bg-white/20 hover:bg-white/30 text-white border-0 relative"
            >
              <Bell className="h-4 w-4 mr-2" />
              {t('physicalTrainer:analytics.alerts')}
              {headerMetrics && headerMetrics.alertsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                >
                  {headerMetrics.alertsCount}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('common:actions.filter')}
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('common:actions.export')}
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t('common:actions.refresh')}
            </Button>
          </div>
        </div>

        {/* Key metrics grid */}
        {headerMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5" />
                <span className="text-2xl font-bold">
                  {headerMetrics.activePlayers}/{headerMetrics.totalPlayers}
                </span>
              </div>
              <p className="text-sm text-blue-100">
                {t('physicalTrainer:analytics.metrics.activePlayers')}
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Heart className="h-5 w-5" />
                <span className="text-2xl font-bold">
                  {Math.round(headerMetrics.avgTeamReadiness)}%
                </span>
              </div>
              <p className="text-sm text-blue-100">
                {t('physicalTrainer:analytics.metrics.teamReadiness')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5" />
                <span className="text-2xl font-bold">{headerMetrics.totalWorkouts}</span>
              </div>
              <p className="text-sm text-blue-100">
                {t('physicalTrainer:analytics.metrics.totalWorkouts')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5" />
                <span className="text-2xl font-bold">{headerMetrics.insightsCount}</span>
              </div>
              <p className="text-sm text-blue-100">
                {t('physicalTrainer:analytics.metrics.keyInsights')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-5 w-5" />
                <span className="text-2xl font-bold text-yellow-300">
                  {headerMetrics.injuryRisk}
                </span>
              </div>
              <p className="text-sm text-blue-100">
                {t('physicalTrainer:analytics.metrics.highRisk')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-2xl font-bold text-red-300">
                  {headerMetrics.alertsCount}
                </span>
              </div>
              <p className="text-sm text-blue-100">
                {t('physicalTrainer:analytics.metrics.activeAlerts')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Brain className="h-5 w-5" />
                <span className="text-2xl font-bold">
                  {recommendations.length}
                </span>
              </div>
              <p className="text-sm text-blue-100">
                {t('physicalTrainer:analytics.metrics.recommendations')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                {headerMetrics.overallTrend === 'up' ? (
                  <TrendingUp className="h-5 w-5 text-green-300" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-300" />
                )}
                <span className="text-2xl font-bold">
                  {headerMetrics.overallTrend === 'up' ? '+' : '-'}5.2%
                </span>
              </div>
              <p className="text-sm text-blue-100">
                {t('physicalTrainer:analytics.metrics.overallTrend')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alerts Panel */}
      {showAlerts && (
        <PerformanceAlertsPanel
          alerts={alerts}
          onDismiss={() => setShowAlerts(false)}
          onActionClick={handleQuickAction}
        />
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <PerformanceFiltersPanel
              filters={filters}
              onChange={handleFilterChange}
              onClose={() => setShowFilters(false)}
              teams={data?.teams || []}
              players={data?.players || []}
            />
          </CardContent>
        </Card>
      )}

      {/* Insights and Recommendations */}
      {(insights.length > 0 || recommendations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  {t('physicalTrainer:analytics.insights.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceInsightsList
                  insights={insights}
                  onInsightClick={handleQuickAction}
                />
              </CardContent>
            </Card>
          )}
          
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  {t('physicalTrainer:analytics.recommendations.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((rec) => (
                    <div 
                      key={rec.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleQuickAction('view-recommendation', { recommendationId: rec.id })}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main content tabs */}
      <Tabs value={selectedView} onValueChange={handleViewChange}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('physicalTrainer:analytics.views.overview')}
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('physicalTrainer:analytics.views.teams')}
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('physicalTrainer:analytics.views.players')}
          </TabsTrigger>
          <TabsTrigger value="workouts" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('physicalTrainer:analytics.views.workouts')}
          </TabsTrigger>
          <TabsTrigger value="load" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('physicalTrainer:analytics.views.load')}
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('physicalTrainer:analytics.views.comparison')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceTrendsChart
              data={data}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            <TeamPerformanceView
              teams={data?.teams || []}
              isLoading={isLoading}
              error={error}
              onTeamSelect={(teamId) => handleQuickAction('view-team', { teamId })}
            />
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <TeamPerformanceView
            teams={data?.teams || []}
            isLoading={isLoading}
            error={error}
            detailed={true}
            onTeamSelect={(teamId) => handleQuickAction('view-team', { teamId })}
            onPlayerSelect={(playerId) => handleQuickAction('view-player', { playerId })}
          />
        </TabsContent>

        <TabsContent value="players" className="mt-6">
          <IndividualPerformanceView
            players={data?.players || []}
            selectedPlayerIds={filters.players}
            isLoading={isLoading}
            error={error}
            onPlayerSelect={(playerIds) => handleFilterChange({ players: playerIds })}
            onCompareSelect={(playerIds) => handleQuickAction('compare-players', { playerIds })}
          />
        </TabsContent>

        <TabsContent value="workouts" className="mt-6">
          <WorkoutEffectivenessMetrics
            data={data?.workoutEffectiveness || []}
            filters={filters}
            isLoading={isLoading}
            error={error}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>

        <TabsContent value="load" className="mt-6">
          <LoadManagementPanel
            players={data?.players || []}
            loadData={data?.loadManagement || []}
            filters={filters}
            isLoading={isLoading}
            error={error}
            onPlayerSelect={(playerId) => handleQuickAction('view-player', { playerId })}
          />
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <PerformanceComparisonTool
            data={data}
            filters={filters}
            isLoading={isLoading}
            error={error}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>
      </Tabs>

      {/* Export Modal */}
      <ExportOptionsModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onExport={handleExport}
        data={data}
        filters={filters}
      />
    </div>
  );
}