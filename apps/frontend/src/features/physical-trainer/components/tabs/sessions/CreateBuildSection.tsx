'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, Heart, Zap, Target, ChevronDown, ChevronUp, 
  Hammer, Clock, TrendingUp, Users, Shield, Waves
} from '@/components/icons';
import type { WorkoutBuilderType } from '../../builders/LazyWorkoutBuilderLoader';

interface WorkoutTypeConfig {
  id: WorkoutBuilderType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  badge?: string;
}

interface WorkoutTypeCardProps {
  type: WorkoutTypeConfig;
  onClick: () => void;
  stats?: {
    weekCount: number;
    lastUsed?: Date;
  };
  showStats?: boolean;
  showLastUsed?: boolean;
}

const WorkoutTypeCard: React.FC<WorkoutTypeCardProps> = ({
  type,
  onClick,
  stats,
  showStats,
  showLastUsed
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const Icon = type.icon;
  
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return t('common:time.justNow');
    if (hours < 24) return t('common:time.hoursAgo', { count: hours });
    if (days < 7) return t('common:time.daysAgo', { count: days });
    return t('common:time.weeksAgo', { count: Math.floor(days / 7) });
  };
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className={`p-3 rounded-lg ${type.bgColor} mb-3 group-hover:scale-105 transition-transform`}>
          <Icon className="h-8 w-8" style={{ color: type.color }} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{type.label}</h4>
            {type.badge && (
              <Badge variant="secondary" className="text-xs">
                {type.badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {type.description}
          </p>
        </div>
        
        {showStats && stats && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('sessions.thisWeek')}:</span>
              <span className="font-medium">{stats.weekCount}</span>
            </div>
            {showLastUsed && stats.lastUsed && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">{t('sessions.lastUsed')}:</span>
                <span>{formatRelativeTime(stats.lastUsed)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CreateBuildSectionProps {
  onSelectWorkoutType: (type: WorkoutBuilderType) => void;
  workoutStats?: Record<WorkoutBuilderType, { weekCount: number; lastUsed?: Date }>;
}

export const CreateBuildSection: React.FC<CreateBuildSectionProps> = ({ 
  onSelectWorkoutType,
  workoutStats = {}
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [showAll, setShowAll] = useState(false);
  
  // Primary workout types (always visible)
  const primaryTypes: WorkoutTypeConfig[] = [
    {
      id: 'strength',
      label: t('workoutTypes.strength.label'),
      description: t('workoutTypes.strength.description'),
      icon: Dumbbell,
      color: '#3B82F6',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'conditioning',
      label: t('workoutTypes.conditioning.label'),
      description: t('workoutTypes.conditioning.description'),
      icon: Heart,
      color: '#EF4444',
      bgColor: 'bg-red-50'
    },
    {
      id: 'hybrid',
      label: t('workoutTypes.hybrid.label'),
      description: t('workoutTypes.hybrid.description'),
      icon: Zap,
      color: '#8B5CF6',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'agility',
      label: t('workoutTypes.agility.label'),
      description: t('workoutTypes.agility.description'),
      icon: Target,
      color: '#F97316',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'flexibility',
      label: t('workoutTypes.flexibility.label'),
      description: t('workoutTypes.flexibility.description'),
      icon: Waves,
      color: '#10B981',
      bgColor: 'bg-green-50'
    },
    {
      id: 'wrestling',
      label: t('workoutTypes.wrestling.label'),
      description: t('workoutTypes.wrestling.description'),
      icon: Shield,
      color: '#6366F1',
      bgColor: 'bg-indigo-50'
    }
  ];
  
  // Secondary types (hidden by default) - for future expansion
  const secondaryTypes: WorkoutTypeConfig[] = [
    // These can be added later as new workout types are developed
  ];
  
  // Mock stats for demonstration - replace with real data
  const mockStats = {
    strength: { weekCount: 12, lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    conditioning: { weekCount: 8, lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    hybrid: { weekCount: 5, lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    agility: { weekCount: 7, lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    flexibility: { weekCount: 3, lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    wrestling: { weekCount: 2, lastUsed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-blue-500" />
            <CardTitle>{t('sessions.createBuild.title')}</CardTitle>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t('sessions.createBuild.shortcut')}
          </Badge>
        </div>
        <CardDescription>
          {t('sessions.createBuild.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Primary Types Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {primaryTypes.map(type => (
            <WorkoutTypeCard
              key={type.id}
              type={type}
              onClick={() => onSelectWorkoutType(type.id)}
              stats={workoutStats[type.id] || mockStats[type.id]}
              showStats={true}
              showLastUsed={true}
            />
          ))}
        </div>
        
        {/* Expandable Secondary Types */}
        {showAll && secondaryTypes.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4 animate-in slide-in-from-top">
            {secondaryTypes.map(type => (
              <WorkoutTypeCard
                key={type.id}
                type={type}
                onClick={() => onSelectWorkoutType(type.id)}
                stats={workoutStats[type.id]}
                showStats={true}
              />
            ))}
          </div>
        )}
        
        {/* Toggle Button - only show if there are secondary types */}
        {secondaryTypes.length > 0 && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                {t('sessions.createBuild.showLess')}
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                {t('sessions.createBuild.showAll', { count: secondaryTypes.length })}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};