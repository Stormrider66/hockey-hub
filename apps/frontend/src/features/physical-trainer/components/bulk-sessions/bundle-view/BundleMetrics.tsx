'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { 
  Users, 
  Activity, 
  PlayCircle,
  BarChart3,
  Heart,
  Zap,
  TrendingUp
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { BundleMetrics as BundleMetricsType } from '../bulk-sessions.types';

interface BundleMetricsProps {
  metrics: BundleMetricsType;
  className?: string;
}

export const BundleMetrics: React.FC<BundleMetricsProps> = ({ 
  metrics, 
  className 
}) => {
  const { t } = useTranslation('physicalTrainer');

  const formatCalories = (calories: number) => {
    return calories > 1000 ? `${(calories / 1000).toFixed(1)}k` : calories.toString();
  };

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = 'blue',
    trend
  }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
    trend?: 'up' | 'down' | 'stable';
  }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      red: 'text-red-600 bg-red-50',
      purple: 'text-purple-600 bg-purple-50',
      orange: 'text-orange-600 bg-orange-50'
    };

    return (
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-full", colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {trend && (
              <TrendingUp className={cn(
                "h-4 w-4",
                trend === 'up' && "text-green-500",
                trend === 'down' && "text-red-500 rotate-180",
                trend === 'stable' && "text-gray-400"
              )} />
            )}
          </div>
          <p className="text-sm text-gray-600">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
    );
  };

  const progressPercentage = metrics.averageProgress;
  const sessionActivityRate = metrics.totalSessions > 0 
    ? (metrics.activeSessions / metrics.totalSessions) * 100 
    : 0;
  const participantActivityRate = metrics.totalParticipants > 0 
    ? (metrics.activeParticipants / metrics.totalParticipants) * 100 
    : 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('bundle.metrics.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Sessions */}
          <MetricCard
            icon={PlayCircle}
            title={t('bundle.metrics.sessions')}
            value={metrics.activeSessions}
            subtitle={`${t('common.of')} ${metrics.totalSessions} ${t('common.total')}`}
            color="blue"
            trend={metrics.activeSessions > 0 ? 'up' : 'stable'}
          />

          {/* Participants */}
          <MetricCard
            icon={Users}
            title={t('bundle.metrics.participants')}
            value={metrics.activeParticipants}
            subtitle={`${t('common.of')} ${metrics.totalParticipants} ${t('common.total')}`}
            color="green"
            trend={participantActivityRate > 75 ? 'up' : participantActivityRate > 50 ? 'stable' : 'down'}
          />

          {/* Average Progress */}
          <MetricCard
            icon={Activity}
            title={t('bundle.metrics.progress')}
            value={`${metrics.averageProgress}%`}
            subtitle={t('bundle.metrics.avgProgress')}
            color="purple"
            trend={progressPercentage > 75 ? 'up' : progressPercentage > 50 ? 'stable' : 'down'}
          />

          {/* Heart Rate / Intensity */}
          {metrics.averageHeartRate ? (
            <MetricCard
              icon={Heart}
              title={t('bundle.metrics.heartRate')}
              value={`${metrics.averageHeartRate}`}
              subtitle="bpm avg"
              color="red"
              trend={metrics.averageHeartRate > 140 ? 'up' : 'stable'}
            />
          ) : metrics.averageIntensity ? (
            <MetricCard
              icon={Zap}
              title={t('bundle.metrics.intensity')}
              value={`${metrics.averageIntensity}%`}
              subtitle={t('bundle.metrics.avgIntensity')}
              color="orange"
              trend={metrics.averageIntensity > 75 ? 'up' : 'stable'}
            />
          ) : (
            <MetricCard
              icon={Activity}
              title={t('bundle.metrics.activity')}
              value={`${Math.round(sessionActivityRate)}%`}
              subtitle={t('bundle.metrics.sessionActivity')}
              color="orange"
              trend={sessionActivityRate > 75 ? 'up' : 'stable'}
            />
          )}
        </div>

        {/* Additional Metrics Row */}
        {metrics.totalCaloriesBurned && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCalories(metrics.totalCaloriesBurned)}
                </div>
                <p className="text-sm text-gray-600">{t('bundle.metrics.caloriesBurned')}</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(participantActivityRate)}%
                </div>
                <p className="text-sm text-gray-600">{t('bundle.metrics.participationRate')}</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(sessionActivityRate)}%
                </div>
                <p className="text-sm text-gray-600">{t('bundle.metrics.sessionActivityRate')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bars */}
        <div className="mt-6 space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{t('bundle.metrics.overallProgress')}</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{t('bundle.metrics.participantEngagement')}</span>
              <span className="font-medium">{Math.round(participantActivityRate)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${participantActivityRate}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};