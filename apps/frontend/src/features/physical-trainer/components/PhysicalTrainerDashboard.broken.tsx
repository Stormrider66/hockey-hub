'use client';

import React, { useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, Calendar, Dumbbell, Library, TestTube2, User, FileText,
  ArrowLeft, AlertCircle, Database, Brain, Heart, Zap, HelpCircle, Settings, Bell, Wifi
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading";
// Lazy load NotificationCenter to improve LCP
const NotificationCenter = React.lazy(() => import("@/features/notifications/components/NotificationCenter").then(module => ({ default: module.NotificationCenter })));

// Import the lazy tab loader with preloading functions
import { LazyTabLoader, preloadTab, preloadTabs } from './tabs/LazyTabLoader';

// Import components needed for session viewer
import TrainingSessionViewer from './TrainingSessionViewer';
import { TeamSelector } from './TeamSelector';
import { OfflineIndicator } from './shared/OfflineIndicator';
import { LazyModalLoader } from './modals/LazyModalLoader';

// Import custom hooks
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useLazyPhysicalTrainerData } from '../hooks/useLazyPhysicalTrainerData';
import { useRecentWorkoutsPersistence } from '../hooks/useRecentWorkoutsPersistence';
import { useGetTeamsQuery } from '@/store/api/userApi';
import { useTrainingSocket } from '../hooks/useTrainingSocket';
import { useAppDispatch } from '@/store/hooks';
import { userApi } from '@/store/api/userApi';
import { calendarApi } from '@/store/api/calendarApi';
import { trainingApi } from '@/store/api/trainingApi';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useTabCache } from '../hooks/useTabCache';
import { usePreloadDebounce } from '../hooks/usePreloadDebounce';

// Import migration test utilities
import { 
  generateTestStrengthWorkout,
  generateTestConditioningWorkout,
  generateTestHybridWorkout,
  generateTestAgilityWorkout 
} from '../utils/migrationTestUtils';

// Import non-modal global features
import { FloatingActionMenu } from './shared';

