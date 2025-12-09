'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Plus,
  Target,
  Clock,
  Users,
  Filter,
  Zap,
  Grid3X3,
  Move,
  Repeat,
  Shield,
  Sparkles,
  Activity,
  UserCheck,
  Footprints,
  Flame,
  TrendingUp,
  Shuffle,
  Pause,
  Gamepad2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { AgilityDrill, AgilityDrillCategory, AgilityMode } from '../../types/agility.types';
import { AGILITY_DRILL_LIBRARY, HOCKEY_DRILL_LIBRARY } from '../../types/agility.types';
import { useTranslation } from 'react-i18next';

interface DrillLibraryProps {
  onSelectDrill: (drill: Partial<AgilityDrill>) => void;
  selectedCategory?: AgilityDrillCategory | 'all';
  onCategoryChange?: (category: AgilityDrillCategory | 'all') => void;
  mode?: AgilityMode;
}

const CATEGORY_ICONS: Record<AgilityDrillCategory, React.ReactNode> = {
  cone_drills: <Target className="h-4 w-4" />,
  ladder_drills: <Grid3X3 className="h-4 w-4" />,
  reaction_drills: <Zap className="h-4 w-4" />,
  change_of_direction: <Move className="h-4 w-4" />,
  balance_coordination: <Shield className="h-4 w-4" />,
  sport_specific: <Gamepad2 className="h-4 w-4" />,
  conditioning_drills: <Activity className="h-4 w-4" />,
  full_body_drills: <UserCheck className="h-4 w-4" />,
  footwork_drills: <Footprints className="h-4 w-4" />,
  power_drills: <Flame className="h-4 w-4" />,
  speed_drills: <TrendingUp className="h-4 w-4" />,
  agility_drills: <Shuffle className="h-4 w-4" />,
  rest: <Pause className="h-4 w-4" />
};

const CATEGORY_LABELS: Record<AgilityDrillCategory, string> = {
  cone_drills: 'Cone Drills',
  ladder_drills: 'Ladder Drills',
  reaction_drills: 'Reaction Drills',
  change_of_direction: 'Change of Direction',
  balance_coordination: 'Balance & Coordination',
  sport_specific: 'Hockey Skills',
  conditioning_drills: 'Conditioning Drills',
  full_body_drills: 'Full Body Drills',
  footwork_drills: 'Footwork Drills',
  power_drills: 'Power Drills',
  speed_drills: 'Speed Drills',
  agility_drills: 'Agility Drills',
  rest: 'Rest & Recovery'
};

// Create combined drill library with mode-specific filtering
const getCombinedDrillLibrary = (mode: AgilityMode = 'agility'): Partial<AgilityDrill>[] => {
  if (mode === 'sport_specific') {
    return [...AGILITY_DRILL_LIBRARY, ...HOCKEY_DRILL_LIBRARY];
  }
  return AGILITY_DRILL_LIBRARY;
};

