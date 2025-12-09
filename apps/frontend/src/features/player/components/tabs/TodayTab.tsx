"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  MessageCircle,
  Dumbbell,
  Clock,
  MapPin,
  Activity,
  Target,
  Heart,
  TrendingUp,
  ChevronRight,
  Play,
} from "lucide-react";
import { 
  getEventTypeColor, 
  spacing,
  grids,
  shadows,
  a11y 
} from "@/lib/design-utils";
import type { UsePlayerDashboardReturn } from '../../hooks/usePlayerDashboard';

interface TodayTabProps {
  dashboard: UsePlayerDashboardReturn;
}

export function TodayTab({ dashboard }: TodayTabProps) {
  const {
    t,
    isLoading,
    schedule,
    upcoming,
    readiness,
    workoutsData,
    launchInterval,
    setTab,
  } = dashboard;

  // Scroll to wellness form
  const scrollToWellnessForm = () => {
    setTab('wellness');
    setTimeout(() => {
      const wellnessFormElement = document.getElementById('wellness-form');
      if (wellnessFormElement) {
        wellnessFormElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className={grids.dashboard}>
      {/* Today's Schedule */}
      <Card className={shadows.card}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" aria-hidden="true" />
            {t('player:dashboard.todaySchedule')}
          </CardTitle>
          <CardDescription>Monday, May 19, 2025</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={spacing.card} role="list" aria-label="Today's events">
            {isLoading ? (
              <div className="py-8 text-center" role="status" aria-live="polite">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <span className={a11y.srOnly}>Loading schedule...</span>
              </div>
            ) : (
              schedule.map((event, index) => (
                <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0" role="listitem">
                  <div className={`p-2 rounded-md ${getEventTypeColor(event.type || '')}`}>
                    {event.type === 'meeting' ? (
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    ) : event.type === 'ice-training' ? (
                      <Activity className="h-4 w-4" aria-hidden="true" />
                    ) : event.type === 'physical-training' ? (
                      <Dumbbell className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Clock className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <p className="font-medium text-sm">{event.title}</p>
                      <div className="flex items-center gap-2">
                        {event.mandatory && (
                          <Badge variant="destructive" className="text-xs">{t('common:labels.required')}</Badge>
                        )}
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {event.time}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {event.location}
                    </p>
                    {event.notes && (
                      <p className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded break-words">
                        <span className={a11y.srOnly}>Note: </span>
                        {event.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Workouts */}
      <Card className={shadows.card}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" aria-hidden="true" />
            {t('player:training.todaysWorkout')}
          </CardTitle>
          <CardDescription>{t('player:training.assigned')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={spacing.card} role="list" aria-label="Today's workouts">
            {workoutsData?.data && workoutsData.data.length > 0 ? (
              workoutsData.data.map((workout) => (
                <div key={workout.id} className="flex items-start space-x-4 border-b pb-3 last:border-0" role="listitem">
                  <div className="p-2 rounded-md bg-orange-100 text-orange-600">
                    <Dumbbell className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div>
                        <p className="font-medium text-sm">{workout.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {workout.type} • {workout.estimatedDuration} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {workout.status}
                        </Badge>
                      </div>
                    </div>
                    {workout.type === 'interval' && (
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => launchInterval(workout)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Interval
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No workouts scheduled for today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className={shadows.card}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" aria-hidden="true" />
            {t('player:dashboard.upcoming')}
          </CardTitle>
          <CardDescription>{t('player:dashboard.nextEvents')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={spacing.card} role="list" aria-label="Upcoming events">
            {upcoming.map((event, index) => (
              <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0" role="listitem">
                <div className={`p-2 rounded-md ${getEventTypeColor(event.type || '')}`}>
                  {event.type === 'ice-training' ? (
                    <Activity className="h-4 w-4" aria-hidden="true" />
                  ) : event.type === 'physical-training' ? (
                    <Dumbbell className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.date} at {event.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.importance}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {event.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Readiness Quick View */}
      <Card className={shadows.card}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" aria-hidden="true" />
            {t('player:wellness.title')}
          </CardTitle>
          <CardDescription>{t('player:wellness.recentTrends')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {readiness.map((day, index) => (
                <div key={index} className="text-center p-2 rounded-md bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold tabular-nums ${
                    day.readinessScore >= 85 ? 'text-green-600' :
                    day.readinessScore >= 70 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {day.readinessScore}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  +5% vs last week
                </span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={scrollToWellnessForm}
            >
              Update Wellness
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TodayTab;



