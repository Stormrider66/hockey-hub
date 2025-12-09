'use client';

import React from 'react';
import { SessionBundleView } from '../../../src/features/physical-trainer/components/bulk-sessions/SessionBundleView';

export default function BundleDemoPage() {
  const handleSessionClick = (sessionId: string) => {
    console.log('Session clicked:', sessionId);
    alert(`Clicked session: ${sessionId}`);
  };

  const handleBulkAction = (action: string, sessionIds: string[], metadata?: any) => {
    console.log('Bulk action:', action, 'Sessions:', sessionIds, 'Metadata:', metadata);
    alert(`Bulk action: ${action} on ${sessionIds.length} sessions ${metadata?.workoutType ? `(${metadata.workoutType})` : ''}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Session Bundle Demo</h1>
          <p className="text-gray-600 mt-2">
            Demonstrates Phase 3.1 implementation: Multi-workout type bundle monitoring with type-specific widgets and enhanced bulk actions.
          </p>
        </div>
        
        {/* Key Features */}
        <div className="bg-white rounded-lg p-6 shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Enhanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-blue-600">Type-Specific Monitoring</h3>
              <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                <li>Strength: Sets, reps, weight, volume tracking</li>
                <li>Conditioning: HR zones, power, calories</li>
                <li>Hybrid: Block progression, mixed metrics</li>
                <li>Agility: Drill accuracy, timing, error rates</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-purple-600">Enhanced Bulk Actions</h3>
              <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                <li>Export by workout type</li>
                <li>Type-specific messaging</li>
                <li>Mixed-bundle awareness</li>
                <li>Workout type distribution display</li>
              </ul>
            </div>
          </div>
        </div>

        <SessionBundleView
          bundleId="demo-bundle-001"
          onSessionClick={handleSessionClick}
          onBulkAction={handleBulkAction}
        />
      </div>
    </div>
  );
}