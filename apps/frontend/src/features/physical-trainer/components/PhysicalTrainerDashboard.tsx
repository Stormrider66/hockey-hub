'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, Calendar, Dumbbell, Library, TestTube2, User, FileText,
  ArrowLeft, AlertCircle, Database, Brain, Heart, Zap, HelpCircle, Settings, Bell, Search
} from '@/components/icons';
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading";

// Import NotificationCenter directly (it's small enough)
import { NotificationCenter } from "@/features/notifications/components/NotificationCenter";

// Lazy load all tabs to improve initial load performance
const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const CalendarTab = lazy(() => import('./tabs/CalendarTab'));
const SessionsTab = lazy(() => import('./tabs/SessionsTab'));
const ExerciseLibraryTab = lazy(() => import('./tabs/ExerciseLibraryTab'));
const TestingTab = lazy(() => import('./tabs/TestingTab'));
const PlayerStatusTab = lazy(() => import('./tabs/PlayerStatusTab'));
const TemplatesTab = lazy(() => import('./tabs/TemplatesTab'));

// Lazy load only the heavy analytics tabs
const MedicalAnalyticsTab = lazy(() => import('./tabs/MedicalAnalyticsTab').then(m => ({ default: m.MedicalAnalyticsTab })));
const PredictiveAnalyticsTab = lazy(() => import('./tabs/PredictiveAnalyticsTab').then(m => ({ default: m.PredictiveAnalyticsTab })));
const AnalyticsTabEnhanced = lazy(() => import('./tabs/AnalyticsTabEnhanced').then(m => ({ default: m.AnalyticsTabEnhanced })));
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

export default function PhysicalTrainerDashboard() {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  
  // Initialize states with safe defaults (SSR-compatible)
  const [activeTab, setActiveTab] = useState('overview');
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
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
  
  // Initialize from URL after mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get tab from URL
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, []); // Run only once on mount
  
  // Handle URL-based tab navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
    selectedTeamId: lazySelectedTeamId,
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
  } = useSessionManagement(lazySelectedTeamId);
  
  // Fetch available teams
  const { data: teamsData, isLoading: teamsLoading } = useGetTeamsQuery();
  const teams = teamsData?.data || [];
  
  // SINGLE RETURN WITH CONDITIONAL RENDERING
  // This ensures all hooks are called consistently
  
  let content;
  
  if (authLoading) {
    content = (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Checking authentication..." />
      </div>
    );
  } else if (isLoading) {
    content = (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title={t('common:roles.physicalTrainer')}
          subtitle={t('physicalTrainer:dashboard.subtitle')}
        />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <LoadingSpinner size="xl" text="Loading dashboard data..." />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } else if (error) {
    content = (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title={t('common:roles.physicalTrainer')}
          subtitle={t('physicalTrainer:dashboard.subtitle')}
        />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Error Loading Dashboard</h3>
                  <p className="text-sm text-gray-500 mt-2">Unable to load dashboard data. Please try refreshing the page.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } else if (showSessionViewer) {
    content = (
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
    );
  } else {
    // Main dashboard content
    content = (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title={t('physicalTrainer:dashboard.title')}
          subtitle={t('physicalTrainer:dashboard.subtitle')}
          role="physicaltrainer"
          rightContent={
            <div className="flex items-center gap-2">
              <TeamSelector
                selectedTeamId={lazySelectedTeamId}
                onTeamChange={setLazySelectedTeamId}
                teams={teams}
                loading={teamsLoading}
              />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowHelp(true)}
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <NotificationCenter />
              <OfflineIndicator />
            </div>
          }
        />
        
        <div className="p-6 max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-10 gap-2 h-auto">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden md:inline">{t('tabs.overview')}</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden md:inline">{t('tabs.calendar')}</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                <span className="hidden md:inline">{t('tabs.sessions')}</span>
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                <span className="hidden md:inline">{t('tabs.exercises')}</span>
              </TabsTrigger>
              <TabsTrigger value="testing" className="flex items-center gap-2">
                <TestTube2 className="h-4 w-4" />
                <span className="hidden md:inline">{t('tabs.testing')}</span>
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{t('tabs.players')}</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">{t('tabs.templates')}</span>
              </TabsTrigger>
              <TabsTrigger value="medical" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden md:inline">{t('tabs.medical')}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden md:inline">{t('dashboard.tabs.analytics')}</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline">{t('dashboard.tabs.ai')}</span>
              </TabsTrigger>
            </TabsList>

            <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." />}>
              <TabsContent value="overview">
                <OverviewTab
                  selectedTeamId={lazySelectedTeamId}
                  todaysSessions={todaysSessions}
                  playerReadiness={playerReadiness}
                  players={players}
                  onCreateSession={() => setShowCreateModal(true)}
                  onLaunchSession={launchSession}
                  onViewAllPlayers={() => setActiveTab('status')}
                />
              </TabsContent>
              
              <TabsContent value="calendar">
                <CalendarTab
                  players={players}
                  todaysSessions={todaysSessions}
                  onLaunchSession={launchSession}
                />
              </TabsContent>
              
              <TabsContent value="sessions">
                <SessionsTab 
                  selectedTeamId={lazySelectedTeamId}
                  onCreateSession={() => setShowCreateModal(true)}
                  onNavigateToCalendar={() => setActiveTab('calendar')}
                />
              </TabsContent>
              
              <TabsContent value="library">
                <ExerciseLibraryTab />
              </TabsContent>
              
              <TabsContent value="testing">
                <TestingTab
                  testBatches={testBatches}
                  testResults={testResults}
                  players={players}
                  onSubmit={handleTestSubmit}
                  onSaveDraft={handleTestSaveDraft}
                />
              </TabsContent>
              
              <TabsContent value="status">
                <PlayerStatusTab
                  players={players}
                  playerReadiness={playerReadiness}
                />
              </TabsContent>
              
              <TabsContent value="templates">
                <TemplatesTab
                  onApplyTemplate={handleApplyTemplate}
                />
              </TabsContent>
              
              <TabsContent value="analytics">
                <AnalyticsTabEnhanced />
              </TabsContent>
              
              <TabsContent value="medical">
                <MedicalAnalyticsTab />
              </TabsContent>
              
              <TabsContent value="ai">
                <AIOptimizationTab />
              </TabsContent>
            </Suspense>
          </Tabs>
        </div>

        {/* Modals */}
        <Suspense fallback={null}>
          {showCreateModal && (
            <CreateSessionModal
              open={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              players={players}
            />
          )}
          {showHelp && (
            <HelpModal
              open={showHelp}
              onClose={() => setShowHelp(false)}
            />
          )}
          {showSettings && (
            <SettingsModal
              open={showSettings}
              onClose={() => setShowSettings(false)}
            />
          )}
        </Suspense>
      </div>
    );
  }
  
  return content;
}