"use client";

/**
 * PlayerDashboardRefactored
 * 
 * A clean, modular version of the Player Dashboard.
 * Refactored from the original 2,305-line component into composable parts.
 * 
 * Structure:
 * - types/ - TypeScript interfaces
 * - constants/ - Mock data and helper functions
 * - hooks/usePlayerDashboard.ts - State management
 * - components/tabs/ - Individual tab components
 */

import React from 'react';
import { logout } from "@/utils/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCircle, LogOut, AlertCircle } from "lucide-react";
import { spacing, a11y } from "@/lib/design-utils";
import { PlayerIntervalViewer } from './components/PlayerIntervalViewer';

// Custom hook
import { usePlayerDashboard } from './hooks/usePlayerDashboard';

// Tab components
import {
  TodayTab,
  TrainingTab,
  TacticalTab,
  WellnessTab,
  PerformanceTab,
  CalendarTab,
} from './components/tabs';

export default function PlayerDashboardRefactored() {
  const dashboard = usePlayerDashboard();
  
  const {
    t,
    router,
    tab,
    setTab,
    isLoading,
    error,
    playerInfo,
    isViewerOpen,
    selectedWorkout,
    closeViewer,
  } = dashboard;

  // Error state
  if (error) {
    return (
      <div className={`p-6 ${spacing.section}`} role="alert">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{t('common:messages.error')}. {t('common:actions.retry')}.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 ${spacing.section}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-bold">{playerInfo.number}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{playerInfo.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge>#{playerInfo.number}</Badge>
              <Badge variant="outline">{playerInfo.position}</Badge>
              <Badge variant="outline">{playerInfo.team}</Badge>
            </div>
            {playerInfo.age && (
              <p className="text-sm text-muted-foreground mt-1">
                Age {playerInfo.age} • {playerInfo.height} • {playerInfo.weight}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => router.push('/chat')}
            className={cn(a11y.focusVisible, "min-w-fit")}
          >
            <MessageCircle className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('player:communication.coachMessages')}</span>
            <span className="sm:hidden">Messages</span>
          </Button>
          <Button size="sm" variant="outline" onClick={logout} className={cn(a11y.focusVisible, "min-w-fit")}>
            <LogOut className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('common:navigation.logout')}</span>
            <span className="sm:hidden">Logout</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className={spacing.card}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6" role="tablist">
          <TabsTrigger value="today" id="today-tab" aria-controls="today-panel">
            {t('common:time.today')}
          </TabsTrigger>
          <TabsTrigger value="training" id="training-tab" aria-controls="training-panel">
            {t('player:training.title')}
          </TabsTrigger>
          <TabsTrigger value="tactical" id="tactical-tab" aria-controls="tactical-panel">
            Tactical
          </TabsTrigger>
          <TabsTrigger value="wellness" id="wellness-tab" aria-controls="wellness-panel">
            {t('player:wellness.title')}
          </TabsTrigger>
          <TabsTrigger value="performance" id="performance-tab" aria-controls="performance-panel">
            {t('player:performance.title')}
          </TabsTrigger>
          <TabsTrigger value="calendar" id="calendar-tab" aria-controls="calendar-panel">
            {t('common:navigation.calendar')}
          </TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent 
          value="today" 
          className={spacing.card} 
          role="tabpanel" 
          id="today-panel" 
          aria-labelledby="today-tab"
        >
          <TodayTab dashboard={dashboard} />
        </TabsContent>

        {/* Training Tab */}
        <TabsContent 
          value="training" 
          className={spacing.card} 
          role="tabpanel" 
          id="training-panel" 
          aria-labelledby="training-tab"
        >
          <TrainingTab dashboard={dashboard} />
        </TabsContent>

        {/* Tactical Tab */}
        <TabsContent 
          value="tactical" 
          className={spacing.card} 
          role="tabpanel" 
          id="tactical-panel" 
          aria-labelledby="tactical-tab"
        >
          <TacticalTab />
        </TabsContent>

        {/* Wellness Tab */}
        <TabsContent 
          value="wellness" 
          className={spacing.card} 
          role="tabpanel" 
          id="wellness-panel" 
          aria-labelledby="wellness-tab"
        >
          <WellnessTab dashboard={dashboard} />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent 
          value="performance" 
          className={spacing.card} 
          role="tabpanel" 
          id="performance-panel" 
          aria-labelledby="performance-tab"
        >
          <PerformanceTab />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent 
          value="calendar" 
          className="h-[calc(100vh-16rem)]" 
          role="tabpanel" 
          id="calendar-panel" 
          aria-labelledby="calendar-tab"
        >
          <CalendarTab />
        </TabsContent>
      </Tabs>

      {/* Interval Training Viewer Modal */}
      <PlayerIntervalViewer
        workout={selectedWorkout}
        isOpen={isViewerOpen}
        onClose={closeViewer}
      />
    </div>
  );
}



