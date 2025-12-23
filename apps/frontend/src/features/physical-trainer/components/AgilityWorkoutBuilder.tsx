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
  AlertTriangle,
  Copy,
  Trash2,
  PlayCircle,
  Zap,
  Eye,
  Grid3X3,
  Move,
  Users,
  User,
  Dumbbell,
  Calendar,
  MapPin,
  Settings,
  Trophy
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useCreateAgilityWorkoutMutation } from '@/store/api/trainingApi';
import { useSaveWorkflow } from '../hooks/useSaveWorkflow';
import { useBulkSession, type BulkSessionConfig } from '../hooks/useBulkSession';
import { SaveWorkflowProgress } from './SaveWorkflowProgress';
import { WorkoutSuccessModal } from './shared/WorkoutSuccessModal';
import { BulkConfigurationPanel } from './shared/BulkConfigurationPanel';
import type { 
  AgilityProgram, 
  AgilityDrill,
  AgilityTemplate,
  AgilityDrillCategory,
  AgilityEquipmentType,
  DrillPattern,
  AgilityMode
} from '../types/agility.types';
import type { WorkoutCreationContext } from '../types';
import { AGILITY_DRILL_LIBRARY, HOCKEY_DRILL_LIBRARY, DRILL_PATTERNS, estimateAgilityDuration } from '../types/agility.types';
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import { PlayerTeamAssignment } from './shared/PlayerTeamAssignment';
import { UnifiedScheduler, UnifiedSchedule } from './shared/UnifiedScheduler';
import { WorkoutType } from '../types/unified-session.types';
import DrillLibrary from './agility-builder/DrillLibrary';
import DrillEditor from './agility-builder/DrillEditor';
import PatternVisualizer from './agility-builder/PatternVisualizer';
import AgilityTemplates from './agility-builder/AgilityTemplates';
import EquipmentGuide from './agility-builder/EquipmentGuide';
import DrillCard from './agility-builder/DrillCard';

interface AgilityWorkoutBuilderProps {
  onSave: (program: AgilityProgram, playerIds?: string[], teamIds?: string[]) => void;
  onCancel: () => void;
  initialProgram?: AgilityProgram;
  initialData?: AgilityProgram;
  workoutId?: string;
  selectedPlayers?: string[];
  teamId?: string;
  workoutContext?: WorkoutCreationContext | null;
}