export default function PhysicalTrainerDashboard() {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  const dispatch = useAppDispatch();
  
  // Initialize persistence for recent workouts
  useRecentWorkoutsPersistence();
  
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
  
  // Strategic preloading of commonly used tabs after initial render
  useEffect(() => {
    // Preload the most commonly used tabs after a delay to avoid impacting initial load
    const timer = setTimeout(() => {
      // Preload in order of likely usage
      preloadTabs(['calendar', 'sessions', 'library']);
      
      // Preload remaining tabs after a longer delay
      setTimeout(() => {
        preloadTabs(['status', 'templates', 'testing', 'medical', 'analytics', 'ai-optimization']);
      }, 2000);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Use custom hooks - useLazyPhysicalTrainerData must come first to define selectedTeamId
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
  } = useLazyPhysicalTrainerData();
  
  // Initialize tab caching
  const { markTabAccessed, shouldCacheTab, getCacheStats } = useTabCache({
    maxCachedTabs: 5,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    priorityTabs: ['overview', 'calendar', 'sessions'] // Most frequently used tabs
  });
  
  // Initialize debounced preloading
  const { debouncedPreload } = usePreloadDebounce({ delay: 150 });
  
  // Defer WebSocket connection initialization to improve LCP
  const [socketInitialized, setSocketInitialized] = React.useState(false);
  
  React.useEffect(() => {
    // Defer socket initialization to after first paint (3s delay for better performance)
    const timer = setTimeout(() => {
      setSocketInitialized(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Initialize WebSocket connection for real-time updates (only after initial render)
  const { connectionStatus, error: socketError } = useTrainingSocket({
    autoConnect: socketInitialized,
    onMedicalStatusChange: (payload) => {
      console.log('Medical status changed:', payload);
      // Invalidate player data to refresh medical status
      dispatch(userApi.util.invalidateTags([
        { type: 'Player', id: payload.playerId },
        'MedicalReport'
      ]));
    },
    onSessionProgress: (payload) => {
      console.log('Session progress update:', payload);
      // Update session state if it's in the current view
      dispatch(trainingApi.util.invalidateTags([
        { type: 'TrainingSession', id: payload.sessionId }
      ]));
    },
    onCalendarEventChange: (payload) => {
      console.log('Calendar event changed:', payload);
      // Invalidate calendar data to refresh events
      dispatch(calendarApi.util.invalidateTags(['Event']));
      // If it's a training event, also invalidate training sessions
      if (payload.event.type === 'training') {
        dispatch(trainingApi.util.invalidateTags(['TrainingSession']));
      }
    },
    onPlayerAvailabilityChange: (payload) => {
      console.log('Player availability changed:', payload);
      // Invalidate player and calendar data
      dispatch(userApi.util.invalidateTags([
        { type: 'Player', id: payload.playerId }
      ]));
      dispatch(calendarApi.util.invalidateTags(['Event']));
    },
    onWorkoutTemplateUpdate: (payload) => {
      console.log('Workout template updated:', payload);
      // Invalidate template data
      dispatch(trainingApi.util.invalidateTags(['WorkoutTemplate']));
    },
    onTeamAssignmentChange: (payload) => {
      console.log('Team assignment changed:', payload);
      // Invalidate player and team data
      dispatch(userApi.util.invalidateTags([
        { type: 'Player', id: payload.playerId },
        'Team'
      ]));
    }
  });
  
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
  
  // Migration state
  const [showMigrationDashboard, setShowMigrationDashboard] = React.useState(false);
  const [migrationWorkouts, setMigrationWorkouts] = React.useState<any[]>([]);
  
  // Global features state
  const [showHelp, setShowHelp] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = React.useState(false);
  
  // Defer keyboard shortcuts initialization to improve LCP
  const [shortcutsEnabled, setShortcutsEnabled] = React.useState(false);
  
  // Defer help system initialization to improve LCP
  const [helpSystemReady, setHelpSystemReady] = React.useState(false);
  
  React.useEffect(() => {
    // Enable shortcuts and help system after first paint (3s delay for better performance)
    const timer = setTimeout(() => {
      setShortcutsEnabled(true);
      setHelpSystemReady(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Setup keyboard shortcuts
  const {
    showShortcutsOverlay,
    toggleShortcutsOverlay,
    shortcutsByCategory
  } = useKeyboardShortcuts({
    onCreateWorkout: () => setShowCreateModal(true),
    onSave: () => {
      // TODO: Implement save functionality
      console.log('Save current work');
    },
    onQuickSearch: () => setQuickSearchOpen(true),
    onShowHelp: () => helpSystemReady && setShowHelp(true),
    onCloseModal: () => {
      setShowHelp(false);
      setShowSettings(false);
      setShowCreateModal(false);
      setShowMigrationDashboard(false);
    },
    onNavigateTab: (tabIndex) => {
      const tabs = ['overview', 'calendar', 'sessions', 'library', 'testing', 'status', 'templates', 'medical', 'analytics', 'ai-optimization'];
      if (tabs[tabIndex]) {
        setActiveTab(tabs[tabIndex]);
      }
    },
    onScheduleSession: () => {
      setActiveTab('calendar');
    },
    enabled: shortcutsEnabled && !showSessionViewer, // Disable shortcuts when in session viewer or not yet enabled
  });

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

  // Handle auth loading state first
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
          <div className="mb-4 flex justify-between items-center">
            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              onTeamChange={setSelectedTeamId}
              loading={teamsLoading}
            />
          </div>
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
        title={t('physicalTrainer:dashboard.title')}
        subtitle={t('physicalTrainer:dashboard.subtitle')}
        role="physicaltrainer"
        rightContent={
          <div className="flex items-center gap-3">
            <Suspense fallback={
              <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse mr-2" />
            }>
              <NotificationCenter 
                userId={user?.id || ''} 
                organizationId={user?.organizationId}
                className="mr-2"
              />
            </Suspense>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => helpSystemReady && setShowHelp(true)}
              className="h-8 w-8"
              disabled={!helpSystemReady}
              title={helpSystemReady ? "Help" : "Help system loading..."}
            >
              <HelpCircle className={`h-5 w-5 ${!helpSystemReady ? 'opacity-50' : ''}`} />
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
        {/* Team Selection and Actions */}
        <div className="mb-4 flex justify-between items-center">
          <TeamSelector
            teams={teams}
            selectedTeamId={selectedTeamId}
            onTeamChange={setSelectedTeamId}
            loading={teamsLoading}
          />
          <div className="flex items-center space-x-3">
            {/* Cache Statistics (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground">
                Cache: {getCacheStats().totalCached} tabs ({getCacheStats().priorityCached} priority)
              </div>
            )}
            {/* Demo WebSocket Events Button */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Trigger a random mock event for demo
                  const eventTypes = [
                    () => {
                      console.log('Simulating medical status change...');
                      // This would normally come from the server
                      const mockPayload = {
                        playerId: 'player-1',
                        previousStatus: 'healthy' as const,
                        newStatus: 'limited' as const,
                        restrictions: ['No contact drills'],
                        updatedBy: 'Dr. Demo',
                        timestamp: new Date(),
                      };
                      // Manually trigger the handler
                      dispatch(userApi.util.invalidateTags([
                        { type: 'Player', id: mockPayload.playerId },
                        'MedicalReport'
                      ]));
                    },
                    () => {
                      console.log('Simulating calendar event change...');
                      dispatch(calendarApi.util.invalidateTags(['Event']));
                    },
                    () => {
                      console.log('Simulating session progress...');
                      dispatch(trainingApi.util.invalidateTags(['TrainingSession']));
                    }
                  ];
                  const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                  randomEvent();
                }}
                className="flex items-center space-x-2"
              >
                <Wifi className="h-4 w-4" />
                <span>Trigger Mock Event</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Load mock workouts for migration demo
                const mockWorkouts = [
                  generateTestStrengthWorkout({ id: 'legacy-strength-1', name: 'Upper Body Strength' }),
                  generateTestStrengthWorkout({ id: 'legacy-strength-2', name: 'Lower Body Power' }),
                  generateTestConditioningWorkout({ id: 'legacy-conditioning-1', name: 'Sprint Intervals' }),
                  generateTestConditioningWorkout({ id: 'legacy-conditioning-2', name: 'Endurance Training' }),
                  generateTestHybridWorkout({ id: 'legacy-hybrid-1', name: 'CrossFit WOD' }),
                  generateTestAgilityWorkout({ id: 'legacy-agility-1', name: 'Agility Circuit' }),
                  // Add some invalid data for testing
                  { invalid: 'data', missing: 'required fields' },
                  null,
                  // Add some already unified data
                  {
                    id: 'unified-1',
                    version: '1.0.0',
                    type: 'strength',
                    name: 'Already Unified Workout',
                    content: { blocks: [], totalDuration: 3600 },
                    metadata: { createdBy: 'system', createdAt: new Date() }
                  }
                ];
                setMigrationWorkouts(mockWorkouts);
                setShowMigrationDashboard(true);
              }}
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>Data Migration</span>
            </Button>
          </div>
        </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(newTab) => {
          setActiveTab(newTab);
          markTabAccessed(newTab);
        }} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-10 w-full">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2"
            onMouseEnter={() => {
              // Preload adjacent tabs when hovering
              debouncedPreload('calendar', preloadTab);
              debouncedPreload('sessions', preloadTab);
            }}
          >
            <Activity className="h-4 w-4" />
            {t('physicalTrainer:tabs.overview')}
          </TabsTrigger>
          <TabsTrigger 
            value="calendar" 
            className="flex items-center gap-2"
            onMouseEnter={() => {
              debouncedPreload('sessions', preloadTab);
              debouncedPreload('overview', preloadTab);
            }}
          >
            <Calendar className="h-4 w-4" />
            {t('physicalTrainer:tabs.calendar')}
          </TabsTrigger>
          <TabsTrigger 
            value="sessions" 
            className="flex items-center gap-2"
            onMouseEnter={() => {
              debouncedPreload('library', preloadTab);
              debouncedPreload('calendar', preloadTab);
            }}
          >
            <Dumbbell className="h-4 w-4" />
            {t('physicalTrainer:tabs.sessions')}
          </TabsTrigger>
          <TabsTrigger 
            value="library" 
            className="flex items-center gap-2"
            onMouseEnter={() => {
              debouncedPreload('testing', preloadTab);
              debouncedPreload('sessions', preloadTab);
            }}
          >
            <Library className="h-4 w-4" />
            {t('physicalTrainer:tabs.exercises')}
          </TabsTrigger>
          <TabsTrigger 
            value="testing" 
            className="flex items-center gap-2"
            onMouseEnter={() => {
              debouncedPreload('status', preloadTab);
              debouncedPreload('library', preloadTab);
            }}
          >
            <TestTube2 className="h-4 w-4" />
            {t('physicalTrainer:tabs.testing')}
          </TabsTrigger>
          <TabsTrigger 
            value="status" 
            className="flex items-center gap-2"
            onMouseEnter={() => {
              debouncedPreload('templates', preloadTab);
              debouncedPreload('testing', preloadTab);
            }}
          >
            <User className="h-4 w-4" />
            {t('physicalTrainer:tabs.players')}
          </TabsTrigger>
          <TabsTrigger 
            value="templates" 
            className="flex items-center gap-2"
            onMouseEnter={() => {
              debouncedPreload('medical', preloadTab);
              debouncedPreload('status', preloadTab);
            }}
          >
            <FileText className="h-4 w-4" />
            {t('physicalTrainer:tabs.templates')}
          </TabsTrigger>
          <TabsTrigger 
            value="medical" 
            className="flex items-center gap-2"
            onMouseEnter={() => {
              debouncedPreload('analytics', preloadTab);
              debouncedPreload('templates', preloadTab);
            }}
          >
            <Heart className="h-4 w-4" />
            Medical
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2"
            onMouseEnter={() => {
              debouncedPreload('ai-optimization', preloadTab);
              debouncedPreload('medical', preloadTab);
            }}
          >
            <Brain className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="ai-optimization" 
            className="flex items-center gap-2"
            onMouseEnter={() => {
              debouncedPreload('analytics', preloadTab);
              // Optionally preload overview (circular)
              debouncedPreload('overview', preloadTab);
            }}
          >
            <Zap className="h-4 w-4" />
            AI Optimize
          </TabsTrigger>
        </TabsList>

        {/* Render tabs with caching strategy */}
        <div className="mt-6">
          {/* Render active tab */}
          <TabsContent value={activeTab}>
            <LazyTabLoader
              tabName={activeTab}
              // Pass all props based on active tab
              {...(activeTab === 'overview' && {
                selectedTeamId,
                todaysSessions,
                playerReadiness,
                onCreateSession: () => setShowCreateModal(true),
                onLaunchSession: launchSession,
                onViewAllPlayers: navigateToPlayerStatus,
              })}
              {...(activeTab === 'calendar' && {
                organizationId: user?.organizationId || '',
                userId: user?.id || '',
                teamId: selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId || undefined,
              })}
              {...(activeTab === 'sessions' && {
                selectedTeamId,
                onCreateSession: () => setShowCreateModal(true),
                onNavigateToCalendar: navigateToCalendar,
              })}
              {...(activeTab === 'testing' && {
                selectedTeamId,
                players,
                onSubmitTest: handleTestSubmit,
                onSaveDraft: handleTestSaveDraft,
              })}
              {...(activeTab === 'status' && {
                selectedTeamId,
                playerReadiness,
              })}
              {...(activeTab === 'templates' && {
                onCreateSession: () => setShowCreateModal(true),
                onApplyTemplate: handleApplyTemplate,
              })}
              {...((activeTab === 'medical' || activeTab === 'analytics' || activeTab === 'ai-optimization') && {
                selectedTeamId: selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId,
                organizationId: user?.organizationId || '',
              })}
            />
          </TabsContent>
          
          {/* Hidden cached tabs - only render if they should be cached */}
          {['overview', 'calendar', 'sessions', 'library', 'testing', 'status', 'templates', 'medical', 'analytics', 'ai-optimization']
            .filter(tab => tab !== activeTab && shouldCacheTab(tab))
            .map(tab => (
              <TabsContent key={tab} value={tab} className="hidden">
                <LazyTabLoader
                  tabName={tab}
                  // Pass minimal props for cached tabs to avoid unnecessary updates
                  {...(tab === 'overview' && {
                    selectedTeamId,
                    todaysSessions,
                    playerReadiness,
                    onCreateSession: () => setShowCreateModal(true),
                    onLaunchSession: launchSession,
                    onViewAllPlayers: navigateToPlayerStatus,
                  })}
                  {...(tab === 'calendar' && {
                    organizationId: user?.organizationId || '',
                    userId: user?.id || '',
                    teamId: selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId || undefined,
                  })}
                  {...(tab === 'sessions' && {
                    selectedTeamId,
                    onCreateSession: () => setShowCreateModal(true),
                    onNavigateToCalendar: navigateToCalendar,
                  })}
                  {...(tab === 'testing' && {
                    selectedTeamId,
                    players,
                    onSubmitTest: handleTestSubmit,
                    onSaveDraft: handleTestSaveDraft,
                  })}
                  {...(tab === 'status' && {
                    selectedTeamId,
                    playerReadiness,
                  })}
                  {...(tab === 'templates' && {
                    onCreateSession: () => setShowCreateModal(true),
                    onApplyTemplate: handleApplyTemplate,
                  })}
                  {...((tab === 'medical' || tab === 'analytics' || tab === 'ai-optimization') && {
                    selectedTeamId: selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId,
                    organizationId: user?.organizationId || '',
                  })}
                />
              </TabsContent>
            ))}
        </div>
      </Tabs>
      </div>

      {/* Lazy loaded modals */}
      <LazyModalLoader
        modalType="createSession"
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateSession={(session) => {
          console.log('New session created:', session);
          // In a real app, this would call an API to save the session
          // For now, just close the modal
          setShowCreateModal(false);
        }}
      />

      <LazyModalLoader
        modalType="migration"
        isOpen={showMigrationDashboard}
        onClose={() => setShowMigrationDashboard(false)}
        workouts={migrationWorkouts}
      />
      
      {helpSystemReady && (
        <LazyModalLoader
          modalType="help"
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
        />
      )}
      
      <LazyModalLoader
        modalType="settings"
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        selectedTeamId={selectedTeamId}
        teams={teams}
      />
      
      <FloatingActionMenu
        onCreateWorkout={(type) => {
          setShowCreateModal(true);
          // TODO: Pass workout type to CreateSessionModal
        }}
        onScheduleSession={() => {
          setActiveTab('calendar');
        }}
        onViewActiveSessions={() => {
          setActiveTab('sessions');
          // TODO: Filter to show only active sessions
        }}
        onQuickTest={() => {
          setActiveTab('testing');
        }}
      />
      
      <LazyModalLoader
        modalType="shortcuts"
        isOpen={showShortcutsOverlay}
        onClose={toggleShortcutsOverlay}
        shortcuts={shortcutsByCategory}
      />
    </div>
  );
}