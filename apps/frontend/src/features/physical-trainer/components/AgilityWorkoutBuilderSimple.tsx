'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Zap, Save, X, Plus, Trash2, Clock, Target, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AgilityProgram, AgilityDrill, AgilityDrillCategory } from '../types/agility.types';
import { AGILITY_DRILL_LIBRARY } from '../types/agility.types';

interface AgilityWorkoutBuilderProps {
  onSave: (program: AgilityProgram) => void;
  onCancel: () => void;
  teamId?: string;
  isLoading?: boolean;
}

export default function AgilityWorkoutBuilderSimple({
  onSave,
  onCancel,
  teamId,
  isLoading = false
}: AgilityWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [warmupDuration, setWarmupDuration] = useState(300); // 5 min default
  const [cooldownDuration, setCooldownDuration] = useState(300); // 5 min default
  const [drills, setDrills] = useState<AgilityDrill[]>([]);

  const addDrill = () => {
    const newDrill: AgilityDrill = {
      id: `drill-${Date.now()}`,
      name: 'New Drill',
      category: 'cone_drills',
      pattern: 'custom',
      equipment: ['cones'],
      restBetweenReps: 30,
      reps: 3,
      description: '',
      instructions: [],
      coachingCues: [],
      difficulty: 'intermediate',
      metrics: { time: true, accuracy: true }
    };
    setDrills([...drills, newDrill]);
  };

  const addPresetDrill = (preset: Partial<AgilityDrill>) => {
    const newDrill: AgilityDrill = {
      id: `drill-${Date.now()}`,
      ...preset,
      name: preset.name || 'New Drill',
      category: preset.category || 'cone_drills',
      pattern: preset.pattern || 'custom',
      equipment: preset.equipment || [],
      restBetweenReps: preset.restBetweenReps || 30,
      reps: preset.reps || 3,
      description: preset.description || '',
      instructions: preset.instructions || [],
      coachingCues: preset.coachingCues || [],
      difficulty: preset.difficulty || 'intermediate',
      metrics: preset.metrics || { time: true, accuracy: true }
    };
    setDrills([...drills, newDrill]);
  };

  const removeDrill = (id: string) => {
    setDrills(drills.filter(d => d.id !== id));
  };

  const updateDrill = (id: string, field: keyof AgilityDrill, value: any) => {
    setDrills(drills.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const calculateTotalDuration = () => {
    let duration = warmupDuration + cooldownDuration;
    drills.forEach(drill => {
      const drillTime = drill.duration || drill.targetTime || 15;
      const totalReps = drill.reps * (drill.sets || 1);
      const restTime = drill.restBetweenReps * (totalReps - 1);
      duration += (drillTime * totalReps) + restTime;
    });
    return duration;
  };

  const handleSave = () => {
    if (isLoading) return; // Prevent multiple submissions
    
    const equipmentNeeded = Array.from(new Set(drills.flatMap(d => d.equipment)));
    const program: AgilityProgram = {
      id: `program-${Date.now()}`,
      name: programName,
      description: programDescription,
      drills,
      warmupDuration,
      cooldownDuration,
      totalDuration: calculateTotalDuration(),
      equipmentNeeded,
      difficulty: 'intermediate',
      focusAreas: [],
      tags: []
    };
    onSave(program);
  };

  const totalDuration = calculateTotalDuration();
  const isValid = programName && drills.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500" />
            Agility Workout Builder
          </h2>
          <p className="text-muted-foreground">
            Create footwork, speed, and reaction drills
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
              placeholder="e.g., Speed & Agility Training"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="warmup">Warmup Duration (minutes)</Label>
              <Input
                id="warmup"
                type="number"
                value={warmupDuration / 60}
                onChange={(e) => setWarmupDuration(parseInt(e.target.value) * 60)}
                min={1}
                max={30}
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="cooldown">Cooldown Duration (minutes)</Label>
              <Input
                id="cooldown"
                type="number"
                value={cooldownDuration / 60}
                onChange={(e) => setCooldownDuration(parseInt(e.target.value) * 60)}
                min={1}
                max={30}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Agility Drills</CardTitle>
          <Button size="sm" onClick={addDrill} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Drill
          </Button>
        </CardHeader>
        <CardContent>
          {/* Preset Drills */}
          {drills.length === 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Quick add preset drills:</p>
              <div className="flex flex-wrap gap-2">
                {AGILITY_DRILL_LIBRARY.slice(0, 3).map((preset, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onClick={() => addPresetDrill(preset)}
                    disabled={isLoading}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {drills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No drills added yet. Add a custom drill or choose from presets above.
            </p>
          ) : (
            <div className="space-y-4">
              {drills.map((drill, index) => (
                <div key={drill.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Drill {index + 1}: {drill.name}</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDrill(drill.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={drill.name}
                        onChange={(e) => updateDrill(drill.id, 'name', e.target.value)}
                        placeholder="Drill name"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <Label>Category</Label>
                      <select
                        value={drill.category}
                        onChange={(e) => updateDrill(drill.id, 'category', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        disabled={isLoading}
                      >
                        <option value="cone_drills">Cone Drills</option>
                        <option value="ladder_drills">Ladder Drills</option>
                        <option value="reaction_drills">Reaction Drills</option>
                        <option value="change_of_direction">Change of Direction</option>
                        <option value="balance_coordination">Balance & Coordination</option>
                        <option value="sport_specific">Sport Specific</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label>Reps</Label>
                      <Input
                        type="number"
                        value={drill.reps}
                        onChange={(e) => updateDrill(drill.id, 'reps', parseInt(e.target.value))}
                        min={1}
                        max={20}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Rest Between Reps (seconds)</Label>
                      <Input
                        type="number"
                        value={drill.restBetweenReps}
                        onChange={(e) => updateDrill(drill.id, 'restBetweenReps', parseInt(e.target.value))}
                        min={10}
                        max={300}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <Label>Difficulty</Label>
                      <select
                        value={drill.difficulty}
                        onChange={(e) => updateDrill(drill.id, 'difficulty', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        disabled={isLoading}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
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