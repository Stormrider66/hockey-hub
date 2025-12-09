'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Save,
  Plus,
  Dumbbell,
  Heart,
  Timer,
  AlertTriangle,
  Layers,
  Eye,
  X,
  Clock,
  Zap,
  Activity,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useCreateHybridWorkoutMutation } from '@/store/api/trainingApi';
import { useSaveWorkflow } from '../hooks/useSaveWorkflow';
import { useBulkSession, type BulkSessionConfig } from '../hooks/useBulkSession';
import { SaveWorkflowProgress } from './SaveWorkflowProgress';
import { WorkoutSuccessModal } from './shared/WorkoutSuccessModal';
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import { BulkConfigurationPanel } from './shared/BulkConfigurationPanel';
import { WorkoutType } from '../types';
import type {
  HybridProgram,
  HybridWorkoutBlock,
  ExerciseBlock,
  IntervalBlock,
  TransitionBlock,
  HybridTemplate,
} from '../types/hybrid.types';
import type { Exercise } from '../types';
import type { IntervalSet } from '../types/conditioning.types';
import HybridBlockItem from './hybrid-builder/HybridBlockItem';
import BlockEditor from './hybrid-builder/BlockEditor';
import HybridPreview from './hybrid-builder/HybridPreview';
import { useTranslation } from 'react-i18next';

interface HybridWorkoutBuilderProps {
  initialProgram?: HybridProgram;
  onSave?: (program: HybridProgram) => void;
  onCancel?: () => void;
  teamId?: string;
  playerRestrictions?: string[];
  // Bulk mode support
  supportsBulk?: boolean;
  onBulkSave?: (config: BulkSessionConfig<HybridProgram>) => Promise<void>;
}

const HYBRID_TEMPLATES: HybridTemplate[] = [
  {
    id: '1',
    name: 'Strength & Cardio Circuit',
    description: '3 rounds of strength exercises followed by cardio intervals',
    category: 'circuit',
    blockPattern: [
      { type: 'exercise', duration: 600 },
      { type: 'transition', duration: 60 },
      { type: 'interval', duration: 300 },
      { type: 'transition', duration: 120 },
    ],
    recommendedEquipment: ['dumbbells', 'rowing machine', 'jump rope'],
    difficulty: 'intermediate',
  },
  {
    id: '2',
    name: 'CrossFit Style WOD',
    description: 'High-intensity workout with mixed exercises and minimal rest',
    category: 'crossfit',
    blockPattern: [
      { type: 'exercise', duration: 300 },
      { type: 'interval', duration: 180 },
      { type: 'exercise', duration: 300 },
      { type: 'interval', duration: 180 },
    ],
    recommendedEquipment: ['barbell', 'pull-up bar', 'box', 'kettlebell'],
    difficulty: 'advanced',
  },
  {
    id: '3',
    name: 'Bootcamp Session',
    description: 'Military-style training with bodyweight and cardio',
    category: 'bootcamp',
    blockPattern: [
      { type: 'interval', duration: 300 },
      { type: 'exercise', duration: 480 },
      { type: 'transition', duration: 90 },
      { type: 'interval', duration: 240 },
    ],
    recommendedEquipment: ['cones', 'medicine ball', 'battle ropes'],
    difficulty: 'intermediate',
  },
];

