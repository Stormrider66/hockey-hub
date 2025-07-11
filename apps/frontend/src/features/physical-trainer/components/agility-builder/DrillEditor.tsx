'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  X,
  Plus,
  Trash2,
  Target,
  Clock,
  Users,
  Zap,
  Settings,
  FileText,
  Video,
  AlertCircle,
  Grid3X3
} from 'lucide-react';
import type { AgilityDrill, AgilityDrillCategory, AgilityEquipmentType, DrillPattern } from '../../types/agility.types';
import PatternVisualizer from './PatternVisualizer';
import { useTranslation } from 'react-i18next';

interface DrillEditorProps {
  drill: AgilityDrill;
  onSave: (drill: AgilityDrill) => void;
  onCancel: () => void;
}

const EQUIPMENT_OPTIONS: AgilityEquipmentType[] = [
  'cones', 'ladder', 'hurdles', 'reaction_ball', 'poles', 'markers', 'lights', 'none'
];

const PATTERN_OPTIONS: DrillPattern[] = [
  't_drill', 'l_drill', '5_10_5', 'box_drill', 'zig_zag', 'figure_8', 'star_drill', 'hexagon', 'custom'
];

export default function DrillEditor({ drill, onSave, onCancel }: DrillEditorProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [editedDrill, setEditedDrill] = useState<AgilityDrill>({ ...drill });
  const [activeTab, setActiveTab] = useState('basic');

  const handleSave = () => {
    onSave(editedDrill);
  };

  const updateDrill = (updates: Partial<AgilityDrill>) => {
    setEditedDrill({ ...editedDrill, ...updates });
  };

  const addInstruction = () => {
    updateDrill({
      instructions: [...editedDrill.instructions, '']
    });
  };

  const updateInstruction = (index: number, value: string) => {
    const instructions = [...editedDrill.instructions];
    instructions[index] = value;
    updateDrill({ instructions });
  };

  const removeInstruction = (index: number) => {
    updateDrill({
      instructions: editedDrill.instructions.filter((_, i) => i !== index)
    });
  };

  const addCoachingCue = () => {
    updateDrill({
      coachingCues: [...editedDrill.coachingCues, '']
    });
  };

  const updateCoachingCue = (index: number, value: string) => {
    const coachingCues = [...editedDrill.coachingCues];
    coachingCues[index] = value;
    updateDrill({ coachingCues });
  };

  const removeCoachingCue = (index: number) => {
    updateDrill({
      coachingCues: editedDrill.coachingCues.filter((_, i) => i !== index)
    });
  };

  const toggleEquipment = (equipment: AgilityEquipmentType) => {
    if (editedDrill.equipment.includes(equipment)) {
      updateDrill({
        equipment: editedDrill.equipment.filter(e => e !== equipment)
      });
    } else {
      updateDrill({
        equipment: [...editedDrill.equipment, equipment]
      });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Edit Drill</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="pattern">Pattern</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="name">Drill Name</Label>
              <Input
                id="name"
                value={editedDrill.name}
                onChange={(e) => updateDrill({ name: e.target.value })}
                placeholder="Enter drill name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedDrill.description}
                onChange={(e) => updateDrill({ description: e.target.value })}
                placeholder="Brief description of the drill"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={editedDrill.category} 
                  onValueChange={(v) => updateDrill({ category: v as AgilityDrillCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cone_drills">Cone Drills</SelectItem>
                    <SelectItem value="ladder_drills">Ladder Drills</SelectItem>
                    <SelectItem value="reaction_drills">Reaction Drills</SelectItem>
                    <SelectItem value="change_of_direction">Change of Direction</SelectItem>
                    <SelectItem value="balance_coordination">Balance & Coordination</SelectItem>
                    <SelectItem value="sport_specific">Sport Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={editedDrill.difficulty} 
                  onValueChange={(v) => updateDrill({ difficulty: v as any })}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Equipment Required</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EQUIPMENT_OPTIONS.map(equipment => (
                  <Badge
                    key={equipment}
                    variant={editedDrill.equipment.includes(equipment) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleEquipment(equipment)}
                  >
                    {equipment}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reps">Repetitions</Label>
                <Input
                  id="reps"
                  type="number"
                  value={editedDrill.reps}
                  onChange={(e) => updateDrill({ reps: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={20}
                />
              </div>

              <div>
                <Label htmlFor="sets">Sets (optional)</Label>
                <Input
                  id="sets"
                  type="number"
                  value={editedDrill.sets || ''}
                  onChange={(e) => updateDrill({ sets: parseInt(e.target.value) || undefined })}
                  min={1}
                  max={10}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="rest">Rest (seconds)</Label>
                <Input
                  id="rest"
                  type="number"
                  value={editedDrill.restBetweenReps}
                  onChange={(e) => updateDrill({ restBetweenReps: parseInt(e.target.value) || 30 })}
                  min={0}
                  max={300}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration per rep (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={editedDrill.duration || ''}
                  onChange={(e) => updateDrill({ duration: parseInt(e.target.value) || undefined })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label htmlFor="targetTime">Target Time (seconds)</Label>
                <Input
                  id="targetTime"
                  type="number"
                  value={editedDrill.targetTime || ''}
                  onChange={(e) => updateDrill({ targetTime: parseInt(e.target.value) || undefined })}
                  placeholder="Optional"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pattern" className="space-y-4">
            <div>
              <Label htmlFor="pattern">Drill Pattern</Label>
              <Select 
                value={editedDrill.pattern} 
                onValueChange={(v) => updateDrill({ pattern: v as DrillPattern })}
              >
                <SelectTrigger id="pattern">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATTERN_OPTIONS.map(pattern => (
                    <SelectItem key={pattern} value={pattern}>
                      {pattern.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editedDrill.pattern !== 'custom' && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Pattern Preview
                </h4>
                <PatternVisualizer
                  pattern={editedDrill.pattern}
                  patternData={editedDrill.patternData}
                  onUpdate={(patternData) => updateDrill({ patternData })}
                  readOnly={editedDrill.pattern !== 'custom'}
                />
              </div>
            )}

            {editedDrill.pattern === 'custom' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">
                  Custom pattern editor allows you to create your own drill layout.
                  Click to add cones and draw paths between them.
                </p>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Step-by-Step Instructions</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addInstruction}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </Button>
              </div>
              <div className="space-y-2">
                {editedDrill.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-sm text-muted-foreground mt-2">
                      {index + 1}.
                    </span>
                    <Input
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder="Enter instruction"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeInstruction(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Coaching Cues</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addCoachingCue}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Cue
                </Button>
              </div>
              <div className="space-y-2">
                {editedDrill.coachingCues.map((cue, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={cue}
                      onChange={(e) => updateCoachingCue(index, e.target.value)}
                      placeholder="Enter coaching cue"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeCoachingCue(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="videoUrl">Video URL (optional)</Label>
              <Input
                id="videoUrl"
                value={editedDrill.videoUrl || ''}
                onChange={(e) => updateDrill({ videoUrl: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div>
              <Label>Track Metrics</Label>
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Completion Time</span>
                  </div>
                  <Switch
                    checked={editedDrill.metrics.time}
                    onCheckedChange={(checked) => 
                      updateDrill({ 
                        metrics: { ...editedDrill.metrics, time: checked } 
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Accuracy / Errors</span>
                  </div>
                  <Switch
                    checked={editedDrill.metrics.accuracy}
                    onCheckedChange={(checked) => 
                      updateDrill({ 
                        metrics: { ...editedDrill.metrics, accuracy: checked } 
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Touches / Contacts</span>
                  </div>
                  <Switch
                    checked={editedDrill.metrics.touches || false}
                    onCheckedChange={(checked) => 
                      updateDrill({ 
                        metrics: { ...editedDrill.metrics, touches: checked } 
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Heart Rate</span>
                  </div>
                  <Switch
                    checked={editedDrill.metrics.heartRate || false}
                    onCheckedChange={(checked) => 
                      updateDrill({ 
                        metrics: { ...editedDrill.metrics, heartRate: checked } 
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                Metrics will be tracked during drill execution. Players can record their performance
                and track improvement over time.
              </p>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}