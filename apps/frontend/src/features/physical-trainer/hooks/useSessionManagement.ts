import { useState } from 'react';
import { useGetSessionsQuery } from '@/store/api/trainingApi';
import { mockTodaysSessions, getCardioIntervals } from '../constants/mockData';
import { WorkoutSession, TodaySession } from '../types';

interface CurrentSession {
  team: string;
  type: string;
  teamId: string;
}

export function useSessionManagement() {
  const [showSessionViewer, setShowSessionViewer] = useState(false);
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch today's sessions from API
  const today = new Date().toISOString().split('T')[0];
  const { data: apiSessions, isLoading: sessionsLoading } = useGetSessionsQuery({ date: today });

  // Use API sessions if available, otherwise use mock data
  const todaysSessions = apiSessions && apiSessions.length > 0 ? 
    apiSessions.map(session => ({
      id: session.id,
      time: session.time,
      team: session.team,
      type: session.name,
      location: session.location,
      players: session.currentParticipants,
      status: session.status === 'active' ? 'active' : 
              session.status === 'completed' ? 'completed' : 'upcoming',
      intensity: session.intensity,
      description: session.description || ''
    })) : mockTodaysSessions;

  const launchSession = (session: TodaySession) => {
    setCurrentSession({ 
      team: session.team, 
      type: session.type,
      teamId: session.id.toString()
    });
    setShowSessionViewer(true);
  };

  const closeSessionViewer = () => {
    setShowSessionViewer(false);
    setCurrentSession(null);
  };

  const getSessionIntervals = () => {
    if (currentSession?.type === 'Cardio Intervals') {
      return getCardioIntervals();
    }
    return [];
  };

  return {
    todaysSessions,
    sessionsLoading,
    showSessionViewer,
    currentSession,
    showCreateModal,
    setShowCreateModal,
    launchSession,
    closeSessionViewer,
    getSessionIntervals
  };
}