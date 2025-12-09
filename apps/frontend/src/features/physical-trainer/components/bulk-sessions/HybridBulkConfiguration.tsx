'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Layers,
  Dumbbell,
  Heart,
  Clock,
  Shuffle,
  AlertTriangle,
  Settings,
  RotateCw,
  Users
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

import type { HybridProgram, HybridWorkoutBlock } from '../../types/hybrid.types';
import type { BulkSessionConfig, SessionConfiguration } from '../../hooks/useBulkSession';
import { WorkoutEquipmentType } from '../../types/conditioning.types';

interface HybridBulkConfigurationProps {
  config: BulkSessionConfig<HybridProgram>;
  onConfigUpdate: (updates: Partial<BulkSessionConfig<HybridProgram>>) => void;
  onSessionUpdate: (sessionId: string, updates: Partial<SessionConfiguration<HybridProgram>>) => void;
  baseProgram: HybridProgram;
  isExpanded?: boolean;
  onToggle?: () => void;
}

interface EquipmentRotationStrategy {
  type: 'none' | 'sequential' | 'balanced' | 'strength_focus' | 'cardio_focus';
  label: string;
  description: string;
}

const ROTATION_STRATEGIES: EquipmentRotationStrategy[] = [
  {
    type: 'none',
    label: 'No Rotation',
    description: 'All sessions use the same equipment'
  },
  {
    type: 'sequential',
    label: 'Sequential Rotation',
    description: 'Equipment rotates in order across sessions'
  },
  {
    type: 'balanced',
    label: 'Balanced Distribution',
    description: 'Even distribution of strength and cardio equipment'
  },
  {
    type: 'strength_focus',
    label: 'Strength Focus Rotation',
    description: 'Emphasize strength equipment in alternating sessions'
  },
  {
    type: 'cardio_focus',
    label: 'Cardio Focus Rotation',
    description: 'Emphasize cardio equipment in alternating sessions'
  }
];

