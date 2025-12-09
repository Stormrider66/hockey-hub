'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, Calendar, Dumbbell, Library, TestTube2, User, FileText,
  ArrowLeft, AlertCircle, Brain, Heart, Zap, HelpCircle, Settings, Search,
  Keyboard, Bell
} from '@/components/icons';
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading";
import { useFeatureFlag } from '../utils/featureFlags';
import { ProgressiveTab, TAB_PRIORITIES } from './shared/ProgressiveTabLoader';

// Import deferred initialization hook
import { useDeferredInitializations, DEFERRED_SYSTEMS } from '../hooks/useDeferredInitialization';

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

// Lazy load all tabs
const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const CalendarTab = lazy(() => import('./tabs/CalendarTab'));
const SessionsTab = lazy(() => import('./tabs/SessionsTabWrapper'));
const ExerciseLibraryTab = lazy(() => import('./tabs/ExerciseLibraryTab'));
const TestingTab = lazy(() => import('./tabs/TestingTab'));
const PlayerStatusTab = lazy(() => import('./tabs/PlayerStatusTab'));
const TemplatesTab = lazy(() => import('./tabs/TemplatesTab'));
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

// Deferred components
const KeyboardShortcuts = lazy(() => import('./shared/KeyboardShortcuts').then(m => ({ default: m.KeyboardShortcuts })));
const FloatingActionButton = lazy(() => import('./shared/FloatingActionButton').then(m => ({ default: m.FloatingActionButton })));
const TourGuide = lazy(() => import('./shared/TourGuide').then(m => ({ default: m.TourGuide })));

// Tab loading component
const TabLoadingFallback = () => (
  <div className="flex items-center justify-center h-96">
    <LoadingSpinner size="lg" />
  </div>
);

