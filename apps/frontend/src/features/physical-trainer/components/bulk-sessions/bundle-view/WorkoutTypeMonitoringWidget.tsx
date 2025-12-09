'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, 
  Heart, 
  Zap, 
  Target,
  Users,
  Clock,
  Activity,
  BarChart3,
  TrendingUp,
  Flame
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { BundleSession, ParticipantMetrics } from '../bulk-sessions.types';

interface WorkoutTypeMonitoringWidgetProps {
  sessions: BundleSession[];
  workoutType: BundleSession['workoutType'];
  className?: string;
}

interface TypeSpecificMetrics {
  strength: {
    totalSets: number;
    averageWeight: number;
    totalVolume: number;
    completionRate: number;
  };
  conditioning: {
    averageHeartRate: number;
    zoneDistribution: Record<string, number>;
    averagePower: number;
    totalCalories: number;
  };
  hybrid: {
    exerciseBlocks: number;
    intervalBlocks: number;
    averageBlockDuration: number;
    overallIntensity: number;
  };
  agility: {
    drillsCompleted: number;
    averageAccuracy: number;
    averageTime: number;
    errorRate: number;
  };
}

export const WorkoutTypeMonitoringWidget: React.FC<WorkoutTypeMonitoringWidgetProps> = ({
  sessions,
  workoutType,
  className
}) => {
  const { t } = useTranslation('physicalTrainer');
  
  const workoutTypeSessions = sessions.filter(s => s.workoutType === workoutType);
  
  if (workoutTypeSessions.length === 0) return null;

  const getWorkoutTypeInfo = () => {
    switch (workoutType) {
      case 'strength':
        return {
          icon: Dumbbell,
          color: 'blue',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        };
      case 'conditioning':
        return {
          icon: Heart,
          color: 'red',
          bgColor: 'bg-red-50',
          textColor: 'text-red-600',
          borderColor: 'border-red-200'
        };
      case 'hybrid':
        return {
          icon: Zap,
          color: 'purple',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600',
          borderColor: 'border-purple-200'
        };
      case 'agility':
        return {
          icon: Target,
          color: 'orange',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600',
          borderColor: 'border-orange-200'
        };
    }
  };

  const calculateTypeSpecificMetrics = (): Partial<TypeSpecificMetrics[keyof TypeSpecificMetrics]> => {
    const allParticipants = workoutTypeSessions.flatMap(s => s.participants);
    
    switch (workoutType) {
      case 'strength': {
        const repsData = allParticipants.map(p => p.metrics.reps || 0).filter(r => r > 0);
        const weightData = allParticipants.map(p => p.metrics.weight || 0).filter(w => w > 0);
        
        return {
          totalSets: repsData.length,
          averageWeight: weightData.length > 0 ? Math.round(weightData.reduce((a, b) => a + b, 0) / weightData.length) : 0,
          totalVolume: weightData.length > 0 && repsData.length > 0 ? 
            Math.round(weightData.reduce((a, b) => a + b, 0) * repsData.reduce((a, b) => a + b, 0) / Math.min(weightData.length, repsData.length)) : 0,
          completionRate: Math.round(workoutTypeSessions.reduce((sum, s) => sum + s.progress, 0) / workoutTypeSessions.length)
        } as TypeSpecificMetrics['strength'];
      }
      
      case 'conditioning': {
        const hrData = allParticipants.map(p => p.metrics.heartRate || 0).filter(hr => hr > 0);
        const powerData = allParticipants.map(p => p.metrics.power || 0).filter(p => p > 0);
        const calorieData = allParticipants.map(p => p.metrics.calories || 0).filter(c => c > 0);
        
        const zoneDistribution = allParticipants.reduce((acc, p) => {
          if (p.metrics.heartRateZone) {
            acc[p.metrics.heartRateZone] = (acc[p.metrics.heartRateZone] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        
        return {
          averageHeartRate: hrData.length > 0 ? Math.round(hrData.reduce((a, b) => a + b, 0) / hrData.length) : 0,
          zoneDistribution,
          averagePower: powerData.length > 0 ? Math.round(powerData.reduce((a, b) => a + b, 0) / powerData.length) : 0,
          totalCalories: calorieData.reduce((a, b) => a + b, 0)
        } as TypeSpecificMetrics['conditioning'];
      }
      
      case 'hybrid': {
        // Mock hybrid-specific calculations
        return {
          exerciseBlocks: workoutTypeSessions.length * 3, // Assume 3 exercise blocks per session
          intervalBlocks: workoutTypeSessions.length * 2, // Assume 2 interval blocks per session
          averageBlockDuration: 8, // minutes
          overallIntensity: Math.round(workoutTypeSessions.reduce((sum, s) => sum + s.progress, 0) / workoutTypeSessions.length * 0.85)
        } as TypeSpecificMetrics['hybrid'];
      }
      
      case 'agility': {
        // Mock agility-specific calculations
        const totalDrills = workoutTypeSessions.reduce((sum, s) => sum + s.participants.length * 4, 0); // Assume 4 drills per participant
        return {
          drillsCompleted: Math.round(totalDrills * 0.8),
          averageAccuracy: Math.round(Math.random() * 20 + 75), // 75-95%
          averageTime: Math.round(Math.random() * 30 + 45), // 45-75 seconds
          errorRate: Math.round(Math.random() * 15 + 5) // 5-20%
        } as TypeSpecificMetrics['agility'];
      }
    }
  };

  const typeInfo = getWorkoutTypeInfo();
  const Icon = typeInfo.icon;
  const metrics = calculateTypeSpecificMetrics();
  
  const totalParticipants = workoutTypeSessions.reduce((sum, s) => sum + s.participants.length, 0);
  const activeParticipants = workoutTypeSessions.reduce((sum, s) => 
    sum + s.participants.filter(p => p.status === 'connected').length, 0
  );
  const averageProgress = workoutTypeSessions.length > 0 
    ? Math.round(workoutTypeSessions.reduce((sum, s) => sum + s.progress, 0) / workoutTypeSessions.length)
    : 0;

  const renderStrengthMetrics = (strengthMetrics: TypeSpecificMetrics['strength']) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{strengthMetrics.totalSets}</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.strength.totalSets')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{strengthMetrics.averageWeight}kg</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.strength.avgWeight')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{strengthMetrics.totalVolume}</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.strength.totalVolume')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{strengthMetrics.completionRate}%</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.completion')}</div>
      </div>
    </div>
  );

  const renderConditioningMetrics = (conditioningMetrics: TypeSpecificMetrics['conditioning']) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{conditioningMetrics.averageHeartRate}</div>
          <div className="text-xs text-gray-600">bpm avg</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{conditioningMetrics.averagePower}W</div>
          <div className="text-xs text-gray-600">{t('bundle.monitoring.conditioning.avgPower')}</div>
        </div>
      </div>
      
      {/* Zone Distribution */}
      <div>
        <div className="text-sm font-medium mb-2">{t('bundle.monitoring.conditioning.zoneDistribution')}</div>
        <div className="flex gap-1">
          {Object.entries(conditioningMetrics.zoneDistribution).map(([zone, count]) => (
            <div key={zone} className="flex-1">
              <div className={cn(
                "h-2 rounded",
                zone === 'zone1' && "bg-gray-400",
                zone === 'zone2' && "bg-blue-400",
                zone === 'zone3' && "bg-green-400",
                zone === 'zone4' && "bg-yellow-400",
                zone === 'zone5' && "bg-red-400"
              )} style={{ height: `${Math.max(8, (count / totalParticipants) * 32)}px` }} />
              <div className="text-xs text-center mt-1">{zone.replace('zone', 'Z')}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{conditioningMetrics.totalCalories}</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.conditioning.totalCalories')}</div>
      </div>
    </div>
  );

  const renderHybridMetrics = (hybridMetrics: TypeSpecificMetrics['hybrid']) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{hybridMetrics.exerciseBlocks}</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.hybrid.exerciseBlocks')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{hybridMetrics.intervalBlocks}</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.hybrid.intervalBlocks')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{hybridMetrics.averageBlockDuration}m</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.hybrid.avgBlockDuration')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{hybridMetrics.overallIntensity}%</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.hybrid.overallIntensity')}</div>
      </div>
    </div>
  );

  const renderAgilityMetrics = (agilityMetrics: TypeSpecificMetrics['agility']) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{agilityMetrics.drillsCompleted}</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.agility.drillsCompleted')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{agilityMetrics.averageAccuracy}%</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.agility.avgAccuracy')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{agilityMetrics.averageTime}s</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.agility.avgTime')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{agilityMetrics.errorRate}%</div>
        <div className="text-xs text-gray-600">{t('bundle.monitoring.agility.errorRate')}</div>
      </div>
    </div>
  );

  return (
    <Card className={cn("border-l-4", typeInfo.borderColor, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className={cn("p-2 rounded-full", typeInfo.bgColor, typeInfo.textColor)}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="capitalize">{workoutType}</span>
          <Badge variant="secondary" className="ml-auto">
            {workoutTypeSessions.length} {workoutTypeSessions.length === 1 ? 'session' : 'sessions'}
          </Badge>
        </CardTitle>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{activeParticipants}/{totalParticipants} active</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span>{averageProgress}% complete</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">{t('bundle.monitoring.overallProgress')}</span>
            <span className="font-medium">{averageProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                typeInfo.textColor.replace('text-', 'bg-').replace('-600', '-500')
              )}
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>

        {/* Type-Specific Metrics */}
        <div>
          {workoutType === 'strength' && metrics && renderStrengthMetrics(metrics as TypeSpecificMetrics['strength'])}
          {workoutType === 'conditioning' && metrics && renderConditioningMetrics(metrics as TypeSpecificMetrics['conditioning'])}
          {workoutType === 'hybrid' && metrics && renderHybridMetrics(metrics as TypeSpecificMetrics['hybrid'])}
          {workoutType === 'agility' && metrics && renderAgilityMetrics(metrics as TypeSpecificMetrics['agility'])}
        </div>
      </CardContent>
    </Card>
  );
};