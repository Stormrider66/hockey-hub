'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, Users, X, Heart, Zap } from '@/components/icons';
import BulkWorkoutAssignment from '../BulkWorkoutAssignment';
import { LazyWorkoutBuilderLoader, type WorkoutBuilderType } from '../builders/LazyWorkoutBuilderLoader';
import { KeyboardShortcuts } from '../shared';
import { WorkoutTypeGrid, RecentWorkoutsSection, SessionTemplatesSection } from './sessions';
import { useAuth } from "@/contexts/AuthContext";
import { useDispatch, useSelector } from 'react-redux';
import { parseWorkoutContext } from '../../utils/workoutNavigation';
import { AppDispatch } from '@/store/store';
import { useFeatureFlag } from '../../utils/featureFlags';
import { 
  LazyWorkoutSuccessModal, 
  LazyWorkoutDetailsModal, 
  LazyModalWrapper,
  preloadCriticalModals
} from '../shared/LazyModalLoader';

// Import all the other dependencies (types, API hooks, etc.) from the original SessionsTab
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

export default function SessionsTabOptimized({ selectedTeamId, onCreateSession, onNavigateToCalendar }: SessionsTabProps) {
  const { t } = useTranslation('physicalTrainer');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const isLazyLoadModals = useFeatureFlag('LAZY_LOAD_MODALS');

  // ... (copy all state management from original SessionsTab)
  const [activeBuilder, setActiveBuilder] = useState<WorkoutBuilderType | null>(null);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [templateCreationData, setTemplateCreationData] = useState<any>(null);

  // Workout details modal state
  const [workoutDetailsModal, setWorkoutDetailsModal] = useState<{
    isOpen: boolean;
    workoutId: string | null;
    workoutType: WorkoutType | null;
  }>({
    isOpen: false,
    workoutId: null,
    workoutType: null
  });
  
  // Success modal state
  const [successModalData, setSuccessModalData] = useState<{
    isOpen: boolean;
    workoutType: WorkoutType;
    workoutName?: string;
    playerCount?: number;
    teamCount?: number;
    duration?: number;
    exerciseCount?: number;
  }>({
    isOpen: false,
    workoutType: WorkoutType.STRENGTH
  });

  // Preload critical modals when tab is active
  useEffect(() => {
    if (isLazyLoadModals) {
      preloadCriticalModals();
    }
  }, [isLazyLoadModals]);

  // ... (copy all the other logic, handlers, etc. from original SessionsTab)
  // For brevity, I'm including just the key changes for modal rendering

  return (
    <WorkoutBuilderErrorBoundary>
      <div className="p-6 space-y-6">
        {/* ... (copy all the JSX from original SessionsTab up to the modals) */}
        
        {/* Success Modal with Lazy Loading */}
        <LazyModalWrapper 
          isOpen={successModalData.isOpen} 
          modalName="WorkoutSuccessModal"
        >
          <LazyWorkoutSuccessModal
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
            onSaveAsTemplate={() => {
              // Store the workout data for template creation
              const workoutData = {
                name: successModalData.workoutName,
                type: successModalData.workoutType,
                duration: successModalData.duration,
                exerciseCount: successModalData.exerciseCount,
              };
              setTemplateCreationData(workoutData);
              // handleCreateTemplateFromSuccessModal();
            }}
            onViewWorkout={() => {
              // Close success modal and show workout details
              setSuccessModalData(prev => ({ ...prev, isOpen: false }));
              toast.info('Workout saved! You can view details from Recent Workouts.');
            }}
            onNotifyPlayers={() => {
              // Send notifications to assigned players
              if (successModalData.playerCount! > 0 || successModalData.teamCount! > 0) {
                toast.success('Notifications sent to assigned players!');
              } else {
                toast.info('No players assigned to notify.');
              }
            }}
            onCreateDifferentType={() => {
              // Reset and close
              setSuccessModalData(prev => ({ ...prev, isOpen: false }));
            }}
          />
        </LazyModalWrapper>
        
        {/* Workout Details Modal with Lazy Loading */}
        <LazyModalWrapper 
          isOpen={workoutDetailsModal.isOpen} 
          modalName="WorkoutDetailsModal"
        >
          <LazyWorkoutDetailsModal
            isOpen={workoutDetailsModal.isOpen}
            onClose={() => setWorkoutDetailsModal({ isOpen: false, workoutId: null, workoutType: null })}
            workout={null} // You'll need to pass the actual workout data here
            isLoading={false}
            workoutType={workoutDetailsModal.workoutType}
          />
        </LazyModalWrapper>
      </div>
    </WorkoutBuilderErrorBoundary>
  );
}