export default function PhysicalTrainerDashboardDeferred() {
  const { t } = useTranslation('physicalTrainer');
  const { user } = useAuth();
  const isDeferEnabled = useFeatureFlag('DEFER_INITIALIZATION');
  
  // Track performance
  const startTime = usePerformanceMonitor('PhysicalTrainerDashboardDeferred');
  
  // Deferred initialization system
  const { deferInit, isSystemInitialized } = useDeferredInitializations();
  
  // Performance dashboard state
  const { showDashboard: showPerformanceDashboard } = usePerformanceDashboard(
    process.env.NODE_ENV === 'development'
  );
  const { showDashboard: showFeatureFlagDashboard } = useFeatureFlagDashboard(true);
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  // Use lazy loading for data
  const {
    todaysSessions,
    playerReadiness,
    players,
    isLoading,
    error,
    navigateToPlayerStatus,
    navigateToCalendar
  } = useLazyPhysicalTrainerData();
  
  const {
    showSessionViewer,
    currentSession,
    showCreateModal,
    setShowCreateModal,
    launchSession,
    closeSessionViewer
  } = useSessionManagement();
  
  const { data: teams = [], isLoading: teamsLoading } = useGetTeamsQuery();
  
  // Modal states
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize non-critical systems with deferred loading
  useEffect(() => {
    // High priority - keyboard shortcuts (users expect these quickly)
    deferInit(
      DEFERRED_SYSTEMS.KEYBOARD_SHORTCUTS,
      () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Initializing keyboard shortcuts...');
        }
        // Keyboard shortcut initialization will happen when component loads
      },
      { priority: 'high' }
    );

    // Normal priority - analytics, help system
    deferInit(
      DEFERRED_SYSTEMS.ANALYTICS,
      () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Initializing analytics...');
        }
        // Analytics initialization
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'page_view', {
            page_title: 'Physical Trainer Dashboard',
            page_path: '/physicaltrainer',
          });
        }
      },
      { priority: 'normal' }
    );

    deferInit(
      DEFERRED_SYSTEMS.HELP_SYSTEM,
      () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Initializing help system...');
        }
        // Help system initialization
      },
      { priority: 'normal' }
    );

    // Low priority - tooltips, tour
    deferInit(
      DEFERRED_SYSTEMS.TOOLTIPS,
      () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Initializing tooltips...');
        }
        // Tooltip initialization
      },
      { priority: 'low' }
    );

    deferInit(
      DEFERRED_SYSTEMS.TOUR,
      () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Initializing tour guide...');
        }
        // Tour guide initialization
      },
      { priority: 'low' }
    );
  }, [deferInit]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Track tab switch performance
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Switched to tab: ${value}`);
    }
  };

  // Loading state
  if (isLoading && !todaysSessions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error Loading Dashboard</h3>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
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
          <div className="flex items-center gap-4">
            <TeamSelector 
              selectedTeamId={selectedTeamId}
              onTeamChange={setSelectedTeamId}
              teams={teams}
              isLoading={teamsLoading}
            />
            <NotificationCenter userId={user?.id || ''} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              className="hidden md:flex"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="hidden md:flex"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-7 xl:grid-cols-10 w-full gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden lg:inline">{t('dashboard.tabs.overview')}</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">{t('dashboard.tabs.calendar')}</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              <span className="hidden lg:inline">{t('dashboard.tabs.sessions')}</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              <span className="hidden lg:inline">{t('dashboard.tabs.library')}</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube2 className="h-4 w-4" />
              <span className="hidden lg:inline">{t('dashboard.tabs.testing')}</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden lg:inline">{t('dashboard.tabs.status')}</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden lg:inline">{t('dashboard.tabs.templates')}</span>
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden lg:inline">{t('dashboard.tabs.medical')}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden lg:inline">{t('dashboard.tabs.analytics')}</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden lg:inline">{t('dashboard.tabs.ai')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Progressive Tab Content */}
          <TabsContent value="overview">
            <ProgressiveTab 
              tabKey="overview" 
              isActive={activeTab === 'overview'} 
              priority="high"
            >
              <Suspense fallback={<TabLoadingFallback />}>
                <PerformanceMonitorWrapper componentName="OverviewTab">
                  <OverviewTab
                    todaysSessions={todaysSessions}
                    playerReadiness={playerReadiness}
                    players={players}
                    onCreateSession={() => setShowCreateModal(true)}
                    onLaunchSession={launchSession}
                    onViewAllPlayers={navigateToPlayerStatus}
                    selectedTeamId={selectedTeamId}
                  />
                </PerformanceMonitorWrapper>
              </Suspense>
            </ProgressiveTab>
          </TabsContent>

          <TabsContent value="calendar">
            <ProgressiveTab 
              tabKey="calendar" 
              isActive={activeTab === 'calendar'} 
              priority="medium"
            >
              <Suspense fallback={<TabLoadingFallback />}>
                <PerformanceMonitorWrapper componentName="CalendarTab">
                  <CalendarTab selectedTeamId={selectedTeamId} />
                </PerformanceMonitorWrapper>
              </Suspense>
            </ProgressiveTab>
          </TabsContent>

          <TabsContent value="sessions">
            <ProgressiveTab 
              tabKey="sessions" 
              isActive={activeTab === 'sessions'} 
              priority="high"
            >
              <Suspense fallback={<TabLoadingFallback />}>
                <PerformanceMonitorWrapper componentName="SessionsTab">
                  <SessionsTab 
                    selectedTeamId={selectedTeamId}
                    onCreateSession={() => setShowCreateModal(true)}
                    onNavigateToCalendar={navigateToCalendar}
                  />
                </PerformanceMonitorWrapper>
              </Suspense>
            </ProgressiveTab>
          </TabsContent>

          {/* Other tabs with similar pattern... */}
        </Tabs>
      </div>

      {/* Deferred components */}
      {isSystemInitialized(DEFERRED_SYSTEMS.KEYBOARD_SHORTCUTS) && (
        <Suspense fallback={null}>
          <KeyboardShortcuts 
            onCreateSession={() => setShowCreateModal(true)}
            onShowHelp={() => setShowHelp(true)}
            onShowSettings={() => setShowSettings(true)}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </Suspense>
      )}

      {isSystemInitialized(DEFERRED_SYSTEMS.TOUR) && (
        <Suspense fallback={null}>
          <TourGuide />
        </Suspense>
      )}

      {/* Floating Action Button - defer to low priority */}
      {isSystemInitialized(DEFERRED_SYSTEMS.HELP_SYSTEM) && (
        <Suspense fallback={null}>
          <FloatingActionButton 
            onCreateSession={() => setShowCreateModal(true)}
          />
        </Suspense>
      )}

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

      {/* Performance Dashboards */}
      {showPerformanceDashboard && <PerformanceDashboard />}
      {showFeatureFlagDashboard && <FeatureFlagDashboard />}
      
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && isDeferEnabled && (
        <div className="fixed bottom-20 right-4 bg-gray-800 text-white p-2 rounded text-xs max-w-xs">
          <div className="font-semibold mb-1">Deferred Systems Status:</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Keyboard className="h-3 w-3" />
              <span>Keyboard: {isSystemInitialized(DEFERRED_SYSTEMS.KEYBOARD_SHORTCUTS) ? '✅' : '⏳'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-3 w-3" />
              <span>Analytics: {isSystemInitialized(DEFERRED_SYSTEMS.ANALYTICS) ? '✅' : '⏳'}</span>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-3 w-3" />
              <span>Help: {isSystemInitialized(DEFERRED_SYSTEMS.HELP_SYSTEM) ? '✅' : '⏳'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-3 w-3" />
              <span>Tour: {isSystemInitialized(DEFERRED_SYSTEMS.TOUR) ? '✅' : '⏳'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}