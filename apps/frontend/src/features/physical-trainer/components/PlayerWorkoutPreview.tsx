'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Clock, 
  Activity, 
  Play,
  Calendar,
  User,
  Target,
  TrendingUp,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntervalProgram } from '../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../types/conditioning.types';
import IntervalPreview from './IntervalPreview';

interface PlayerWorkoutPreviewProps {
  program: IntervalProgram;
  scheduledDate?: Date;
  assignedBy?: string;
  onStart?: () => void;
  className?: string;
}

export default function PlayerWorkoutPreview({ 
  program, 
  scheduledDate,
  assignedBy,
  onStart,
  className 
}: PlayerWorkoutPreviewProps) {
  // Calculate workout statistics
  const totalDuration = program.intervals.reduce((sum, interval) => sum + interval.duration, 0);
  const workIntervals = program.intervals.filter(i => i.type === 'work').length;
  const restIntervals = program.intervals.filter(i => i.type === 'rest').length;
  
  // Format duration
  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min ${secs > 0 ? `${secs}s` : ''}`;
  };
  
  // Get unique equipment used
  const uniqueEquipment = Array.from(
    new Set(program.intervals.map(i => i.equipment))
  ).map(eq => EQUIPMENT_CONFIGS[eq]);
  
  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500" />
                {program.name}
              </CardTitle>
              {program.description && (
                <p className="text-muted-foreground mt-2">{program.description}</p>
              )}
            </div>
            <Button size="lg" onClick={onStart} className="bg-green-600 hover:bg-green-700">
              <Play className="h-5 w-5 mr-2" />
              Start Workout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Duration */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Clock className="h-4 w-4" />
                Total Duration
              </div>
              <p className="text-lg font-semibold">{formatTotalDuration(totalDuration)}</p>
            </div>
            
            {/* Intervals */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Activity className="h-4 w-4" />
                Intervals
              </div>
              <p className="text-lg font-semibold">
                {workIntervals} work / {restIntervals} rest
              </p>
            </div>
            
            {/* Equipment */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Target className="h-4 w-4" />
                Equipment
              </div>
              <div className="flex gap-1">
                {uniqueEquipment.map(eq => (
                  <span key={eq.type} title={eq.label} className="text-lg">
                    {eq.icon}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Difficulty */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                Difficulty
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "capitalize",
                  program.difficulty === 'beginner' && "border-green-500 text-green-700",
                  program.difficulty === 'intermediate' && "border-yellow-500 text-yellow-700",
                  program.difficulty === 'advanced' && "border-orange-500 text-orange-700",
                  program.difficulty === 'elite' && "border-red-500 text-red-700"
                )}
              >
                {program.difficulty || 'intermediate'}
              </Badge>
            </div>
          </div>
          
          {/* Schedule Info */}
          {(scheduledDate || assignedBy) && (
            <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm text-gray-600">
              {scheduledDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Scheduled for {new Date(scheduledDate).toLocaleDateString()} at {new Date(scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {assignedBy && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Assigned by {assignedBy}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Workout Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Workout Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {program.intervals.map((interval, index) => (
              <IntervalPreview
                key={interval.id}
                interval={interval}
                index={index}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-lg">Preparation Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Ensure all equipment is ready: {uniqueEquipment.map(eq => eq.label).join(', ')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Have water and a towel nearby</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Connect your heart rate monitor if using HR targets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Complete a proper warm-up if not included in the workout</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}