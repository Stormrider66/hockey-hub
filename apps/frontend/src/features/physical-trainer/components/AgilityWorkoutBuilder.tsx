'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock,
  Plus,
  Save,
  X,
  Activity,
  Target,
  Timer,
  AlertTriangle,
  Copy,
  Trash2,
  PlayCircle,
  Zap,
  Eye,
  Grid3X3,
  Move,
  Users,
  Dumbbell
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useCreateAgilityWorkoutMutation } from '@/store/api/trainingApi';
import type { 
  AgilityProgram, 
  AgilityDrill,
  AgilityTemplate,
  AgilityDrillCategory,
  AgilityEquipmentType,
  DrillPattern
} from '../types/agility.types';
import { AGILITY_DRILL_LIBRARY, DRILL_PATTERNS, estimateAgilityDuration } from '../types/agility.types';
import DrillLibrary from './agility-builder/DrillLibrary';
import DrillEditor from './agility-builder/DrillEditor';
import PatternVisualizer from './agility-builder/PatternVisualizer';
import AgilityTemplates from './agility-builder/AgilityTemplates';
import EquipmentGuide from './agility-builder/EquipmentGuide';
import DrillCard from './agility-builder/DrillCard';

interface AgilityWorkoutBuilderProps {
  onSave: (program: AgilityProgram) => void;
  onCancel: () => void;
  initialProgram?: AgilityProgram;
  selectedPlayers?: string[];
  teamId?: string;
}

