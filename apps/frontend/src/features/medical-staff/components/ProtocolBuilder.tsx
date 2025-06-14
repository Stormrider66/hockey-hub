"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Plus, 
  Trash2, 
  Edit3,
  FileText, 
  Target, 
  Activity, 
  Zap, 
  Clock,
  CheckCircle,
  X,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  sets?: number;
  reps?: number;
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ProtocolPhase {
  id: string;
  name: string;
  description: string;
  duration: number;
  goals: string[];
  exercises: Exercise[];
  criteria: string[];
  notes?: string;
}

interface TreatmentProtocol {
  id?: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  phases: ProtocolPhase[];
  createdDate?: string;
  scheduledStartDate?: string;
  assignedToPlayer?: string;
  status: 'draft' | 'template' | 'active' | 'completed';
  createdBy?: string;
}

// Mock exercise library
const EXERCISE_LIBRARY: Exercise[] = [
  {
    id: '1',
    name: 'Straight Leg Raises',
    category: 'Strengthening',
    description: 'Lying supine, lift straight leg to 45 degrees, hold 5 seconds, lower slowly',
    duration: 10,
    sets: 3,
    reps: 15,
    equipment: ['Mat'],
    difficulty: 'beginner'
  },
  {
    id: '2',
    name: 'Wall Sits',
    category: 'Strengthening',
    description: 'Back against wall, slide down to 90-degree knee bend, hold position',
    duration: 15,
    sets: 3,
    reps: 1,
    equipment: ['Wall'],
    difficulty: 'intermediate'
  },
  {
    id: '3',
    name: 'Ice Application',
    category: 'Recovery',
    description: 'Apply ice pack to affected area for inflammation control',
    duration: 20,
    equipment: ['Ice Pack', 'Towel'],
    difficulty: 'beginner'
  },
  {
    id: '4',
    name: 'Range of Motion - Knee',
    category: 'Mobility',
    description: 'Gentle passive and active knee flexion/extension exercises',
    duration: 15,
    sets: 2,
    reps: 10,
    equipment: ['None'],
    difficulty: 'beginner'
  },
  {
    id: '5',
    name: 'Balance Training',
    category: 'Functional',
    description: 'Single leg standing with eyes closed, progress to unstable surface',
    duration: 10,
    sets: 3,
    reps: 1,
    equipment: ['Balance Pad'],
    difficulty: 'intermediate'
  }
];

const INJURY_CATEGORIES = [
  'ACL Injury',
  'Hamstring Strain',
  'Ankle Sprain',
  'Concussion',
  'Shoulder Injury',
  'Back Pain',
  'General Recovery'
];

const PHASE_TEMPLATES = [
  {
    name: 'Acute Phase',
    duration: 7,
    goals: ['Reduce pain and inflammation', 'Protect healing tissue', 'Maintain range of motion'],
    criteria: ['Pain level < 3/10', 'Swelling reduced by 50%', 'No increase in symptoms']
  },
  {
    name: 'Sub-Acute Phase',
    duration: 14,
    goals: ['Restore range of motion', 'Begin gentle strengthening', 'Improve mobility'],
    criteria: ['Full passive range of motion', 'Minimal pain with movement', 'Can bear weight']
  },
  {
    name: 'Strengthening Phase',
    duration: 21,
    goals: ['Restore strength', 'Improve stability', 'Progress functional movement'],
    criteria: ['80% strength compared to unaffected side', 'No pain with resistance', 'Good movement quality']
  },
  {
    name: 'Functional Phase',
    duration: 14,
    goals: ['Sport-specific movements', 'Return to play preparation', 'Injury prevention'],
    criteria: ['Functional movement screen passed', 'Sport-specific tests passed', 'Confidence restored']
  }
];

const PLAYERS = [
  { id: '1', name: 'Erik Andersson' },
  { id: '2', name: 'Marcus Lindberg' },
  { id: '3', name: 'Viktor Nilsson' },
  { id: '4', name: 'Johan Bergström' },
  { id: '5', name: 'Anders Johansson' },
  { id: '6', name: 'Oskar Pettersson' },
  { id: '7', name: 'Gustav Eriksson' },
  { id: '8', name: 'Filip Larsson' }
];

interface EnhancedProtocol extends TreatmentProtocol {
  id?: string;
  createdDate?: string;
  scheduledStartDate?: string;
  assignedToPlayer?: string;
  status: 'draft' | 'template' | 'active' | 'completed';
  createdBy?: string;
}

