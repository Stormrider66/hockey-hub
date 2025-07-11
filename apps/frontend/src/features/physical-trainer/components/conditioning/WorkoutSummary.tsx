'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Zap, 
  Heart, 
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IntervalSet } from '../../types/conditioning.types';

interface WorkoutSummaryProps {
  totalDuration: number;
  estimatedCalories: number;
  zoneDistribution: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  intervals: IntervalSet[];
}

const ZONE_COLORS = [
  { zone: 1, color: 'bg-blue-500', label: 'Recovery' },
  { zone: 2, color: 'bg-green-500', label: 'Aerobic' },
  { zone: 3, color: 'bg-yellow-500', label: 'Threshold' },
  { zone: 4, color: 'bg-orange-500', label: 'VO2 Max' },
  { zone: 5, color: 'bg-red-500', label: 'Max' },
];

export default function WorkoutSummary({
  totalDuration,
  estimatedCalories,
  zoneDistribution,
  intervals
}: WorkoutSummaryProps) {
  const { t } = useTranslation(['physicalTrainer']);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate work/rest ratio
  const workTime = intervals
    .filter(i => i.type === 'work')
    .reduce((sum, i) => sum + i.duration, 0);
  const restTime = intervals
    .filter(i => i.type === 'rest' || i.type === 'active_recovery')
    .reduce((sum, i) => sum + i.duration, 0);
  const workRestRatio = restTime > 0 ? (workTime / restTime).toFixed(1) : 'N/A';

  // Calculate interval counts
  const intervalCounts = intervals.reduce((acc, interval) => {
    acc[interval.type] = (acc[interval.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('physicalTrainer:conditioning.summary.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 mx-auto mb-1 text-gray-600" />
            <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
            <p className="text-xs text-muted-foreground">Total Duration</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Zap className="h-5 w-5 mx-auto mb-1 text-gray-600" />
            <p className="text-2xl font-bold">{estimatedCalories}</p>
            <p className="text-xs text-muted-foreground">Est. Calories</p>
          </div>
        </div>

        {/* Work/Rest Ratio */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Work : Rest Ratio</span>
            <Badge variant="outline">{workRestRatio} : 1</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Work: </span>
              <span className="font-medium">{formatDuration(workTime)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Rest: </span>
              <span className="font-medium">{formatDuration(restTime)}</span>
            </div>
          </div>
        </div>

        {/* Zone Distribution */}
        {Object.values(zoneDistribution).some(v => v > 0) && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Zone Distribution
            </h4>
            <div className="space-y-2">
              {ZONE_COLORS.map(({ zone, color, label }) => {
                const percentage = zoneDistribution[`zone${zone}` as keyof typeof zoneDistribution];
                if (percentage === 0) return null;
                
                return (
                  <div key={zone}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">Zone {zone} - {label}</span>
                      <span>{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2">
                      <div 
                        className={`h-full ${color} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </Progress>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interval Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Interval Breakdown
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(intervalCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-xs">
                <span className="capitalize text-muted-foreground">
                  {type.replace('_', ' ')}:
                </span>
                <Badge variant="outline" className="text-xs">
                  {count} intervals
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}