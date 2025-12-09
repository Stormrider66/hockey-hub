'use client';

import React, { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Users, CheckCircle2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import LaunchSessionButton from '../../LaunchSessionButton';
import type { TodaySession } from '../../../types';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useGetEventsByDateRangeQuery, EventType } from '@/store/api/calendarApi';

interface TodaysSessionsProps {
  sessions: TodaySession[];
  onCreateNew: () => void;
  onLaunchSession: (session: TodaySession) => void;
  selectedSessionId?: number | string;
  onSelectSession?: (session: TodaySession) => void;
  selectedTeamId?: string | null;
}

const TodaysSessions = memo(function TodaysSessions({ 
  sessions, 
  onCreateNew, 
  onLaunchSession,
  selectedSessionId,
  onSelectSession,
  selectedTeamId 
}: TodaysSessionsProps) {
  const { t } = useTranslation('physicalTrainer');
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Get events from calendar for the selected date
  const { data: calendarEvents, isLoading } = useGetEventsByDateRangeQuery({
    userId: user?.id || '',
    organizationId: user?.organizationId || '',
    teamId: selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId || undefined,
    startDate: startOfDay(selectedDate).toISOString(),
    endDate: endOfDay(selectedDate).toISOString()
  }, {
    skip: !user?.id || !user?.organizationId
  });

  // Transform calendar events to training sessions
  const calendarSessions: TodaySession[] = React.useMemo(() => {
    // For now, generate mock data for other days
    if (format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')) {
      const dayOfWeek = selectedDate.getDay();
      const mockSessions: TodaySession[] = [];
      
      // Different schedule based on day of week
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Weekend - lighter schedule
        mockSessions.push({
          id: `weekend-${selectedDate.getTime()}-1`,
          time: '10:00',
          team: 'A-Team',
          type: 'recoverySession',
          location: 'gym',
          players: 18,
          status: 'upcoming',
          intensity: 'low',
          description: 'Weekend recovery and mobility',
          category: 'recovery'
        });
      } else {
        // Weekday - full schedule
        mockSessions.push(
          {
            id: `weekday-${selectedDate.getTime()}-1`,
            time: '07:00',
            team: 'A-Team',
            type: 'strengthTraining',
            location: 'weightRoom',
            players: 22,
            status: 'upcoming',
            intensity: 'high',
            description: 'Morning strength session',
            category: 'strength'
          },
          {
            id: `weekday-${selectedDate.getTime()}-2`,
            time: '09:30',
            team: 'J20',
            type: 'agilityTraining',
            location: 'field',
            players: 18,
            status: 'upcoming',
            intensity: 'medium',
            description: 'Speed and agility drills',
            category: 'agility'
          },
          {
            id: `weekday-${selectedDate.getTime()}-3`,
            time: '14:00',
            team: 'U18',
            type: 'hybridWorkout',
            location: 'gym',
            players: 16,
            status: 'upcoming',
            intensity: 'medium',
            description: 'Combined strength and cardio',
            category: 'hybrid'
          },
          {
            id: `weekday-${selectedDate.getTime()}-4`,
            time: '16:30',
            team: 'A-Team',
            type: 'cardioIntervals',
            location: 'track',
            players: 20,
            status: 'upcoming',
            intensity: 'high',
            description: 'Interval training',
            category: 'cardio'
          }
        );
      }
      
      return mockSessions;
    }
    
    // If we have real calendar data, use it
    if (!calendarEvents?.data) return [];
    
    return calendarEvents.data
      .filter(event => event.type === EventType.TRAINING)
      .map((event, index) => ({
        id: event.id,
        time: format(new Date(event.startTime), 'HH:mm'),
        team: event.title.split(' - ')[0] || 'Team',
        type: 'strengthTraining' as const,
        location: event.location || 'gym',
        players: event.participants?.length || 0,
        status: new Date(event.startTime) < new Date() ? 'completed' : 
                new Date(event.startTime) <= new Date() && new Date(event.endTime) >= new Date() ? 'active' : 'upcoming',
        intensity: 'medium' as const,
        description: event.description,
        category: 'strength'
      }));
  }, [calendarEvents, selectedDate]);

  // Use calendar sessions if not today, otherwise use provided sessions
  const displaySessions = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
    ? sessions 
    : calendarSessions;

  const handlePreviousDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const dateDisplay = isToday ? t('dashboard.todaySessions') : format(selectedDate, 'EEEE, MMMM d');

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <CardTitle>{dateDisplay}</CardTitle>
            <Button size="sm" onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-1" />
              {t('sessions.newSession')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePreviousDay}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={isToday ? "default" : "outline"}
              onClick={handleToday}
              className="h-8 px-3 text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Today
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextDay}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p>Loading sessions...</p>
          </div>
        ) : displaySessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{isToday ? t('sessions.viewer.noSessionsToday') : `No sessions scheduled for ${format(selectedDate, 'MMMM d')}`}</p>
            <Button 
              variant="link" 
              onClick={onCreateNew}
              className="mt-2"
            >
              {t('sessions.viewer.createFirstSession')}
            </Button>
          </div>
        ) : (
        <div className="space-y-3">
          {displaySessions.map(session => (
            <div 
              key={session.id} 
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg transition-colors cursor-pointer",
                selectedSessionId === session.id 
                  ? "border-primary bg-primary/10 hover:bg-primary/15" 
                  : "hover:bg-accent/50"
              )}
              onClick={() => onSelectSession?.(session)}
            >
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold">{session.time}</div>
                  <div className="text-xs text-muted-foreground">{t(`physicalTrainer:training.locations.${session.location}`)}</div>
                </div>
                <div className={cn(
                  "h-12 w-1 rounded-full",
                  session.status === 'active' ? 'bg-green-500' : 
                  session.status === 'completed' ? 'bg-gray-500' : 'bg-gray-300'
                )} />
                <div>
                  <div className="font-medium">{t(`physicalTrainer:training.sessionTypes.${session.type}`)}</div>
                  <div className="text-sm text-muted-foreground">{session.team}</div>
                  {session.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">{session.description}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={
                  session.intensity === 'high' ? 'destructive' : 
                  session.intensity === 'medium' ? 'default' : 'secondary'
                }>
                  {t('sessions.intensity', { level: t(`training.intensity.${session.intensity}`) })}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {session.players}
                </div>
                {session.status === 'completed' ? (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t('sessions.status.completed')}
                  </Badge>
                ) : session.status === 'active' ? (
                  <LaunchSessionButton
                    sessionType={session.type}
                    teamId={selectedTeamId || 'a-team'}
                    teamName={session.team}
                    sessionCategory={t(`physicalTrainer:training.sessionTypes.${session.type}`)}
                    size="sm"
                    onLaunch={() => onLaunchSession(session)}
                  />
                ) : (
                  <LaunchSessionButton
                    sessionType={session.type}
                    teamId={selectedTeamId || 'a-team'}
                    teamName={session.team}
                    sessionCategory={t(`physicalTrainer:training.sessionTypes.${session.type}`)}
                    size="sm"
                    variant="outline"
                    onLaunch={() => onLaunchSession(session)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
});

export default TodaysSessions;