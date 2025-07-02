'use client';

import React from 'react';
import { useGetWorkoutSessionByIdQuery, useGetSessionExecutionsQuery } from '@/store/api/trainingApi';
import { CardioSessionDashboard } from './CardioSessionDashboard';
import { StrengthSessionDashboard } from './StrengthSessionDashboard';
import { EnhancedTrainingSessionViewer } from './EnhancedTrainingSessionViewer';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface WorkoutSessionDashboardProps {
  sessionId: string;
  isTrainerView?: boolean;
}

export function WorkoutSessionDashboard({ 
  sessionId, 
  isTrainerView = true 
}: WorkoutSessionDashboardProps) {
  // API queries
  const { data: sessionData, isLoading: sessionLoading, error: sessionError } = useGetWorkoutSessionByIdQuery(sessionId);
  const { data: executionsData, isLoading: executionsLoading } = useGetSessionExecutionsQuery(sessionId);

  const session = sessionData?.data;
  const executions = executionsData?.data || [];

  // Loading state
  if (sessionLoading || executionsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Error state
  if (sessionError || !session) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load workout session. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Determine which dashboard to show based on category
  const renderDashboard = () => {
    // Check for category first (new field)
    if (session.category) {
      switch (session.category) {
        case 'cardio':
        case 'interval':
          return (
            <CardioSessionDashboard 
              session={session} 
              executions={executions}
              isTrainerView={isTrainerView}
            />
          );
        
        case 'strength':
          return (
            <StrengthSessionDashboard 
              session={session} 
              executions={executions}
              isTrainerView={isTrainerView}
            />
          );
        
        case 'circuit':
        case 'skill':
        case 'recovery':
        default:
          // For other categories, use the general viewer for now
          return (
            <EnhancedTrainingSessionViewer 
              sessionId={sessionId}
              isTrainerView={isTrainerView}
            />
          );
      }
    }
    
    // Fallback: check type field (legacy)
    switch (session.type) {
      case 'cardio':
        return (
          <CardioSessionDashboard 
            session={session} 
            executions={executions}
            isTrainerView={isTrainerView}
          />
        );
      
      case 'strength':
        return (
          <StrengthSessionDashboard 
            session={session} 
            executions={executions}
            isTrainerView={isTrainerView}
          />
        );
      
      default:
        return (
          <EnhancedTrainingSessionViewer 
            sessionId={sessionId}
            isTrainerView={isTrainerView}
          />
        );
    }
  };

  return renderDashboard();
}