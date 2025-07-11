'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Zap, 
  Search,
  FileText,
  TrendingUp,
  Heart,
  Timer,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WorkoutTemplate, WorkoutEquipmentType, IntervalSet } from '../../types/conditioning.types';

interface WorkoutTemplateLibraryProps {
  onSelect: (template: WorkoutTemplate) => void;
  equipment?: WorkoutEquipmentType;
}

// Pre-built workout templates
const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'hiit-1',
    name: '20-Minute HIIT',
    category: 'hiit',
    description: 'High-intensity interval training with 30s work, 30s rest',
    intervalProgram: {
      name: '20-Minute HIIT',
      description: 'High-intensity interval training with 30s work, 30s rest',
      equipment: 'rowing' as WorkoutEquipmentType,
      intervals: [
        {
          id: '1',
          type: 'warmup',
          duration: 300,
          equipment: 'rowing' as WorkoutEquipmentType,
          targetMetrics: { heartRate: { type: 'percentage', value: 60, reference: 'max' } },
          color: '#10b981'
        },
        ...Array(10).fill(null).flatMap((_, i) => [
          {
            id: `work-${i}`,
            type: 'work' as const,
            duration: 30,
            equipment: 'rowing' as WorkoutEquipmentType,
            targetMetrics: { 
              heartRate: { type: 'percentage', value: 85, reference: 'max' },
              pace: { type: 'absolute', value: 125 } // 2:05/500m
            },
            color: '#ef4444'
          },
          {
            id: `rest-${i}`,
            type: 'rest' as const,
            duration: 30,
            equipment: 'rowing' as WorkoutEquipmentType,
            targetMetrics: { heartRate: { type: 'percentage', value: 60, reference: 'max' } },
            color: '#3b82f6'
          }
        ]),
        {
          id: 'cooldown',
          type: 'cooldown',
          duration: 300,
          equipment: 'rowing' as WorkoutEquipmentType,
          targetMetrics: { heartRate: { type: 'percentage', value: 50, reference: 'max' } },
          color: '#6366f1'
        }
      ],
      totalDuration: 1200,
      estimatedCalories: 250
    },
    recommendedFor: ['All levels'],
    isPublic: true
  },
  {
    id: 'steady-1',
    name: '30-Minute Steady State',
    category: 'steady_state',
    description: 'Aerobic base building at consistent pace',
    intervalProgram: {
      name: '30-Minute Steady State',
      description: 'Aerobic base building at consistent pace',
      equipment: 'bike_erg' as WorkoutEquipmentType,
      intervals: [
        {
          id: '1',
          type: 'warmup',
          duration: 300,
          equipment: 'bike_erg' as WorkoutEquipmentType,
          targetMetrics: { heartRate: { type: 'percentage', value: 55, reference: 'max' } },
          color: '#10b981'
        },
        {
          id: '2',
          type: 'work',
          duration: 1200,
          equipment: 'bike_erg' as WorkoutEquipmentType,
          targetMetrics: { 
            heartRate: { type: 'percentage', value: 70, reference: 'max' },
            watts: { type: 'percentage', value: 65, reference: 'ftp' }
          },
          color: '#3b82f6'
        },
        {
          id: '3',
          type: 'cooldown',
          duration: 300,
          equipment: 'bike_erg' as WorkoutEquipmentType,
          targetMetrics: { heartRate: { type: 'percentage', value: 50, reference: 'max' } },
          color: '#6366f1'
        }
      ],
      totalDuration: 1800,
      estimatedCalories: 300
    },
    recommendedFor: ['Beginners', 'Base building'],
    isPublic: true
  },
  {
    id: 'pyramid-1',
    name: 'Pyramid Intervals',
    category: 'pyramid',
    description: 'Progressive intervals: 1-2-3-2-1 minutes',
    intervalProgram: {
      name: 'Pyramid Intervals',
      description: 'Progressive intervals: 1-2-3-2-1 minutes',
      equipment: 'treadmill' as WorkoutEquipmentType,
      intervals: [
        {
          id: 'warmup',
          type: 'warmup',
          duration: 300,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { speed: { type: 'absolute', value: 8 } },
          color: '#10b981'
        },
        {
          id: 'work-1-up',
          type: 'work',
          name: '1 min hard',
          duration: 60,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { 
            heartRate: { type: 'percentage', value: 80, reference: 'max' },
            speed: { type: 'absolute', value: 14 }
          },
          color: '#ef4444'
        },
        {
          id: 'rest-1',
          type: 'rest',
          duration: 60,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { speed: { type: 'absolute', value: 6 } },
          color: '#3b82f6'
        },
        {
          id: 'work-2-up',
          type: 'work',
          name: '2 min hard',
          duration: 120,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { 
            heartRate: { type: 'percentage', value: 85, reference: 'max' },
            speed: { type: 'absolute', value: 13 }
          },
          color: '#ef4444'
        },
        {
          id: 'rest-2',
          type: 'rest',
          duration: 90,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { speed: { type: 'absolute', value: 6 } },
          color: '#3b82f6'
        },
        {
          id: 'work-3',
          type: 'work',
          name: '3 min hard',
          duration: 180,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { 
            heartRate: { type: 'percentage', value: 90, reference: 'max' },
            speed: { type: 'absolute', value: 12 }
          },
          color: '#ef4444'
        },
        {
          id: 'rest-3',
          type: 'rest',
          duration: 120,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { speed: { type: 'absolute', value: 6 } },
          color: '#3b82f6'
        },
        {
          id: 'work-2-down',
          type: 'work',
          name: '2 min hard',
          duration: 120,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { 
            heartRate: { type: 'percentage', value: 85, reference: 'max' },
            speed: { type: 'absolute', value: 13 }
          },
          color: '#ef4444'
        },
        {
          id: 'rest-4',
          type: 'rest',
          duration: 90,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { speed: { type: 'absolute', value: 6 } },
          color: '#3b82f6'
        },
        {
          id: 'work-1-down',
          type: 'work',
          name: '1 min hard',
          duration: 60,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { 
            heartRate: { type: 'percentage', value: 80, reference: 'max' },
            speed: { type: 'absolute', value: 14 }
          },
          color: '#ef4444'
        },
        {
          id: 'cooldown',
          type: 'cooldown',
          duration: 300,
          equipment: 'treadmill' as WorkoutEquipmentType,
          targetMetrics: { speed: { type: 'absolute', value: 6 } },
          color: '#6366f1'
        }
      ],
      totalDuration: 1560,
      estimatedCalories: 280
    },
    recommendedFor: ['Intermediate', 'Advanced'],
    isPublic: true
  },
  {
    id: 'ftp-test',
    name: 'FTP Test (20 min)',
    category: 'test',
    description: 'Functional Threshold Power test protocol',
    intervalProgram: {
      name: 'FTP Test (20 min)',
      description: 'Functional Threshold Power test protocol',
      equipment: 'wattbike' as WorkoutEquipmentType,
      intervals: [
        {
          id: '1',
          type: 'warmup',
          duration: 600,
          equipment: 'wattbike' as WorkoutEquipmentType,
          targetMetrics: { 
            heartRate: { type: 'percentage', value: 65, reference: 'max' },
            rpm: 90
          },
          color: '#10b981'
        },
        {
          id: '2',
          type: 'work',
          name: '20 min TT',
          duration: 1200,
          equipment: 'wattbike' as WorkoutEquipmentType,
          targetMetrics: { 
            heartRate: { type: 'percentage', value: 95, reference: 'threshold' }
          },
          notes: 'All-out effort for 20 minutes. FTP = Average watts × 0.95',
          color: '#ef4444'
        },
        {
          id: '3',
          type: 'cooldown',
          duration: 600,
          equipment: 'wattbike' as WorkoutEquipmentType,
          targetMetrics: { 
            heartRate: { type: 'percentage', value: 55, reference: 'max' }
          },
          color: '#6366f1'
        }
      ],
      totalDuration: 2400,
      estimatedCalories: 400
    },
    recommendedFor: ['Advanced', 'Testing'],
    isPublic: true
  }
];

