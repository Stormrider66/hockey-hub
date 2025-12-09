'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Clock,
  Users,
  Zap,
  Target,
  TrendingUp,
  Star,
  ArrowRight,
  Filter
} from 'lucide-react';
import type { AgilityTemplate } from '../../types/agility.types';
import { estimateAgilityDuration } from '../../types/agility.types';
import { useTranslation } from 'react-i18next';

interface AgilityTemplatesProps {
  onSelectTemplate: (template: AgilityTemplate) => void;
}

// Sample templates
const AGILITY_TEMPLATES: AgilityTemplate[] = [
  {
    id: 'template-1',
    name: 'Speed Development Program',
    description: 'Comprehensive speed and acceleration training for hockey players',
    category: 'speed',
    program: {
      name: 'Speed Development Program',
      drills: [
        {
          id: 'd1',
          name: 'Dynamic Warm-up Ladder',
          category: 'ladder_drills',
          pattern: 'custom',
          equipment: ['ladder'],
          restBetweenReps: 0,
          reps: 1,
          description: 'Progressive ladder warm-up sequence',
          instructions: ['High knees', 'In-in-out-out', 'Lateral shuffle', 'Ickey shuffle'],
          coachingCues: ['Stay on balls of feet', 'Quick ground contact'],
          difficulty: 'beginner',
          metrics: { time: true, accuracy: false }
        },
        {
          id: 'd2',
          name: 'Acceleration Starts',
          category: 'change_of_direction',
          pattern: 'custom',
          equipment: ['cones'],
          targetTime: 3,
          restBetweenReps: 60,
          reps: 5,
          description: '10-yard explosive starts from various positions',
          instructions: ['3-point stance start', 'Sprint 10 yards', 'Focus on first 3 steps'],
          coachingCues: ['Drive knees', 'Forward lean', 'Powerful arm drive'],
          difficulty: 'intermediate',
          metrics: { time: true, accuracy: false }
        },
        {
          id: 'd3',
          name: 'T-Drill',
          category: 'cone_drills',
          pattern: 't_drill',
          equipment: ['cones'],
          targetTime: 10,
          restBetweenReps: 45,
          reps: 3,
          sets: 2,
          description: 'Classic agility test for lateral movement',
          instructions: ['Sprint forward', 'Shuffle left', 'Shuffle right', 'Shuffle center', 'Backpedal'],
          coachingCues: ['Stay low', 'Quick feet', 'Touch each cone'],
          difficulty: 'intermediate',
          metrics: { time: true, accuracy: true }
        }
      ],
      warmupDuration: 300,
      cooldownDuration: 300,
      totalDuration: 1800,
      equipmentNeeded: ['cones', 'ladder'],
      difficulty: 'intermediate',
      focusAreas: ['acceleration', 'lateral_movement', 'change_of_direction']
    },
    recommendedFor: ['forwards', 'defensemen'],
    sportSpecific: ['ice_hockey'],
    createdBy: 'System',
    isPublic: true
  },
  {
    id: 'template-2',
    name: 'Reaction & Decision Making',
    description: 'Improve reaction time and decision making under pressure',
    category: 'reaction',
    program: {
      name: 'Reaction & Decision Making',
      drills: [
        {
          id: 'd1',
          name: 'Mirror Drill',
          category: 'reaction_drills',
          pattern: 'custom',
          equipment: ['none'],
          duration: 20,
          restBetweenReps: 30,
          reps: 5,
          description: 'Partner-based reaction training',
          instructions: ['Face partner', 'Mirror movements', 'Stay in athletic stance'],
          coachingCues: ['Quick reactions', 'Stay balanced', 'Anticipate movements'],
          difficulty: 'beginner',
          metrics: { time: false, accuracy: true }
        },
        {
          id: 'd2',
          name: 'Reaction Ball Chaos',
          category: 'reaction_drills',
          pattern: 'custom',
          equipment: ['reaction_ball'],
          duration: 30,
          restBetweenReps: 30,
          reps: 6,
          description: 'Multi-directional reaction training',
          instructions: ['Drop ball from shoulder height', 'React and catch', 'Vary angles'],
          coachingCues: ['Track with eyes', 'React with whole body', 'Soft hands'],
          difficulty: 'intermediate',
          metrics: { time: false, accuracy: true, touches: true }
        },
        {
          id: 'd3',
          name: 'Light Reaction Training',
          category: 'reaction_drills',
          pattern: 'custom',
          equipment: ['lights'],
          duration: 45,
          restBetweenReps: 45,
          reps: 4,
          description: 'Visual stimulus reaction training',
          instructions: ['React to light signals', 'Touch indicated targets', 'Return to center'],
          coachingCues: ['Peripheral vision', 'Explosive movements', 'Quick recovery'],
          difficulty: 'advanced',
          metrics: { time: true, accuracy: true }
        }
      ],
      warmupDuration: 300,
      cooldownDuration: 240,
      totalDuration: 1500,
      equipmentNeeded: ['reaction_ball', 'lights'],
      difficulty: 'intermediate',
      focusAreas: ['reaction_time', 'decision_making', 'hand_eye_coordination']
    },
    recommendedFor: ['goalies', 'all_players'],
    sportSpecific: ['ice_hockey'],
    createdBy: 'System',
    isPublic: true
  },
  {
    id: 'template-3',
    name: 'Pre-Season Agility Test',
    description: 'Standardized agility testing protocol for baseline measurements',
    category: 'test',
    program: {
      name: 'Pre-Season Agility Test',
      drills: [
        {
          id: 'd1',
          name: '5-10-5 Pro Agility',
          category: 'change_of_direction',
          pattern: '5_10_5',
          equipment: ['cones'],
          targetTime: 5,
          restBetweenReps: 120,
          reps: 3,
          description: 'Standard pro agility test',
          instructions: ['Start at center', 'Sprint 5 yards right', 'Sprint 10 yards left', 'Sprint 5 yards center'],
          coachingCues: ['Touch lines', 'Low stance', 'Maximum effort'],
          difficulty: 'intermediate',
          metrics: { time: true, accuracy: true }
        },
        {
          id: 'd2',
          name: 'L-Drill Test',
          category: 'cone_drills',
          pattern: 'l_drill',
          equipment: ['cones'],
          targetTime: 7,
          restBetweenReps: 120,
          reps: 3,
          description: 'L-shaped agility test',
          instructions: ['Sprint to cone 1', 'Sprint to cone 2', 'Sprint around cone 3', 'Return same path'],
          coachingCues: ['Tight turns', 'Maintain speed', 'Proper deceleration'],
          difficulty: 'intermediate',
          metrics: { time: true, accuracy: true }
        },
        {
          id: 'd3',
          name: 'Hexagon Test',
          category: 'balance_coordination',
          pattern: 'hexagon',
          equipment: ['markers'],
          duration: 60,
          restBetweenReps: 120,
          reps: 2,
          description: 'Multi-directional agility and balance test',
          instructions: ['Start in center', 'Jump to each point', 'Return to center', 'Complete 3 full rotations'],
          coachingCues: ['Quick ground contact', 'Maintain balance', 'Consistent pattern'],
          difficulty: 'advanced',
          metrics: { time: true, accuracy: true, touches: true }
        }
      ],
      warmupDuration: 600,
      cooldownDuration: 300,
      totalDuration: 1800,
      equipmentNeeded: ['cones', 'markers'],
      difficulty: 'intermediate',
      focusAreas: ['testing', 'baseline_measurement', 'performance_assessment']
    },
    recommendedFor: ['all_players'],
    sportSpecific: ['ice_hockey'],
    createdBy: 'System',
    isPublic: true
  },
  {
    id: 'template-4',
    name: 'Youth Agility Fundamentals',
    description: 'Fun and engaging agility drills for youth players (U12-U14)',
    category: 'footwork',
    program: {
      name: 'Youth Agility Fundamentals',
      drills: [
        {
          id: 'd1',
          name: 'Follow the Leader',
          category: 'reaction_drills',
          pattern: 'custom',
          equipment: ['cones'],
          duration: 60,
          restBetweenReps: 30,
          reps: 3,
          description: 'Fun group drill for movement patterns',
          instructions: ['Leader performs movements', 'Group follows', 'Include various movements'],
          coachingCues: ['Have fun', 'Stay focused', 'Quality movements'],
          difficulty: 'beginner',
          metrics: { time: false, accuracy: false }
        },
        {
          id: 'd2',
          name: 'Ladder Races',
          category: 'ladder_drills',
          pattern: 'custom',
          equipment: ['ladder'],
          restBetweenReps: 45,
          reps: 4,
          description: 'Competitive ladder drill variations',
          instructions: ['Two feet in each', 'One foot in each', 'Lateral shuffle', 'Race format'],
          coachingCues: ['Proper form first', 'Then add speed', 'Encourage effort'],
          difficulty: 'beginner',
          metrics: { time: true, accuracy: false }
        },
        {
          id: 'd3',
          name: 'Cone Weave Relay',
          category: 'cone_drills',
          pattern: 'zig_zag',
          equipment: ['cones'],
          restBetweenReps: 60,
          reps: 4,
          description: 'Team relay through cone course',
          instructions: ['Weave through cones', 'Tag teammate', 'First team done wins'],
          coachingCues: ['Control speed', 'Tight turns', 'Team encouragement'],
          difficulty: 'beginner',
          metrics: { time: true, accuracy: false }
        }
      ],
      warmupDuration: 300,
      cooldownDuration: 300,
      totalDuration: 1500,
      equipmentNeeded: ['cones', 'ladder'],
      difficulty: 'beginner',
      focusAreas: ['fundamental_movements', 'coordination', 'fun_engagement']
    },
    recommendedFor: ['youth_players'],
    sportSpecific: ['ice_hockey'],
    createdBy: 'System',
    isPublic: true
  }
];

