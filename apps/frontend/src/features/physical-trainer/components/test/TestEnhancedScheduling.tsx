'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentWorkoutsWidget } from '../shared/RecentWorkoutsWidget';

// Mock data with enhanced scheduling information
const mockRecentWorkouts = [
  {
    id: '1',
    name: 'Morning Strength Training',
    type: 'STRENGTH',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    playerCount: 15,
    teamCount: 1,
    duration: 60,
    isFavorite: true,
    usageCount: 5,
    successRate: 92,
    location: {
      facilityName: 'Main Training Center',
      area: 'Weight Room'
    },
    assignedTeams: ['Pittsburgh Penguins'],
    recurring: {
      frequency: 'Weekly',
      daysOfWeek: [1, 3, 5]
    },
    hasReminders: true
  },
  {
    id: '2',
    name: 'Conditioning Intervals',
    type: 'CONDITIONING',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    playerCount: 8,
    teamCount: 0,
    duration: 45,
    isFavorite: true,
    usageCount: 3,
    successRate: 88,
    location: {
      facilityName: 'Indoor Track'
    },
    assignedPlayers: ['player-001', 'player-002', 'player-003'],
    hasReminders: true
  },
  {
    id: '3',
    name: 'Agility Ladder Drills',
    type: 'AGILITY',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    playerCount: 12,
    teamCount: 0,
    duration: 30,
    isFavorite: false,
    usageCount: 2,
    location: {
      facilityName: 'Field House',
      area: 'Turf Area'
    },
    hasReminders: false
  },
  {
    id: '4',
    name: 'Recovery Session',
    type: 'HYBRID',
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    playerCount: 20,
    teamCount: 1,
    duration: 40,
    isFavorite: false,
    usageCount: 1,
    successRate: 95,
    assignedTeams: ['Colorado Avalanche'],
    recurring: {
      frequency: 'Daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    }
  }
];

export default function TestEnhancedScheduling() {
  const handleDuplicate = (workoutId: string) => {
    console.log('Duplicate workout:', workoutId);
  };

  const handleEdit = (workoutId: string) => {
    console.log('Edit workout:', workoutId);
  };

  const handleToggleFavorite = (workoutId: string) => {
    console.log('Toggle favorite:', workoutId);
  };

  const handleViewDetails = (workoutId: string) => {
    console.log('View details:', workoutId);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Scheduling Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This test component demonstrates the enhanced scheduling information in workout cards.
          </p>
        </CardContent>
      </Card>

      <RecentWorkoutsWidget
        workouts={mockRecentWorkouts}
        isLoading={false}
        onDuplicate={handleDuplicate}
        onEdit={handleEdit}
        onToggleFavorite={handleToggleFavorite}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}