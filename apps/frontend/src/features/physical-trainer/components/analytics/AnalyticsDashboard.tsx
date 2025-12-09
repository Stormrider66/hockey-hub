'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  Heart
} from 'lucide-react';

// Import sub-components
import { TeamOverview } from './TeamOverview';
import { PlayerAnalytics } from './PlayerAnalytics';
import { WorkoutEffectivenessMetrics } from './WorkoutEffectivenessMetrics';
import { PerformanceComparisonTool } from './PerformanceComparisonTool';
import { PerformanceFiltersPanel } from './PerformanceFiltersPanel';
import { ExportOptionsModal } from './ExportOptionsModal';
import { PerformanceInsightsList } from './PerformanceInsightsList';

// Import hooks and types
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import { 
  AnalyticsFilters, 
  TimePeriod,
  ExportOptions,
  AnalyticsDashboardState 
} from '../../types/analytics.types';

interface AnalyticsDashboardProps {
  teamId?: string;
  initialView?: AnalyticsDashboardState['selectedView'];
}

export function AnalyticsDashboard({ teamId, initialView = 'overview' }: AnalyticsDashboardProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  // State management
  const [selectedView, setSelectedView] = useState<AnalyticsDashboardState['selectedView']>(initialView);
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  // Initialize filters
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'week',
    teamIds: teamId ? [teamId] : [],
    playerIds: [],
    workoutTypes: [],
    metrics: ['workload', 'performance', 'recovery', 'attendance']
  });

  // Fetch analytics data
  const { 
    data, 
    isLoading, 
    error, 
    insights,
    recommendations,
    refresh 
  } = useAnalyticsData(filters);

  // Calculate key metrics for header
  const headerMetrics = useMemo(() => {
    if (!data.team) return null;
    
    return {
      teamHealth: data.team.overallHealth,
      activePlayers: data.players?.filter(p => p.readiness.status === 'ready').length || 0,
      totalPlayers: data.players?.length || 0,
      upcomingWorkouts: 12, // Mock data
      completionRate: data.team.metrics.averageAttendance.value
    };
  }, [data]);

  // Handle export
  const handleExport = (options: ExportOptions) => {
    console.log('Exporting analytics with options:', options);
    // TODO: Implement export functionality
    setShowExport(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with key metrics */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{t('physicalTrainer:analytics.title')}</h2>
            <p className="text-blue-100">{t('physicalTrainer:analytics.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-3">
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
              onClick={() => setShowExport(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {t('common:actions.export')}
            </Button>
          </div>
        </div>

        {/* Key metrics cards */}
        {headerMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Heart className="h-5 w-5" />
                <span className="text-2xl font-bold">{headerMetrics.teamHealth}%</span>
              </div>
              <p className="text-sm text-blue-100">{t('physicalTrainer:analytics.metrics.teamHealth')}</p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5" />
                <span className="text-2xl font-bold">
                  {headerMetrics.activePlayers}/{headerMetrics.totalPlayers}
                </span>
              </div>
              <p className="text-sm text-blue-100">{t('physicalTrainer:analytics.metrics.activePlayers')}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5" />
                <span className="text-2xl font-bold">{headerMetrics.completionRate}%</span>
              </div>
              <p className="text-sm text-blue-100">{t('physicalTrainer:analytics.metrics.completionRate')}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5" />
                <span className="text-2xl font-bold">{headerMetrics.upcomingWorkouts}</span>
              </div>
              <p className="text-sm text-blue-100">{t('physicalTrainer:analytics.metrics.upcomingWorkouts')}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Brain className="h-5 w-5" />
                <span className="text-2xl font-bold">{insights.length}</span>
              </div>
              <p className="text-sm text-blue-100">{t('physicalTrainer:analytics.metrics.insights')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <PerformanceFiltersPanel
              filters={filters}
              onChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Insights Panel */}
      {insights.length > 0 && (
        <PerformanceInsightsList 
          insights={insights}
          recommendations={recommendations}
        />
      )}

      {/* Main content tabs */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('physicalTrainer:analytics.views.overview')}
          </TabsTrigger>
          <TabsTrigger value="player" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('physicalTrainer:analytics.views.players')}
          </TabsTrigger>
          <TabsTrigger value="workouts" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('physicalTrainer:analytics.views.workouts')}
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('physicalTrainer:analytics.views.comparison')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <TeamOverview
            data={data.team}
            players={data.players}
            isLoading={isLoading}
            error={error}
            period={filters.period}
            onPlayerSelect={(playerId) => {
              setFilters({ ...filters, playerIds: [playerId] });
              setSelectedView('player');
            }}
          />
        </TabsContent>

        <TabsContent value="player" className="mt-6">
          <PlayerAnalytics
            players={data.players}
            loadManagement={data.loadManagement}
            recovery={data.recovery}
            isLoading={isLoading}
            error={error}
            selectedPlayerIds={filters.playerIds}
            onPlayerSelect={(playerIds) => setFilters({ ...filters, playerIds })}
          />
        </TabsContent>

        <TabsContent value="workouts" className="mt-6">
          <WorkoutEffectivenessMetrics
            data={data.workouts}
            isLoading={isLoading}
            error={error}
            period={filters.period}
            selectedTypes={filters.workoutTypes}
            onTypeSelect={(types) => setFilters({ ...filters, workoutTypes: types })}
          />
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <PerformanceComparisonTool
            data={data.comparisons}
            players={data.players}
            teams={[]} // TODO: Add teams data
            isLoading={isLoading}
            error={error}
            onComparisonChange={(comparison) => setFilters({ ...filters, comparison })}
          />
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportOptionsModal
        open={showExport}
        onOpenChange={setShowExport}
        onExport={handleExport}
        availableSections={['overview', 'players', 'workouts', 'comparisons']}
        dateRange={filters.customDateRange || {
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          to: new Date()
        }}
      />
    </div>
  );
}