// Extended drill library with more options - moved outside component to prevent recreation
const EXTENDED_DRILL_LIBRARY: Partial<AgilityDrill>[] = [
  ...AGILITY_DRILL_LIBRARY,
  // Additional drills
  {
    name: '5-10-5 Shuttle',
    category: 'change_of_direction',
    pattern: '5_10_5',
    equipment: ['cones'],
    targetTime: 5,
    restBetweenReps: 45,
    reps: 3,
    description: 'Pro agility drill for explosive direction changes',
    instructions: [
        'Start in 3-point stance at middle cone',
        'Sprint 5 yards to right cone and touch',
        'Sprint 10 yards to left cone and touch',
        'Sprint 5 yards back to middle'
      ],
      coachingCues: [
        'Low center of gravity',
        'Touch line with hand',
        'Explosive direction changes'
      ],
      difficulty: 'advanced',
      metrics: { time: true, accuracy: true }
    },
    {
      name: 'Ickey Shuffle',
      category: 'ladder_drills',
      pattern: 'custom',
      equipment: ['ladder'],
      restBetweenReps: 20,
      reps: 4,
      description: 'Complex footwork pattern for coordination',
      instructions: [
        'Start to side of ladder',
        'Step in with near foot',
        'Follow with far foot',
        'Step out with near foot on opposite side',
        'Repeat pattern'
      ],
      coachingCues: [
        'Quick feet',
        'Stay on balls of feet',
        'Maintain rhythm'
      ],
      difficulty: 'intermediate',
      metrics: { time: true, accuracy: false }
    },
    {
      name: 'Mirror Drill',
      category: 'reaction_drills',
      pattern: 'custom',
      equipment: ['none'],
      duration: 20,
      restBetweenReps: 40,
      reps: 5,
      description: 'Partner reaction drill for game-like movements',
      instructions: [
        'Face partner 2-3 yards apart',
        'Designate leader and follower',
        'Leader moves randomly',
        'Follower mirrors movements',
        'Switch roles each rep'
      ],
      coachingCues: [
        'Stay in athletic stance',
        'React quickly',
        'Keep eyes on partner'
      ],
      difficulty: 'beginner',
      metrics: { time: false, accuracy: true }
    },
    {
      name: 'Box Drill',
      category: 'cone_drills',
      pattern: 'box_drill',
      equipment: ['cones'],
      targetTime: 12,
      restBetweenReps: 45,
      reps: 4,
      description: 'Multi-directional movement pattern',
      instructions: [
        'Set up 4 cones in square (5 yards apart)',
        'Sprint forward to cone 1',
        'Shuffle right to cone 2',
        'Backpedal to cone 3',
        'Carioca left to start'
      ],
      coachingCues: [
        'Maintain square shape',
        'Quick transitions',
        'Proper technique for each movement'
      ],
      difficulty: 'intermediate',
      metrics: { time: true, accuracy: false }
    },
    {
      name: 'Single Leg Hops',
      category: 'balance_coordination',
      pattern: 'custom',
      equipment: ['cones', 'markers'],
      duration: 30,
      restBetweenReps: 30,
      reps: 3,
      sets: 2,
      description: 'Unilateral power and balance development',
      instructions: [
        'Set up line of 5-6 small cones',
        'Hop on one leg over each cone',
        'Land softly and controlled',
        'Alternate legs each set'
      ],
      coachingCues: [
        'Land on ball of foot',
        'Use arms for balance',
        'Control each landing'
      ],
      difficulty: 'intermediate',
      metrics: { time: true, accuracy: false }
    },
    {
      name: 'Hockey Stop & Start',
      category: 'sport_specific',
      pattern: 'custom',
      equipment: ['cones'],
      targetTime: 8,
      restBetweenReps: 40,
      reps: 5,
      description: 'Ice hockey specific movement pattern',
      instructions: [
        'Sprint forward 10 yards',
        'Perform hockey stop (both feet)',
        'Immediately accelerate in opposite direction',
        'Stop at starting point'
      ],
      coachingCues: [
        'Low stance on stops',
        'Quick weight transfer',
        'Explosive starts'
      ],
      difficulty: 'advanced',
      metrics: { time: true, accuracy: true }
    },
    // Rest periods
    {
      name: 'Active Recovery',
      category: 'rest',
      pattern: 'custom',
      equipment: ['none'],
      duration: 60,
      restBetweenReps: 0,
      reps: 1,
      description: 'Light movement to maintain blood flow',
      instructions: [
        'Walk at comfortable pace',
        'Gentle arm circles',
        'Light dynamic stretching',
        'Focus on breathing'
      ],
      coachingCues: [
        'Keep moving gently',
        'Control breathing',
        'Stay relaxed'
      ],
      difficulty: 'beginner',
      metrics: { time: true, accuracy: false }
    },
    {
      name: 'Complete Rest',
      category: 'rest',
      pattern: 'custom',
      equipment: ['none'],
      duration: 120,
      restBetweenReps: 0,
      reps: 1,
      description: 'Full recovery period between intensive drills',
      instructions: [
        'Sit or stand comfortably',
        'Hydrate as needed',
        'Focus on recovery',
        'Prepare mentally for next drill'
      ],
      coachingCues: [
        'Use time to hydrate',
        'Review next drill',
        'Reset mentally'
      ],
      difficulty: 'beginner',
      metrics: { time: true, accuracy: false }
    },
    {
      name: 'Water Break',
      category: 'rest',
      pattern: 'custom',
      equipment: ['none'],
      duration: 90,
      restBetweenReps: 0,
      reps: 1,
      description: 'Scheduled hydration break',
      instructions: [
        'Get water bottle',
        'Drink small sips',
        'Avoid over-hydrating',
        'Prepare for next activity'
      ],
      coachingCues: [
        'Small, frequent sips',
        'Stay loose',
        'Keep warm if needed'
      ],
      difficulty: 'beginner',
      metrics: { time: true, accuracy: false }
    },
    {
      name: 'Strategic Rest',
      category: 'rest',
      pattern: 'custom',
      equipment: ['none'],
      duration: 180,
      restBetweenReps: 0,
      reps: 1,
      description: 'Extended recovery for high-intensity sessions',
      instructions: [
        'Full recovery period',
        'Monitor heart rate if applicable',
        'Light stretching optional',
        'Mental preparation for next segment'
      ],
      coachingCues: [
        'Full recovery is key',
        'Check equipment if needed',
        'Stay focused'
      ],
      difficulty: 'beginner',
      metrics: { time: true, accuracy: false }
    }
];

