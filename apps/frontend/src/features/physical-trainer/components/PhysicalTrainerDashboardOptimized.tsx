'use client';

import React, { useEffect, useState, lazy, Suspense, useCallback, useMemo } from 'react';
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
import { NotificationCenter } from "@/features/notifications/components/NotificationCenter";
import { TeamSelector } from './TeamSelector';
import { OfflineIndicator } from './shared/OfflineIndicator';
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useLazyPhysicalTrainerData } from '../hooks/useLazyPhysicalTrainerData';
import { useGetTeamsQuery } from '@/store/api/userApi';

// Lazy load ALL tabs - no exceptions
const tabComponents = {
  overview: lazy(() => import('./tabs/OverviewTab')),
  calendar: lazy(() => import('./tabs/CalendarTab')),
  sessions: lazy(() => import('./tabs/SessionsTab')),
  library: lazy(() => import('./tabs/ExerciseLibraryTab')),
  testing: lazy(() => import('./tabs/TestingTab')),
  status: lazy(() => import('./tabs/PlayerStatusTab')),
  templates: lazy(() => import('./tabs/TemplatesTab')),
  medical: lazy(() => import('./tabs/MedicalAnalyticsTab').then(m => ({ default: m.MedicalAnalyticsTab }))),
  analytics: lazy(() => import('./tabs/PredictiveAnalyticsTab').then(m => ({ default: m.PredictiveAnalyticsTab }))),
  'ai-optimization': lazy(() => import('./tabs/AIOptimizationTab').then(m => ({ default: m.AIOptimizationTab })))
};

// Lazy load session components
const SessionBriefingView = lazy(() => import('./SessionBriefingView'));
const CreateSessionModal = lazy(() => import('./CreateSessionModal'));
const HelpModal = lazy(() => import('./shared/HelpModal').then(m => ({ default: m.HelpModal })));
const SettingsModal = lazy(() => import('./shared/SettingsModal').then(m => ({ default: m.SettingsModal })));

// Loading component for tabs
const TabLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" />
  </div>
);

// Tab configuration for better performance
const TAB_CONFIG = [
  { value: 'overview', icon: Activity, labelKey: 'tabs.overview' },
  { value: 'calendar', icon: Calendar, labelKey: 'tabs.calendar' },
  { value: 'sessions', icon: Dumbbell, labelKey: 'tabs.sessions' },
  { value: 'library', icon: Library, labelKey: 'tabs.exercises' },
  { value: 'testing', icon: TestTube2, labelKey: 'tabs.testing' },
  { value: 'status', icon: User, labelKey: 'tabs.players' },
  { value: 'templates', icon: FileText, labelKey: 'tabs.templates' },
  { value: 'medical', icon: Heart, label: 'Medical' },
  { value: 'analytics', icon: Brain, label: 'Analytics' },
  { value: 'ai-optimization', icon: Zap, label: 'AI' }
];

export default function PhysicalTrainerDashboardOptimized() {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  
  // State management
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('physicalTrainer_selectedTeamId') || 'all';
    }
    return 'all';
  });
  
  // Modal states
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Auto-login for mock mode
  useEffect(() => {
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    if (isMockMode && !authLoading && !isAuthenticated && !user) {
      login('trainer@hockeyhub.com', 'mock123', false).catch(console.error);
    }
  }, [isAuthenticated, authLoading, user, login]);
  
  // Use hooks with memoization
  const {
    setActiveTab: setLazyActiveTab,
    setSelectedTeamId: setLazySelectedTeamId,
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
  } = useLazyPhysicalTrainerData();
  
  // Sync state with lazy hook (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLazyActiveTab(activeTab);
    }, 100);
    return () => clearTimeout(timeout);
  }, [activeTab, setLazyActiveTab]);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (selectedTeamId) {
        setLazySelectedTeamId(selectedTeamId);
        localStorage.setItem('physicalTrainer_selectedTeamId', selectedTeamId);
      }
    }, 100);
    return () => clearTimeout(timeout);
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
  
  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading } = useGetTeamsQuery();
  
  // Handle tab change with URL update
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url);
  }, []);
  
  // Memoize tab content
  const tabContent = useMemo(() => {
    const TabComponent = tabComponents[activeTab as keyof typeof tabComponents];
    if (!TabComponent) return null;
    
    const props = {
      players,
      testBatches,
      testResults,
      todaysSessions,
      playerReadiness,
      onNavigateToPlayerStatus: navigateToPlayerStatus,
      onNavigateToCalendar: navigateToCalendar,
      onApplyTemplate: handleApplyTemplate,
      onTestSubmit: handleTestSubmit,
      onTestSaveDraft: handleTestSaveDraft,
      selectedTeamId
    };
    
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <TabComponent {...props} />
      </Suspense>
    );
  }, [
    activeTab, players, testBatches, testResults, todaysSessions, 
    playerReadiness, selectedTeamId, navigateToPlayerStatus, 
    navigateToCalendar, handleApplyTemplate, handleTestSubmit, handleTestSaveDraft
  ]);
  
  // Session viewer
  if (showSessionViewer && currentSession) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b px-4 py-3 flex items-center justify-between bg-background">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={closeSessionViewer}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common:navigation.backToDashboard')}
            </Button>
            <div className="text-sm text-muted-foreground">
              {currentSession.type} • {currentSession.team}
            </div>
          </div>
          <OfflineIndicator />
        </div>
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading session..." />}>
            <SessionBriefingView 
              session={currentSession.fullSessionData || {
                id: currentSession.teamId || '1',
                team: currentSession.team || '',
                type: currentSession.type || 'strength',
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
  }
  
  // Loading states
  if (authLoading || isLoading) {
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
  
  // Error state
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
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive">{t('common:errors.loadingError')}</p>
              <p className="text-sm text-muted-foreground mt-2">{t('common:errors.tryRefresh')}</p>
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8">
              <Search className="h-5 w-5" />
            </Button>
            <NotificationCenter userId={user?.id || ''} organizationId={user?.organizationId} />
            <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)} className="h-8 w-8">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="h-8 w-8">
              <Settings className="h-5 w-5" />
            </Button>
            <OfflineIndicator />
          </div>
        }
      />
      
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-4">
          <TeamSelector
            teams={teams}
            selectedTeamId={selectedTeamId}
            onTeamChange={setSelectedTeamId}
            loading={teamsLoading}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full">
            {TAB_CONFIG.map(({ value, icon: Icon, labelKey, label }) => (
              <TabsTrigger key={value} value={value} className="flex items-center gap-1 text-xs">
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">
                  {labelKey ? t(`physicalTrainer:${labelKey}`) : label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {tabContent}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Lazy loaded modals */}
      {showCreateModal && (
        <Suspense fallback={null}>
          <CreateSessionModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={() => setShowCreateModal(false)}
          />
        </Suspense>
      )}
      
      {showHelp && (
        <Suspense fallback={null}>
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </Suspense>
      )}
      
      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </Suspense>
      )}
    </div>
  );
}