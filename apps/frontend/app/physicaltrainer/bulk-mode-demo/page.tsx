import React from 'react';
import { BulkModeDemo } from '@/features/physical-trainer/components/shared/BulkModeDemo';

export const metadata = {
  title: 'Bulk Mode Demo - Physical Trainer',
  description: 'Phase 1.2 enhancement demo for shared components with bulk mode support',
};

export default function BulkModeDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <BulkModeDemo workoutType="conditioning" />
    </div>
  );
}