import React from 'react';
import { Clock, Dumbbell, Zap, Target, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import * as Icons from '@/components/icons';
import { ScheduleEvent, UserRole } from '../../types';

interface TrainingContentProps {
  event: ScheduleEvent;
  role: UserRole;
}

const MetricCard: React.FC<{ label: string; value: string | number; icon: any }> = ({ 
  label, 
  value, 
  icon: Icon 
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
    </CardContent>
  </Card>
);

const ExerciseCard: React.FC<{ exercise: any; index: number }> = ({ exercise, index }) => (
  <div className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50">
    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
      {index}
    </div>
    <div className="flex-1">
      <p className="font-medium">{exercise.name}</p>
      <div className="flex gap-3 mt-1 text-sm text-gray-600">
        {exercise.sets && <span>{exercise.sets} sets</span>}
        {exercise.reps && <span>{exercise.reps} reps</span>}
        {exercise.weight && <span>{exercise.weight}kg</span>}
        {exercise.duration && <span>{exercise.duration}min</span>}
        {exercise.rest && <span>{exercise.rest}s rest</span>}
      </div>
    </div>
    {exercise.difficulty && (
      <Badge variant={
        exercise.difficulty === 'hard' ? 'destructive' : 
        exercise.difficulty === 'medium' ? 'default' : 
        'secondary'
      }>
        {exercise.difficulty}
      </Badge>
    )}
  </div>
);

const AssignedPlayersSection: React.FC<{ players: any[] }> = ({ players }) => {
  if (!players || players.length === 0) return null;

  const healthyPlayers = players.filter(p => !p.medical || p.medical === 'healthy');
  const limitedPlayers = players.filter(p => p.medical === 'limited');
  const injuredPlayers = players.filter(p => p.medical === 'injured');

  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Assigned Players ({players.length})
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Healthy</span>
              <Badge className="bg-green-100 text-green-800">{healthyPlayers.length}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Limited</span>
              <Badge className="bg-amber-100 text-amber-800">{limitedPlayers.length}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Injured</span>
              <Badge className="bg-red-100 text-red-800">{injuredPlayers.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {players.slice(0, 5).map((player, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Icons.User className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{player.name || `Player ${idx + 1}`}</p>
                <p className="text-xs text-gray-500">{player.position || 'Forward'}</p>
              </div>
            </div>
            {player.medical && player.medical !== 'healthy' && (
              <Badge variant={player.medical === 'injured' ? 'destructive' : 'default'}>
                {player.medical}
              </Badge>
            )}
          </div>
        ))}
        {players.length > 5 && (
          <p className="text-sm text-gray-500 text-center py-2">
            +{players.length - 5} more players
          </p>
        )}
      </div>
    </div>
  );
};

export const TrainingContent: React.FC<TrainingContentProps> = ({ event, role }) => {
  // Generate mock exercises if not provided
  const exercises = event.exercises || event.metadata?.exercises || [
    { name: 'Squat', sets: 4, reps: 8, weight: 100, rest: 120, difficulty: 'hard' },
    { name: 'Bench Press', sets: 3, reps: 10, weight: 80, rest: 90, difficulty: 'medium' },
    { name: 'Deadlift', sets: 3, reps: 6, weight: 120, rest: 180, difficulty: 'hard' },
    { name: 'Pull-ups', sets: 3, reps: 12, rest: 60, difficulty: 'medium' },
    { name: 'Core Circuit', duration: 10, difficulty: 'easy' },
  ];

  const duration = event.metadata?.duration || 90;
  const workoutType = event.workoutType || 'strength';
  const participants = event.participants || [];

  return (
    <div className="space-y-6">
      {/* Workout Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          label="Duration" 
          value={`${duration} min`} 
          icon={Clock} 
        />
        <MetricCard 
          label="Exercises" 
          value={exercises.length} 
          icon={Dumbbell} 
        />
        <MetricCard 
          label="Intensity" 
          value={event.intensity || 'Medium'} 
          icon={Zap} 
        />
      </div>

      {/* Workout Type and Focus */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Workout Details
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Type</p>
              <Badge variant="outline" className="text-base">
                {workoutType.charAt(0).toUpperCase() + workoutType.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Focus Areas</p>
              <div className="flex gap-2 flex-wrap">
                {event.metadata?.focusAreas?.map((area: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{area}</Badge>
                )) || (
                  <>
                    <Badge variant="secondary">Upper Body</Badge>
                    <Badge variant="secondary">Core</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {event.metadata?.notes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Notes:</strong> {event.metadata.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise List */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          Exercise Program
        </h3>
        <div className="space-y-2">
          {exercises.map((exercise: any, idx: number) => (
            <ExerciseCard key={idx} exercise={exercise} index={idx + 1} />
          ))}
        </div>
      </div>

      {/* Progress Tracking (if active) */}
      {event.status === 'active' && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Live Progress
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Overall Completion</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Time Elapsed</span>
                  <span className="text-sm font-medium">41 / 90 min</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>18 players currently active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Players */}
      <AssignedPlayersSection players={participants as any[]} />
    </div>
  );
};