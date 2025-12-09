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
  PieChart,
  Users,
  Activity
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { BundleSession } from '../bulk-sessions.types';

interface WorkoutTypeDistributionProps {
  sessions: BundleSession[];
  className?: string;
}

interface WorkoutTypeStats {
  type: BundleSession['workoutType'];
  count: number;
  participants: number;
  averageProgress: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  textColor: string;
}

export const WorkoutTypeDistribution: React.FC<WorkoutTypeDistributionProps> = ({
  sessions,
  className
}) => {
  const { t } = useTranslation('physicalTrainer');

  const getWorkoutTypeStats = (): WorkoutTypeStats[] => {
    const typeGroups = sessions.reduce((acc, session) => {
      if (!acc[session.workoutType]) {
        acc[session.workoutType] = [];
      }
      acc[session.workoutType].push(session);
      return acc;
    }, {} as Record<string, BundleSession[]>);

    return Object.entries(typeGroups).map(([type, typeSessions]) => {
      const totalParticipants = typeSessions.reduce((sum, s) => sum + s.participants.length, 0);
      const averageProgress = typeSessions.length > 0 
        ? Math.round(typeSessions.reduce((sum, s) => sum + s.progress, 0) / typeSessions.length)
        : 0;

      const typeInfo = {
        strength: {
          icon: Dumbbell,
          color: 'blue',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600'
        },
        conditioning: {
          icon: Heart,
          color: 'red',
          bgColor: 'bg-red-50',
          textColor: 'text-red-600'
        },
        hybrid: {
          icon: Zap,
          color: 'purple',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600'
        },
        agility: {
          icon: Target,
          color: 'orange',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600'
        }
      }[type as BundleSession['workoutType']];

      return {
        type: type as BundleSession['workoutType'],
        count: typeSessions.length,
        participants: totalParticipants,
        averageProgress,
        ...typeInfo
      };
    }).sort((a, b) => b.count - a.count); // Sort by count descending
  };

  const typeStats = getWorkoutTypeStats();
  const totalSessions = sessions.length;
  const totalParticipants = sessions.reduce((sum, s) => sum + s.participants.length, 0);

  if (totalSessions === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            {t('bundle.distribution.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            {t('bundle.distribution.noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {t('bundle.distribution.title')}
        </CardTitle>
        <div className="text-sm text-gray-600">
          {totalSessions} {totalSessions === 1 ? 'session' : 'sessions'} • {totalParticipants} participants
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Type Distribution List */}
        <div className="space-y-3">
          {typeStats.map((stat) => {
            const Icon = stat.icon;
            const percentage = Math.round((stat.count / totalSessions) * 100);
            const participantPercentage = Math.round((stat.participants / totalParticipants) * 100);

            return (
              <div key={stat.type} className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full flex-shrink-0", stat.bgColor, stat.textColor)}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium capitalize">{stat.type}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stat.count} {stat.count === 1 ? 'session' : 'sessions'}
                    </Badge>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          stat.type === 'strength' && "bg-blue-500",
                          stat.type === 'conditioning' && "bg-red-500",
                          stat.type === 'hybrid' && "bg-purple-500",
                          stat.type === 'agility' && "bg-orange-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 min-w-[3rem]">{percentage}%</span>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{stat.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>{stat.averageProgress}% complete</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {typeStats.length}
              </div>
              <div className="text-xs text-gray-600">
                {typeStats.length === 1 ? 'Workout Type' : 'Workout Types'}
              </div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(typeStats.reduce((sum, stat) => sum + stat.averageProgress, 0) / typeStats.length) || 0}%
              </div>
              <div className="text-xs text-gray-600">
                {t('bundle.distribution.avgProgress')}
              </div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(totalParticipants / totalSessions)}
              </div>
              <div className="text-xs text-gray-600">
                {t('bundle.distribution.avgParticipants')}
              </div>
            </div>
          </div>
        </div>

        {/* Mixed Bundle Indicator */}
        {typeStats.length > 1 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex -space-x-1">
                {typeStats.slice(0, 3).map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div 
                      key={stat.type}
                      className={cn("p-1 rounded-full border-2 border-white", stat.bgColor, stat.textColor)}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                  );
                })}
                {typeStats.length > 3 && (
                  <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-medium">+{typeStats.length - 3}</span>
                  </div>
                )}
              </div>
              <span className="font-medium text-gray-900">
                {t('bundle.distribution.mixedBundle')}
              </span>
              <Badge variant="outline" className="ml-auto">
                {typeStats.length} types
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};