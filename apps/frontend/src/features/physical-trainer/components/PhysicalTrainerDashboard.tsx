'use client';

import React, { useEffect } from 'react';
import { useTranslation } from '@hockey-hub/translations';
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, Calendar, Dumbbell, Library, TestTube2, User, FileText,
  ArrowLeft, AlertCircle
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

// Import tab components
import OverviewTab from './tabs/OverviewTab';
import CalendarTab from './tabs/CalendarTab';
import SessionsTab from './tabs/SessionsTab';
import ExerciseLibraryTab from './tabs/ExerciseLibraryTab';
import TestingTab from './tabs/TestingTab';
import PlayerStatusTab from './tabs/PlayerStatusTab';
import TemplatesTab from './tabs/TemplatesTab';

// Import components needed for session viewer
import TrainingSessionViewer from './TrainingSessionViewer';
import CreateSessionModal from './CreateSessionModal';
import { TeamSelector } from './TeamSelector';

// Import custom hooks
import { useSessionManagement } from '../hooks/useSessionManagement';
import { usePhysicalTrainerData } from '../hooks/usePhysicalTrainerData';
import { useGetTeamsQuery } from '@/store/api/userApi';

export default function PhysicalTrainerDashboard() {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { user } = useAuth();
  
  // Use custom hooks - usePhysicalTrainerData must come first to define selectedTeamId
  const {
    activeTab,
    setActiveTab,
    selectedTeamId,
    setSelectedTeamId,
    players,
    testBatches,
    testResults,
    isLoading,
    error,
    playerReadiness,
    navigateToPlayerStatus,
    navigateToCalendar,
    handleApplyTemplate,
    handleTestSubmit,
    handleTestSaveDraft
  } = usePhysicalTrainerData();
  
  const {
    todaysSessions,
    sessionsLoading,
    showSessionViewer,
    currentSession,
    showCreateModal,
    setShowCreateModal,
    launchSession,
    closeSessionViewer,
    getSessionIntervals
  } = useSessionManagement(selectedTeamId);
  
  // Fetch available teams
  const { data: teams = [], isLoading: teamsLoading } = useGetTeamsQuery();

  // Check for workout ID from calendar launch
  useEffect(() => {
    const launchWorkoutId = sessionStorage.getItem('launchWorkoutId');
    if (launchWorkoutId && !showSessionViewer) {
      // Clear the stored ID and interval program
      sessionStorage.removeItem('launchWorkoutId');
      const intervalProgramStr = sessionStorage.getItem('launchIntervalProgram');
      const intervalProgram = intervalProgramStr ? JSON.parse(intervalProgramStr) : null;
      sessionStorage.removeItem('launchIntervalProgram');
      
      // Find the workout in today's sessions
      const workout = todaysSessions.find(s => s.id === launchWorkoutId);
      if (workout) {
        launchSession(workout);
      } else {
        // Create a mock workout with the interval data from calendar
        const mockWorkout = {
          id: launchWorkoutId,
          title: intervalProgram?.name || 'Training Session',
          type: 'Interval Training' as const,
          team: selectedTeamId || 'Team',
          players: [],
          time: new Date().toISOString(),
          location: 'Training Center',
          estimatedDuration: intervalProgram?.totalDuration ? Math.round(intervalProgram.totalDuration / 60) : 60,
          intervalProgram: intervalProgram || {
            id: launchWorkoutId,
            name: 'Training Session',
            totalDuration: 3600,
            intervals: [
              { duration: 300, intensity: 'Warm-up', targetBPM: 120 },
              { duration: 30, intensity: 'Sprint', targetBPM: 180 },
              { duration: 90, intensity: 'Recovery', targetBPM: 140 }
            ]
          }
        };
        launchSession(mockWorkout);
      }
    }
  }, [todaysSessions, showSessionViewer, launchSession, selectedTeamId]);

  // If showing session viewer, render it instead of the dashboard
  if (showSessionViewer) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b px-4 py-3 flex items-center justify-between bg-background">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeSessionViewer}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common:navigation.backToDashboard')}
            </Button>
            {currentSession && (
              <div className="text-sm text-muted-foreground">
                {currentSession.type} • {currentSession.team}
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {t('physicalTrainer:sessions.viewer.title')}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <TrainingSessionViewer 
            sessionType={currentSession?.type}
            teamName={currentSession?.team}
            initialIntervals={getSessionIntervals()}
          />
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title={t('physicalTrainer:dashboard.title')}
          subtitle={t('physicalTrainer:dashboard.subtitle')}
          role="physicaltrainer"
        />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              onTeamChange={setSelectedTeamId}
              loading={teamsLoading}
            />
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('common:loading.loadingData')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title={t('physicalTrainer:dashboard.title')}
          subtitle={t('physicalTrainer:dashboard.subtitle')}
          role="physicaltrainer"
        />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              onTeamChange={setSelectedTeamId}
              loading={teamsLoading}
            />
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{t('common:errors.loadingError')}</p>
                <p className="text-sm text-muted-foreground mt-2">{t('common:errors.tryRefresh')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Physical Training Dashboard"
        subtitle="Manage training sessions, monitor player readiness, and track performance"
        role="physicaltrainer"
      />
      <div className="p-6 max-w-7xl mx-auto">
        {/* Team Selection */}
        <div className="mb-4 flex justify-between items-center">
          <TeamSelector
            teams={teams}
            selectedTeamId={selectedTeamId}
            onTeamChange={setSelectedTeamId}
            loading={teamsLoading}
          />
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('physicalTrainer:tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('physicalTrainer:tabs.calendar')}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            {t('physicalTrainer:tabs.sessions')}
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            {t('physicalTrainer:tabs.exercises')}
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube2 className="h-4 w-4" />
            {t('physicalTrainer:tabs.testing')}
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('physicalTrainer:tabs.players')}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('physicalTrainer:tabs.templates')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            selectedTeamId={selectedTeamId}
            todaysSessions={todaysSessions}
            playerReadiness={playerReadiness}
            onCreateSession={() => setShowCreateModal(true)}
            onLaunchSession={launchSession}
            onViewAllPlayers={navigateToPlayerStatus}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CalendarTab
            organizationId={user?.organizationId || ''}
            userId={user?.id || ''}
            teamId={selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId || undefined}
          />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <SessionsTab
            selectedTeamId={selectedTeamId}
            onCreateSession={() => setShowCreateModal(true)}
            onNavigateToCalendar={navigateToCalendar}
          />
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <ExerciseLibraryTab />
        </TabsContent>

        <TabsContent value="testing" className="mt-6">
          <TestingTab
            selectedTeamId={selectedTeamId}
            players={players}
            onSubmitTest={handleTestSubmit}
            onSaveDraft={handleTestSaveDraft}
          />
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <PlayerStatusTab 
            selectedTeamId={selectedTeamId}
            playerReadiness={playerReadiness} 
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplatesTab
            onCreateSession={() => setShowCreateModal(true)}
            onApplyTemplate={handleApplyTemplate}
          />
        </TabsContent>
      </Tabs>
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateSession={(session) => {
          console.log('New session created:', session);
          // In a real app, this would call an API to save the session
          // For now, just close the modal
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}