export default function HybridWorkoutBuilder({
  initialProgram,
  onSave,
  onCancel,
  teamId = 'team-001',
  playerRestrictions = [],
  supportsBulk = true,
  onBulkSave,
}: HybridWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [createHybridWorkout, { isLoading }] = useCreateHybridWorkoutMutation();
  const [activeTab, setActiveTab] = useState('structure');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  
  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkConfig, setBulkConfig] = useState<BulkSessionConfig<HybridProgram> | null>(null);

  // Save workflow integration
  const saveWorkflow = useSaveWorkflow({
    workoutType: WorkoutType.HYBRID,
    workoutData: {
      name: program.name,
      description: program.description,
      hybridProgram: program,
      date: new Date().toISOString(),
      location: 'Training Center',
      duration: Math.round(program.totalDuration / 60)
    },
    playerAssignments: {
      players: [],
      teams: teamId ? [teamId] : []
    },
    onSaveSuccess: (result) => {
      toast.success(t('physicalTrainer:hybrid.createSuccess'));
    },
    onSaveError: (error) => {
      console.error('Failed to save hybrid workout:', error);
      toast.error(t('physicalTrainer:hybrid.saveError'));
    }
  });
  
  // Bulk session handling
  const handleBulkComplete = useCallback(async (config: BulkSessionConfig<HybridProgram>) => {
    updateTotals();
    
    // Update bulk config with current program
    const updatedConfig = {
      ...config,
      baseWorkout: program,
      sessions: config.sessions.map(session => ({
        ...session,
        workoutData: {
          ...program,
          id: uuidv4(), // New ID for each session
          name: session.name || program.name
        }
      }))
    };
    
    if (onBulkSave) {
      await onBulkSave(updatedConfig);
    }
    
    setBulkConfig(updatedConfig);
    toast.success(`Successfully created ${config.numberOfSessions} hybrid workout sessions`);
  }, [program, onBulkSave, updateTotals]);
  
  const handleBulkToggle = useCallback((enabled: boolean) => {
    setBulkMode(enabled);
    if (!enabled) {
      setBulkConfig(null);
    }
  }, []);
  
  const [program, setProgram] = useState<HybridProgram>({
    id: initialProgram?.id || uuidv4(),
    name: initialProgram?.name || '',
    description: initialProgram?.description || '',
    blocks: initialProgram?.blocks || [],
    totalDuration: initialProgram?.totalDuration || 0,
    totalExercises: initialProgram?.totalExercises || 0,
    totalIntervals: initialProgram?.totalIntervals || 0,
    estimatedCalories: initialProgram?.estimatedCalories || 0,
    equipment: initialProgram?.equipment || [],
  });


  // Calculate totals whenever blocks change
  const updateTotals = useCallback(() => {
    let totalDuration = 0;
    let totalExercises = 0;
    let totalIntervals = 0;
    let equipment: string[] = [];

    program.blocks.forEach((block) => {
      totalDuration += block.duration;
      
      if (block.type === 'exercise') {
        const exerciseBlock = block as ExerciseBlock;
        totalExercises += exerciseBlock.exercises.length;
        equipment = [...equipment, ...(exerciseBlock.equipment || [])];
      } else if (block.type === 'interval') {
        const intervalBlock = block as IntervalBlock;
        totalIntervals += intervalBlock.intervals.length;
        equipment.push(intervalBlock.equipment);
      }
    });

    // Calculate estimated calories (rough estimate)
    const minutes = totalDuration / 60;
    const caloriesPerMinute = 10; // Average for mixed training
    const estimatedCalories = Math.round(minutes * caloriesPerMinute);

    setProgram((prev) => ({
      ...prev,
      totalDuration,
      totalExercises,
      totalIntervals,
      estimatedCalories,
      equipment: [...new Set(equipment)],
    }));
  }, [program.blocks]);

  const addBlock = useCallback((type: 'exercise' | 'interval' | 'transition') => {
    const newBlock: HybridWorkoutBlock = {
      id: uuidv4(),
      type,
      name: type === 'exercise' ? 'Exercise Block' : type === 'interval' ? 'Interval Block' : 'Transition',
      duration: type === 'transition' ? 60 : 300,
      orderIndex: program.blocks.length,
      ...(type === 'exercise' && {
        exercises: [],
        targetMuscleGroups: [],
        equipment: [],
      }),
      ...(type === 'interval' && {
        intervals: [],
        equipment: 'rowing',
        totalWorkTime: 0,
        totalRestTime: 0,
      }),
      ...(type === 'transition' && {
        transitionType: 'rest',
        activities: [],
      }),
    } as HybridWorkoutBlock;

    setProgram((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    setActiveBlockId(newBlock.id);
    setActiveTab('edit');
  }, [program.blocks.length]);

  const updateBlock = useCallback((blockId: string, updates: Partial<HybridWorkoutBlock>) => {
    setProgram((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block
      ),
    }));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setProgram((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((block) => block.id !== blockId),
    }));
    if (activeBlockId === blockId) {
      setActiveBlockId(null);
    }
  }, [activeBlockId]);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setProgram((prev) => {
      const currentIndex = prev.blocks.findIndex((b) => b.id === blockId);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // Check boundaries
      if (newIndex < 0 || newIndex >= prev.blocks.length) return prev;
      
      const newBlocks = [...prev.blocks];
      const [movedBlock] = newBlocks.splice(currentIndex, 1);
      newBlocks.splice(newIndex, 0, movedBlock);
      
      // Update order indices
      return {
        ...prev,
        blocks: newBlocks.map((block, index) => ({
          ...block,
          orderIndex: index,
        })),
      };
    });
  }, []);

  const applyTemplate = useCallback((template: HybridTemplate) => {
    const newBlocks: HybridWorkoutBlock[] = [];
    
    template.blockPattern.forEach((pattern, index) => {
      const block: HybridWorkoutBlock = {
        id: uuidv4(),
        type: pattern.type,
        name: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} ${index + 1}`,
        duration: pattern.duration,
        orderIndex: index,
        ...(pattern.type === 'exercise' && {
          exercises: [],
          targetMuscleGroups: [],
          equipment: [],
        }),
        ...(pattern.type === 'interval' && {
          intervals: [],
          equipment: template.recommendedEquipment[0] || 'rowing',
          totalWorkTime: 0,
          totalRestTime: 0,
        }),
        ...(pattern.type === 'transition' && {
          transitionType: 'rest',
          activities: [],
        }),
      } as HybridWorkoutBlock;
      
      newBlocks.push(block);
    });

    setProgram((prev) => ({
      ...prev,
      name: template.name,
      description: template.description,
      blocks: newBlocks,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!program.name) {
      toast.error(t('physicalTrainer:hybrid.validation.nameRequired'));
      return;
    }

    if (program.blocks.length === 0) {
      toast.error(t('physicalTrainer:hybrid.validation.blocksRequired'));
      return;
    }

    updateTotals();
    
    // Handle bulk mode save
    if (bulkMode && bulkConfig) {
      await handleBulkComplete(bulkConfig);
      return;
    }
    
    // If onSave prop is provided, use it for legacy compatibility
    if (onSave) {
      onSave(program);
      return;
    }
    
    // Use the new save workflow
    const result = await saveWorkflow.save();
    if (result?.success && onCancel) {
      onCancel(); // Close the builder on success
    }
  }, [program, updateTotals, onSave, saveWorkflow, onCancel, t, bulkMode, bulkConfig, handleBulkComplete]);

  // Update totals when blocks change
  React.useEffect(() => {
    updateTotals();
  }, [program.blocks, updateTotals]);

  const activeBlock = program.blocks.find((b) => b.id === activeBlockId);
  const blockIds = program.blocks.map((b) => b.id);

  return (
    <div className="space-y-4">
      {/* Header with Bulk Mode Support */}
      <WorkoutBuilderHeader
        title="Hybrid Workout Builder"
        workoutType="hybrid"
        onSave={handleSave}
        onCancel={onCancel || (() => {})}
        isSaving={isLoading || saveWorkflow.isSaving}
        showAutoSave={false}
        supportsBulkMode={supportsBulk}
        bulkMode={bulkMode}
        onBulkToggle={handleBulkToggle}
        bulkConfig={bulkConfig}
        onBulkConfigChange={setBulkConfig}
      />
      
      {/* Bulk Configuration Panel */}
      {bulkMode && (
        <BulkConfigurationPanel<HybridProgram>
          workoutType="hybrid"
          baseWorkout={program}
          onComplete={handleBulkComplete}
          onCancel={() => setBulkMode(false)}
          enablePlayerDistribution={true}
          showAdvancedOptions={true}
        />
      )}

      {/* Basic Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workout Name</Label>
              <Input
                id="name"
                value={program.name}
                onChange={(e) => setProgram({ ...program, name: e.target.value })}
                placeholder="e.g., Monday Strength & Cardio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={program.description}
                onChange={(e) => setProgram({ ...program, description: e.target.value })}
                placeholder="Brief description of the workout"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mt-4">
            <Badge variant="secondary" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {Math.floor(program.totalDuration / 60)} min
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Dumbbell className="h-3 w-3 mr-1" />
              {program.totalExercises} exercises
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Heart className="h-3 w-3 mr-1" />
              {program.totalIntervals} intervals
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Zap className="h-3 w-3 mr-1" />
              ~{program.estimatedCalories} cal
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Builder Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="structure">
            <Layers className="h-4 w-4 mr-2" />
            Structure
          </TabsTrigger>
          <TabsTrigger value="edit" disabled={!activeBlock}>
            <Activity className="h-4 w-4 mr-2" />
            Edit Block
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Timer className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workout Structure</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add and arrange blocks to build your hybrid workout
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Block Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addBlock('exercise')}
                >
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Add Exercise Block
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addBlock('interval')}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Add Interval Block
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addBlock('transition')}
                >
                  <Timer className="h-4 w-4 mr-2" />
                  Add Transition
                </Button>
              </div>

              {/* Block List */}
              <div className="space-y-2">
                {program.blocks.map((block, index) => (
                  <HybridBlockItem
                    key={block.id}
                    block={block}
                    isActive={activeBlockId === block.id}
                    onEdit={() => {
                      setActiveBlockId(block.id);
                      setActiveTab('edit');
                    }}
                    onDelete={() => deleteBlock(block.id)}
                    onMoveUp={() => moveBlock(block.id, 'up')}
                    onMoveDown={() => moveBlock(block.id, 'down')}
                    canMoveUp={index > 0}
                    canMoveDown={index < program.blocks.length - 1}
                  />
                ))}
              </div>

              {program.blocks.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No blocks added yet. Start by adding an exercise or interval block.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Block Tab */}
        <TabsContent value="edit">
          {activeBlock ? (
            <BlockEditor
              block={activeBlock}
              onUpdate={(updates) => updateBlock(activeBlock.id, updates)}
              playerRestrictions={playerRestrictions}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Select a block from the Structure tab to edit
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workout Templates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Start with a pre-built template and customize it
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {HYBRID_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => applyTemplate(template)}
                  >
                    <CardHeader className="pb-3">
                      <h4 className="font-semibold">{template.name}</h4>
                      <Badge
                        variant="secondary"
                        className="w-fit capitalize text-xs"
                      >
                        {template.difficulty}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.recommendedEquipment.map((eq) => (
                          <Badge key={eq} variant="outline" className="text-xs">
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <HybridPreview program={program} />
        </TabsContent>
      </Tabs>

      {/* Save Progress */}
      {(saveWorkflow.isSaving || saveWorkflow.isValidating) && (
        <div className="mb-4">
          <SaveWorkflowProgress
            workflow={saveWorkflow}
            onRetry={saveWorkflow.retry}
            onCancel={() => saveWorkflow.reset()}
          />
        </div>
      )}

      {/* Warnings */}
      {playerRestrictions.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some players have restrictions. Exercises will be filtered based on medical limitations.
          </AlertDescription>
        </Alert>
      )}

      {/* Success Modal */}
      {saveWorkflow.successModalProps && (
        <WorkoutSuccessModal
          isOpen={saveWorkflow.isSuccessModalOpen}
          onClose={saveWorkflow.closeSuccessModal}
          workoutType={WorkoutType.HYBRID}
          workoutName={program.name}
          playerCount={0}
          teamCount={teamId ? 1 : 0}
          duration={Math.round(program.totalDuration / 60)}
          exerciseCount={program.totalExercises}
          onSchedule={saveWorkflow.successModalProps.onSchedule}
          onCreateAnother={() => {
            saveWorkflow.reset();
            // Reset form state
            setProgram({
              id: uuidv4(),
              name: '',
              description: '',
              blocks: [],
              totalDuration: 0,
              totalExercises: 0,
              totalIntervals: 0,
              estimatedCalories: 0,
              equipment: [],
            });
          }}
          onCreateTemplate={() => {
            toast.success('Template creation feature coming soon!');
          }}
          onViewWorkout={saveWorkflow.successModalProps.onViewDetails}
          onNotifyPlayers={() => {
            toast.success('Player notification sent!');
          }}
        />
      )}
    </div>
  );
}