export default function WorkoutTemplateLibrary({
  onSelect,
  equipment
}: WorkoutTemplateLibraryProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = WORKOUT_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesEquipment = !equipment || template.intervalProgram.equipment === equipment;
    
    return matchesSearch && matchesCategory && matchesEquipment;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hiit': return <Timer className="h-4 w-4" />;
      case 'steady_state': return <Heart className="h-4 w-4" />;
      case 'pyramid': return <TrendingUp className="h-4 w-4" />;
      case 'test': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filters */}
      <div className="space-y-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('physicalTrainer:conditioning.templates.search')}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="hiit">HIIT</TabsTrigger>
            <TabsTrigger value="steady_state">Steady</TabsTrigger>
            <TabsTrigger value="pyramid">Pyramid</TabsTrigger>
            <TabsTrigger value="test">Tests</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Template Grid */}
      <ScrollArea className="flex-1">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onSelect(template)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(template.category)}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(template.intervalProgram.totalDuration)}
                  </Badge>
                  <Badge variant="outline">
                    <Zap className="h-3 w-3 mr-1" />
                    {template.intervalProgram.estimatedCalories} cal
                  </Badge>
                  <Badge variant="secondary">
                    {template.intervalProgram.equipment.replace('_', ' ')}
                  </Badge>
                </div>

                {template.recommendedFor && (
                  <div className="flex flex-wrap gap-1">
                    {template.recommendedFor.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('physicalTrainer:conditioning.templates.noResults')}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}