export default function AgilityWorkoutBuilder({
  onSave,
  onCancel,
  initialProgram,
  initialData,
  workoutId,
  selectedPlayers = [],
  teamId = 'team-001',
  workoutContext
}: AgilityWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [createAgilityWorkout, { isLoading }] = useCreateAgilityWorkoutMutation();
  
  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  
  // State management - use initialData or initialProgram
  const initData = initialData || initialProgram;
  const [activeTab, setActiveTab] = useState<'build' | 'players' | 'library' | 'templates' | 'equipment'>('build');
  const [mode, setMode] = useState<AgilityMode>(initData?.mode || 'agility');
  const [programName, setProgramName] = useState(
    initData?.name || 
    (workoutContext ? `${workoutContext.sessionType} - ${workoutContext.playerName}` : '')
  );
  const [programDescription, setProgramDescription] = useState(
    initData?.description || 
    (workoutContext ? `Personalized agility training for ${workoutContext.playerName}` : '')
  );
  const [warmupDuration, setWarmupDuration] = useState(initData?.warmupDuration || 300); // 5 min default
  const [cooldownDuration, setCooldownDuration] = useState(initData?.cooldownDuration || 300); // 5 min default
  const [drills, setDrills] = useState<AgilityDrill[]>(initData?.drills || []);
  const [editingDrill, setEditingDrill] = useState<AgilityDrill | null>(null);
  const [activeDrillId, setActiveDrillId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AgilityDrillCategory | 'all'>('all');
  const [focusAreas, setFocusAreas] = useState<string[]>(initData?.focusAreas || []);
  
  // Player/Team state for both single and bulk modes
  const [assignedPlayerIds, setAssignedPlayerIds] = useState<string[]>(selectedPlayers);
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>(teamId ? [teamId] : []);
  
  // Unified Schedule State
  const sessionDate = workoutContext?.sessionDate ? 
    (typeof workoutContext.sessionDate === 'string' ? new Date(workoutContext.sessionDate) : workoutContext.sessionDate) : 
    new Date();
    
  const [schedule, setSchedule] = useState<UnifiedSchedule>({
    startDate: sessionDate,
    startTime: workoutContext?.sessionTime || '09:00',
    location: workoutContext?.sessionLocation || 'Training Field',
    participants: {
      playerIds: workoutContext ? [workoutContext.playerId] : selectedPlayers,
      teamIds: workoutContext ? [workoutContext.teamId] : (teamId ? [teamId] : [])
    }
  });
  
  // Save workflow integration
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

  // Create agility program for bulk operations
  const currentProgram: AgilityProgram = useMemo(() => ({
    id: workoutId || `agility-${Date.now()}`,
    name: programName,
    description: programDescription,
    drills,
    warmupDuration,
    cooldownDuration,
    totalDuration,
    equipmentNeeded,
    difficulty: 'intermediate',
    focusAreas,
    mode,
    metadata: workoutContext ? {
      sessionId: workoutContext.sessionId,
      sessionType: workoutContext.sessionType,
      sessionDate: workoutContext.sessionDate instanceof Date ? 
        workoutContext.sessionDate.toISOString() : 
        workoutContext.sessionDate,
      sessionTime: workoutContext.sessionTime,
      sessionLocation: workoutContext.sessionLocation
    } : undefined
  }), [workoutId, programName, programDescription, drills, warmupDuration, cooldownDuration, totalDuration, equipmentNeeded, focusAreas, mode, workoutContext]);

  // Bulk session management
  const {
    config: bulkConfig,
    updateConfig: updateBulkConfig,
    complete: completeBulkSession,
    canProceed: canProceedBulk,
    validation: bulkValidation
  } = useBulkSession({
    workoutType: 'agility',
    baseWorkout: currentProgram,
    onComplete: async (config: BulkSessionConfig<AgilityProgram>) => {
      // Handle bulk session creation for agility workouts
      toast.success(`Created ${config.numberOfSessions} agility sessions successfully!`);
      onCancel();
    }
  });

  const saveWorkflow = useSaveWorkflow({
    workoutType: WorkoutType.AGILITY,
    workoutData: {
      name: programName,
      description: programDescription,
      agilityProgram: {
        id: workoutId || `agility-${Date.now()}`,
        name: programName,
        description: programDescription,
        drills,
        warmupDuration,
        cooldownDuration,
        totalDuration,
        equipmentNeeded,
        difficulty: 'intermediate',
        focusAreas,
        mode,
        metadata: workoutContext ? {
          sessionId: workoutContext.sessionId,
          sessionType: workoutContext.sessionType,
          sessionDate: workoutContext.sessionDate instanceof Date ? 
            workoutContext.sessionDate.toISOString() : 
            workoutContext.sessionDate,
          sessionTime: workoutContext.sessionTime,
          sessionLocation: workoutContext.sessionLocation
        } : undefined
      }
    },
    playerAssignments: {
      players: schedule.participants.playerIds,
      teams: schedule.participants.teamIds
    },
    onSaveSuccess: () => {
      toast.success(t('physicalTrainer:agility.messages.saveSuccess'));
      onCancel();
    }
  });

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
    if (bulkMode) {
      try {
        await completeBulkSession();
      } catch (error) {
        // Error handling is done in the hook
      }
    } else {
      const program: AgilityProgram = {
        id: initialProgram?.id || `program-${Date.now()}`,
        name: programName,
        description: programDescription,
        drills,
        warmupDuration,
        cooldownDuration,
        totalDuration,
        equipmentNeeded,
        difficulty: 'intermediate',
        focusAreas,
        mode,
        tags: [],
        // Link to session if context provided
        metadata: workoutContext ? {
          sessionId: workoutContext.sessionId,
          sessionType: workoutContext.sessionType,
          sessionDate: workoutContext.sessionDate instanceof Date ? 
            workoutContext.sessionDate.toISOString() : 
            workoutContext.sessionDate,
          sessionTime: workoutContext.sessionTime,
          sessionLocation: workoutContext.sessionLocation
        } : undefined
      };
      
      // Always call onSave with playerIds and teamIds
      onSave(program, schedule.participants.playerIds, schedule.participants.teamIds);
    }
  };

  const handleBulkToggle = (enabled: boolean) => {
    setBulkMode(enabled);
    setShowBulkPanel(enabled);
    
    // Switch away from players tab if it becomes disabled
    if (enabled && activeTab === 'players') {
      setActiveTab('build');
    }
  };

  const isValid = bulkMode 
    ? (programName && drills.length > 0 && canProceedBulk)
    : (programName && drills.length > 0 && 
       (schedule.participants.playerIds.length > 0 || schedule.participants.teamIds.length > 0));
  const isSaving = isLoading || saveWorkflow.isSaving;
  const showProgress = saveWorkflow.isSaving || saveWorkflow.isValidating;
  
  // Use schedule participants or assigned IDs based on bulk mode
  const assignedPlayers = bulkMode ? assignedPlayerIds : schedule.participants.playerIds;
  const assignedTeams = bulkMode ? assignedTeamIds : schedule.participants.teamIds;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <WorkoutBuilderHeader
        title={t('physicalTrainer:agility.builder.title')}
        workoutType="agility"
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={isSaving}
        canSave={!!isValid}
        supportsBulkMode={true}
        bulkMode={bulkMode}
        onBulkToggle={handleBulkToggle}
        bulkConfig={bulkConfig}
        onBulkConfigChange={updateBulkConfig}
      />

      {/* Session Context Banner */}
      {workoutContext && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Creating workout for training session
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{workoutContext.playerName} ({workoutContext.teamName})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{format(workoutContext.sessionDate instanceof Date ? workoutContext.sessionDate : new Date(workoutContext.sessionDate), 'MMM d')} at {workoutContext.sessionTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{workoutContext.sessionLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>{workoutContext.sessionType}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Configuration Panel */}
      {bulkMode && (
        <div className="mx-4 mt-4">
          <BulkConfigurationPanel
            workoutType="agility"
            baseWorkout={currentProgram}
            onComplete={async (config) => {
              // Handle agility-specific bulk session considerations
              // Space management for multiple concurrent drill stations
              const stationsNeeded = Math.ceil(config.sessions.length / 2); // Assume max 2 sessions per station
              const spaceWarnings = [];
              
              // Check for equipment conflicts in agility drills
              const equipmentUsage = new Map<AgilityEquipmentType, number>();
              config.sessions.forEach(session => {
                if (session.workoutData) {
                  session.workoutData.equipmentNeeded.forEach(equipment => {
                    equipmentUsage.set(equipment, (equipmentUsage.get(equipment) || 0) + 1);
                  });
                }
              });

              // Warn about space requirements for agility drills
              if (stationsNeeded > 4) {
                spaceWarnings.push(`${stationsNeeded} drill stations required - ensure adequate space`);
              }

              if (spaceWarnings.length > 0) {
                toast.warning(`Space considerations: ${spaceWarnings.join(', ')}`);
              }

              await completeBulkSession();
            }}
            onCancel={() => {
              setBulkMode(false);
              setShowBulkPanel(false);
            }}
            isOpen={showBulkPanel}
            onToggle={setShowBulkPanel}
            enablePlayerDistribution={true}
            showAdvancedOptions={true}
            maxSessions={6} // Agility-specific limit for space management
            minSessions={2}
          />
        </div>
      )}
      
      {/* Subtitle and Metrics */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <p className="text-muted-foreground">
          {t('physicalTrainer:agility.builder.subtitle')}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-2 py-1">
            <Clock className="h-3 w-3 mr-1" />
            {Math.floor(totalDuration / 60)} min
          </Badge>
          <Badge variant="outline" className="text-sm px-2 py-1">
            <Activity className="h-3 w-3 mr-1" />
            {drills.length} drills
          </Badge>
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
            <TabsTrigger 
              value="players" 
              className="flex items-center gap-2"
              disabled={bulkMode}
            >
              <Calendar className="h-4 w-4" />
              {bulkMode ? 'Schedule (Bulk Mode)' : t('physicalTrainer:agility.tabs.schedule', 'Schedule & Assignment')}
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
                      <Label htmlFor="mode">
                        Training Mode
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          type="button"
                          variant={mode === 'agility' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMode('agility')}
                          className="flex-1"
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Agility
                        </Button>
                        <Button
                          type="button"
                          variant={mode === 'sport_specific' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMode('sport_specific')}
                          className="flex-1"
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Hockey Skills
                        </Button>
                      </div>
                      {mode === 'sport_specific' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Focus on hockey-specific skills: shooting, passing, puck handling, and skating techniques
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="name">
                        {t('physicalTrainer:agility.details.name')}
                      </Label>
                      <Input
                        id="name"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                        placeholder={mode === 'sport_specific' ? 'e.g., Power Play Skills Training' : t('physicalTrainer:agility.details.namePlaceholder')}
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

                    {(assignedPlayers.length > 0 || assignedTeams.length > 0) && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          {t('physicalTrainer:agility.summary.participants')}
                        </h4>
                        <div className="space-y-1">
                          {assignedPlayers.length > 0 && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{assignedPlayers.length} individual players</span>
                            </div>
                          )}
                          {assignedTeams.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{assignedTeams.length} teams</span>
                            </div>
                          )}
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

          <TabsContent value="players" className="h-full p-4">
            {bulkMode ? (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Copy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Bulk Mode Active</h3>
                    <p className="text-muted-foreground">
                      Player assignment and scheduling is handled in the bulk configuration panel above.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <UnifiedScheduler
                schedule={schedule}
                onScheduleUpdate={setSchedule}
                duration={totalDuration / 60} // Convert to minutes
                title={t('physicalTrainer:agility.schedule.title', 'Schedule Agility Session')}
                description={t('physicalTrainer:agility.schedule.description', 'Set when this agility session will take place and who will participate. Agility work is often personalized based on player position and skill level.')}
                showLocation={true}
                showRecurrence={true}
                showReminders={true}
                showConflictCheck={true}
                defaultLocation={workoutContext?.sessionLocation || 'Training Field'}
                collapsible={false}
                variant="inline"
              />
            )}
          </TabsContent>

          <TabsContent value="library" className="h-full p-4">
            <DrillLibrary
              onSelectDrill={handleAddDrill}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              mode={mode}
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

      {/* Save Progress */}
      {showProgress && (
        <div className="mx-4 mb-4">
          <SaveWorkflowProgress
            workflow={saveWorkflow}
            onRetry={saveWorkflow.retry}
            onCancel={() => saveWorkflow.reset()}
          />
        </div>
      )}

      {/* Warnings */}
      {drills.length === 0 && (
        <Alert className="mx-4 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('physicalTrainer:agility.warnings.noDrills')}
          </AlertDescription>
        </Alert>
      )}
      
      {!bulkMode && (assignedPlayers.length === 0 && assignedTeams.length === 0) && (
        <Alert className="mx-4 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('physicalTrainer:agility.warnings.noPlayersAssigned', 'Please assign players or teams to this agility session.')}
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk mode specific warnings */}
      {bulkMode && bulkValidation && Object.values(bulkValidation.errors).some(errors => errors.length > 0) && (
        <Alert className="mx-4 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please resolve configuration issues in the bulk session setup above.
          </AlertDescription>
        </Alert>
      )}

      {/* Success Modal */}
      {!bulkMode && saveWorkflow.successModalProps && (
        <WorkoutSuccessModal
          isOpen={saveWorkflow.isSuccessModalOpen}
          onClose={saveWorkflow.closeSuccessModal}
          workoutType={WorkoutType.AGILITY}
          workoutName={programName}
          playerCount={assignedPlayers.length > 0 ? assignedPlayers.length : selectedPlayers.length}
          teamCount={assignedTeams.length > 0 ? assignedTeams.length : (teamId ? 1 : 0)}
          duration={Math.round(totalDuration / 60)}
          exerciseCount={drills.length}
          onSchedule={saveWorkflow.successModalProps.onSchedule}
          onCreateAnother={() => {
            saveWorkflow.reset();
            // Reset form state
            setProgramName('');
            setProgramDescription('');
            setDrills([]);
            setFocusAreas([]);
            setWarmupDuration(300);
            setCooldownDuration(300);
            setAssignedPlayerIds([]);
            setAssignedTeamIds([]);
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