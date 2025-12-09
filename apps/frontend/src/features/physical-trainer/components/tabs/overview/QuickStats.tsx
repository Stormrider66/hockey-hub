'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Activity, 
  Heart, 
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Minus,
  ExternalLink
} from '@/components/icons';
import type { PlayerReadiness, TodaySession } from '../../../types';
import {
  calculateInjuryRisk,
  calculateLoadDistribution,
  calculateRecoveryStatus,
  calculatePerformanceTrending
} from '../../../utils/dashboardMetrics';
import { DetailView, DetailViewType } from './DetailViews';

interface QuickStatsProps {
  todaysSessions: TodaySession[];
  playerReadiness: PlayerReadiness[];
}

export default function QuickStats({ todaysSessions, playerReadiness }: QuickStatsProps) {
  const { t } = useTranslation('physicalTrainer');
  const [selectedDetailView, setSelectedDetailView] = useState<DetailViewType | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  // Calculate all metrics
  const injuryRisk = calculateInjuryRisk(playerReadiness);
  const loadDistribution = calculateLoadDistribution(playerReadiness);
  const recoveryStatus = calculateRecoveryStatus(playerReadiness);
  const performanceTrending = calculatePerformanceTrending(playerReadiness);

  const handleWidgetClick = (type: DetailViewType) => {
    setSelectedDetailView(type);
    setIsDetailViewOpen(true);
  };

  const handleDetailClose = () => {
    setIsDetailViewOpen(false);
    setSelectedDetailView(null);
  };

  const handleActionTaken = (action: string, data: any) => {
    console.log('Action taken:', action, data);
    // Here you would handle the action, e.g., make API calls, update state, etc.
    // For now, we'll just log it
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {/* Widget 1: Injury Risk Alert */}
        <Card 
          className="relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
          onClick={() => handleWidgetClick('injury-risk')}
        >
          <div className="absolute top-2 right-2">
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CardHeader className="pb-3 group">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {t('dashboard.quickStats.injuryRisk', { defaultValue: 'Injury Risk Alert' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {injuryRisk.highRisk}
              </div>
              <span className="text-sm text-muted-foreground">High Risk</span>
            </div>
            
            <div className="flex gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>High: {injuryRisk.highRisk}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Med: {injuryRisk.mediumRisk}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Low: {injuryRisk.lowRisk}</span>
              </div>
            </div>
            
            {injuryRisk.highRiskPlayers.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2 truncate" title={injuryRisk.highRiskPlayers.join(', ')}>
                {injuryRisk.highRiskPlayers.slice(0, 2).join(', ')}
                {injuryRisk.highRiskPlayers.length > 2 && '...'}
              </p>
            )}
            
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <span>Click for details</span>
              <ExternalLink className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
        
        {/* Widget 2: Load Distribution */}
        <Card 
          className="relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
          onClick={() => handleWidgetClick('load-distribution')}
        >
          <div className="absolute top-2 right-2">
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CardHeader className="pb-3 group">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              {t('dashboard.quickStats.loadDistribution', { defaultValue: 'Load Distribution' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{loadDistribution.optimalPercentage}%</div>
              <span className="text-sm text-muted-foreground">Optimal</span>
              {loadDistribution.weekTrend !== 0 && (
                <Badge variant="outline" className="text-xs ml-auto">
                  {loadDistribution.weekTrend > 0 ? (
                    <ChevronUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {Math.abs(loadDistribution.weekTrend)}%
                </Badge>
              )}
            </div>
            
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div className="flex h-full">
                    <div 
                      className="bg-yellow-500 transition-all"
                      style={{ width: `${(loadDistribution.under / loadDistribution.totalPlayers) * 100}%` }}
                    />
                    <div 
                      className="bg-green-500 transition-all"
                      style={{ width: `${(loadDistribution.optimal / loadDistribution.totalPlayers) * 100}%` }}
                    />
                    <div 
                      className="bg-red-500 transition-all"
                      style={{ width: `${(loadDistribution.over / loadDistribution.totalPlayers) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Under: {loadDistribution.under}</span>
                <span>Optimal: {loadDistribution.optimal}</span>
                <span>Over: {loadDistribution.over}</span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <span>Optimize loads</span>
              <ExternalLink className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
        
        {/* Widget 3: Recovery Status */}
        <Card 
          className="relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
          onClick={() => handleWidgetClick('recovery')}
        >
          <div className="absolute top-2 right-2">
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CardHeader className="pb-3 group">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              {t('dashboard.quickStats.recoveryStatus', { defaultValue: 'Recovery Status' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{recoveryStatus.recoveredPercentage}%</div>
              <span className="text-sm text-muted-foreground">Recovered</span>
            </div>
            
            <div className="mt-3">
              <Progress 
                value={recoveryStatus.recoveredPercentage} 
                className="h-2"
              />
            </div>
            
            <div className="mt-2 space-y-1">
              {recoveryStatus.needingAttention > 0 && (
                <p className="text-xs text-orange-600">
                  {recoveryStatus.needingAttention} need attention
                </p>
              )}
              {recoveryStatus.belowBaselineHRV > 0 && (
                <p className="text-xs text-muted-foreground">
                  {recoveryStatus.belowBaselineHRV} below baseline HRV
                </p>
              )}
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <span>Manage protocols</span>
              <ExternalLink className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
        
        {/* Widget 4: Performance Trending */}
        <Card 
          className="relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
          onClick={() => handleWidgetClick('performance')}
        >
          <div className="absolute top-2 right-2">
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CardHeader className="pb-3 group">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {t('dashboard.quickStats.performanceTrending', { defaultValue: 'Performance Trending' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">+{performanceTrending.weeklyIndex}%</div>
              <div className="flex items-center">
                {performanceTrending.trend === 'up' && (
                  <ChevronUp className="h-4 w-4 text-green-500" />
                )}
                {performanceTrending.trend === 'down' && (
                  <ChevronDown className="h-4 w-4 text-red-500" />
                )}
                {performanceTrending.trend === 'stable' && (
                  <Minus className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-1">
              {performanceTrending.topMetric}: +{performanceTrending.topMetricValue}% this week
            </p>
            
            {performanceTrending.plateauingPlayers > 0 && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {performanceTrending.plateauingPlayers} players plateauing
              </Badge>
            )}
            
            {/* Mini sparkline visualization */}
            <div className="mt-2 flex items-end gap-0.5 h-6">
              {[3, 5, 4, 7, 6, 8, 9].map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 bg-gradient-to-t ${
                    i === 6 ? 'from-green-500 to-green-400' : 'from-gray-300 to-gray-200'
                  } rounded-t`}
                  style={{ height: `${(height / 10) * 100}%` }}
                />
              ))}
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <span>View analytics</span>
              <ExternalLink className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail View Sheet */}
      <DetailView
        type={selectedDetailView}
        isOpen={isDetailViewOpen}
        onClose={handleDetailClose}
        playerReadiness={playerReadiness}
        onActionTaken={handleActionTaken}
      />
    </>
  );
}