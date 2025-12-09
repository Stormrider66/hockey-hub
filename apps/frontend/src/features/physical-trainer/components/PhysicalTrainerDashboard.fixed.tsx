'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, Calendar, Dumbbell, Library, TestTube2, User, FileText,
  ArrowLeft, AlertCircle, Database, Brain, Heart, Zap, HelpCircle, Settings, Bell
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading";

// Import NotificationCenter directly (it's small enough)
import { NotificationCenter } from "@/features/notifications/components/NotificationCenter";

// Direct imports for core tabs (no LazyTabLoader!)
import OverviewTab from './tabs/OverviewTab';
import CalendarTab from './tabs/CalendarTab';
import SessionsTab from './tabs/SessionsTab';
import ExerciseLibraryTab from './tabs/ExerciseLibraryTab';
import TestingTab from './tabs/TestingTab';
import PlayerStatusTab from './tabs/PlayerStatusTab';
import TemplatesTab from './tabs/TemplatesTab';

// Lazy load only the heavy analytics tabs
const MedicalAnalyticsTab = lazy(() => import('./tabs/MedicalAnalyticsTab').then(m => ({ default: m.MedicalAnalyticsTab })));
const PredictiveAnalyticsTab = lazy(() => import('./tabs/PredictiveAnalyticsTab').then(m => ({ default: m.PredictiveAnalyticsTab })));
const AIOptimizationTab = lazy(() => import('./tabs/AIOptimizationTab').then(m => ({ default: m.AIOptimizationTab })));

// Import components needed for session viewer
import TrainingSessionViewer from './TrainingSessionViewer';
import { TeamSelector } from './TeamSelector';
import { OfflineIndicator } from './shared/OfflineIndicator';

// Import essential hooks only
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useLazyPhysicalTrainerData } from '../hooks/useLazyPhysicalTrainerData';
import { useGetTeamsQuery } from '@/store/api/userApi';

// Simple modals - load on demand
const CreateSessionModal = lazy(() => import('./CreateSessionModal'));
const HelpModal = lazy(() => import('./shared/HelpModal').then(m => ({ default: m.HelpModal })));
const SettingsModal = lazy(() => import('./shared/SettingsModal').then(m => ({ default: m.SettingsModal })));