export default function DrillLibrary({
  onSelectDrill,
  selectedCategory = 'all',
  onCategoryChange,
  mode = 'agility'
}: DrillLibraryProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  // Get mode-specific drill library
  const drillLibrary = useMemo(() => {
    if (mode === 'sport_specific') {
      return [...EXTENDED_DRILL_LIBRARY, ...HOCKEY_DRILL_LIBRARY];
    }
    return EXTENDED_DRILL_LIBRARY;
  }, [mode]);

  // Filter drills based on search and filters
  const filteredDrills = useMemo(() => {
    return drillLibrary.filter(drill => {
      if (!drill.name || !drill.category) return false;
      
      const matchesSearch = searchTerm === '' || 
                          drill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          drill.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || drill.category === selectedCategory;
      
      const matchesDifficulty = difficultyFilter === 'all' || drill.difficulty === difficultyFilter;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [drillLibrary, searchTerm, selectedCategory, difficultyFilter]);

  // Group drills by category
  const groupedDrills = useMemo(() => {
    const groups = new Map<AgilityDrillCategory, Partial<AgilityDrill>[]>();
    
    filteredDrills.forEach(drill => {
      if (drill.category) {
        const drills = groups.get(drill.category) || [];
        drills.push(drill);
        groups.set(drill.category, drills);
      }
    });
    
    // Debug: log which categories have drills
    console.log('Grouped categories:', Array.from(groups.keys()));
    console.log('Category counts:', Array.from(groups.entries()).map(([cat, drills]) => `${cat}: ${drills.length}`));
    
    return groups;
  }, [filteredDrills]);

  return (
    <div className="space-y-4">
      {/* Mode Header */}
      {mode === 'sport_specific' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Hockey Skills Mode</h3>
              <p className="text-sm text-blue-700">
                Focus on shooting accuracy, passing precision, puck handling, and hockey-specific skating techniques
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={mode === 'sport_specific' ? 'Search hockey drills...' : t('physicalTrainer:agility.library.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={(v) => onCategoryChange?.(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      {CATEGORY_ICONS[value as AgilityDrillCategory]}
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v as any)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                onSelectDrill({
                  name: 'Custom Drill',
                  category: 'cone_drills',
                  pattern: 'custom',
                  equipment: [],
                  restBetweenReps: 30,
                  reps: 3,
                  description: 'Create your own custom drill',
                  instructions: [],
                  coachingCues: [],
                  difficulty: 'intermediate',
                  metrics: { time: true, accuracy: true }
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Custom
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Drill List */}
      <ScrollArea className="h-[600px]">
        {selectedCategory === 'all' ? (
          // Show grouped by category
          <div className="space-y-6">
            {console.log('Rendering categories:', Array.from(groupedDrills.keys()))}
            {Array.from(groupedDrills.entries()).map(([category, drills]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  {CATEGORY_ICONS[category]}
                  <h3 className="font-semibold">{CATEGORY_LABELS[category]}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {drills.length}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {drills.map((drill, index) => (
                    <DrillLibraryCard
                      key={`${category}-${index}`}
                      drill={drill}
                      onSelect={() => onSelectDrill(drill)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Show flat list
          <div className="grid gap-3">
            {filteredDrills.map((drill, index) => (
              <DrillLibraryCard
                key={index}
                drill={drill}
                onSelect={() => onSelectDrill(drill)}
              />
            ))}
          </div>
        )}

        {filteredDrills.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No drills found matching your criteria</p>
            <p className="text-sm mt-2">
              Total library size: {EXTENDED_DRILL_LIBRARY.length} drills
            </p>
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm('');
                setDifficultyFilter('all');
                onCategoryChange?.('all');
              }}
              className="mt-2"
            >
              Reset filters
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Individual drill card component
function DrillLibraryCard({ 
  drill, 
  onSelect 
}: { 
  drill: Partial<AgilityDrill>; 
  onSelect: () => void;
}) {
  const estimatedTime = drill.duration || drill.targetTime || 15;
  const totalTime = drill.reps ? (estimatedTime * drill.reps) + (drill.restBetweenReps || 30 * (drill.reps - 1)) : estimatedTime;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium">{drill.name}</h4>
          <Button size="sm" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">
          {drill.description}
        </p>

        <div className="flex flex-wrap gap-3 text-sm">
          {drill.reps && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Repeat className="h-3 w-3" />
              <span>{drill.reps} reps</span>
              {drill.sets && drill.sets > 1 && <span>× {drill.sets} sets</span>}
            </div>
          )}
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>~{Math.ceil(totalTime / 60)} min</span>
          </div>

          {drill.targetTime && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Target: {drill.targetTime}s</span>
            </div>
          )}
        </div>

        <div className="flex gap-1 mt-3">
          <Badge variant="outline" className="text-xs capitalize">
            {drill.difficulty}
          </Badge>
          {drill.equipment?.map(eq => (
            <Badge key={eq} variant="secondary" className="text-xs">
              {eq === 'hockey_stick' ? 'Hockey Stick' : 
               eq === 'hockey_net' ? 'Hockey Net' : 
               eq === 'hockey_pylons' ? 'Hockey Pylons' :
               eq === 'shooting_targets' ? 'Shooting Targets' :
               eq === 'passing_targets' ? 'Passing Targets' :
               eq === 'shooting_board' ? 'Shooting Board' :
               eq === 'synthetic_ice' ? 'Synthetic Ice' :
               eq === 'hockey_pads' ? 'Hockey Pads' :
               eq === 'pucks' ? 'Pucks' :
               eq.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}