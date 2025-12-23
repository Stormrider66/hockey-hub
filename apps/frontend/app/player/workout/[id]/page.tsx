'use client';

import { use } from 'react';
import { WorkoutExecutor } from '@/features/player/components/WorkoutExecutor';
import { TrainingSocketProvider } from '@/contexts/TrainingSocketContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkoutExecutionPage({ params }: PageProps) {
  const { id: workoutId } = use(params);

  // In production, get player ID from auth context
  const playerId = "player-123";

  return (
    <TrainingSocketProvider>
      <div className="container mx-auto py-6">
        <WorkoutExecutor sessionId={workoutId} playerId={playerId} />
      </div>
    </TrainingSocketProvider>
  );
}
