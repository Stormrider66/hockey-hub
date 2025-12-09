'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Target, Flame, Heart } from '@/components/icons';
import { WorkoutEquipmentType } from '../../types/conditioning.types';

export interface IntervalTemplate {
  id: string;
  name: string;
  description: string;
  category: 'hiit' | 'endurance' | 'test' | 'recovery';
  equipment: WorkoutEquipmentType[];
  intervals: Array<{
    type: 'warmup' | 'work' | 'rest' | 'active_recovery' | 'cooldown';
    name: string;
    primaryMetric: 'time' | 'distance' | 'calories' | 'watts' | 'heartRate';
    targetValue: number;
    duration: number;
    setConfig?: {
      numberOfSets: number;
      intervalsPerSet: number;
      restBetweenSets: number;
      restBetweenIntervals: number;
    };
  }>;
  totalDuration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const INTERVAL_TEMPLATES: IntervalTemplate[] = [
  {
    id: 'tabata-classic',
    name: 'Classic Tabata',
    description: '8 rounds of 20s work, 10s rest - maximum intensity',
    category: 'hiit',
    equipment: [WorkoutEquipmentType.ROWING, WorkoutEquipmentType.BIKE_ERG, WorkoutEquipmentType.AIRBIKE],
    intervals: [
      {
        type: 'warmup',
        name: 'Warm-up',
        primaryMetric: 'time',
        targetValue: 300,
        duration: 300
      },
      {
        type: 'work',
        name: 'Tabata Intervals',
        primaryMetric: 'time',
        targetValue: 20,
        duration: 20,
        setConfig: {
          numberOfSets: 1,
          intervalsPerSet: 8,
          restBetweenSets: 0,
          restBetweenIntervals: 10
        }
      },
      {
        type: 'cooldown',
        name: 'Cool-down',
        primaryMetric: 'time',
        targetValue: 300,
        duration: 300
      }
    ],
    totalDuration: 14,
    difficulty: 'advanced'
  },
  {
    id: '30-30-intervals',
    name: '30/30 Intervals',
    description: '30 seconds work, 30 seconds rest - great for building aerobic power',
    category: 'hiit',
    equipment: [WorkoutEquipmentType.RUNNING, WorkoutEquipmentType.ROWING, WorkoutEquipmentType.BIKE_ERG],
    intervals: [
      {
        type: 'warmup',
        name: 'Warm-up',
        primaryMetric: 'time',
        targetValue: 600,
        duration: 600
      },
      {
        type: 'work',
        name: '30/30 Work',
        primaryMetric: 'time',
        targetValue: 30,
        duration: 30,
        setConfig: {
          numberOfSets: 3,
          intervalsPerSet: 10,
          restBetweenSets: 180,
          restBetweenIntervals: 30
        }
      },
      {
        type: 'cooldown',
        name: 'Cool-down',
        primaryMetric: 'time',
        targetValue: 300,
        duration: 300
      }
    ],
    totalDuration: 51,
    difficulty: 'intermediate'
  },
  {
    id: 'pyramid-intervals',
    name: 'Pyramid Intervals',
    description: 'Progressive intervals: 1-2-3-4-3-2-1 minutes',
    category: 'endurance',
    equipment: [WorkoutEquipmentType.ROWING, WorkoutEquipmentType.RUNNING, WorkoutEquipmentType.BIKE_ERG],
    intervals: [
      {
        type: 'warmup',
        name: 'Warm-up',
        primaryMetric: 'time',
        targetValue: 600,
        duration: 600
      },
      {
        type: 'work',
        name: '1 min interval',
        primaryMetric: 'time',
        targetValue: 60,
        duration: 60
      },
      {
        type: 'rest',
        name: 'Rest',
        primaryMetric: 'time',
        targetValue: 60,
        duration: 60
      },
      {
        type: 'work',
        name: '2 min interval',
        primaryMetric: 'time',
        targetValue: 120,
        duration: 120
      },
      {
        type: 'rest',
        name: 'Rest',
        primaryMetric: 'time',
        targetValue: 90,
        duration: 90
      },
      {
        type: 'work',
        name: '3 min interval',
        primaryMetric: 'time',
        targetValue: 180,
        duration: 180
      },
      {
        type: 'rest',
        name: 'Rest',
        primaryMetric: 'time',
        targetValue: 120,
        duration: 120
      },
      {
        type: 'work',
        name: '4 min interval',
        primaryMetric: 'time',
        targetValue: 240,
        duration: 240
      },
      {
        type: 'rest',
        name: 'Rest',
        primaryMetric: 'time',
        targetValue: 120,
        duration: 120
      },
      {
        type: 'work',
        name: '3 min interval',
        primaryMetric: 'time',
        targetValue: 180,
        duration: 180
      },
      {
        type: 'rest',
        name: 'Rest',
        primaryMetric: 'time',
        targetValue: 90,
        duration: 90
      },
      {
        type: 'work',
        name: '2 min interval',
        primaryMetric: 'time',
        targetValue: 120,
        duration: 120
      },
      {
        type: 'rest',
        name: 'Rest',
        primaryMetric: 'time',
        targetValue: 60,
        duration: 60
      },
      {
        type: 'work',
        name: '1 min interval',
        primaryMetric: 'time',
        targetValue: 60,
        duration: 60
      },
      {
        type: 'cooldown',
        name: 'Cool-down',
        primaryMetric: 'time',
        targetValue: 300,
        duration: 300
      }
    ],
    totalDuration: 44,
    difficulty: 'intermediate'
  },
  {
    id: '2k-test-prep',
    name: '2K Test Preparation',
    description: 'Specific intervals to prepare for 2000m rowing test',
    category: 'test',
    equipment: [WorkoutEquipmentType.ROWING],
    intervals: [
      {
        type: 'warmup',
        name: 'General Warm-up',
        primaryMetric: 'time',
        targetValue: 600,
        duration: 600
      },
      {
        type: 'work',
        name: '500m Pieces',
        primaryMetric: 'distance',
        targetValue: 500,
        duration: 120, // estimated
        setConfig: {
          numberOfSets: 4,
          intervalsPerSet: 1,
          restBetweenSets: 120,
          restBetweenIntervals: 0
        }
      },
      {
        type: 'cooldown',
        name: 'Cool-down',
        primaryMetric: 'time',
        targetValue: 600,
        duration: 600
      }
    ],
    totalDuration: 34,
    difficulty: 'advanced'
  },
  {
    id: 'ftp-builder',
    name: 'FTP Builder',
    description: 'Sweet spot intervals to increase Functional Threshold Power',
    category: 'endurance',
    equipment: [WorkoutEquipmentType.BIKE_ERG, WorkoutEquipmentType.WATTBIKE],
    intervals: [
      {
        type: 'warmup',
        name: 'Progressive Warm-up',
        primaryMetric: 'time',
        targetValue: 900,
        duration: 900
      },
      {
        type: 'work',
        name: 'Sweet Spot Intervals',
        primaryMetric: 'watts',
        targetValue: 200, // This would be personalized based on FTP
        duration: 600,
        setConfig: {
          numberOfSets: 3,
          intervalsPerSet: 1,
          restBetweenSets: 300,
          restBetweenIntervals: 0
        }
      },
      {
        type: 'cooldown',
        name: 'Cool-down',
        primaryMetric: 'time',
        targetValue: 600,
        duration: 600
      }
    ],
    totalDuration: 65,
    difficulty: 'intermediate'
  }
];

interface IntervalTemplatesProps {
  onSelectTemplate: (template: IntervalTemplate) => void;
  currentEquipment: WorkoutEquipmentType;
}

export default function IntervalTemplates({ onSelectTemplate, currentEquipment }: IntervalTemplatesProps) {
  const compatibleTemplates = INTERVAL_TEMPLATES.filter(
    template => template.equipment.includes(currentEquipment)
  );

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'hiit': return 'bg-red-100 text-red-700';
      case 'endurance': return 'bg-blue-100 text-blue-700';
      case 'test': return 'bg-purple-100 text-purple-700';
      case 'recovery': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'time': return Clock;
      case 'distance': return Target;
      case 'calories': return Flame;
      case 'watts': return Zap;
      case 'heartRate': return Heart;
      default: return Clock;
    }
  };

  if (compatibleTemplates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No templates available for {currentEquipment} equipment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {compatibleTemplates.map((template) => (
        <Card key={template.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
            <div className="flex gap-2 mt-2">
              <Badge className={getCategoryBadgeColor(template.category)}>
                {template.category}
              </Badge>
              <Badge className={getDifficultyBadgeColor(template.difficulty)}>
                {template.difficulty}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {template.totalDuration} min
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium">Workout Structure:</p>
              <div className="space-y-1">
                {template.intervals.slice(0, 3).map((interval, idx) => {
                  const Icon = getMetricIcon(interval.primaryMetric);
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="h-3 w-3" />
                      <span>{interval.name}</span>
                      {interval.setConfig && (
                        <Badge variant="outline" className="text-xs">
                          {interval.setConfig.numberOfSets}×{interval.setConfig.intervalsPerSet}
                        </Badge>
                      )}
                    </div>
                  );
                })}
                {template.intervals.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{template.intervals.length - 3} more intervals
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => onSelectTemplate(template)}
              className="w-full"
              size="sm"
            >
              Use Template
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}