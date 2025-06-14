"use client";
import React from 'react';
import { TestAnalyticsPanel } from '@/components/TestAnalyticsPanel';

export default function TestAnalyticsPage() {
  // Replace with real playerId once integrated with auth state
  const playerId = 'player-123';
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Analytics</h1>
      <TestAnalyticsPanel playerId={playerId} />
    </main>
  );
} 