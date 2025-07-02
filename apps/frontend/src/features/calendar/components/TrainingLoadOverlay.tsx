'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { CalendarEvent, EventType } from '@/store/api/calendarApi';

interface TrainingLoadData {
  date: Date;
  load: number; // 0-100
  sessions: number;
  playerCount: number;
}

interface TrainingLoadOverlayProps {
  events: CalendarEvent[];
  currentDate: Date;
  view: 'month' | 'week' | 'day';
  teamId?: string;
}

export const TrainingLoadOverlay: React.FC<TrainingLoadOverlayProps> = ({
  events,
  currentDate,
  view,
  teamId,
}) => {
  // Calculate training load for each day
  const calculateTrainingLoad = (): TrainingLoadData[] => {
    const trainingEvents = events.filter(
      event => event.type === EventType.TRAINING && 
      (!teamId || event.teamIds?.includes(teamId))
    );

    const startDate = view === 'month' 
      ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      : startOfWeek(currentDate);
    
    const endDate = view === 'month'
      ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      : endOfWeek(currentDate);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map(day => {
      const dayEvents = trainingEvents.filter(event => 
        isSameDay(new Date(event.startTime), day)
      );

      // Calculate load based on duration and intensity
      const totalMinutes = dayEvents.reduce((acc, event) => {
        const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000;
        const intensity = event.metadata?.intensity || 'medium';
        const multiplier = intensity === 'high' ? 1.5 : intensity === 'low' ? 0.7 : 1;
        return acc + (duration * multiplier);
      }, 0);

      // Normalize to 0-100 scale (assuming 180 minutes high intensity = 100%)
      const load = Math.min(100, (totalMinutes / 270) * 100);

      // Count unique players across all sessions
      const playerSet = new Set<string>();
      dayEvents.forEach(event => {
        event.metadata?.assignedPlayers?.forEach((playerId: string) => 
          playerSet.add(playerId)
        );
      });

      return {
        date: day,
        load: Math.round(load),
        sessions: dayEvents.length,
        playerCount: playerSet.size,
      };
    });
  };

  const loadData = calculateTrainingLoad();
  const averageLoad = loadData.reduce((acc, d) => acc + d.load, 0) / loadData.length;
  const peakLoad = Math.max(...loadData.map(d => d.load));

  // Get load color based on intensity
  const getLoadColor = (load: number) => {
    if (load > 80) return 'text-red-500';
    if (load > 60) return 'text-orange-500';
    if (load > 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (view === 'day') {
    // For day view, show detailed load information
    const todayLoad = loadData.find(d => isSameDay(d.date, currentDate));
    if (!todayLoad) return null;

    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Training Load
          </h3>
          <span className={`text-2xl font-bold ${getLoadColor(todayLoad.load)}`}>
            {todayLoad.load}%
          </span>
        </div>
        <Progress value={todayLoad.load} className="mb-2" />
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Sessions: {todayLoad.sessions}</div>
          <div>Players involved: {todayLoad.playerCount}</div>
        </div>
      </Card>
    );
  }

  // For month/week view, show summary
  return (
    <div className="mb-4 space-y-2">
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <div className="text-xs text-muted-foreground">Average Load</div>
              <div className={`text-lg font-semibold ${getLoadColor(averageLoad)}`}>
                {Math.round(averageLoad)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Peak Load</div>
              <div className={`text-lg font-semibold ${getLoadColor(peakLoad)}`}>
                {peakLoad}%
              </div>
            </div>
          </div>
          {peakLoad > 80 && (
            <Alert className="flex items-center p-2 max-w-xs">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <AlertDescription className="text-xs">
                High training load detected. Consider recovery sessions.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Weekly load distribution */}
      {view === 'week' && (
        <Card className="p-3">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Weekly Distribution
          </h4>
          <div className="space-y-2">
            {loadData.map((data, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="text-xs w-16">{format(data.date, 'EEE')}</div>
                <Progress value={data.load} className="flex-1 h-2" />
                <div className={`text-xs w-12 text-right ${getLoadColor(data.load)}`}>
                  {data.load}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrainingLoadOverlay;