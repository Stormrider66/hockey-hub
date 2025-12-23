'use client';

import { use } from 'react';
import { WorkoutSessionDashboard } from '@/features/physical-trainer/components/WorkoutSessionDashboard';
import { TrainingSocketProvider } from '@/contexts/TrainingSocketContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TrainingSessionPage({ params }: PageProps) {
  const { id: sessionId } = use(params);

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
