'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, Calendar, Dumbbell, Library, TestTube2, User, FileText,
  ArrowLeft, AlertCircle, Brain, Heart, Zap, HelpCircle, Settings, Search
} from '@/components/icons';
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading";

// Import performance monitoring
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { PerformanceMonitorWrapper } from './shared/PerformanceMonitorWrapper';
import { PerformanceDashboard, usePerformanceDashboard } from './shared/PerformanceDashboard';
import { FeatureFlagDashboard, useFeatureFlagDashboard } from './shared/FeatureFlagDashboard';
import { FontOptimization } from './shared/FontOptimization';
import { ImportOptimization } from './shared/ImportOptimization';
import { OptimizationMonitor } from './shared/OptimizationMonitor';

// Import NotificationCenter directly (it's small enough)
import { NotificationCenter } from "@/features/notifications/components/NotificationCenter";

// Lazy load all tabs to improve initial load performance
const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const CalendarTab = lazy(() => import('./tabs/CalendarTab'));
const SessionsTab = lazy(() => import('./tabs/SessionsTabWrapper'));
const ExerciseLibraryTab = lazy(() => import('./tabs/ExerciseLibraryTab'));
const TestingTab = lazy(() => import('./tabs/TestingTab'));
const PlayerStatusTab = lazy(() => import('./tabs/PlayerStatusTab'));
const TemplatesTab = lazy(() => import('./tabs/TemplatesTab'));

// Lazy load only the heavy analytics tabs
const MedicalAnalyticsTab = lazy(() => import('./tabs/MedicalAnalyticsTab').then(m => ({ default: m.MedicalAnalyticsTab })));
const PredictiveAnalyticsTab = lazy(() => import('./tabs/PredictiveAnalyticsTab').then(m => ({ default: m.PredictiveAnalyticsTab })));
const AIOptimizationTab = lazy(() => import('./tabs/AIOptimizationTab').then(m => ({ default: m.AIOptimizationTab })));

// Import components needed for session viewer
const TrainingSessionViewer = lazy(() => import('./TrainingSessionViewer'));
const SessionBriefingView = lazy(() => import('./SessionBriefingView'));
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

export default function PhysicalTrainerDashboardMonitored() {
  // Add performance monitoring for the main dashboard
  usePerformanceMonitor({
    componentName: 'PhysicalTrainerDashboard',
    metadata: { version: 'monitored' },
    logToConsole: true // Enable for debugging
  });

  // Performance dashboard state (hidden by default)
  const { showDashboard, setShowDashboard } = usePerformanceDashboard(
    process.env.NODE_ENV === 'development'
  );

  // Feature flag dashboard state
  const { showDashboard: showFeatureFlags } = useFeatureFlagDashboard(true); // Always enabled for monitored dashboard

  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  
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
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL for tab parameter
    const tabParam = searchParams.get('tab');
    return tabParam || 'overview';
  });
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
  
  // Handle URL-based tab navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && tabParam !== activeTab) {
        setActiveTab(tabParam);
      }
    };
    
    // Check on mount and when URL changes
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [activeTab]);
  
  const {
    activeTab: _activeTab, // Not using this, we have our own state
    setActiveTab: setLazyActiveTab,
    selectedTeamId: _selectedTeamId,
    setSelectedTeamId: setLazySelectedTeamId,
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
  
  // Sync activeTab with lazy hook
  useEffect(() => {
    setLazyActiveTab(activeTab);
  }, [activeTab, setLazyActiveTab]);
  
  // Sync selectedTeamId with lazy hook
  useEffect(() => {
    if (selectedTeamId) {
      setLazySelectedTeamId(selectedTeamId);
    }
  }, [selectedTeamId, setLazySelectedTeamId]);
  
  const {
    todaysSessions,
    showSessionViewer,
    currentSession,
    showCreateModal,
    setShowCreateModal,
    launchSession,
    closeSessionViewer,
    getSessionIntervals,
    getHybridBlocks,
    getAgilitySession
  } = useSessionManagement(selectedTeamId);
  
  // Fetch available teams
  const { data: teams = [], isLoading: teamsLoading } = useGetTeamsQuery();
  
  // Modal states
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // If showing session viewer, render it instead of the dashboard
  if (showSessionViewer) {
    return (
      <PerformanceMonitorWrapper componentName="SessionViewer">
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
                {t('sessions.viewer.title')}
              </div>
              <OfflineIndicator />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading session briefing..." />}>
              <SessionBriefingView 
                session={currentSession?.fullSessionData || {
                  id: currentSession?.teamId || '1',
                  team: currentSession?.team || '',
                  type: currentSession?.type || 'strength',
                  time: '09:00',
                  location: 'gym',
                  players: 20,
                  status: 'active' as const,
                  intensity: 'medium' as const,
                  description: ''
                }}
                players={players}
                onBack={closeSessionViewer}
              />
            </Suspense>
          </div>
        </div>
      </PerformanceMonitorWrapper>
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
          rightContent={
            <div className="flex items-center gap-2">
              <OfflineIndicator />
            </div>
          }
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
          rightContent={
            <div className="flex items-center gap-2">
              <OfflineIndicator />
            </div>
          }
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
      {/* Performance optimizations */}
      <FontOptimization />
      <ImportOptimization />
      <OptimizationMonitor />
      
      <DashboardHeader 
        title={t('physicalTrainer:dashboard.title')}
        subtitle={t('physicalTrainer:dashboard.subtitle')}
        role="physicaltrainer"
        rightContent={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8"
            >
              <Search className="h-5 w-5" />
            </Button>
            <NotificationCenter 
              userId={user?.id || ''} 
              organizationId={user?.organizationId}
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
          <PerformanceMonitorWrapper componentName="TeamSelector">
            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              onTeamChange={setSelectedTeamId}
              loading={teamsLoading}
            />
          </PerformanceMonitorWrapper>
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
              AI
            </TabsTrigger>
          </TabsList>

          {/* Wrap each tab content with performance monitor */}
          <TabsContent value="overview">
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <PerformanceMonitorWrapper componentName="OverviewTab">
                <OverviewTab
                  selectedTeamId={selectedTeamId}
                  todaysSessions={todaysSessions}
                  playerReadiness={playerReadiness}
                  players={players}
                  onCreateSession={() => setShowCreateModal(true)}
                  onLaunchSession={launchSession}
                  onViewAllPlayers={navigateToPlayerStatus}
                />
              </PerformanceMonitorWrapper>
            </Suspense>
          </TabsContent>

          <TabsContent value="calendar">
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <PerformanceMonitorWrapper componentName="CalendarTab">
                <CalendarTab
                  selectedTeamId={selectedTeamId}
                />
              </PerformanceMonitorWrapper>
            </Suspense>
          </TabsContent>

          <TabsContent value="sessions">
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <PerformanceMonitorWrapper componentName="SessionsTab">
                <SessionsTab
                  selectedTeamId={selectedTeamId}
                  players={players}
                />
              </PerformanceMonitorWrapper>
            </Suspense>
          </TabsContent>

          <TabsContent value="library">
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <PerformanceMonitorWrapper componentName="ExerciseLibraryTab">
                <ExerciseLibraryTab />
              </PerformanceMonitorWrapper>
            </Suspense>
          </TabsContent>

          <TabsContent value="testing">
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <PerformanceMonitorWrapper componentName="TestingTab">
                <TestingTab
                  testBatches={testBatches}
                  testResults={testResults}
                  players={players}
                  onSubmit={handleTestSubmit}
                  onSaveDraft={handleTestSaveDraft}
                />
              </PerformanceMonitorWrapper>
            </Suspense>
          </TabsContent>

          <TabsContent value="status">
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <PerformanceMonitorWrapper componentName="PlayerStatusTab">
                <PlayerStatusTab
                  players={players}
                  playerReadiness={playerReadiness}
                />
              </PerformanceMonitorWrapper>
            </Suspense>
          </TabsContent>

          <TabsContent value="templates">
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <PerformanceMonitorWrapper componentName="TemplatesTab">
                <TemplatesTab
                  onApplyTemplate={handleApplyTemplate}
                />
              </PerformanceMonitorWrapper>
            </Suspense>
          </TabsContent>

          <TabsContent value="medical">
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <PerformanceMonitorWrapper componentName="MedicalAnalyticsTab">
                <MedicalAnalyticsTab />
              </PerformanceMonitorWrapper>
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics">
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <PerformanceMonitorWrapper componentName="PredictiveAnalyticsTab">
                <PredictiveAnalyticsTab />
              </PerformanceMonitorWrapper>
            </Suspense>
          </TabsContent>

          <TabsContent value="ai-optimization">
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <PerformanceMonitorWrapper componentName="AIOptimizationTab">
                <AIOptimizationTab />
              </PerformanceMonitorWrapper>
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <Suspense fallback={null}>
          <CreateSessionModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={() => {
              setShowCreateModal(false);
              // Refresh sessions if needed
            }}
          />
        </Suspense>
      )}

      {showHelp && (
        <Suspense fallback={null}>
          <HelpModal
            isOpen={showHelp}
            onClose={() => setShowHelp(false)}
          />
        </Suspense>
      )}

      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </Suspense>
      )}

      {/* Performance Dashboard (Ctrl+Shift+P to toggle) */}
      {showDashboard && <PerformanceDashboard />}
      
      {/* Feature Flag Dashboard (Ctrl+Shift+F to toggle) */}
      {showFeatureFlags && <FeatureFlagDashboard />}
    </div>
  );
}