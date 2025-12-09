'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, AlertCircle, CheckCircle, Users, Circle, CheckCircle2 } from '@/components/icons';
import { cn } from "@/lib/utils";
import type { TodaySession, WorkoutCreationContext } from '../../../types';
import { navigateToWorkoutBuilder } from '../../../utils/workoutNavigation';

interface Player {
  id: string;
  name: string;
  position: string;
  team?: string;
  teamId?: string;
  status?: 'healthy' | 'injured' | 'limited' | 'active';
  jersey?: string;
  number?: number;
  avatar?: string;
  medicalStatus?: {
    status: string;
    restrictions: string[];
    returnDate?: string;
  };
}

interface TeamRosterProps {
  players: Player[];
  onViewAll?: () => void;
  selectedSession?: TodaySession | null;
}

export default function TeamRoster({ players, onViewAll, selectedSession }: TeamRosterProps) {
  const router = useRouter();
  // Mock workout assignments for the selected session
  const mockWorkoutAssignments = useMemo(() => {
    if (!selectedSession) return {};
    
    // Simulate different assignment patterns based on session
    // Map session IDs to player IDs based on event type and team
    const assignmentPatterns: Record<string, string[]> = {
      // A-Team events
      'event-today-1': ['1', '2', '3', '5', '7', '8', '10', '11', '13', '14'], // A-Team Morning Strength Training
      'event-today-3': ['1', '2', '3', '8', '9'], // A-Team Ice Practice - Power Play
      'event-tomorrow-1': ['1', '2', '3'], // A-Team Pre-Game Skate
      'event-tomorrow-2': ['1', '2', '3', '8', '9'], // A-Team Home Game vs Rangers
      
      // J20 events
      'event-today-2': ['16', '17', '19', '20'], // J20 Team Conditioning
      'event-today-5': ['16', '17', '18', '19', '20'], // J20 Team Meeting - Strategy Review
      
      // U18 events
      'event-week-2': ['28', '29', '30'], // U18 Agility Training
      'event-today-8': ['28', '29', '30', '31'], // U18 Team Meeting
      
      // U16 events
      'event-today-6': ['38', '39', '40', '41'], // U16 Skills Development
      
      // Women's Team events
      'event-today-7': ['46', '47', '48', '49', '50'], // Women's Team Strength Training
      
      // Legacy session IDs (for backwards compatibility)
      'session-001': ['1', '2', '3', '5', '7', '8', '10', '11', '13', '14'], // Max Strength Testing
      'session-002': ['1', '4', '6', '9', '12', '15'], // VO2 Max Intervals
      'session-003': ['2', '3', '5', '7', '10', '11', '14'], // Elite Power Circuit
      'session-004': ['16', '17', '19', '20', '22', '24', '26'], // J20 Morning Practice
      'session-005': ['18', '21', '23', '25', '27'], // J20 Speed Development
      'session-006': ['28', '29', '31', '32', '34', '36'], // U18 Strength Training
      'session-007': ['30', '33', '35', '37'], // U18 Conditioning
      'session-008': ['46', '47', '49', '50', '52', '54'], // Women's Power Training
    };
    
    const assignedPlayerIds = assignmentPatterns[selectedSession.id] || [];
    return assignedPlayerIds.reduce((acc, playerId) => {
      acc[playerId] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }, [selectedSession]);

  // Add mock medical status to some players for demo
  const playersWithMedicalStatus = useMemo(() => {
    return players.map((player, index) => {
      // Add some variety to player statuses for demo
      let status: Player['status'] = 'healthy';
      let medicalStatus = undefined;
      
      // Make some players injured/limited for demo
      if (player.name === 'Jonathan Pudas' || player.name === 'Michelle Löwenhielm') {
        status = 'injured';
        medicalStatus = {
          status: 'injured',
          restrictions: ['No contact', 'Limited ice time'],
          returnDate: '2025-02-15'
        };
      } else if (player.name === 'Oscar Möller' || player.name === 'Viktor Nordin') {
        status = 'limited';
        medicalStatus = {
          status: 'limited',
          restrictions: ['No heavy lifting'],
          returnDate: '2025-02-01'
        };
      } else if (index % 5 === 0 && index > 0) {
        status = 'limited';
        medicalStatus = {
          status: 'limited',
          restrictions: ['Modified training'],
          returnDate: undefined
        };
      }
      
      return {
        ...player,
        status,
        medicalStatus
      };
    });
  }, [players]);

  const getStatusIcon = (status: Player['status']) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'injured':
        return <Heart className="h-3 w-3 text-red-500" />;
      case 'limited':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      default:
        return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
  };

  const getPositionAbbr = (position: string) => {
    switch(position.toLowerCase()) {
      case 'forward': return 'F';
      case 'defense': return 'D';
      case 'goalie': return 'G';
      default: return position.charAt(0);
    }
  };

  const handlePlayerClick = (player: Player) => {
    // Only handle click if a session is selected and player doesn't have a workout
    if (!selectedSession || mockWorkoutAssignments[player.id]) return;
    
    // Create the workout context
    const context: WorkoutCreationContext = {
      sessionId: selectedSession.id,
      sessionType: selectedSession.type,
      sessionDate: new Date(), // Assuming today for now
      sessionTime: selectedSession.time,
      sessionLocation: selectedSession.location,
      teamId: player.teamId || selectedSession.team.toLowerCase().replace(/\s+/g, '-'),
      teamName: selectedSession.team,
      playerId: player.id,
      playerName: player.name,
      returnPath: '/physicaltrainer'
    };
    
    // Navigate to the workout builder with context
    navigateToWorkoutBuilder(router as any, context);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Team Roster
            <span className="text-sm text-muted-foreground font-normal">
              ({playersWithMedicalStatus.length} players)
            </span>
          </CardTitle>
          {selectedSession && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Session: <span className="font-medium">{selectedSession.type}</span> at {selectedSession.time}
              </p>
              <p className="text-xs text-muted-foreground">
                Location: {selectedSession.location} • Click on red circles to create workouts
              </p>
            </div>
          )}
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Pos</div>
            <div className="col-span-2 text-center">Workout</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          
          {/* Player rows */}
          {playersWithMedicalStatus.map((player) => {
            const hasWorkout = selectedSession ? mockWorkoutAssignments[player.id] : false;
            const canCreateWorkout = selectedSession && !hasWorkout;
            
            return (
              <div
                key={player.id}
                className={cn(
                  "grid grid-cols-12 gap-2 px-2 py-1.5 text-sm transition-colors rounded",
                  player.status === 'injured' && "bg-red-50/50",
                  player.status === 'limited' && "bg-yellow-50/50",
                  canCreateWorkout && "cursor-pointer hover:bg-accent/50",
                  !canCreateWorkout && "cursor-default"
                )}
                onClick={() => canCreateWorkout && handlePlayerClick(player)}
                title={canCreateWorkout 
                  ? `Click to create ${selectedSession.type} workout for ${player.name} at ${selectedSession.time} in ${selectedSession.location}` 
                  : hasWorkout && selectedSession 
                    ? `${player.name} already has a workout assigned for this session`
                    : undefined}
              >
              <div className="col-span-1 font-medium text-muted-foreground">
                {player.number || player.jersey || '--'}
              </div>
              <div className="col-span-5 font-medium truncate">
                {player.name}
              </div>
              <div className="col-span-2 text-muted-foreground">
                {getPositionAbbr(player.position)}
              </div>
              <div className="col-span-2 flex justify-center">
                {selectedSession ? (
                  mockWorkoutAssignments[player.id] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" title="Workout assigned" />
                  ) : (
                    <Circle className="h-4 w-4 text-red-500" title="No workout assigned" />
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1">
                {getStatusIcon(player.status)}
                {player.medicalStatus && player.medicalStatus.restrictions.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {player.medicalStatus.restrictions.length}R
                  </span>
                )}
              </div>
            </div>
            );
          })}
        </div>
        
        {/* Legend and Stats */}
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              <span>Limited</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-500" />
              <span>Injured</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">R</span>
              <span>Restrictions</span>
            </div>
          </div>
          
          {selectedSession && (
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground">Assigned:</span>
                <span className="font-medium text-green-600">
                  {Object.keys(mockWorkoutAssignments).length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Circle className="h-3 w-3 text-red-500" />
                <span className="text-muted-foreground">Not Assigned:</span>
                <span className="font-medium text-red-500">
                  {playersWithMedicalStatus.length - Object.keys(mockWorkoutAssignments).length}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}