export default function PhysicalTrainerDashboard() {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  
  // Auto-login for mock mode development
  useEffect(() => {
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    if (isMockMode && !authLoading && !isAuthenticated && !user) {
      console.log('🔄 Mock mode detected - auto-logging in as Physical Trainer');
      login('trainer@hockeyhub.com', 'mock123', false).catch(err => {
        console.error('❌ Mock auto-login failed:', err);
      });
    }
  }, [isAuthenticated, authLoading, user, login]);
  
  // Use simplified hooks
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    const saved = localStorage.getItem('physicalTrainer_selectedTeamId');
    return saved || 'all';
  });
  
  // Persist team selection
  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem('physicalTrainer_selectedTeamId', selectedTeamId);
    }
  }, [selectedTeamId]);
  
  const {
    activeTab: _activeTab, // Not using this, we have our own state
    setActiveTab: _setActiveTab,
    selectedTeamId: _selectedTeamId,
    setSelectedTeamId: _setSelectedTeamId,
    players,
    testBatches,
    testResults,
    isLoading,
    error,
    playerReadiness,
    todaysSessions: _todaysSessions,
    navigateToPlayerStatus,
    navigateToCalendar,
    handleApplyTemplate,
    handleTestSubmit,
    handleTestSaveDraft
  } = useLazyPhysicalTrainerData();
  
  const {
    todaysSessions,
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
  
  // Modal states
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
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
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {t('physicalTrainer:sessions.viewer.title')}
            </div>
            <OfflineIndicator />
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

  // Handle auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Checking authentication..." />
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
          <LoadingSpinner size="xl" text={t('common:loading.loadingData')} />
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
        title={t('physicalTrainer:dashboard.title')}
        subtitle={t('physicalTrainer:dashboard.subtitle')}
        role="physicaltrainer"
        rightContent={
          <div className="flex items-center gap-3">
            <NotificationCenter 
              userId={user?.id || ''} 
              organizationId={user?.organizationId}
              className="mr-2"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              className="h-8 w-8"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="h-8 w-8"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <OfflineIndicator />
          </div>
        }
      />
      <div className="p-6 max-w-7xl mx-auto">
        {/* Team Selection */}
        <div className="mb-4">
          <TeamSelector
            teams={teams}
            selectedTeamId={selectedTeamId}
            onTeamChange={setSelectedTeamId}
            loading={teamsLoading}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-10 w-full">
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
            <TabsTrigger value="medical" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Medical
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="ai-optimization" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Optimize
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {/* Core tabs - direct rendering */}
            <TabsContent value="overview">
              <OverviewTab
                selectedTeamId={selectedTeamId}
                todaysSessions={todaysSessions}
                playerReadiness={playerReadiness}
                onCreateSession={() => setShowCreateModal(true)}
                onLaunchSession={launchSession}
                onViewAllPlayers={navigateToPlayerStatus}
              />
            </TabsContent>
            
            <TabsContent value="calendar">
              <CalendarTab
                organizationId={user?.organizationId || ''}
                userId={user?.id || ''}
                teamId={selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId || undefined}
              />
            </TabsContent>
            
            <TabsContent value="sessions">
              <SessionsTab
                selectedTeamId={selectedTeamId}
                onCreateSession={() => setShowCreateModal(true)}
                onNavigateToCalendar={navigateToCalendar}
              />
            </TabsContent>
            
            <TabsContent value="library">
              <ExerciseLibraryTab />
            </TabsContent>
            
            <TabsContent value="testing">
              <TestingTab
                selectedTeamId={selectedTeamId}
                players={players}
                onSubmitTest={handleTestSubmit}
                onSaveDraft={handleTestSaveDraft}
              />
            </TabsContent>
            
            <TabsContent value="status">
              <PlayerStatusTab
                selectedTeamId={selectedTeamId}
                playerReadiness={playerReadiness}
              />
            </TabsContent>
            
            <TabsContent value="templates">
              <TemplatesTab
                onCreateSession={() => setShowCreateModal(true)}
                onApplyTemplate={handleApplyTemplate}
              />
            </TabsContent>
            
            {/* Heavy analytics tabs - lazy loaded */}
            <TabsContent value="medical">
              <Suspense fallback={<LoadingSpinner />}>
                <MedicalAnalyticsTab
                  selectedTeamId={selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId}
                  organizationId={user?.organizationId || ''}
                />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="analytics">
              <Suspense fallback={<LoadingSpinner />}>
                <PredictiveAnalyticsTab
                  selectedTeamId={selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId}
                  organizationId={user?.organizationId || ''}
                />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="ai-optimization">
              <Suspense fallback={<LoadingSpinner />}>
                <AIOptimizationTab
                  selectedTeamId={selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId}
                  organizationId={user?.organizationId || ''}
                />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Modals - lazy loaded but simpler */}
      {showCreateModal && (
        <Suspense fallback={<LoadingSpinner />}>
          <CreateSessionModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onCreateSession={(session) => {
              console.log('New session created:', session);
              setShowCreateModal(false);
            }}
          />
        </Suspense>
      )}
      
      {showHelp && (
        <Suspense fallback={<LoadingSpinner />}>
          <HelpModal
            isOpen={showHelp}
            onClose={() => setShowHelp(false)}
          />
        </Suspense>
      )}
      
      {showSettings && (
        <Suspense fallback={<LoadingSpinner />}>
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            selectedTeamId={selectedTeamId}
            teams={teams}
          />
        </Suspense>
      )}
    </div>
  );
}