export default function AgilityWorkoutBuilder({
  onSave,
  onCancel,
  initialProgram,
  selectedPlayers = [],
  teamId = 'team-001'
}: AgilityWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [createAgilityWorkout, { isLoading }] = useCreateAgilityWorkoutMutation();
  
  // State management
  const [activeTab, setActiveTab] = useState<'build' | 'library' | 'templates' | 'equipment'>('build');
  const [programName, setProgramName] = useState(initialProgram?.name || '');
  const [programDescription, setProgramDescription] = useState(initialProgram?.description || '');
  const [warmupDuration, setWarmupDuration] = useState(initialProgram?.warmupDuration || 300); // 5 min default
  const [cooldownDuration, setCooldownDuration] = useState(initialProgram?.cooldownDuration || 300); // 5 min default
  const [drills, setDrills] = useState<AgilityDrill[]>(initialProgram?.drills || []);
  const [editingDrill, setEditingDrill] = useState<AgilityDrill | null>(null);
  const [activeDrillId, setActiveDrillId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AgilityDrillCategory | 'all'>('all');
  const [focusAreas, setFocusAreas] = useState<string[]>(initialProgram?.focusAreas || []);
  
  // Calculate total duration and metrics
  const totalDuration = useMemo(() => {
    return estimateAgilityDuration({
      id: '',
      name: '',
      drills,
      warmupDuration,
      cooldownDuration,
      totalDuration: 0,
      equipmentNeeded: [],
      difficulty: 'intermediate',
      focusAreas: []
    });
  }, [drills, warmupDuration, cooldownDuration]);

  const equipmentNeeded = useMemo(() => {
    const equipment = new Set<AgilityEquipmentType>();
    drills.forEach(drill => {
      drill.equipment.forEach(eq => equipment.add(eq));
    });
    return Array.from(equipment);
  }, [drills]);

  const drillCategories = useMemo(() => {
    const categories = new Map<AgilityDrillCategory, number>();
    drills.forEach(drill => {
      categories.set(drill.category, (categories.get(drill.category) || 0) + 1);
    });
    return categories;
  }, [drills]);

  // Handlers
  const handleAddDrill = useCallback((drill: Partial<AgilityDrill>) => {
    const newDrill: AgilityDrill = {
      id: `drill-${Date.now()}`,
      name: drill.name || 'New Drill',
      category: drill.category || 'cone_drills',
      pattern: drill.pattern || 'custom',
      equipment: drill.equipment || [],
      restBetweenReps: drill.restBetweenReps || 30,
      reps: drill.reps || 3,
      description: drill.description || '',
      instructions: drill.instructions || [],
      coachingCues: drill.coachingCues || [],
      difficulty: drill.difficulty || 'intermediate',
      metrics: drill.metrics || { time: true, accuracy: true },
      ...drill
    };
    setDrills([...drills, newDrill]);
    setEditingDrill(newDrill);
    setActiveTab('build');
  }, [drills]);

  const handleUpdateDrill = useCallback((drill: AgilityDrill) => {
    setDrills(drills.map(d => d.id === drill.id ? drill : d));
    setEditingDrill(null);
  }, [drills]);

  const handleDeleteDrill = useCallback((drillId: string) => {
    setDrills(drills.filter(d => d.id !== drillId));
    if (editingDrill?.id === drillId) {
      setEditingDrill(null);
    }
  }, [drills, editingDrill]);

  const handleDuplicateDrill = useCallback((drill: AgilityDrill) => {
    const newDrill = {
      ...drill,
      id: `drill-${Date.now()}`,
      name: `${drill.name} (Copy)`
    };
    const index = drills.findIndex(d => d.id === drill.id);
    const newDrills = [...drills];
    newDrills.splice(index + 1, 0, newDrill);
    setDrills(newDrills);
  }, [drills]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrillId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = drills.findIndex(d => d.id === active.id);
      const newIndex = drills.findIndex(d => d.id === over.id);
      setDrills(arrayMove(drills, oldIndex, newIndex));
    }
    
    setActiveDrillId(null);
  };

  const handleTemplateSelect = (template: AgilityTemplate) => {
    setProgramName(template.name);
    setProgramDescription(template.description);
    setDrills(template.program.drills);
    setWarmupDuration(template.program.warmupDuration);
    setCooldownDuration(template.program.cooldownDuration);
    setFocusAreas(template.program.focusAreas);
    setActiveTab('build');
  };

  const handleSave = async () => {
    const program: AgilityProgram = {
      id: initialProgram?.id || `program-${Date.now()}`,
      name: programName,
      description: programDescription,
      drills,
      warmupDuration,
      cooldownDuration,
      totalDuration,
      equipmentNeeded,
      difficulty: 'intermediate', // Could be calculated based on drills
      focusAreas,
      tags: []
    };
    
    // If onSave prop is provided, use it
    if (onSave) {
      onSave(program);
      return;
    }
    
    // Otherwise, save directly via API
    try {
      const workoutData = {
        title: programName,
        description: programDescription,
        type: 'agility' as const,
        scheduledDate: new Date().toISOString(),
        location: 'Field House',
        teamId,
        playerIds: selectedPlayers,
        agilityProgram: program
      };
      
      await createAgilityWorkout(workoutData).unwrap();
      toast.success(t('physicalTrainer:agility.createSuccess'));
      onCancel();
    } catch (error) {
      console.error('Failed to save agility workout:', error);
      toast.error(t('physicalTrainer:agility.saveError'));
    }
  };

  const isValid = programName && drills.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500" />
            {t('physicalTrainer:agility.builder.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('physicalTrainer:agility.builder.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Clock className="h-4 w-4 mr-2" />
            {Math.floor(totalDuration / 60)} min
          </Badge>
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Activity className="h-4 w-4 mr-2" />
            {drills.length} drills
          </Badge>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            {t('common:cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('common:saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('common:save')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="build" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              {t('physicalTrainer:agility.tabs.build')}
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              {t('physicalTrainer:agility.tabs.library')}
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              {t('physicalTrainer:agility.tabs.templates')}
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('physicalTrainer:agility.tabs.equipment')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="build" className="h-full p-4">
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* Left Panel - Program Details */}
              <div className="col-span-3 space-y-4 overflow-y-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('physicalTrainer:agility.details.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">
                        {t('physicalTrainer:agility.details.name')}
                      </Label>
                      <Input
                        id="name"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                        placeholder={t('physicalTrainer:agility.details.namePlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">
                        {t('physicalTrainer:agility.details.description')}
                      </Label>
                      <Textarea
                        id="description"
                        value={programDescription}
                        onChange={(e) => setProgramDescription(e.target.value)}
                        rows={3}
                        placeholder={t('physicalTrainer:agility.details.descriptionPlaceholder')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="warmup">
                          {t('physicalTrainer:agility.details.warmup')}
                        </Label>
                        <Input
                          id="warmup"
                          type="number"
                          value={warmupDuration / 60}
                          onChange={(e) => setWarmupDuration(parseInt(e.target.value) * 60)}
                          min={1}
                          max={30}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cooldown">
                          {t('physicalTrainer:agility.details.cooldown')}
                        </Label>
                        <Input
                          id="cooldown"
                          type="number"
                          value={cooldownDuration / 60}
                          onChange={(e) => setCooldownDuration(parseInt(e.target.value) * 60)}
                          min={1}
                          max={30}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('physicalTrainer:agility.summary.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {t('physicalTrainer:agility.summary.equipment')}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {equipmentNeeded.length > 0 ? (
                          equipmentNeeded.map(eq => (
                            <Badge key={eq} variant="secondary" className="text-xs">
                              {eq}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">None required</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {t('physicalTrainer:agility.summary.categories')}
                      </h4>
                      <div className="space-y-1">
                        {Array.from(drillCategories.entries()).map(([category, count]) => (
                          <div key={category} className="flex justify-between text-sm">
                            <span className="text-muted-foreground capitalize">
                              {category.replace('_', ' ')}
                            </span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedPlayers.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          {t('physicalTrainer:agility.summary.participants')}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedPlayers.length} players</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Center Panel - Drill List */}
              <div className="col-span-5">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{t('agility.drills.title', { ns: 'physicalTrainer', defaultValue: 'Drill Sequence' })}</CardTitle>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setActiveTab('library');
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('agility.drills.add', { ns: 'physicalTrainer', defaultValue: 'Add Drill' })}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={drills.map(d => d.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                          <div className="space-y-3 pb-4">
                            {drills.map((drill, index) => (
                              <DrillCard
                                key={drill.id}
                                drill={drill}
                                index={index}
                                isActive={editingDrill?.id === drill.id}
                                onEdit={() => setEditingDrill(drill)}
                                onDelete={() => handleDeleteDrill(drill.id)}
                                onDuplicate={() => handleDuplicateDrill(drill)}
                              />
                            ))}
                          </div>
                        </div>
                      </SortableContext>
                      <DragOverlay>
                        {activeDrillId && (
                          <Card className="shadow-lg">
                            <CardContent className="p-2">
                              <div className="text-sm font-medium">
                                {drills.find(d => d.id === activeDrillId)?.name}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </DragOverlay>
                    </DndContext>

                    {drills.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>{t('agility.drills.empty', { ns: 'physicalTrainer', defaultValue: 'No drills added yet' })}</p>
                        <Button 
                          variant="link" 
                          onClick={() => setActiveTab('library')}
                          className="mt-2"
                        >
                          {t('agility.drills.browse', { ns: 'physicalTrainer', defaultValue: 'Browse drill library' })}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Drill Editor / Pattern Visualizer */}
              <div className="col-span-4">
                {editingDrill ? (
                  <DrillEditor
                    drill={editingDrill}
                    onSave={handleUpdateDrill}
                    onCancel={() => setEditingDrill(null)}
                  />
                ) : (
                  <Card className="h-full">
                    <CardContent className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Move className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{t('physicalTrainer:agility.editor.selectDrill')}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library" className="h-full p-4">
            <DrillLibrary
              onSelectDrill={handleAddDrill}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </TabsContent>

          <TabsContent value="templates" className="h-full p-4">
            <AgilityTemplates
              onSelectTemplate={handleTemplateSelect}
            />
          </TabsContent>

          <TabsContent value="equipment" className="h-full p-4">
            <EquipmentGuide
              requiredEquipment={equipmentNeeded}
              drills={drills}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Warnings */}
      {drills.length === 0 && (
        <Alert className="mx-4 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('physicalTrainer:agility.warnings.noDrills')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}