export default function AgilityTemplates({ onSelectTemplate }: AgilityTemplatesProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'speed' | 'reaction' | 'footwork' | 'test'>('all');

  const filteredTemplates = AGILITY_TEMPLATES.filter(
    template => selectedCategory === 'all' || template.category === selectedCategory
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('physicalTrainer:agility.templates.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('physicalTrainer:agility.templates.subtitle')}
          </p>
        </CardHeader>
      </Card>

      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="speed">Speed</TabsTrigger>
          <TabsTrigger value="reaction">Reaction</TabsTrigger>
          <TabsTrigger value="footwork">Footwork</TabsTrigger>
          <TabsTrigger value="test">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => onSelectTemplate(template)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateCard({ 
  template, 
  onSelect 
}: { 
  template: AgilityTemplate; 
  onSelect: () => void;
}) {
  const duration = estimateAgilityDuration(template.program);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-all" onClick={onSelect}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
            <p className="text-sm text-muted-foreground">{template.description}</p>
          </div>
          <Button size="sm" variant="ghost">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-medium">{Math.round(duration / 60)} min</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>
          <div className="text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-medium">{template.program.drills.length}</div>
            <div className="text-xs text-muted-foreground">Drills</div>
          </div>
          <div className="text-center">
            <Zap className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-medium capitalize">{template.program.difficulty}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
          <div className="text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-medium">{template.recommendedFor?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Target Groups</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {template.program.equipmentNeeded.map(equipment => (
            <Badge key={equipment} variant="secondary" className="text-xs">
              {equipment}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {template.program.focusAreas.map(area => (
            <Badge key={area} variant="outline" className="text-xs">
              {area.replace('_', ' ')}
            </Badge>
          ))}
        </div>

        {template.category === 'test' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
            <Star className="h-4 w-4" />
            <span>Standardized testing protocol</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}