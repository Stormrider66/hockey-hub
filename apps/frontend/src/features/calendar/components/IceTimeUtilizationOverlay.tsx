'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Snowflake, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp,
  AlertTriangle,
  Activity,
  Target
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInMinutes } from 'date-fns';
import { CalendarEvent, EventType } from '@/store/api/calendarApi';

interface IceTimeData {
  date: Date;
  totalMinutes: number;
  utilization: number; // 0-100%
  sessions: {
    practice: number;
    game: number;
    skills: number;
    goalie: number;
  };
  zones: {
    full: number;
    halfIce: number;
    thirds: number;
  };
  cost: number;
  teams: string[];
}

interface IceTimeUtilizationOverlayProps {
  events: CalendarEvent[];
  currentDate: Date;
  view: 'month' | 'week' | 'day';
  rinkHoursPerDay?: number; // Total available ice hours
  costPerHour?: number;
}

export const IceTimeUtilizationOverlay: React.FC<IceTimeUtilizationOverlayProps> = ({
  events,
  currentDate,
  view,
  rinkHoursPerDay = 16, // 6 AM to 10 PM typical
  costPerHour = 250,
}) => {
  const iceTimeData = useMemo(() => {
    // Filter only ice-related events
    const iceEvents = events.filter(
      event => event.type === EventType.TRAINING || 
              event.type === EventType.GAME ||
              event.metadata?.location?.includes('rink') ||
              event.metadata?.location?.includes('ice')
    );

    const startDate = view === 'month' 
      ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      : startOfWeek(currentDate);
    
    const endDate = view === 'month'
      ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      : endOfWeek(currentDate);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map(day => {
      const dayEvents = iceEvents.filter(event => 
        isSameDay(new Date(event.startTime), day)
      );

      let totalMinutes = 0;
      const sessions = { practice: 0, game: 0, skills: 0, goalie: 0 };
      const zones = { full: 0, halfIce: 0, thirds: 0 };
      const teams = new Set<string>();

      dayEvents.forEach(event => {
        const duration = differenceInMinutes(new Date(event.endTime), new Date(event.startTime));
        totalMinutes += duration;

        // Categorize sessions
        if (event.type === EventType.GAME) {
          sessions.game++;
        } else if (event.metadata?.sessionType === 'skills') {
          sessions.skills++;
        } else if (event.metadata?.sessionType === 'goalie') {
          sessions.goalie++;
        } else {
          sessions.practice++;
        }

        // Track zone usage
        const zoneUsage = event.metadata?.zoneUsage || 'full';
        if (zoneUsage === 'half') {
          zones.halfIce += duration;
        } else if (zoneUsage === 'third') {
          zones.thirds += duration;
        } else {
          zones.full += duration;
        }

        // Track teams
        event.teamIds?.forEach(teamId => teams.add(teamId));
      });

      const availableMinutes = rinkHoursPerDay * 60;
      const utilization = Math.min(100, (totalMinutes / availableMinutes) * 100);
      const cost = (totalMinutes / 60) * costPerHour;

      return {
        date: day,
        totalMinutes,
        utilization: Math.round(utilization),
        sessions,
        zones,
        cost: Math.round(cost),
        teams: Array.from(teams),
      };
    });
  }, [events, currentDate, view, rinkHoursPerDay, costPerHour]);

  const totalCost = iceTimeData.reduce((sum, day) => sum + day.cost, 0);
  const avgUtilization = iceTimeData.reduce((sum, day) => sum + day.utilization, 0) / iceTimeData.length;
  const peakUtilization = Math.max(...iceTimeData.map(d => d.utilization));

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 90) return 'text-red-500';
    if (utilization > 75) return 'text-orange-500';
    if (utilization > 50) return 'text-green-500';
    return 'text-blue-500';
  };

  if (view === 'day') {
    const todayData = iceTimeData.find(d => isSameDay(d.date, currentDate));
    if (!todayData) return null;

    return (
      <Card className="p-4 mb-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center">
              <Snowflake className="w-4 h-4 mr-2" />
              Ice Time Utilization
            </h3>
            <span className={`text-2xl font-bold ${getUtilizationColor(todayData.utilization)}`}>
              {todayData.utilization}%
            </span>
          </div>
          
          <Progress value={todayData.utilization} className="h-3" />
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Total Ice Time:</span>
              <span className="ml-1 font-medium">{Math.round(todayData.totalMinutes / 60)}h {todayData.totalMinutes % 60}m</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cost:</span>
              <span className="ml-1 font-medium">${todayData.cost}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium">Session Breakdown:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {todayData.sessions.practice > 0 && (
                <Badge variant="outline">Practice: {todayData.sessions.practice}</Badge>
              )}
              {todayData.sessions.game > 0 && (
                <Badge variant="outline">Games: {todayData.sessions.game}</Badge>
              )}
              {todayData.sessions.skills > 0 && (
                <Badge variant="outline">Skills: {todayData.sessions.skills}</Badge>
              )}
              {todayData.sessions.goalie > 0 && (
                <Badge variant="outline">Goalie: {todayData.sessions.goalie}</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Week/Month view
  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Activity className="w-3 h-3 mr-1" />
              Avg Utilization
            </div>
            <div className={`text-lg font-semibold ${getUtilizationColor(avgUtilization)}`}>
              {Math.round(avgUtilization)}%
            </div>
          </div>
          <div>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Peak Day
            </div>
            <div className={`text-lg font-semibold ${getUtilizationColor(peakUtilization)}`}>
              {peakUtilization}%
            </div>
          </div>
          <div>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3 mr-1" />
              Total Cost
            </div>
            <div className="text-lg font-semibold">
              ${totalCost.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      {peakUtilization > 90 && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-sm">
            High ice utilization detected. Consider optimizing practice schedules or booking additional ice time.
          </AlertDescription>
        </Alert>
      )}

      {view === 'week' && (
        <Card className="p-3">
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Weekly Ice Time Distribution
          </h4>
          <div className="space-y-2">
            {iceTimeData.map((data, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{format(data.date, 'EEE')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {Math.round(data.totalMinutes / 60)}h
                    </span>
                    <span className={getUtilizationColor(data.utilization)}>
                      {data.utilization}%
                    </span>
                  </div>
                </div>
                <Progress value={data.utilization} className="h-2" />
                <div className="flex gap-1">
                  {data.sessions.practice > 0 && (
                    <Badge variant="secondary" className="text-xs py-0">
                      P:{data.sessions.practice}
                    </Badge>
                  )}
                  {data.sessions.game > 0 && (
                    <Badge variant="destructive" className="text-xs py-0">
                      G:{data.sessions.game}
                    </Badge>
                  )}
                  {data.sessions.skills > 0 && (
                    <Badge variant="outline" className="text-xs py-0">
                      S:{data.sessions.skills}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-3">
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <Target className="w-4 h-4 mr-2" />
          Optimization Tips
        </h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          {avgUtilization < 50 && (
            <p>• Low utilization - consider sharing ice time with other teams</p>
          )}
          {avgUtilization > 80 && (
            <p>• High utilization - book additional ice slots in advance</p>
          )}
          <p>• Use half-ice practices for skills development to maximize efficiency</p>
        </div>
      </Card>
    </div>
  );
};

export default IceTimeUtilizationOverlay;