export function ProtocolBuilder() {
  const [protocol, setProtocol] = useState<EnhancedProtocol>({
    name: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    phases: [],
    status: 'draft',
    createdDate: new Date().toISOString().split('T')[0]
  });

  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string>('');
  const [editingCriterion, setEditingCriterion] = useState<string>('');

  const handleSaveProtocol = () => {
    const savedProtocol: EnhancedProtocol = {
      ...protocol,
      id: protocol.id || Date.now().toString(),
      createdDate: protocol.createdDate || new Date().toISOString().split('T')[0],
      createdBy: 'Medical Staff'
    };

    console.log('Protocol saved:', savedProtocol);
    
    // Here you would normally save to backend
    alert(`Protocol "${savedProtocol.name}" saved successfully!\n\n` + 
          `Phases: ${savedProtocol.phases.length}\n` +
          `Exercises: ${savedProtocol.phases.reduce((sum, phase) => sum + phase.exercises.length, 0)}\n` +
          `Status: ${savedProtocol.status}\n` +
          (savedProtocol.assignedToPlayer ? `Assigned to: ${PLAYERS.find(p => p.id === savedProtocol.assignedToPlayer)?.name}\n` : '') +
          (savedProtocol.scheduledStartDate ? `Start Date: ${savedProtocol.scheduledStartDate}` : ''));
  };

  const addPhase = (templateIndex?: number) => {
    const template = templateIndex !== undefined ? PHASE_TEMPLATES[templateIndex] : null;
    const newPhase: ProtocolPhase = {
      id: Date.now().toString(),
      name: template?.name || `Phase ${protocol.phases.length + 1}`,
      description: template ? `${template.name} - Focus on recovery and rehabilitation` : '',
      duration: template?.duration || 7,
      goals: template?.goals || [],
      exercises: [],
      criteria: template?.criteria || [],
      notes: ''
    };

    setProtocol(prev => ({
      ...prev,
      phases: [...prev.phases, newPhase]
    }));
    setActivePhase(protocol.phases.length);
  };

  const updatePhase = (phaseIndex: number, updatedPhase: Partial<ProtocolPhase>) => {
    setProtocol(prev => ({
      ...prev,
      phases: prev.phases.map((phase, index) => 
        index === phaseIndex ? { ...phase, ...updatedPhase } : phase
      )
    }));
  };

  const removePhase = (phaseId: string) => {
    const phaseIndex = protocol.phases.findIndex(p => p.id === phaseId);
    setProtocol(prev => ({
      ...prev,
      phases: prev.phases.filter(p => p.id !== phaseId)
    }));
    
    if (activePhase === phaseIndex) {
      setActivePhase(null);
    }
  };

  const addGoalToPhase = (phaseIndex: number, goal: string) => {
    if (!goal.trim()) return;
    updatePhase(phaseIndex, {
      goals: [...protocol.phases[phaseIndex].goals, goal.trim()]
    });
  };

  const removeGoalFromPhase = (phaseIndex: number, goalIndex: number) => {
    updatePhase(phaseIndex, {
      goals: protocol.phases[phaseIndex].goals.filter((_, index) => index !== goalIndex)
    });
  };

  const addCriterionToPhase = (phaseIndex: number, criterion: string) => {
    if (!criterion.trim()) return;
    updatePhase(phaseIndex, {
      criteria: [...protocol.phases[phaseIndex].criteria, criterion.trim()]
    });
  };

  const removeCriterionFromPhase = (phaseIndex: number, criterionIndex: number) => {
    updatePhase(phaseIndex, {
      criteria: protocol.phases[phaseIndex].criteria.filter((_, index) => index !== criterionIndex)
    });
  };

  const addExerciseToPhase = (phaseIndex: number, exercise: Exercise) => {
    updatePhase(phaseIndex, {
      exercises: [...protocol.phases[phaseIndex].exercises, exercise]
    });
  };

  const removeExerciseFromPhase = (phaseIndex: number, exerciseIndex: number) => {
    updatePhase(phaseIndex, {
      exercises: protocol.phases[phaseIndex].exercises.filter((_, index) => index !== exerciseIndex)
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Strengthening': return <Zap className="h-4 w-4" />;
      case 'Mobility': return <Activity className="h-4 w-4" />;
      case 'Recovery': return <Clock className="h-4 w-4" />;
      case 'Functional': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const totalDuration = protocol.phases.reduce((sum, phase) => sum + phase.duration, 0);
  const totalExercises = protocol.phases.reduce((sum, phase) => sum + phase.exercises.length, 0);

  return (
    <div className="space-y-6">
      {/* Protocol Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Treatment Protocol
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Label>Protocol Name</Label>
              <Input
                value={protocol.name}
                onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ACL Reconstruction Rehabilitation"
              />
            </div>
            <div className="space-y-4">
              <Label htmlFor="category">Category</Label>
              <Select 
                key={protocol.category || "empty"}
                value={protocol.category || ""} 
                onValueChange={(value) => {
                  setProtocol(prev => ({ 
                    ...prev, 
                    category: value 
                  }));
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select injury category" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8} className="bg-white border shadow-lg p-2">
                  {INJURY_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category} className="px-3 py-2 cursor-pointer">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {protocol.category && (
                <div className="text-xs text-muted-foreground">
                  Selected: {protocol.category}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Description</Label>
            <Textarea
              value={protocol.description}
              onChange={(e) => setProtocol(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the protocol purpose and overview..."
              rows={3}
            />
          </div>

          {/* Player Assignment and Scheduling */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assign to Player (Optional)</Label>
              <Select 
                value={protocol.assignedToPlayer || ""} 
                onValueChange={(value) => setProtocol(prev => ({ ...prev, assignedToPlayer: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {PLAYERS.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scheduled Start Date (Optional)</Label>
              <Input
                type="date"
                value={protocol.scheduledStartDate || ''}
                onChange={(e) => setProtocol(prev => ({ ...prev, scheduledStartDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-4">
              <Label>Difficulty Level</Label>
              <Select 
                value={protocol.difficulty} 
                onValueChange={(value: any) => setProtocol(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8} className="bg-white border shadow-lg p-2">
                  <SelectItem value="beginner" className="px-3 py-2 cursor-pointer">Beginner</SelectItem>
                  <SelectItem value="intermediate" className="px-3 py-2 cursor-pointer">Intermediate</SelectItem>
                  <SelectItem value="advanced" className="px-3 py-2 cursor-pointer">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <Label>Protocol Status</Label>
              <Select 
                value={protocol.status || 'draft'} 
                onValueChange={(value: any) => setProtocol(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8} className="bg-white border shadow-lg p-2">
                  <SelectItem value="draft" className="px-3 py-2 cursor-pointer">Draft</SelectItem>
                  <SelectItem value="template" className="px-3 py-2 cursor-pointer">Template</SelectItem>
                  <SelectItem value="active" className="px-3 py-2 cursor-pointer">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total Duration</Label>
              <div className="flex items-center gap-2 pt-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{totalDuration} days</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Phases</Label>
              <div className="flex items-center gap-2 pt-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{protocol.phases.length} phases</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Exercises</Label>
              <div className="flex items-center gap-2 pt-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{totalExercises} exercises</span>
              </div>
            </div>
          </div>

          {/* Protocol Overview */}
          {protocol.phases.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-3">Protocol Overview</h4>
              <div className="flex items-center gap-2 text-sm">
                {protocol.phases.map((phase, index) => (
                  <React.Fragment key={phase.id}>
                    <Badge variant="outline" className="text-xs">
                      {phase.name} ({phase.duration}d)
                    </Badge>
                    {index < protocol.phases.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase Management */}
      <div className="grid grid-cols-3 gap-6">
        {/* Phase List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Protocol Phases</CardTitle>
              <Button size="sm" onClick={() => addPhase()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Quick Templates */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Add Templates:</Label>
              <div className="grid grid-cols-2 gap-2">
                {PHASE_TEMPLATES.map((template, index) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    onClick={() => addPhase(index)}
                    className="text-xs h-8"
                  >
                    {template.name.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Phase List */}
            <div className="space-y-2">
              {protocol.phases.map((phase, index) => (
                <div
                  key={phase.id}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                    activePhase === index ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                  )}
                  onClick={() => setActivePhase(index)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{phase.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {phase.duration} days • {phase.exercises.length} exercises
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhase(phase.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {protocol.phases.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm">No phases added yet</p>
                <p className="text-xs">Click templates above to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phase Details */}
        <div className="col-span-2">
          {activePhase !== null && protocol.phases[activePhase] ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Edit Phase: {protocol.phases[activePhase].name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="goals">Goals</TabsTrigger>
                    <TabsTrigger value="exercises">Exercises</TabsTrigger>
                    <TabsTrigger value="criteria">Criteria</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phase Name</Label>
                        <Input
                          value={protocol.phases[activePhase].name}
                          onChange={(e) => updatePhase(activePhase, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (days)</Label>
                        <Input
                          type="number"
                          value={protocol.phases[activePhase].duration}
                          onChange={(e) => updatePhase(activePhase, { duration: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={protocol.phases[activePhase].description}
                        onChange={(e) => updatePhase(activePhase, { description: e.target.value })}
                        placeholder="Describe this phase..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={protocol.phases[activePhase].notes || ''}
                        onChange={(e) => updatePhase(activePhase, { notes: e.target.value })}
                        placeholder="Any additional notes..."
                        rows={2}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="goals" className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={editingGoal}
                        onChange={(e) => setEditingGoal(e.target.value)}
                        placeholder="Add a goal for this phase..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addGoalToPhase(activePhase, editingGoal);
                            setEditingGoal('');
                          }
                        }}
                      />
                      <Button 
                        size="sm"
                        onClick={() => {
                          addGoalToPhase(activePhase, editingGoal);
                          setEditingGoal('');
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {protocol.phases[activePhase].goals.map((goal, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{goal}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeGoalFromPhase(activePhase, index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      {protocol.phases[activePhase].goals.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-sm">No goals defined</p>
                          <p className="text-xs">Add goals to track progress</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="exercises" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Phase Exercises</h4>
                      <Button 
                        size="sm" 
                        onClick={() => setShowExerciseLibrary(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Exercise
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {protocol.phases[activePhase].exercises.map((exercise, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(exercise.category)}
                            <div>
                              <div className="font-medium text-sm">{exercise.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {exercise.category} • {exercise.duration}min
                                {exercise.sets && exercise.reps && ` • ${exercise.sets}x${exercise.reps}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(exercise.difficulty)} variant="outline">
                              {exercise.difficulty}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeExerciseFromPhase(activePhase, index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {protocol.phases[activePhase].exercises.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-sm">No exercises added</p>
                          <p className="text-xs">Click "Add Exercise" to browse library</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="criteria" className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={editingCriterion}
                        onChange={(e) => setEditingCriterion(e.target.value)}
                        placeholder="Add progression criteria..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addCriterionToPhase(activePhase, editingCriterion);
                            setEditingCriterion('');
                          }
                        }}
                      />
                      <Button 
                        size="sm"
                        onClick={() => {
                          addCriterionToPhase(activePhase, editingCriterion);
                          setEditingCriterion('');
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {protocol.phases[activePhase].criteria.map((criterion, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">{criterion}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeCriterionFromPhase(activePhase, index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      {protocol.phases[activePhase].criteria.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-sm">No criteria defined</p>
                          <p className="text-xs">Add criteria for phase progression</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No Phase Selected</h3>
                  <p className="text-sm">Add a phase or select an existing one to edit details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Exercise Library Modal */}
      {showExerciseLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Exercise Library</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowExerciseLibrary(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="space-y-3">
                {EXERCISE_LIBRARY.map(exercise => (
                  <div key={exercise.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(exercise.category)}
                      <div>
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-sm text-muted-foreground">{exercise.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {exercise.category} • {exercise.duration}min
                          {exercise.sets && exercise.reps && ` • ${exercise.sets}x${exercise.reps}`}
                          • Equipment: {exercise.equipment.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(exercise.difficulty)} variant="outline">
                        {exercise.difficulty}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (activePhase !== null) {
                            addExerciseToPhase(activePhase, exercise);
                          }
                          setShowExerciseLibrary(false);
                        }}
                        disabled={activePhase === null}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Save Button */}
      {protocol.name && protocol.phases.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Ready to Save Protocol</h3>
                <p className="text-sm text-muted-foreground">
                  {protocol.name} • {protocol.phases.length} phases • {totalExercises} exercises
                  {protocol.assignedToPlayer && ` • Assigned to ${PLAYERS.find(p => p.id === protocol.assignedToPlayer)?.name}`}
                  {protocol.scheduledStartDate && ` • Starts ${protocol.scheduledStartDate}`}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSaveProtocol}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Protocol
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 