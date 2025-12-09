'use client';

import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Zap, 
  TrendingUp, 
  Activity,
  Gauge,
  Timer,
  Target,
  Dumbbell
} from 'lucide-react';
import { LiveMetrics } from './types';
import { cn } from '@/lib/utils';

interface LiveMetricsPanelProps {
  metrics: LiveMetrics;
  compact?: boolean;
  detailed?: boolean;
  className?: string;
}

export const LiveMetricsPanel: React.FC<LiveMetricsPanelProps> = ({ 
  metrics,
  compact = false,
  detailed = false,
  className 
}) => {
  const getHeartRateZoneColor = (zone?: string) => {
    switch (zone) {
      case 'rest':
        return 'text-gray-600 bg-gray-100';
      case 'zone1':
        return 'text-blue-600 bg-blue-100';
      case 'zone2':
        return 'text-green-600 bg-green-100';
      case 'zone3':
        return 'text-yellow-600 bg-yellow-100';
      case 'zone4':
        return 'text-orange-600 bg-orange-100';
      case 'zone5':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHeartRateZoneLabel = (zone?: string) => {
    switch (zone) {
      case 'rest':
        return 'Rest';
      case 'zone1':
        return 'Recovery';
      case 'zone2':
        return 'Aerobic';
      case 'zone3':
        return 'Threshold';
      case 'zone4':
        return 'VO2 Max';
      case 'zone5':
        return 'Max Effort';
      default:
        return 'Unknown';
    }
  };

  // Compact view for list displays
  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {metrics.heartRate && (
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">{metrics.heartRate}</span>
            <span className="text-xs text-gray-500">bpm</span>
          </div>
        )}
        {metrics.power && (
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{metrics.power}</span>
            <span className="text-xs text-gray-500">W</span>
          </div>
        )}
        {metrics.pace && (
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">{metrics.pace}</span>
          </div>
        )}
      </div>
    );
  }

  // Detailed view for focus mode
  if (detailed) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {/* Heart Rate Card */}
        {metrics.heartRate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Heart Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{metrics.heartRate}</span>
                  <span className="text-sm text-gray-500">bpm</span>
                </div>
                {metrics.heartRateZone && (
                  <Badge className={cn("w-fit", getHeartRateZoneColor(metrics.heartRateZone))}>
                    {getHeartRateZoneLabel(metrics.heartRateZone)}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Power Card */}
        {metrics.power && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Power Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{metrics.power}</span>
                <span className="text-sm text-gray-500">watts</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pace Card */}
        {metrics.pace && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                Pace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{metrics.pace}</span>
                <span className="text-sm text-gray-500">min/km</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distance Card */}
        {metrics.distance !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Distance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{(metrics.distance / 1000).toFixed(2)}</span>
                <span className="text-sm text-gray-500">km</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weight/Reps Card for Strength */}
        {(metrics.weight || metrics.reps) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-purple-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {metrics.weight && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Weight</span>
                    <span className="font-semibold">{metrics.weight} kg</span>
                  </div>
                )}
                {metrics.reps && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reps</span>
                    <span className="font-semibold">{metrics.reps}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rest Time Card */}
        {metrics.restTime !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Timer className="h-4 w-4 text-indigo-500" />
                Rest Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{metrics.restTime}</span>
                <span className="text-sm text-gray-500">seconds</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Standard view
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.heartRate && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-600">Heart Rate</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{metrics.heartRate}</span>
                <span className="text-sm text-gray-500">bpm</span>
              </div>
              {metrics.heartRateZone && (
                <Badge className={cn("mt-1", getHeartRateZoneColor(metrics.heartRateZone))}>
                  {getHeartRateZoneLabel(metrics.heartRateZone)}
                </Badge>
              )}
            </div>
          )}

          {metrics.power && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-600">Power</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{metrics.power}</span>
                <span className="text-sm text-gray-500">W</span>
              </div>
            </div>
          )}

          {metrics.pace && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">Pace</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{metrics.pace}</span>
              </div>
            </div>
          )}

          {metrics.calories !== undefined && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-gray-600">Calories</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{metrics.calories}</span>
                <span className="text-sm text-gray-500">kcal</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};