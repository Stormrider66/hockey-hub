'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, AlertCircle } from '@/components/icons';
import { toast } from 'react-hot-toast';
import type { WorkoutCreationContext } from '../types';

interface ConditioningWorkoutBuilderBasicProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  workoutContext?: WorkoutCreationContext | null;
}

export default function ConditioningWorkoutBuilderBasic({
  onSave,
  onCancel,
  workoutContext
}: ConditioningWorkoutBuilderBasicProps) {
  const [workoutName, setWorkoutName] = useState(
    workoutContext ? 
    `${workoutContext.teamName} - Conditioning - ${new Date(workoutContext.sessionDate).toLocaleDateString()}` : 
    ''
  );
  const [description, setDescription] = useState(
    workoutContext ? 
    `Conditioning workout for ${workoutContext.playerName} at ${workoutContext.sessionLocation}` : 
    ''
  );
  const [duration, setDuration] = useState(45);
  const [equipment, setEquipment] = useState('rowing');

  const handleSave = () => {
    if (!workoutName.trim()) {
      toast.error('Please enter a workout name');
      return;
    }

    const workoutData = {
      id: Date.now().toString(),
      name: workoutName,
      description,
      type: 'conditioning',
      equipment,
      duration,
      intervals: [
        // Default interval structure
        {
          id: '1',
          type: 'warmup',
          name: 'Warm Up',
          duration: 300,
          equipment,
          targetMetrics: {}
        },
        {
          id: '2', 
          type: 'work',
          name: 'Work Interval',
          duration: 240,
          equipment,
          targetMetrics: {
            heartRate: { type: 'percentage', value: 85, reference: 'max' }
          }
        },
        {
          id: '3',
          type: 'rest', 
          name: 'Rest',
          duration: 120,
          equipment,
          targetMetrics: {}
        },
        {
          id: '4',
          type: 'cooldown',
          name: 'Cool Down', 
          duration: 300,
          equipment,
          targetMetrics: {}
        }
      ],
      sessionContext: workoutContext,
      createdAt: new Date().toISOString()
    };

    onSave(workoutData);
    toast.success('Conditioning workout created successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Session Context Info */}
      {workoutContext && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Creating workout for <strong>{workoutContext.playerName}</strong> 
            {' '}from <strong>{workoutContext.teamName}</strong>
            {' '}on {new Date(workoutContext.sessionDate).toLocaleDateString()}
            {' '}at {workoutContext.sessionTime}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conditioning Workout Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="workoutName">Workout Name</Label>
            <Input
              id="workoutName"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="Enter workout name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the workout"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="equipment">Equipment</Label>
            <select
              id="equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="rowing">Rowing Machine</option>
              <option value="bike_erg">Bike Erg</option>
              <option value="treadmill">Treadmill</option>
              <option value="skierg">SkiErg</option>
              <option value="airbike">Air Bike</option>
              <option value="wattbike">WattBike</option>
              <option value="running">Running (Track)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min={10}
              max={120}
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              This basic conditioning workout includes:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>5 minute warm-up</li>
              <li>4 minute work interval at 85% max HR</li>
              <li>2 minute rest period</li>
              <li>5 minute cool-down</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Workout
        </Button>
      </div>
    </div>
  );
}