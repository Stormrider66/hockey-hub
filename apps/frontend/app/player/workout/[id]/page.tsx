'use client';

import { WorkoutExecutor } from '@/features/player/components/WorkoutExecutor';
import { TrainingSocketProvider } from '@/contexts/TrainingSocketContext';
import { useParams } from 'next/navigation';

export default function WorkoutExecutionPage() {
  const params = useParams();
  const workoutId = params.id as string;
  
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