'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Clock, 
  Heart, 
  Users,
  Activity
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import type { 
  StretchExercise, 
  BodyPart, 
  StretchType, 
  DifficultyLevel,
  FlexibilityEquipment,
  FlexibilityProgramPhase 
} from '../../types/flexibility.types';

interface FlexibilityStretchLibraryProps {
  onAddStretch: (stretch: StretchExercise) => void;
  selectedPhase: FlexibilityProgramPhase | null;
}

// Mock stretch library data
const MOCK_STRETCHES: StretchExercise[] = [
  {
    id: 'neck-rolls',
    name: 'Neck Rolls',
    description: 'Gentle circular movements to release neck tension',
    type: 'dynamic',
    bodyParts: ['neck'],
    difficulty: 'beginner',
    equipment: ['none'],
    defaultHoldTime: 15,
    minHoldTime: 10,
    maxHoldTime: 30,
    progressionSteps: [10, 15, 20, 30],
    isUnilateral: false,
    requiresPartner: false,
    setupInstructions: [
      'Sit or stand tall with shoulders relaxed',
      'Keep chin parallel to the ground'
    ],
    executionCues: [
      'Move slowly and controlled',
      'Stop if you feel any pain',
      'Breathe naturally throughout'
    ],
    safetyNotes: [
      'Avoid if you have neck injuries',
      'Never force the movement'
    ],
    modifications: [
      'Reduce range of motion for beginners',
      'Add gentle resistance for advanced'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'hamstring-stretch',
    name: 'Standing Hamstring Stretch',
    description: 'Classic stretch for hamstring flexibility',
    type: 'static',
    bodyParts: ['hamstrings'],
    difficulty: 'beginner',
    equipment: ['none'],
    defaultHoldTime: 30,
    minHoldTime: 20,
    maxHoldTime: 60,
    progressionSteps: [20, 30, 45, 60],
    isUnilateral: true,
    requiresPartner: false,
    setupInstructions: [
      'Stand upright with feet hip-width apart',
      'Step one foot forward about 12 inches'
    ],
    executionCues: [
      'Flex the front foot and keep leg straight',
      'Hinge at hips, reach toward front foot',
      'Keep back straight, chest up'
    ],
    safetyNotes: [
      'Do not bounce or force the stretch',
      'Stop if you feel sharp pain'
    ],
    modifications: [
      'Use a wall or chair for balance',
      'Bend the back leg slightly if needed'
    ],
    rangeOfMotion: {
      initial: 45,
      target: 70,
      unit: 'degrees',
      improvementRate: 2
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'hip-flexor-stretch',
    name: 'Kneeling Hip Flexor Stretch',
    description: 'Deep stretch for hip flexors and quads',
    type: 'static',
    bodyParts: ['hips', 'quadriceps'],
    difficulty: 'intermediate',
    equipment: ['mat'],
    defaultHoldTime: 45,
    minHoldTime: 30,
    maxHoldTime: 90,
    progressionSteps: [30, 45, 60, 90],
    isUnilateral: true,
    requiresPartner: false,
    setupInstructions: [
      'Start in a kneeling lunge position',
      'Place mat under the back knee for comfort'
    ],
    executionCues: [
      'Keep torso upright and tall',
      'Press hips forward gently',
      'Engage core for stability'
    ],
    safetyNotes: [
      'Avoid if you have knee problems',
      'Use a pillow under knee if needed'
    ],
    modifications: [
      'Hold a wall or chair for balance',
      'Reduce depth for beginners'
    ],
    breathingPattern: {
      name: '4-4-4 Equal Breathing',
      description: 'Equal counts for inhale, hold, exhale',
      inhaleCount: 4,
      holdCount: 4,
      exhaleCount: 4,
      cycles: 3,
      cue: 'Breathe in for 4, hold for 4, breathe out for 4'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat-cow-stretch',
    name: 'Cat-Cow Stretch',
    description: 'Dynamic spinal mobility movement',
    type: 'dynamic',
    bodyParts: ['back', 'core'],
    difficulty: 'beginner',
    equipment: ['mat'],
    defaultHoldTime: 20,
    minHoldTime: 15,
    maxHoldTime: 30,
    progressionSteps: [15, 20, 25, 30],
    isUnilateral: false,
    requiresPartner: false,
    setupInstructions: [
      'Start on hands and knees',
      'Position wrists under shoulders, knees under hips'
    ],
    executionCues: [
      'Cow: Arch back, look up, drop belly',
      'Cat: Round spine, tuck chin to chest',
      'Move slowly between positions'
    ],
    safetyNotes: [
      'Keep movements controlled',
      'Stop if you feel back pain'
    ],
    modifications: [
      'Perform seated in a chair',
      'Reduce range of motion as needed'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pigeon-pose',
    name: 'Pigeon Pose',
    description: 'Deep hip opener for advanced flexibility',
    type: 'static',
    bodyParts: ['hips', 'glutes'],
    difficulty: 'advanced',
    equipment: ['mat', 'blocks'],
    defaultHoldTime: 60,
    minHoldTime: 45,
    maxHoldTime: 120,
    progressionSteps: [45, 60, 90, 120],
    isUnilateral: true,
    requiresPartner: false,
    setupInstructions: [
      'From tabletop, bring one knee forward',
      'Extend the back leg straight behind you',
      'Use blocks under hips if needed'
    ],
    executionCues: [
      'Keep hips square and even',
      'Breathe deeply into the stretch',
      'Lean forward gently to deepen'
    ],
    safetyNotes: [
      'Not recommended for knee injuries',
      'Use props to modify intensity'
    ],
    modifications: [
      'Use blocks or bolster for support',
      'Thread the needle variation for beginners'
    ],
    breathingPattern: {
      name: '4-7-8 Relaxation',
      description: 'Deep relaxation breathing pattern',
      inhaleCount: 4,
      holdCount: 7,
      exhaleCount: 8,
      cycles: 4,
      cue: 'Inhale deeply for 4, hold for 7, slowly exhale for 8'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'shoulder-rolls',
    name: 'Shoulder Rolls',
    description: 'Dynamic shoulder mobility for warm-up',
    type: 'dynamic',
    bodyParts: ['shoulders'],
    difficulty: 'beginner',
    equipment: ['none'],
    defaultHoldTime: 20,
    minHoldTime: 15,
    maxHoldTime: 30,
    progressionSteps: [15, 20, 25, 30],
    isUnilateral: false,
    requiresPartner: false,
    setupInstructions: [
      'Stand with feet hip-width apart',
      'Arms at sides, shoulders relaxed'
    ],
    executionCues: [
      'Lift shoulders up toward ears',
      'Roll backward in slow circles',
      'Reverse direction halfway through'
    ],
    safetyNotes: [
      'Keep movements smooth and controlled',
      'Stop if you feel pinching'
    ],
    modifications: [
      'Perform one shoulder at a time',
      'Reduce range of motion if needed'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const BODY_PART_FILTERS: { value: BodyPart | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Body Parts', color: 'bg-gray-500' },
  { value: 'neck', label: 'Neck', color: 'bg-blue-500' },
  { value: 'shoulders', label: 'Shoulders', color: 'bg-indigo-500' },
  { value: 'back', label: 'Back', color: 'bg-purple-500' },
  { value: 'chest', label: 'Chest', color: 'bg-pink-500' },
  { value: 'core', label: 'Core', color: 'bg-red-500' },
  { value: 'hips', label: 'Hips', color: 'bg-orange-500' },
  { value: 'glutes', label: 'Glutes', color: 'bg-yellow-500' },
  { value: 'quadriceps', label: 'Quads', color: 'bg-green-500' },
  { value: 'hamstrings', label: 'Hamstrings', color: 'bg-emerald-500' },
  { value: 'calves', label: 'Calves', color: 'bg-teal-500' },
  { value: 'ankles', label: 'Ankles', color: 'bg-cyan-500' }
];

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500'
};

const TYPE_COLORS = {
  static: 'bg-blue-500',
  dynamic: 'bg-orange-500',
  pnf: 'bg-purple-500',
  ballistic: 'bg-red-500'
};

export const FlexibilityStretchLibrary: React.FC<FlexibilityStretchLibraryProps> = ({
  onAddStretch,
  selectedPhase
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedType, setSelectedType] = useState<StretchType | 'all'>('all');

  const filteredStretches = useMemo(() => {
    return MOCK_STRETCHES.filter(stretch => {
      const matchesSearch = stretch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           stretch.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBodyPart = selectedBodyPart === 'all' || stretch.bodyParts.includes(selectedBodyPart);
      const matchesDifficulty = selectedDifficulty === 'all' || stretch.difficulty === selectedDifficulty;
      const matchesType = selectedType === 'all' || stretch.type === selectedType;

      return matchesSearch && matchesBodyPart && matchesDifficulty && matchesType;
    });
  }, [searchTerm, selectedBodyPart, selectedDifficulty, selectedType]);

  const getPhaseRecommendations = (stretch: StretchExercise): string[] => {
    const recommendations: string[] = [];
    
    if (stretch.type === 'dynamic') {
      recommendations.push('Best for warm-up phase');
    }
    if (stretch.type === 'static') {
      recommendations.push('Ideal for static stretches phase');
    }
    if (stretch.difficulty === 'beginner') {
      recommendations.push('Great for beginners');
    }
    if (stretch.isUnilateral) {
      recommendations.push('Remember to do both sides');
    }
    
    return recommendations;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Stretch Library</h3>
            <p className="text-sm text-muted-foreground">
              {selectedPhase 
                ? `Adding to: ${selectedPhase.name}` 
                : 'Select a phase first to add stretches'
              }
            </p>
          </div>
          <Badge variant="outline">
            {filteredStretches.length} stretches
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stretches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <Tabs defaultValue="bodypart" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bodypart">Body Part</TabsTrigger>
            <TabsTrigger value="difficulty">Difficulty</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bodypart" className="mt-3">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {BODY_PART_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedBodyPart === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedBodyPart(filter.value)}
                    className="whitespace-nowrap"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="difficulty" className="mt-3">
            <div className="flex gap-2">
              {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((difficulty) => (
                <Button
                  key={difficulty}
                  variant={selectedDifficulty === difficulty ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className="capitalize"
                >
                  {difficulty === 'all' ? 'All Levels' : difficulty}
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="type" className="mt-3">
            <div className="flex gap-2">
              {(['all', 'static', 'dynamic', 'pnf', 'ballistic'] as const).map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All Types' : type}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stretch List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredStretches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No stretches found matching your criteria</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filteredStretches.map((stretch) => (
              <Card key={stretch.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{stretch.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stretch.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onAddStretch(stretch)}
                      disabled={!selectedPhase}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge 
                      variant="outline" 
                      className={`text-white ${DIFFICULTY_COLORS[stretch.difficulty]}`}
                    >
                      {stretch.difficulty}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`text-white ${TYPE_COLORS[stretch.type]}`}
                    >
                      {stretch.type}
                    </Badge>
                    {stretch.isUnilateral && (
                      <Badge variant="outline">
                        Both Sides
                      </Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{stretch.defaultHoldTime}s hold</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{stretch.equipment.join(', ')}</span>
                    </div>
                  </div>

                  {/* Body Parts */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {stretch.bodyParts.map((part) => (
                        <Badge key={part} variant="secondary" className="text-xs">
                          {t(`physicalTrainer:flexibility.bodyParts.${part}`)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Breathing Pattern */}
                  {stretch.breathingPattern && (
                    <div className="mt-3 p-2 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2 text-sm">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{stretch.breathingPattern.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stretch.breathingPattern.cue}
                      </p>
                    </div>
                  )}

                  {/* Phase Recommendations */}
                  {getPhaseRecommendations(stretch).length > 0 && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      <span className="font-medium">💡 </span>
                      {getPhaseRecommendations(stretch).join(' • ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};