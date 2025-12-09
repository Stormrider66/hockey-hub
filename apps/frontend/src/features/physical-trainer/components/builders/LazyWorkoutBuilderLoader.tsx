'use client';

import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';
import type { WorkoutSession, Exercise, WorkoutCreationContext } from '../../types';
import type { BulkSessionConfig } from '../../hooks/useBulkSession';

// Lazy load workout builders
const StrengthWorkoutBuilder = React.lazy(() => 
  import('../SessionBuilder/SessionBuilder').then(module => ({ default: module.SessionBuilder }))
);

const ConditioningWorkoutBuilder = React.lazy(() => 
  import('../ConditioningWorkoutBuilderSimple')
);

const HybridWorkoutBuilder = React.lazy(() => 
  import('../HybridWorkoutBuilderEnhanced')
);

const AgilityWorkoutBuilder = React.lazy(() => 
  import('../AgilityWorkoutBuilder')
);

const FlexibilityWorkoutBuilder = React.lazy(() => 
  import('../FlexibilityWorkoutBuilder')
);

const WrestlingWorkoutBuilder = React.lazy(() => 
  import('../WrestlingWorkoutBuilder')
);

export type WorkoutBuilderType = 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'flexibility' | 'wrestling';

interface LazyWorkoutBuilderLoaderProps {
  builderType: WorkoutBuilderType;
  onSave: (session: Partial<WorkoutSession>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<WorkoutSession>;
  workoutId?: string;
  // Props specific to SessionBuilder
  players?: any[];
  exercises?: Exercise[];
  templates?: any[];
  // Pre-filled context from Team Roster
  workoutContext?: WorkoutCreationContext | null;
  // Bulk mode support
  supportsBulk?: boolean;
  onBulkSave?: (config: BulkSessionConfig<any>) => Promise<void>;
}

export const LazyWorkoutBuilderLoader = React.memo(function LazyWorkoutBuilderLoader({
  builderType,
  onSave,
  onCancel,
  isLoading = false,
  initialData,
  workoutId,
  players,
  exercises,
  templates,
  workoutContext,
  supportsBulk = false,
  onBulkSave
}: LazyWorkoutBuilderLoaderProps) {
  const LoadingFallback = (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <p className="text-muted-foreground">
          Loading {builderType} workout builder...
        </p>
      </div>
    </div>
  );

  const commonProps = {
    onSave,
    onCancel,
    isLoading,
    ...(initialData && { initialData }),
    ...(workoutId && { workoutId }),
    ...(workoutContext && { workoutContext }),
    ...(supportsBulk && { supportsBulk, onBulkSave })
  };

  let builder: React.ReactNode = null;
  if (builderType === 'strength') {
    builder = <StrengthWorkoutBuilder {...commonProps} />;
  } else if (builderType === 'conditioning') {
    builder = <ConditioningWorkoutBuilder {...commonProps} />;
  } else if (builderType === 'hybrid') {
    builder = <HybridWorkoutBuilder {...commonProps} />;
  } else if (builderType === 'agility') {
    builder = (
      <AgilityWorkoutBuilder
        {...commonProps}
        selectedPlayers={players?.map(p => p.id) || []}
      />
    );
  } else if (builderType === 'flexibility') {
    builder = (
      <FlexibilityWorkoutBuilder
        {...commonProps}
        selectedPlayers={players?.map(p => p.id) || []}
      />
    );
  } else if (builderType === 'wrestling') {
    builder = (
      <WrestlingWorkoutBuilder
        {...commonProps}
        supportsBulkMode={supportsBulk}
      />
    );
  }

  return (
    <Suspense fallback={LoadingFallback}>
      {/* Force remount on builder type change to avoid hook order mismatches */}
      <div key={`builder-${builderType}`}>
        {builder}
      </div>
    </Suspense>
  );
})
