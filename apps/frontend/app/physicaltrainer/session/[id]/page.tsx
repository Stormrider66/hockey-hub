'use client';

import { WorkoutSessionDashboard } from '@/features/physical-trainer/components/WorkoutSessionDashboard';
import { TrainingSocketProvider } from '@/contexts/TrainingSocketContext';
import { useParams } from 'next/navigation';

export default function TrainingSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  return (
    <TrainingSocketProvider>
      <div className="container mx-auto">
        <WorkoutSessionDashboard 
          sessionId={sessionId} 
          isTrainerView={true} 
        />
      </div>
    </TrainingSocketProvider>
  );
}