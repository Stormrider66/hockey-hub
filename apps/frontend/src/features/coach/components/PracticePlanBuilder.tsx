'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Clock,
  GripVertical,
  Play,
  Plus,
  Save,
  Trash2,
  Copy,
  FileText,
  Snowflake,
  Users,
  Target,
  Video,
  AlertCircle,
  ChevronRight,
  Timer,
  MapPin,
  Dumbbell,
  Shield,
  Zap,
  Heart,
  Brain,
} from 'lucide-react';
import { format } from 'date-fns';

export interface Drill {
  id: string;
  name: string;
  category: 'warmup' | 'skills' | 'tactics' | 'conditioning' | 'scrimmage' | 'cooldown';
  duration: number; // minutes
  zone: 'full' | 'half' | 'third' | 'neutral' | 'offensive' | 'defensive';
  equipment: string[];
  description?: string;
  objectives?: string[];
  keyPoints?: string[];
  videoUrl?: string;
  intensity: 'low' | 'medium' | 'high';
  playerCount?: string; // e.g., "5v5", "3v3", "all"
}

export interface PracticePlan {
  id: string;
  name: string;
  date?: Date;
  duration: number; // total minutes
  teamId?: string;
  objectives: string[];
  drills: Drill[];
  notes?: string;
  equipment: string[];
  createdBy: string;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

interface PracticePlanBuilderProps {
  onSavePlan: (plan: PracticePlan) => void;
  existingPlan?: PracticePlan;
  teamId?: string;
}

// Drill Library - Mock data
const drillLibrary: Drill[] = [
  {
    id: 'd1',
    name: 'Dynamic Warm-up',
    category: 'warmup',
    duration: 10,
    zone: 'full',
    equipment: [],
    intensity: 'low',
    objectives: ['Prepare muscles', 'Increase heart rate'],
  },
  {
    id: 'd2',
    name: 'Passing Progression',
    category: 'skills',
    duration: 15,
    zone: 'half',
    equipment: ['pucks', 'cones'],
    intensity: 'medium',
    objectives: ['Improve passing accuracy', 'Quick decision making'],
  },
  {
    id: 'd3',
    name: '2-1-2 Forecheck',
    category: 'tactics',
    duration: 20,
    zone: 'full',
    equipment: ['pucks', 'jerseys'],
    intensity: 'high',
    objectives: ['Pressure opposition', 'Force turnovers'],
  },
  {
    id: 'd4',
    name: 'Power Play Setup',
    category: 'tactics',
    duration: 20,
    zone: 'offensive',
    equipment: ['pucks', 'cones'],
    intensity: 'medium',
    objectives: ['Practice PP formations', 'Quick puck movement'],
  },
  {
    id: 'd5',
    name: 'Battle Drills',
    category: 'conditioning',
    duration: 15,
    zone: 'third',
    equipment: ['pucks'],
    intensity: 'high',
    objectives: ['Compete level', 'Board battles'],
  },
  {
    id: 'd6',
    name: 'Small Area Game 3v3',
    category: 'scrimmage',
    duration: 20,
    zone: 'half',
    equipment: ['pucks', 'jerseys', 'nets'],
    intensity: 'high',
    playerCount: '3v3',
    objectives: ['Quick decisions', 'Compete'],
  },
];

// Sortable Drill Item
const SortableDrillItem: React.FC<{
  drill: Drill;
  index: number;
  onRemove: () => void;
  onEdit: () => void;
}> = ({ drill, index, onRemove, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: drill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'warmup': return <Heart className="w-4 h-4" />;
      case 'skills': return <Target className="w-4 h-4" />;
      case 'tactics': return <Brain className="w-4 h-4" />;
      case 'conditioning': return <Dumbbell className="w-4 h-4" />;
      case 'scrimmage': return <Users className="w-4 h-4" />;
      case 'cooldown': return <Snowflake className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-3 mb-2"
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab pt-1"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getCategoryIcon(drill.category)}
                <h4 className="font-medium">{drill.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  {drill.duration} min
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {drill.zone}
                </Badge>
                <span className={`text-xs ${getIntensityColor(drill.intensity)}`}>
                  ● {drill.intensity}
                </span>
              </div>
              {drill.objectives && drill.objectives.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {drill.objectives.join(' • ')}
                </p>
              )}
              {drill.equipment && drill.equipment.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">Equipment:</span>
                  {drill.equipment.map((item, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
              >
                <Clock className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PracticePlanBuilder: React.FC<PracticePlanBuilderProps> = ({
  onSavePlan,
  existingPlan,
  teamId,
}) => {
  const [planName, setPlanName] = useState(existingPlan?.name || '');
  const [objectives, setObjectives] = useState<string[]>(existingPlan?.objectives || []);
  const [currentObjective, setCurrentObjective] = useState('');
  const [selectedDrills, setSelectedDrills] = useState<Drill[]>(existingPlan?.drills || []);
  const [notes, setNotes] = useState(existingPlan?.notes || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showDrillDialog, setShowDrillDialog] = useState(false);
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSelectedDrills((drills) => {
        const oldIndex = drills.findIndex((d) => d.id === active.id);
        const newIndex = drills.findIndex((d) => d.id === over?.id);
        return arrayMove(drills, oldIndex, newIndex);
      });
    }
  };

  const totalDuration = selectedDrills.reduce((sum, drill) => sum + drill.duration, 0);
  const allEquipment = Array.from(new Set(selectedDrills.flatMap(d => d.equipment || [])));

  const filteredDrills = drillLibrary.filter(drill => {
    const matchesSearch = drill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || drill.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const addObjective = () => {
    if (currentObjective.trim()) {
      setObjectives([...objectives, currentObjective.trim()]);
      setCurrentObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const addDrill = (drill: Drill) => {
    const newDrill = {
      ...drill,
      id: `${drill.id}-${Date.now()}`, // Unique ID for each instance
    };
    setSelectedDrills([...selectedDrills, newDrill]);
  };

  const removeDrill = (drillId: string) => {
    setSelectedDrills(selectedDrills.filter(d => d.id !== drillId));
  };

  const updateDrill = (drillId: string, updates: Partial<Drill>) => {
    setSelectedDrills(selectedDrills.map(d => 
      d.id === drillId ? { ...d, ...updates } : d
    ));
  };

  const savePracticePlan = () => {
    const plan: PracticePlan = {
      id: existingPlan?.id || `plan-${Date.now()}`,
      name: planName,
      duration: totalDuration,
      teamId,
      objectives,
      drills: selectedDrills,
      notes,
      equipment: allEquipment,
      createdBy: 'current-coach', // Would come from auth
      createdAt: existingPlan?.createdAt || new Date(),
      useCount: existingPlan?.useCount || 0,
    };
    
    onSavePlan(plan);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          {/* Plan Name and Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Practice Plan Name</Label>
              <Input
                id="plan-name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g., Pre-Game Practice, Skills Development"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{totalDuration} minutes</span>
              </div>
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-2">
            <Label>Practice Objectives</Label>
            <div className="flex gap-2">
              <Input
                value={currentObjective}
                onChange={(e) => setCurrentObjective(e.target.value)}
                placeholder="Add an objective..."
                onKeyPress={(e) => e.key === 'Enter' && addObjective()}
              />
              <Button onClick={addObjective} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {objectives.map((obj, idx) => (
                <Badge key={idx} variant="secondary" className="pr-1">
                  {obj}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={() => removeObjective(idx)}
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Drill Library */}
        <Card className="p-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Drill Library</h3>
            
            <div className="space-y-2">
              <Input
                placeholder="Search drills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="warmup">Warm-up</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                  <SelectItem value="tactics">Tactics</SelectItem>
                  <SelectItem value="conditioning">Conditioning</SelectItem>
                  <SelectItem value="scrimmage">Scrimmage</SelectItem>
                  <SelectItem value="cooldown">Cool-down</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredDrills.map((drill) => (
                  <Card
                    key={drill.id}
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => addDrill(drill)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{drill.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {drill.duration} min
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {drill.zone} • {drill.intensity} intensity
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>

        {/* Practice Plan */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Practice Timeline</h3>
              <Button
                onClick={savePracticePlan}
                disabled={!planName || selectedDrills.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Plan
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedDrills.map(d => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {selectedDrills.map((drill, index) => (
                    <SortableDrillItem
                      key={drill.id}
                      drill={drill}
                      index={index}
                      onRemove={() => removeDrill(drill.id)}
                      onEdit={() => {
                        setEditingDrill(drill);
                        setShowDrillDialog(true);
                      }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              
              {selectedDrills.length === 0 && (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Snowflake className="w-8 h-8 mx-auto mb-2" />
                    <p>Click drills from the library to add them</p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Equipment Summary */}
            {allEquipment.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Equipment needed:</span>
                  {allEquipment.map((item, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Notes */}
      <Card className="p-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any special instructions, reminders, or notes..."
            rows={3}
          />
        </div>
      </Card>

      {/* Edit Drill Dialog */}
      <Dialog open={showDrillDialog} onOpenChange={setShowDrillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Drill Duration</DialogTitle>
            <DialogDescription>
              Adjust the duration for this specific drill in your practice plan.
            </DialogDescription>
          </DialogHeader>
          {editingDrill && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={editingDrill.duration}
                  onChange={(e) => setEditingDrill({
                    ...editingDrill,
                    duration: parseInt(e.target.value) || 0
                  })}
                  min={1}
                  max={60}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDrillDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingDrill) {
                updateDrill(editingDrill.id, { duration: editingDrill.duration });
                setShowDrillDialog(false);
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PracticePlanBuilder;