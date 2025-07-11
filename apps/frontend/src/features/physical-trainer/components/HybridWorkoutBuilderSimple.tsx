'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Layers, Save, X, Plus, Trash2, Clock, Dumbbell, Heart, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { HybridProgram, HybridWorkoutBlock } from '../types/hybrid.types';
// Simple ID generator
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface HybridWorkoutBuilderProps {
  onSave: (program: HybridProgram) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function HybridWorkoutBuilderSimple({
  onSave,
  onCancel,
  isLoading = false
}: HybridWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [blocks, setBlocks] = useState<HybridWorkoutBlock[]>([]);

  const addBlock = (type: 'exercise' | 'interval' | 'transition') => {
    const newBlock: HybridWorkoutBlock = {
      id: generateId(),
      type,
      name: type === 'exercise' ? 'Exercise Block' : type === 'interval' ? 'Interval Block' : 'Transition',
      duration: type === 'transition' ? 60 : 300,
      orderIndex: blocks.length,
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

    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id).map((b, index) => ({ ...b, orderIndex: index })));
  };

  const updateBlock = (id: string, field: string, value: any) => {
    setBlocks(blocks.map(b => 
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  const handleSave = () => {
    if (isLoading) return; // Prevent multiple submissions
    
    const totalDuration = blocks.reduce((sum, b) => sum + b.duration, 0);
    const program: HybridProgram = {
      id: generateId(),
      name: programName,
      description: programDescription,
      blocks,
      totalDuration,
      totalExercises: blocks.filter(b => b.type === 'exercise').length,
      totalIntervals: blocks.filter(b => b.type === 'interval').length,
      estimatedCalories: Math.round(totalDuration / 60 * 10),
      equipment: []
    };
    onSave(program);
  };

  const totalDuration = blocks.reduce((sum, b) => sum + b.duration, 0);
  const isValid = programName && blocks.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-purple-500" />
            Hybrid Workout Builder
          </h2>
          <p className="text-muted-foreground">
            Create workouts that combine strength exercises with cardio intervals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Clock className="h-4 w-4 mr-2" />
            {Math.floor(totalDuration / 60)} min
          </Badge>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Workout
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Workout Name</Label>
            <Input
              id="name"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., Monday Strength & Cardio"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={programDescription}
              onChange={(e) => setProgramDescription(e.target.value)}
              placeholder="Brief description of the workout"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workout Structure</CardTitle>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => addBlock('exercise')} disabled={isLoading}>
              <Dumbbell className="h-4 w-4 mr-2" />
              Add Exercise Block
            </Button>
            <Button size="sm" variant="outline" onClick={() => addBlock('interval')} disabled={isLoading}>
              <Heart className="h-4 w-4 mr-2" />
              Add Interval Block
            </Button>
            <Button size="sm" variant="outline" onClick={() => addBlock('transition')} disabled={isLoading}>
              <Clock className="h-4 w-4 mr-2" />
              Add Transition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {blocks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No blocks added yet. Start by adding an exercise or interval block.
            </p>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, index) => (
                <div key={block.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {block.type === 'exercise' && <Dumbbell className="h-4 w-4" />}
                      {block.type === 'interval' && <Heart className="h-4 w-4" />}
                      {block.type === 'transition' && <Clock className="h-4 w-4" />}
                      <h4 className="font-medium">Block {index + 1}: {block.name}</h4>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeBlock(block.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={block.name}
                        onChange={(e) => updateBlock(block.id, 'name', e.target.value)}
                        placeholder="Block name"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <Label>Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={block.duration}
                        onChange={(e) => updateBlock(block.id, 'duration', parseInt(e.target.value))}
                        min={30}
                        max={3600}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {block.type === 'exercise' && 'Configure exercises in this block after saving'}
                    {block.type === 'interval' && 'Configure intervals in this block after saving'}
                    {block.type === 'transition' && 'Rest or transition between blocks'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}