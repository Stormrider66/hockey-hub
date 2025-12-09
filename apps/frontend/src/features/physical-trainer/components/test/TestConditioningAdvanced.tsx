'use client';

import React from 'react';
import ConditioningBuilderAdvanced from '../ConditioningBuilderAdvanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestConditioningAdvanced() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Advanced Conditioning Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Testing the advanced conditioning builder with mixed equipment, watts/calories targets, and sets support.
          </p>
        </CardContent>
      </Card>

      <ConditioningBuilderAdvanced
        onSave={(data) => {
          console.log('Saved workout:', data);
          alert('Workout saved! Check console for details.');
        }}
        onCancel={() => {
          console.log('Cancelled');
          alert('Cancelled');
        }}
        workoutContext={{
          playerName: 'Test Player',
          playerId: '123',
          teamName: 'Test Team',
          teamId: '456',
          sessionId: 789,
          sessionDate: new Date().toISOString(),
          sessionTime: '09:00',
          sessionLocation: 'Test Track',
          sessionType: 'conditioning'
        }}
      />
    </div>
  );
}