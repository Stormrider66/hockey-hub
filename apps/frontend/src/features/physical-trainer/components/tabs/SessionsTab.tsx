'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, Users, X, Heart, Zap } from '@/components/icons';
import BulkWorkoutAssignment from '../BulkWorkoutAssignment';
import { LazyWorkoutBuilderLoader, type WorkoutBuilderType } from '../builders/LazyWorkoutBuilderLoader';
import { WorkoutSuccessModal, KeyboardShortcuts } from '../shared';
import { WorkoutTypeGrid, RecentWorkoutsSection, SessionTemplatesSection } from './sessions';
import { WorkoutDetailsModal } from '../WorkoutDetailsModal';
import { useAuth } from "@/contexts/AuthContext";
import { useDispatch, useSelector } from 'react-redux';
import { parseWorkoutContext } from '../../utils/workoutNavigation';
import { AppDispatch } from '@/store/store';
import { 
  addToRecentWorkouts, 
  toggleWorkoutFavorite as toggleWorkoutFavoriteAction, 
  incrementWorkoutUsage,
  selectRecentWorkouts 
} from '@/store/slices/workoutBuilderSlice';
import { 
  useGetRecentWorkoutsQuery,
  useUpdateWorkoutFavoriteMutation,
  useIncrementWorkoutUsageMutation 
} from '@/store/api/recentWorkoutsApi';
import { WorkoutType } from '../../types';
import type { SessionTemplate as SessionTemplateType } from '../../types/session-builder.types';
import type { IntervalProgram } from '../../types/conditioning.types';
import type { HybridProgram } from '../../types/hybrid.types';
import type { AgilityProgram } from '../../types/agility.types';
import { toast } from 'react-hot-toast';
import { 
  useCreateSessionTemplateMutation, 
  useUpdateSessionTemplateMutation,
  useCreateConditioningWorkoutMutation,
  useCreateHybridWorkoutMutation,
  useCreateAgilityWorkoutMutation,
  useGetWorkoutSessionByIdQuery,
  useGetConditioningWorkoutByIdQuery,
  useGetHybridWorkoutByIdQuery,
  useGetAgilityWorkoutByIdQuery,
  useDeleteWorkoutSessionMutation,
  useLazyGetWorkoutSessionByIdQuery,
  useLazyGetConditioningWorkoutByIdQuery,
  useLazyGetHybridWorkoutByIdQuery,
  useLazyGetAgilityWorkoutByIdQuery,
  useGetExercisesQuery,
  useGetSessionTemplatesQuery
} from '@/store/api/trainingApi';
import { useGetPlayersQuery } from '@/store/api/userApi';
import { WorkoutBuilderErrorBoundary } from '../WorkoutErrorBoundary';

interface SessionsTabProps {
  selectedTeamId: string | null;
  onCreateSession: () => void;
  onNavigateToCalendar: () => void;
}

