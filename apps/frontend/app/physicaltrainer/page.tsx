'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the dashboard to avoid SSR issues
const PhysicalTrainerDashboard = dynamic(
  () => import('@/src/features/physical-trainer/components/PhysicalTrainerDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Physical Trainer Dashboard...</p>
        </div>
      </div>
    )
  }
);

export default function PhysicalTrainerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PhysicalTrainerDashboard />
    </Suspense>
  );
} 