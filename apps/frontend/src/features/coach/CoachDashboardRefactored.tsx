'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Activity,
  Calendar,
  Users,
  Snowflake,
  Trophy,
  BarChart3,
  Target,
  Megaphone,
  Lock,
  Gamepad2,
} from '@/components/icons';
import { useTranslation } from '@hockey-hub/translations';
import { TeamSelector } from '@/features/physical-trainer/components/TeamSelector';

// Hooks
import { useCoachDashboard } from './hooks/useCoachDashboard';

// Tab Components
import {
  OverviewTab,
  TacticalTab,
  CalendarTab,
  TeamManagementTab,
  TrainingPlansTab,
  GamesTab,
  StatisticsTab,
  DevelopmentTab,
  BroadcastsTab,
  ParentChannelsTab,
} from './components/tabs';

// Data
import { specialTeamsStats, teamPerformance } from './constants/mock-data';

// Modals
import { CoachDashboardModals } from './components/CoachDashboardModals';

/**
 * CoachDashboard - Refactored Version
 *
 * This is the main orchestrator component for the Coach Dashboard.
 * It coordinates state management through useCoachDashboard hook
 * and renders tab content through dedicated tab components.
 *
 * Original file: 2788 lines
 * Refactored orchestrator: ~180 lines
 */
export default function CoachDashboard() {
  const { t } = useTranslation(['coach', 'common']);
  const dashboard = useCoachDashboard();

  const {
    activeTab,
    setActiveTab,
    selectedTeamId,
    setSelectedTeamId,
    teams,
    teamsLoading,
    selectedPlayer,
    setSelectedPlayer,
    availabilityStats,
    privateChannels,
    channelsLoading,
    handleChannelSelect,
    practicePlans,
    // Modal handlers
    setShowCreatePracticeModal,
    setSelectedPracticePlan,
    setShowDrillLibraryModal,
    setShowSessionTimerModal,
    setShowLineGeneratorModal,
    setShowCreateTacticalModal,
    setShowAnalyticsModal,
    setShowSharePlaybookModal,
    setShowAIDetailsModal,
    setSelectedAIInsightType,
    // Practice plan handlers
    handleEditPracticePlan,
    handleDuplicatePracticePlan,
    handleDeletePracticePlan,
    refetchPlans,
  } = dashboard;

  // Helper to open practice modal with optional existing plan
  const handleShowCreatePracticeModal = (plan?: any) => {
    setSelectedPracticePlan(plan || null);
    setShowCreatePracticeModal(true);
  };

  // Helper to show AI details modal with type
  const handleShowAIDetailsModal = (type: 'power_play' | 'defensive' | 'breakout') => {
    setSelectedAIInsightType(type);
    setShowAIDetailsModal(true);
  };

  return (
    <div className="w-full">
      {/* Team Selector for Ice Coach */}
      <div className="mb-6">
        <TeamSelector
          teams={teams}
          selectedTeamId={selectedTeamId}
          onTeamChange={setSelectedTeamId}
          loading={teamsLoading}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid grid-cols-10 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('coach:tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="tactical" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            Tactical
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('coach:tabs.calendar')}
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('coach:tabs.team')}
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Snowflake className="h-4 w-4" />
            {t('coach:tabs.practice')}
          </TabsTrigger>
          <TabsTrigger value="games" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            {t('coach:tabs.games')}
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('coach:tabs.statistics')}
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('coach:tabs.development')}
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            {t('coach:tabs.broadcasts', 'Broadcasts')}
          </TabsTrigger>
          <TabsTrigger value="parents" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {t('coach:tabs.parents', 'Parents')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            availabilityStats={availabilityStats}
            selectedTeamId={selectedTeamId}
            specialTeamsStats={specialTeamsStats}
            onNavigateToTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="tactical" className="mt-6">
          <TacticalTab
            selectedTeamId={selectedTeamId}
            onShowCreateTacticalModal={() => setShowCreateTacticalModal(true)}
            onShowAnalyticsModal={() => setShowAnalyticsModal(true)}
            onShowSharePlaybookModal={() => setShowSharePlaybookModal(true)}
            onShowAIDetailsModal={handleShowAIDetailsModal}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CalendarTab selectedTeamId={selectedTeamId} />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamManagementTab selectedPlayer={selectedPlayer} onSelectPlayer={setSelectedPlayer} />
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          <TrainingPlansTab
            selectedTeamId={selectedTeamId}
            practicePlans={practicePlans}
            onShowCreatePracticeModal={handleShowCreatePracticeModal}
            onShowDrillLibraryModal={() => setShowDrillLibraryModal(true)}
            onShowSessionTimerModal={() => setShowSessionTimerModal(true)}
            onShowLineGeneratorModal={() => setShowLineGeneratorModal(true)}
            onEditPracticePlan={handleEditPracticePlan}
            onDuplicatePracticePlan={handleDuplicatePracticePlan}
            onDeletePracticePlan={handleDeletePracticePlan}
            onRefetchPlans={refetchPlans}
          />
        </TabsContent>

        <TabsContent value="games" className="mt-6">
          <GamesTab selectedTeamId={selectedTeamId} />
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <StatisticsTab teamPerformance={teamPerformance} specialTeamsStats={specialTeamsStats} />
        </TabsContent>

        <TabsContent value="development" className="mt-6">
          <DevelopmentTab />
        </TabsContent>

        <TabsContent value="broadcasts" className="mt-6">
          <BroadcastsTab selectedTeamId={selectedTeamId} />
        </TabsContent>

        <TabsContent value="parents" className="mt-6">
          <ParentChannelsTab
            channels={privateChannels}
            loading={channelsLoading}
            onChannelSelect={handleChannelSelect}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CoachDashboardModals dashboard={dashboard} />
    </div>
  );
}