export const HybridBulkConfiguration: React.FC<HybridBulkConfigurationProps> = ({
  config,
  onConfigUpdate,
  onSessionUpdate,
  baseProgram,
  isExpanded = false,
  onToggle
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [rotationStrategy, setRotationStrategy] = useState<string>('balanced');
  const [blockVariation, setBlockVariation] = useState(true);
  const [equipmentConflictResolution, setEquipmentConflictResolution] = useState<'stagger' | 'share' | 'allocate'>('stagger');

  // Analyze base program for equipment requirements
  const analyzeEquipmentRequirements = useCallback(() => {
    const strengthEquipment = new Set<string>();
    const cardioEquipment = new Set<WorkoutEquipmentType>();
    
    baseProgram.blocks.forEach(block => {
      if (block.type === 'exercise') {
        block.exercises?.forEach(exercise => {
          exercise.equipment?.forEach(eq => strengthEquipment.add(eq));
        });
      } else if (block.type === 'interval') {
        cardioEquipment.add(block.equipment as WorkoutEquipmentType);
      }
    });
    
    return {
      strengthEquipment: Array.from(strengthEquipment),
      cardioEquipment: Array.from(cardioEquipment),
      mixedRequirements: strengthEquipment.size > 0 && cardioEquipment.size > 0
    };
  }, [baseProgram]);

  const equipment = analyzeEquipmentRequirements();

  // Apply rotation strategy to sessions
  const applyRotationStrategy = useCallback((strategy: string) => {
    if (!config.sessions.length) return;

    const availableCardioEquipment: WorkoutEquipmentType[] = [
      WorkoutEquipmentType.ROWING,
      WorkoutEquipmentType.BIKE_ERG,
      WorkoutEquipmentType.TREADMILL,
      WorkoutEquipmentType.AIRBIKE,
      WorkoutEquipmentType.SKIERG,
      WorkoutEquipmentType.WATTBIKE
    ];

    config.sessions.forEach((session, index) => {
      let sessionEquipment: WorkoutEquipmentType[] = [];
      
      switch (strategy) {
        case 'sequential':
          sessionEquipment = [availableCardioEquipment[index % availableCardioEquipment.length]];
          break;
        case 'balanced':
          // Alternate between 2-3 equipment types per session
          const startIndex = (index * 2) % availableCardioEquipment.length;
          sessionEquipment = availableCardioEquipment.slice(startIndex, startIndex + 2);
          if (sessionEquipment.length < 2 && startIndex > 0) {
            sessionEquipment.push(availableCardioEquipment[0]);
          }
          break;
        case 'strength_focus':
          // Sessions alternate between strength-heavy and cardio-light
          if (index % 2 === 0) {
            sessionEquipment = availableCardioEquipment.slice(0, 1); // Minimal cardio
          } else {
            sessionEquipment = availableCardioEquipment.slice(0, 3); // More variety
          }
          break;
        case 'cardio_focus':
          // Sessions alternate between cardio-heavy and strength-light
          if (index % 2 === 0) {
            sessionEquipment = availableCardioEquipment.slice(0, 3); // More cardio variety
          } else {
            sessionEquipment = availableCardioEquipment.slice(0, 1); // Minimal cardio
          }
          break;
        default:
          // No rotation - use all available
          sessionEquipment = equipment.cardioEquipment as WorkoutEquipmentType[];
      }

      onSessionUpdate(session.id, { 
        equipment: sessionEquipment,
        // Update workout data with equipment variations
        workoutData: {
          ...session.workoutData,
          blocks: session.workoutData?.blocks?.map(block => {
            if (block.type === 'interval' && sessionEquipment.length > 0) {
              return {
                ...block,
                equipment: sessionEquipment[0] // Use first equipment for interval blocks
              };
            }
            return block;
          }) || []
        }
      });
    });

    setRotationStrategy(strategy);
  }, [config.sessions, equipment.cardioEquipment, onSessionUpdate]);

  // Generate block variations across sessions
  const generateBlockVariations = useCallback(() => {
    if (!blockVariation) return;

    config.sessions.forEach((session, sessionIndex) => {
      const variatedBlocks = baseProgram.blocks.map((block, blockIndex) => {
        const variation = { ...block };
        
        if (block.type === 'exercise') {
          // Vary exercise order and rest periods
          variation.duration = block.duration + ((sessionIndex % 2 === 0) ? 30 : -30);
        } else if (block.type === 'interval') {
          // Vary interval durations slightly
          const durationVariation = (sessionIndex * 15) % 60;
          variation.duration = Math.max(60, block.duration + durationVariation);
        } else if (block.type === 'transition') {
          // Adjust transition times for equipment changes
          const baseTransition = block.duration;
          const equipmentChangePenalty = equipment.mixedRequirements ? 30 : 0;
          variation.duration = baseTransition + equipmentChangePenalty + (sessionIndex * 10);
        }
        
        return variation;
      });

      onSessionUpdate(session.id, {
        workoutData: {
          ...session.workoutData,
          blocks: variatedBlocks,
          totalDuration: variatedBlocks.reduce((sum, block) => sum + block.duration, 0)
        }
      });
    });
  }, [config.sessions, baseProgram.blocks, equipment.mixedRequirements, blockVariation, onSessionUpdate]);

  // Calculate equipment conflicts
  const getEquipmentConflicts = useCallback(() => {
    const equipmentUsage = new Map<WorkoutEquipmentType, number>();
    
    config.sessions.forEach(session => {
      session.equipment?.forEach(eq => {
        equipmentUsage.set(eq, (equipmentUsage.get(eq) || 0) + 1);
      });
    });

    const conflicts: { equipment: WorkoutEquipmentType; sessions: number; available: number }[] = [];
    
    equipmentUsage.forEach((sessions, equipment) => {
      // Mock availability data - in real app, this would come from facility API
      const available = equipment === WorkoutEquipmentType.ROWING ? 6 : 
                       equipment === WorkoutEquipmentType.TREADMILL ? 4 : 8;
                       
      if (sessions > available) {
        conflicts.push({ equipment, sessions, available });
      }
    });

    return conflicts;
  }, [config.sessions]);

  const equipmentConflicts = getEquipmentConflicts();

  return (
    <Card className={cn('border-purple-200', isExpanded && 'border-purple-300')}>
      <CardHeader 
        className="cursor-pointer hover:bg-purple-50/50 transition-colors"
        onClick={onToggle}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-500" />
            <span>Hybrid Workout Configuration</span>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              {config.numberOfSessions} sessions
            </Badge>
          </div>
          {equipmentConflicts.length > 0 && (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Equipment Analysis */}
          <div className="bg-purple-50/30 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Program Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Strength Equipment</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {equipment.strengthEquipment.map(eq => (
                    <Badge key={eq} variant="outline" className="text-xs">
                      <Dumbbell className="h-3 w-3 mr-1" />
                      {eq}
                    </Badge>
                  ))}
                  {equipment.strengthEquipment.length === 0 && (
                    <span className="text-muted-foreground">None</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Cardio Equipment</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {equipment.cardioEquipment.map(eq => (
                    <Badge key={eq} variant="outline" className="text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      {eq}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Rotation Strategy */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              Equipment Rotation Strategy
            </h4>
            
            <Select value={rotationStrategy} onValueChange={applyRotationStrategy}>
              <SelectTrigger>
                <SelectValue placeholder="Select rotation strategy" />
              </SelectTrigger>
              <SelectContent>
                {ROTATION_STRATEGIES.map(strategy => (
                  <SelectItem key={strategy.type} value={strategy.type}>
                    <div>
                      <div className="font-medium">{strategy.label}</div>
                      <div className="text-xs text-muted-foreground">{strategy.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Block Variation Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="block-variation">Block Variations</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically vary block durations and transitions across sessions
                </p>
              </div>
              <Switch
                id="block-variation"
                checked={blockVariation}
                onCheckedChange={(checked) => {
                  setBlockVariation(checked);
                  if (checked) {
                    generateBlockVariations();
                  }
                }}
              />
            </div>

            {blockVariation && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateBlockVariations}
                className="w-full"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Regenerate Block Variations
              </Button>
            )}
          </div>

          {/* Equipment Conflicts */}
          {equipmentConflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Equipment Conflicts Detected:</div>
                <ul className="space-y-1 text-sm">
                  {equipmentConflicts.map(conflict => (
                    <li key={conflict.equipment} className="flex items-center gap-2">
                      <span>•</span>
                      <span>
                        {conflict.equipment}: {conflict.sessions} sessions need this equipment, 
                        but only {conflict.available} available
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-2">
                  <Label>Conflict Resolution:</Label>
                  <Select 
                    value={equipmentConflictResolution} 
                    onValueChange={(value: 'stagger' | 'share' | 'allocate') => 
                      setEquipmentConflictResolution(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stagger">
                        <div>
                          <div className="font-medium">Stagger Start Times</div>
                          <div className="text-xs text-muted-foreground">Start sessions at different times</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="share">
                        <div>
                          <div className="font-medium">Share Equipment</div>
                          <div className="text-xs text-muted-foreground">Allow multiple sessions to use same equipment</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="allocate">
                        <div>
                          <div className="font-medium">Auto-Allocate</div>
                          <div className="text-xs text-muted-foreground">Automatically redistribute equipment</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Session Summary */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Session Summary
            </h4>
            <div className="space-y-2 text-sm">
              {config.sessions.map((session, index) => (
                <div key={session.id} className="flex items-center justify-between p-2 bg-background rounded border">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{session.name}</span>
                    {session.equipment && session.equipment.length > 0 && (
                      <div className="flex gap-1">
                        {session.equipment.slice(0, 2).map(eq => (
                          <Badge key={eq} variant="outline" className="text-xs">
                            {eq}
                          </Badge>
                        ))}
                        {session.equipment.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{session.equipment.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{Math.round((session.workoutData?.totalDuration || 0) / 60)} min</span>
                    <Users className="h-3 w-3" />
                    <span>{session.playerIds.length + session.teamIds.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default HybridBulkConfiguration;