export default function SessionsTab({ selectedTeamId, onCreateSession, onNavigateToCalendar }: SessionsTabProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [activeBuilder, setActiveBuilder] = useState<WorkoutBuilderType | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<SessionTemplateType | undefined>();
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | undefined>();
  const [editingWorkoutData, setEditingWorkoutData] = useState<any>(null);
  const [workoutContext, setWorkoutContext] = useState<ReturnType<typeof parseWorkoutContext>>(null);
  
  // Use API to fetch recent workouts
  const { data: recentWorkouts = [], isLoading: isLoadingRecent } = useGetRecentWorkoutsQuery();
  const [updateFavorite] = useUpdateWorkoutFavoriteMutation();
  const [incrementUsage] = useIncrementWorkoutUsageMutation();
  
  // Fetch players, exercises, and templates for SessionBuilder
  // Only fetch when SessionBuilder is active to improve performance
  const shouldFetchBuilderData = activeBuilder === 'strength';
  const { data: playersData = [] } = useGetPlayersQuery(
    shouldFetchBuilderData && selectedTeamId ? { teamId: selectedTeamId } : undefined,
    { skip: !shouldFetchBuilderData }
  );
  const { data: exercisesData } = useGetExercisesQuery(
    shouldFetchBuilderData ? { organizationId: user?.organizationId } : undefined,
    { skip: !shouldFetchBuilderData }
  );
  const { data: templatesData } = useGetSessionTemplatesQuery(
    shouldFetchBuilderData ? { limit: 20 } : undefined,
    { skip: !shouldFetchBuilderData }
  );
  
  // Workout details modal state
  const [workoutDetailsModal, setWorkoutDetailsModal] = useState<{
    isOpen: boolean;
    workoutId: string | null;
    workoutType: WorkoutType | null;
  }>({ isOpen: false, workoutId: null, workoutType: null });
  
  // Template creation from success modal state
  const [templateCreationData, setTemplateCreationData] = useState<any>(null);
  
  // Success modal state
  const [successModalData, setSuccessModalData] = useState<{
    isOpen: boolean;
    workoutType: WorkoutType;
    workoutName: string;
    playerCount: number;
    teamCount: number;
    duration?: number;
    exerciseCount?: number;
  }>({
    isOpen: false,
    workoutType: WorkoutType.STRENGTH,
    workoutName: '',
    playerCount: 0,
    teamCount: 0,
  });
  
  const [createSessionTemplate, { isLoading: isCreating }] = useCreateSessionTemplateMutation();
  const [updateSessionTemplate, { isLoading: isUpdating }] = useUpdateSessionTemplateMutation();
  const [createConditioningWorkout, { isLoading: isCreatingConditioning }] = useCreateConditioningWorkoutMutation();
  const [createHybridWorkout, { isLoading: isCreatingHybrid }] = useCreateHybridWorkoutMutation();
  const [createAgilityWorkout, { isLoading: isCreatingAgility }] = useCreateAgilityWorkoutMutation();
  const [deleteWorkout, { isLoading: isDeletingWorkout }] = useDeleteWorkoutSessionMutation();
  
  // Lazy queries for fetching workout data
  const [getStrengthWorkout] = useLazyGetWorkoutSessionByIdQuery();
  const [getConditioningWorkout] = useLazyGetConditioningWorkoutByIdQuery();
  const [getHybridWorkout] = useLazyGetHybridWorkoutByIdQuery();
  const [getAgilityWorkout] = useLazyGetAgilityWorkoutByIdQuery();
  
  // Fetch workout details when modal is opened
  const { data: strengthWorkout, isLoading: isLoadingStrength } = useGetWorkoutSessionByIdQuery(
    workoutDetailsModal.workoutId || '', 
    { skip: !workoutDetailsModal.workoutId || workoutDetailsModal.workoutType !== WorkoutType.STRENGTH }
  );
  const { data: conditioningWorkout, isLoading: isLoadingConditioning } = useGetConditioningWorkoutByIdQuery(
    workoutDetailsModal.workoutId || '', 
    { skip: !workoutDetailsModal.workoutId || workoutDetailsModal.workoutType !== WorkoutType.CONDITIONING }
  );
  const { data: hybridWorkout, isLoading: isLoadingHybrid } = useGetHybridWorkoutByIdQuery(
    workoutDetailsModal.workoutId || '', 
    { skip: !workoutDetailsModal.workoutId || workoutDetailsModal.workoutType !== WorkoutType.HYBRID }
  );
  const { data: agilityWorkout, isLoading: isLoadingAgility } = useGetAgilityWorkoutByIdQuery(
    workoutDetailsModal.workoutId || '', 
    { skip: !workoutDetailsModal.workoutId || workoutDetailsModal.workoutType !== WorkoutType.AGILITY }
  );

  // Helper function to clear workout context from URL
  const clearWorkoutContextFromURL = () => {
    const workoutType = searchParams.get('workoutType');
    const contextParam = searchParams.get('context');
    if (workoutType || contextParam) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('workoutType');
      newParams.delete('context');
      router.replace(`/physicaltrainer?${newParams.toString()}`);
    }
  };

  // Check for workout context from URL on mount
  useEffect(() => {
    const workoutType = searchParams.get('workoutType');
    const contextParam = searchParams.get('context');
    
    if (workoutType && contextParam) {
      const context = parseWorkoutContext(contextParam);
      if (context) {
        setWorkoutContext(context);
        // Open the appropriate builder
        setActiveBuilder(workoutType as WorkoutBuilderType);
        
        // Don't clear URL parameters immediately - wait for user action or save
        // This prevents the builder from being interrupted during load
      }
    }
  }, [searchParams]);

  const handleSaveStrengthWorkout = async (program: any, playerIds: string[] = [], teamIds: string[] = []) => {
    try {
      // Extract session context if available
      const sessionContext = program.metadata;
      const scheduledDate = sessionContext?.sessionDate || new Date().toISOString();
      const location = sessionContext?.sessionLocation || 'Training Center';
      
      // Create strength workout session template
      const template: SessionTemplateType = {
        id: editingTemplate?.id || '',
        name: program.name,
        description: program.description || '',
        type: 'mixed', // For strength workouts
        category: 'strength',
        duration: program.estimatedDuration || 60,
        exercises: program.phases?.main?.exercises || [],
        equipment: [], // Could extract from exercises
        targetPlayers: 'all',
        difficulty: 'intermediate',
        tags: ['strength'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...program.metadata,
          strengthProgram: program,
          playerIds: playerIds,
          teamIds: teamIds
        }
      };
      
      if (editingTemplate?.id) {
        // Update existing template
        await updateSessionTemplate({
          id: editingTemplate.id,
          data: template
        }).unwrap();
        toast.success(t('physicalTrainer:templates.updateSuccess'));
      } else {
        // Create new template
        const result = await createSessionTemplate(template).unwrap();
        
        // Add to recent workouts
        dispatch(addToRecentWorkouts({
          id: result.id,
          name: template.name,
          type: WorkoutType.STRENGTH,
          createdAt: new Date().toISOString(),
          playerCount: playerIds.length,
          teamCount: teamIds.length,
          duration: template.duration,
          usageCount: 0,
          isFavorite: false,
          templateId: result.id
        }));
      }
      
      // Clear workout context after successful save
      setWorkoutContext(null);
      clearWorkoutContextFromURL();
      
      // Hide builder
      setActiveBuilder(null);
      setEditingTemplate(undefined);
      
      // Show success modal for strength workouts
      setSuccessModalData({
        isOpen: true,
        workoutType: WorkoutType.STRENGTH,
        workoutName: program.name,
        playerCount: playerIds.length,
        teamCount: teamIds.length,
        duration: program.estimatedDuration || 60,
        exerciseCount: program.phases?.main?.exercises?.length || 0,
      });
      
      // Notify success with context-aware message
      if (sessionContext) {
        toast.success(`Workout created and linked to ${sessionContext.sessionType} session`);
      } else {
        toast.success('Strength workout created successfully');
      }
      
      // Navigate back to overview if context had return path
      if (workoutContext?.returnPath) {
        router.push(workoutContext.returnPath);
      } else if (workoutContext) {
        // If we had context but no explicit return path, go back to overview
        router.push('/physicaltrainer?tab=overview');
      }
    } catch (error) {
      console.error('Failed to save strength workout:', error);
      toast.error(t('physicalTrainer:templates.saveError'));
    }
  };

  const handleApplyTemplate = (template: SessionTemplateType, date?: Date, time?: string) => {
    // This would normally schedule a session based on the template
    console.log('Applying template:', template, date, time);
    onCreateSession();
  };

  const handleEditTemplate = (template: SessionTemplateType) => {
    setEditingTemplate(template);
    setActiveBuilder('strength');
  };

  const handleSaveConditioningWorkout = async (program: IntervalProgram, playerIds: string[] = [], teamIds: string[] = []) => {
    try {
      // Extract session context if available
      const sessionContext = program.metadata;
      const scheduledDate = sessionContext?.sessionDate || new Date().toISOString();
      const location = sessionContext?.sessionLocation || 'Training Center';
      
      // Create conditioning workout using the dedicated API
      const workoutData = {
        title: program.name,
        description: program.description,
        type: 'conditioning' as const,
        scheduledDate: scheduledDate,
        location: location,
        teamId: selectedTeamId || 'team-001',
        playerIds: playerIds, // Use assigned players
        teamIds: teamIds, // Use assigned teams
        intervalProgram: program,
        personalizeForPlayers: playerIds.length > 0 || teamIds.length > 0,
        // Link to session if context provided
        sessionId: sessionContext?.sessionId,
        metadata: sessionContext
      };
      
      await createConditioningWorkout(workoutData).unwrap();
      
      // Clear workout context after successful save
      setWorkoutContext(null);
      clearWorkoutContextFromURL();
      
      // Hide builder and show success modal
      setActiveBuilder(null);
      
      // Show success modal with workout details
      setSuccessModalData({
        isOpen: true,
        workoutType: WorkoutType.CONDITIONING,
        workoutName: program.name,
        playerCount: playerIds.length,
        teamCount: teamIds.length,
        duration: Math.ceil(program.totalDuration / 60),
        exerciseCount: program.intervals.length,
      });
      
      // Notify success with context-aware message
      if (sessionContext) {
        toast.success(`Workout created and linked to ${sessionContext.sessionType} session`);
      } else {
        toast.success('Conditioning workout created successfully');
      }
      
      // Also create as template for reuse (only if not from session context)
      if (!sessionContext) {
        const template: SessionTemplateType = {
          id: '',
          name: program.name,
          description: program.description,
          type: 'cardio',
          category: 'conditioning',
          duration: Math.ceil(program.totalDuration / 60),
          exercises: [],
          equipment: [program.equipment],
          targetPlayers: 'all',
          difficulty: program.difficulty || 'intermediate',
          tags: program.tags || [],
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            intervalProgram: program
          }
        };
        await createSessionTemplate(template).unwrap();
      }
      
      // Navigate back to overview if context had return path
      if (workoutContext?.returnPath) {
        router.push(workoutContext.returnPath);
      } else if (workoutContext) {
        // If we had context but no explicit return path, go back to overview
        router.push('/physicaltrainer?tab=overview');
      }
    } catch (error) {
      console.error('Failed to save conditioning workout:', error);
      toast.error(t('physicalTrainer:conditioning.saveError'));
    }
  };

  const handleSaveHybridWorkout = async (program: HybridProgram, playerIds: string[] = [], teamIds: string[] = []) => {
    try {
      // Extract session context if available
      const sessionContext = program.metadata;
      const scheduledDate = sessionContext?.sessionDate || new Date().toISOString();
      const location = sessionContext?.sessionLocation || 'Training Center';
      
      // Create hybrid workout using the dedicated API
      const workoutData = {
        title: program.name,
        description: program.description,
        type: 'hybrid' as const,
        scheduledDate: scheduledDate,
        location: location,
        teamId: teamIds.length > 0 ? teamIds[0] : selectedTeamId || 'team-001',
        playerIds: playerIds,
        hybridProgram: program,
        // Link to session if context provided
        sessionId: sessionContext?.sessionId,
        metadata: sessionContext
      };
      
      await createHybridWorkout(workoutData).unwrap();
      
      // Clear workout context after successful save
      setWorkoutContext(null);
      clearWorkoutContextFromURL();
      
      // Hide builder and show success modal
      setActiveBuilder(null);
      
      // Calculate total duration and exercise count
      const totalDuration = program.blocks.reduce((sum, block) => {
        if (block.type === 'exercise') {
          return sum + (block.exercises?.length || 0) * 3; // Estimate 3 min per exercise
        } else if (block.type === 'interval') {
          return sum + (block.intervals?.reduce((iSum, i) => iSum + i.duration / 60, 0) || 0);
        } else {
          return sum + (block.duration || 0);
        }
      }, 0);
      
      const exerciseCount = program.blocks.reduce((count, block) => {
        if (block.type === 'exercise') {
          return count + (block.exercises?.length || 0);
        } else if (block.type === 'interval') {
          return count + (block.intervals?.length || 0);
        }
        return count;
      }, 0);
      
      // Show success modal with workout details
      setSuccessModalData({
        isOpen: true,
        workoutType: WorkoutType.HYBRID,
        workoutName: program.name,
        playerCount: playerIds.length,
        teamCount: teamIds.length,
        duration: Math.ceil(totalDuration),
        exerciseCount: exerciseCount,
      });
      
      // Notify success with context-aware message
      if (sessionContext) {
        toast.success(`Workout created and linked to ${sessionContext.sessionType} session`);
      } else {
        toast.success('Hybrid workout created successfully');
      }
      
      // Also create as template for reuse (only if not from session context)
      if (!sessionContext) {
        const template: SessionTemplateType = {
        id: '',
        name: program.name,
        description: program.description,
        type: 'hybrid',
        category: 'hybrid',
        duration: Math.ceil(program.totalDuration / 60),
        exercises: [],
        equipment: program.equipment,
        targetPlayers: 'all',
        difficulty: 'intermediate',
        tags: ['hybrid'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          hybridProgram: program
        }
      };
      await createSessionTemplate(template).unwrap();
      }
      
      // Navigate back to overview if context had return path
      if (workoutContext?.returnPath) {
        router.push(workoutContext.returnPath);
      } else if (workoutContext) {
        // If we had context but no explicit return path, go back to overview
        router.push('/physicaltrainer?tab=overview');
      }
    } catch (error) {
      console.error('Failed to save hybrid workout:', error);
      toast.error(t('physicalTrainer:hybrid.saveError'));
    }
  };

  const handleSaveAgilityWorkout = async (program: AgilityProgram, playerIds: string[] = [], teamIds: string[] = []) => {
    try {
      // Extract session context if available
      const sessionContext = program.metadata;
      const scheduledDate = sessionContext?.sessionDate || new Date().toISOString();
      const location = sessionContext?.sessionLocation || 'Field House';
      
      // Create agility workout using the dedicated API
      const workoutData = {
        title: program.name,
        description: program.description,
        type: 'agility' as const,
        scheduledDate: scheduledDate,
        location: location,
        teamId: teamIds.length > 0 ? teamIds[0] : selectedTeamId || 'team-001',
        playerIds: playerIds,
        agilityProgram: program,
        // Link to session if context provided
        sessionId: sessionContext?.sessionId,
        metadata: sessionContext
      };
      
      await createAgilityWorkout(workoutData).unwrap();
      
      // Clear workout context after successful save
      setWorkoutContext(null);
      clearWorkoutContextFromURL();
      
      // Hide builder and show success modal
      setActiveBuilder(null);
      
      // Calculate total duration and drill count
      const totalDuration = 
        (program.warmup?.duration || 0) +
        program.drills.reduce((sum, drill) => sum + drill.duration * drill.sets, 0) / 60 +
        (program.cooldown?.duration || 0);
      
      // Show success modal with workout details
      setSuccessModalData({
        isOpen: true,
        workoutType: WorkoutType.AGILITY,
        workoutName: program.name,
        playerCount: playerIds.length,
        teamCount: teamIds.length,
        duration: Math.ceil(totalDuration),
        exerciseCount: program.drills.length,
      });
      
      // Notify success with context-aware message
      if (sessionContext) {
        toast.success(`Workout created and linked to ${sessionContext.sessionType} session`);
      } else {
        toast.success('Agility workout created successfully');
      }
      
      // Also create as template for reuse (only if not from session context)
      if (!sessionContext) {
        const template: SessionTemplateType = {
        id: '',
        name: program.name,
        description: program.description,
        type: 'agility',
        category: 'agility',
        duration: Math.ceil(program.totalDuration / 60),
        exercises: [],
        equipment: program.equipmentNeeded,
        targetPlayers: 'all',
        difficulty: program.difficulty,
        tags: ['agility', ...program.focusAreas],
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          agilityProgram: program
        }
      };
      await createSessionTemplate(template).unwrap();
      }
      
      // Navigate back to overview if context had return path
      if (workoutContext?.returnPath) {
        router.push(workoutContext.returnPath);
      } else if (workoutContext) {
        // If we had context but no explicit return path, go back to overview
        router.push('/physicaltrainer?tab=overview');
      }
    } catch (error) {
      console.error('Failed to save agility workout:', error);
      toast.error(t('physicalTrainer:agility.saveError'));
    }
  };

  if (activeBuilder) {
    const handleCancelBuilder = () => {
      setActiveBuilder(null);
      setEditingTemplate(undefined);
      setEditingWorkoutId(undefined);
      setEditingWorkoutData(null);
      
      // Clear URL parameters if they exist
      clearWorkoutContextFromURL();
      
      // Navigate back if there's a return path
      if (workoutContext?.returnPath) {
        router.push(workoutContext.returnPath);
      }
      
      setWorkoutContext(null); // Clear the context last
    };

    const getSaveHandler = () => {
      switch (activeBuilder) {
        case 'conditioning': return handleSaveConditioningWorkout;
        case 'hybrid': return handleSaveHybridWorkout;
        case 'agility': return handleSaveAgilityWorkout;
        case 'strength': return handleSaveStrengthWorkout;
      }
    };

    const getLoadingState = () => {
      switch (activeBuilder) {
        case 'conditioning': return isCreatingConditioning;
        case 'hybrid': return isCreatingHybrid;
        case 'agility': return false; // Add loading state when available
        case 'strength': return false; // Add loading state when available
      }
    };

    const getInitialData = () => {
      switch (activeBuilder) {
        case 'conditioning': return editingWorkoutData?.intervalProgram;
        case 'hybrid': return editingWorkoutData?.hybridProgram;
        case 'agility': return editingWorkoutData?.agilityProgram;
        case 'strength': return editingTemplate || editingWorkoutData;
      }
    };

    const builderNames = {
      strength: 'Session Builder',
      conditioning: 'Conditioning Workout Builder',
      hybrid: 'Hybrid Workout Builder',
      agility: 'Agility Workout Builder'
    };

    return (
      <div className="h-full">
        <WorkoutBuilderErrorBoundary
          componentName={builderNames[activeBuilder]}
          onReset={handleCancelBuilder}
        >
          <LazyWorkoutBuilderLoader
            builderType={activeBuilder}
            onSave={getSaveHandler()}
            onCancel={handleCancelBuilder}
            isLoading={getLoadingState()}
            initialData={getInitialData()}
            workoutId={editingWorkoutId}
            // Props for SessionBuilder
            players={playersData}
            exercises={exercisesData?.exercises || []}
            templates={templatesData?.data || []}
            // Pre-filled context from Team Roster
            workoutContext={workoutContext}
          />
        </WorkoutBuilderErrorBoundary>
      </div>
    );
  }

  // Recent workout handlers
  const handleDuplicateWorkout = async (workoutId: string) => {
    const workout = recentWorkouts.find(w => w.id === workoutId);
    if (!workout) return;
    
    // Increment usage via API
    await incrementUsage(workoutId);
    
    // Open appropriate builder based on type
    switch (workout.type) {
      case WorkoutType.STRENGTH:
        setEditingWorkoutId(workoutId);
        setActiveBuilder('strength');
        break;
      case WorkoutType.CONDITIONING:
        setEditingWorkoutId(workoutId);
        setActiveBuilder('conditioning');
        break;
      case WorkoutType.HYBRID:
        setEditingWorkoutId(workoutId);
        setActiveBuilder('hybrid');
        break;
      case WorkoutType.AGILITY:
        setEditingWorkoutId(workoutId);
        setActiveBuilder('agility');
        break;
    }
  };
  
  const handleEditWorkout = async (workoutId: string) => {
    const workout = recentWorkouts.find(w => w.id === workoutId);
    if (!workout) return;
    
    setEditingWorkoutId(workoutId);
    
    // Fetch complete workout data based on type
    try {
      let fullWorkoutData = null;
      
      switch (workout.type) {
        case WorkoutType.STRENGTH:
          const strengthResult = await getStrengthWorkout(workoutId).unwrap();
          fullWorkoutData = strengthResult?.data;
          if (fullWorkoutData) {
            // Convert to SessionTemplate format for editing
            const template: SessionTemplateType = {
              id: fullWorkoutData.id,
              name: fullWorkoutData.name || fullWorkoutData.title,
              description: fullWorkoutData.description || '',
              type: 'mixed',
              category: 'strength',
              duration: fullWorkoutData.duration || 60,
              exercises: fullWorkoutData.exercises || [],
              equipment: fullWorkoutData.equipment || [],
              targetPlayers: 'all',
              difficulty: fullWorkoutData.difficulty || 'intermediate',
              tags: fullWorkoutData.tags || [],
              usageCount: fullWorkoutData.usageCount || 0,
              createdAt: fullWorkoutData.createdAt,
              updatedAt: fullWorkoutData.updatedAt,
              metadata: fullWorkoutData.metadata || {}
            };
            setEditingTemplate(template);
            setEditingWorkoutData(fullWorkoutData);
            setActiveBuilder('strength');
          }
          break;
          
        case WorkoutType.CONDITIONING:
          const conditioningResult = await getConditioningWorkout(workoutId).unwrap();
          fullWorkoutData = conditioningResult?.data;
          setEditingWorkoutData(fullWorkoutData);
          setActiveBuilder('conditioning');
          break;
          
        case WorkoutType.HYBRID:
          const hybridResult = await getHybridWorkout(workoutId).unwrap();
          fullWorkoutData = hybridResult?.data;
          setEditingWorkoutData(fullWorkoutData);
          setActiveBuilder('hybrid');
          break;
          
        case WorkoutType.AGILITY:
          const agilityResult = await getAgilityWorkout(workoutId).unwrap();
          fullWorkoutData = agilityResult?.data;
          setEditingWorkoutData(fullWorkoutData);
          setActiveBuilder('agility');
          break;
      }
    } catch (error) {
      console.error('Failed to load workout for editing:', error);
      toast.error(t('sessions.loadError'));
    }
  };
  
  const handleToggleFavorite = async (workoutId: string) => {
    const workout = recentWorkouts.find(w => w.id === workoutId);
    if (workout) {
      await updateFavorite({ workoutId, isFavorite: !workout.isFavorite });
    }
  };
  
  const handleViewWorkoutDetails = (workoutId: string) => {
    const workout = recentWorkouts.find(w => w.id === workoutId);
    if (!workout) {
      toast.error('Workout not found');
      return;
    }
    
    setWorkoutDetailsModal({
      isOpen: true,
      workoutId: workoutId,
      workoutType: workout.type,
    });
  };
  
  const handleCloseWorkoutDetails = () => {
    setWorkoutDetailsModal({ isOpen: false, workoutId: null, workoutType: null });
  };
  
  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await deleteWorkout(workoutId).unwrap();
      toast.success('Workout deleted successfully');
      handleCloseWorkoutDetails();
    } catch (error) {
      console.error('Failed to delete workout:', error);
      toast.error('Failed to delete workout');
    }
  };
  
  const handleCreateTemplateFromWorkout = async (workout: any) => {
    try {
      const template: SessionTemplateType = {
        id: '',
        name: `${workout.name || workout.title} Template`,
        description: workout.description || '',
        type: workout.type === 'conditioning' ? 'cardio' : workout.type,
        category: workout.type,
        duration: workout.duration || workout.estimatedDuration || 60,
        exercises: workout.exercises || [],
        equipment: workout.equipment || [],
        targetPlayers: 'all',
        difficulty: 'intermediate',
        tags: [workout.type],
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          intervalProgram: workout.intervalProgram,
          hybridProgram: workout.hybridProgram,
          agilityProgram: workout.agilityProgram,
        }
      };
      
      await createSessionTemplate(template).unwrap();
      toast.success('Template created successfully!');
      handleCloseWorkoutDetails();
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template');
    }
  };
  
  const handleCreateTemplateFromSuccessModal = async () => {
    if (!templateCreationData) {
      toast.error('No workout data available for template creation');
      return;
    }
    
    try {
      const template: SessionTemplateType = {
        id: '',
        name: `${templateCreationData.name} Template`,
        description: `Auto-generated template from ${templateCreationData.name}`,
        type: templateCreationData.type === WorkoutType.CONDITIONING ? 'cardio' : templateCreationData.type.toLowerCase(),
        category: templateCreationData.type.toLowerCase(),
        duration: templateCreationData.duration || 60,
        exercises: [],
        equipment: [],
        targetPlayers: 'all',
        difficulty: 'intermediate',
        tags: [templateCreationData.type.toLowerCase()],
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {}
      };
      
      await createSessionTemplate(template).unwrap();
      toast.success('Template created successfully from workout!');
      setTemplateCreationData(null);
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template');
      setTemplateCreationData(null);
    }
  };

  const handleLaunchSession = (workout: any) => {
    if (!workout) {
      toast.error('No workout data available');
      return;
    }

    // Close the modal first
    handleCloseWorkoutDetails();

    // Determine workout type
    let workoutType = WorkoutType.STRENGTH;
    if (workout.type) {
      switch (workout.type.toLowerCase()) {
        case 'conditioning':
        case 'cardio':
          workoutType = WorkoutType.CONDITIONING;
          break;
        case 'hybrid':
          workoutType = WorkoutType.HYBRID;
          break;
        case 'agility':
          workoutType = WorkoutType.AGILITY;
          break;
      }
    } else if (workout.intervalProgram) {
      workoutType = WorkoutType.CONDITIONING;
    } else if (workout.hybridProgram || workout.blocks) {
      workoutType = WorkoutType.HYBRID;
    } else if (workout.agilityProgram || workout.drillSequence) {
      workoutType = WorkoutType.AGILITY;
    }

    // Navigate to the player's workout viewer for the specific workout type
    const baseUrl = '/player/workout';
    let targetUrl = baseUrl;
    
    switch (workoutType) {
      case WorkoutType.STRENGTH:
        targetUrl = `${baseUrl}/${workout.id}`;
        break;
      case WorkoutType.CONDITIONING:
        targetUrl = `${baseUrl}/conditioning/${workout.id}`;
        break;
      case WorkoutType.HYBRID:
        targetUrl = `${baseUrl}/hybrid/${workout.id}`;
        break;
      case WorkoutType.AGILITY:
        targetUrl = `${baseUrl}/agility/${workout.id}`;
        break;
    }

    // Open in new tab to simulate navigation (since we're in a component)
    window.open(targetUrl, '_blank');
    toast.success(`Launching ${workoutType} session...`);
  };

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: 'ctrl+n, cmd+n',
      description: 'Create new workout',
      handler: () => setActiveBuilder('strength'),
    },
    {
      key: 'ctrl+k, cmd+k',
      description: 'Quick schedule',
      handler: onNavigateToCalendar,
    },
    {
      key: 'ctrl+b, cmd+b',
      description: 'Bulk assignment',
      handler: () => setShowBulkAssignment(true),
    },
  ];

  return (
    <div className="space-y-6">
      <KeyboardShortcuts shortcuts={shortcuts} />
      
      {/* Recent Workouts Section */}
      {(recentWorkouts.length > 0 || isLoadingRecent) && (
        <RecentWorkoutsSection
          recentWorkouts={recentWorkouts.slice(0, 5)}
          isLoadingRecent={isLoadingRecent}
          onDuplicate={handleDuplicateWorkout}
          onEdit={handleEditWorkout}
          onToggleFavorite={handleToggleFavorite}
          onViewDetails={handleViewWorkoutDetails}
        />
      )}
      
      {/* Workout Type Grid */}
      <WorkoutTypeGrid
        onSelectWorkoutType={(type) => {
          // Prevent opening multiple builders simultaneously
          if (isCreatingConditioning || isCreatingHybrid || isCreatingAgility || isCreating || isUpdating) {
            return;
          }
          setActiveBuilder(type as WorkoutBuilderType);
        }}
        scheduledWorkouts={5} // TODO: Get from actual data
        activeWorkouts={2} // TODO: Get from actual data
        onScheduleClick={onNavigateToCalendar}
        onBulkAssignClick={() => setShowBulkAssignment(true)}
      />

      {/* Session Templates Section */}
      <SessionTemplatesSection
        templates={templatesData?.data || []}
        onCreateTemplate={() => setActiveBuilder('strength')}
        onEditTemplate={handleEditTemplate}
        onCreateFromTemplate={handleApplyTemplate}
      />

      {/* Bulk Assignment Modal/Overlay */}
      {showBulkAssignment && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
            <BulkWorkoutAssignment
              organizationId={user?.organizationId || ''}
              userId={user?.id || ''}
              onClose={() => setShowBulkAssignment(false)}
              onSuccess={(count) => {
                console.log(`Created ${count} assignments`);
                setShowBulkAssignment(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Success Modal */}
      <WorkoutSuccessModal
        isOpen={successModalData.isOpen}
        onClose={() => setSuccessModalData(prev => ({ ...prev, isOpen: false }))}
        workoutType={successModalData.workoutType}
        workoutName={successModalData.workoutName}
        playerCount={successModalData.playerCount}
        teamCount={successModalData.teamCount}
        duration={successModalData.duration}
        exerciseCount={successModalData.exerciseCount}
        onSchedule={() => {
          // Navigate to calendar with the workout pre-selected
          onNavigateToCalendar();
        }}
        onCreateTemplate={() => {
          // Store the workout data for template creation
          const workoutData = {
            name: successModalData.workoutName,
            type: successModalData.workoutType,
            duration: successModalData.duration,
            exerciseCount: successModalData.exerciseCount,
            // Add more data as needed based on workout type
          };
          setTemplateCreationData(workoutData);
          handleCreateTemplateFromSuccessModal();
        }}
        onCreateAnother={() => {
          // Open the appropriate builder based on workout type
          switch (successModalData.workoutType) {
            case WorkoutType.STRENGTH:
              setActiveBuilder('strength');
              break;
            case WorkoutType.CONDITIONING:
              setActiveBuilder('conditioning');
              break;
            case WorkoutType.HYBRID:
              setActiveBuilder('hybrid');
              break;
            case WorkoutType.AGILITY:
              setActiveBuilder('agility');
              break;
          }
        }}
        onViewWorkout={() => {
          // Close success modal and show workout details (requires workout ID)
          setSuccessModalData(prev => ({ ...prev, isOpen: false }));
          toast.info('Workout saved! You can view details from Recent Workouts.');
        }}
        onNotifyPlayers={() => {
          // Send notifications to assigned players
          if (successModalData.playerCount > 0 || successModalData.teamCount > 0) {
            toast.success('Notifications sent to assigned players!');
          } else {
            toast.info('No players assigned to notify');
          }
        }}
        onCreateDifferentType={() => {
          // This could open a workout type selector or just reset
          setSuccessModalData(prev => ({ ...prev, isOpen: false }));
        }}
      />
      
      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        isOpen={workoutDetailsModal.isOpen}
        onClose={handleCloseWorkoutDetails}
        workout={
          workoutDetailsModal.workoutType === WorkoutType.STRENGTH ? strengthWorkout?.data :
          workoutDetailsModal.workoutType === WorkoutType.CONDITIONING ? conditioningWorkout?.data :
          workoutDetailsModal.workoutType === WorkoutType.HYBRID ? hybridWorkout?.data :
          workoutDetailsModal.workoutType === WorkoutType.AGILITY ? agilityWorkout?.data :
          null
        }
        isLoading={
          isLoadingStrength || isLoadingConditioning || isLoadingHybrid || isLoadingAgility
        }
        onEdit={(workout) => {
          handleCloseWorkoutDetails();
          handleEditWorkout(workout.id);
        }}
        onDuplicate={(workout) => {
          handleCloseWorkoutDetails();
          handleDuplicateWorkout(workout.id);
        }}
        onDelete={handleDeleteWorkout}
        onCreateTemplate={handleCreateTemplateFromWorkout}
        onToggleFavorite={handleToggleFavorite}
        onLaunchSession={(workout) => {
          handleLaunchSession(workout);
        }}
      />
    </div>
  );
}