import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  useGetCoachOverviewQuery,
  useGetPracticePlansQuery,
  useCreatePracticePlanMutation,
  useUpdatePracticePlanMutation,
  useDeletePracticePlanMutation,
  useDuplicatePracticePlanMutation,
  useGetDrillLibraryQuery,
  useGetTacticalPlansQuery,
  useCreateTacticalPlanMutation,
  useUpdateTacticalPlanMutation,
  useDeleteTacticalPlanMutation,
  useSharePlaybookMutation,
  useGetAIInsightsQuery,
  useApplyAISuggestionMutation,
  PracticePlan as ApiPracticePlan,
  TacticalPlan,
  TacticalCategory,
  FormationType,
} from '@/store/api/coachApi';
import { useTeamSelection } from '@/hooks/useTeamSelection';
import { usePrivateCoachChannels } from '@/hooks/usePrivateCoachChannels';
import { useFeatureFlags } from '@/config/featureFlags';
import type { CoachTab } from '../types/coach-dashboard.types';
import { mockPlayers, calculateAvailabilityStats } from '../constants/mock-data';

export function useCoachDashboard() {
  const { isTacticalDemoMode, isEnabled } = useFeatureFlags();

  // Tab state
  const [activeTab, setActiveTab] = useState<CoachTab>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // Practice planning state
  const [showCreatePracticeModal, setShowCreatePracticeModal] = useState(false);
  const [showDrillLibraryModal, setShowDrillLibraryModal] = useState(false);
  const [showSessionTimerModal, setShowSessionTimerModal] = useState(false);
  const [showLineGeneratorModal, setShowLineGeneratorModal] = useState(false);
  const [selectedPracticePlan, setSelectedPracticePlan] = useState<ApiPracticePlan | null>(null);
  const [drillSearchTerm, setDrillSearchTerm] = useState('');
  const [drillFilterCategory, setDrillFilterCategory] = useState('all');

  // Tactical planning state
  const [showCreateTacticalModal, setShowCreateTacticalModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSharePlaybookModal, setShowSharePlaybookModal] = useState(false);
  const [showAIDetailsModal, setShowAIDetailsModal] = useState(false);
  const [selectedTacticalPlan, setSelectedTacticalPlan] = useState<TacticalPlan | null>(null);
  const [selectedAIInsightType, setSelectedAIInsightType] = useState<'power_play' | 'defensive' | 'breakout'>('power_play');

  // Team selection management
  const {
    selectedTeamId,
    setSelectedTeamId,
    teams,
    teamsLoading,
  } = useTeamSelection({
    storageKey: 'iceCoach_selectedTeamId',
    includeAllOption: false,
    includePersonalOption: false,
  });

  // API queries
  const { data: apiData, isLoading } = useGetCoachOverviewQuery(selectedTeamId || 'senior');
  const { channels: privateChannels, loading: channelsLoading } = usePrivateCoachChannels();

  // Practice plans API hooks
  const {
    data: practicePlans,
    isLoading: plansLoading,
    refetch: refetchPlans,
  } = useGetPracticePlansQuery({
    teamId: selectedTeamId,
    page: 1,
    pageSize: 20,
  });

  const [createPracticePlan] = useCreatePracticePlanMutation();
  const [updatePracticePlan] = useUpdatePracticePlanMutation();
  const [deletePracticePlan] = useDeletePracticePlanMutation();
  const [duplicatePracticePlan] = useDuplicatePracticePlanMutation();

  const { data: drillLibrary, isLoading: drillsLoading } = useGetDrillLibraryQuery({
    category: drillFilterCategory !== 'all' ? drillFilterCategory : undefined,
    search: drillSearchTerm,
  });

  // Tactical plans API hooks
  const {
    data: tacticalPlans,
    isLoading: tacticalLoading,
    refetch: refetchTactical,
  } = useGetTacticalPlansQuery({
    teamId: selectedTeamId,
    page: 1,
    pageSize: 20,
  });

  const [createTacticalPlan] = useCreateTacticalPlanMutation();
  const [updateTacticalPlan] = useUpdateTacticalPlanMutation();
  const [deleteTacticalPlan] = useDeleteTacticalPlanMutation();
  const [sharePlaybook] = useSharePlaybookMutation();
  const [applyAISuggestion] = useApplyAISuggestionMutation();

  const { data: aiInsights, isLoading: aiLoading } = useGetAIInsightsQuery(
    { teamId: selectedTeamId || 'team-senior', type: selectedAIInsightType },
    { skip: !selectedTeamId }
  );

  // Calculated values
  const availabilityStats = calculateAvailabilityStats(mockPlayers);

  // Practice plan handlers
  const handleCreatePracticePlan = useCallback(
    async (plan: any) => {
      try {
        await createPracticePlan({
          name: plan.name,
          date: plan.date,
          teamId: selectedTeamId || 'team-senior',
          objectives: plan.objectives,
          drills: plan.drills,
          notes: plan.notes,
          primaryFocus: plan.primaryFocus,
        }).unwrap();

        toast({
          title: 'Practice Plan Created',
          description: `Successfully created "${plan.name}"`,
        });

        setShowCreatePracticeModal(false);
        refetchPlans();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create practice plan',
          variant: 'destructive',
        });
      }
    },
    [createPracticePlan, selectedTeamId, refetchPlans]
  );

  const handleEditPracticePlan = useCallback(
    (planId: string) => {
      const plan = practicePlans?.data?.find((p) => p.id === planId);
      if (plan) {
        setSelectedPracticePlan(plan);
        setShowCreatePracticeModal(true);
      }
    },
    [practicePlans]
  );

  const handleDuplicatePracticePlan = useCallback(
    async (planId: string) => {
      try {
        await duplicatePracticePlan({
          id: planId,
          newTitle: 'Copy of Practice Plan',
        }).unwrap();

        toast({
          title: 'Practice Plan Duplicated',
          description: 'Successfully created a copy of the practice plan',
        });

        refetchPlans();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to duplicate practice plan',
          variant: 'destructive',
        });
      }
    },
    [duplicatePracticePlan, refetchPlans]
  );

  const handleDeletePracticePlan = useCallback(
    async (planId: string) => {
      if (!confirm('Are you sure you want to delete this practice plan?')) return;

      try {
        await deletePracticePlan(planId).unwrap();

        toast({
          title: 'Practice Plan Deleted',
          description: 'Successfully deleted the practice plan',
        });

        refetchPlans();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete practice plan',
          variant: 'destructive',
        });
      }
    },
    [deletePracticePlan, refetchPlans]
  );

  // Tactical plan handlers
  const handleCreateTacticalPlan = useCallback(
    async (plan: any) => {
      try {
        await createTacticalPlan({
          name: plan.name,
          teamId: selectedTeamId || 'team-senior',
          category: plan.category,
          formation: plan.formation,
          playerAssignments: plan.playerAssignments,
          description: plan.description,
        }).unwrap();

        toast({
          title: 'Tactical Plan Created',
          description: `Successfully created "${plan.name}"`,
        });

        setShowCreateTacticalModal(false);
        refetchTactical();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create tactical plan',
          variant: 'destructive',
        });
      }
    },
    [createTacticalPlan, selectedTeamId, refetchTactical]
  );

  const handleSharePlaybook = useCallback(async () => {
    if (!selectedTeamId) return;

    try {
      const result = await sharePlaybook({
        teamId: selectedTeamId,
        playerIds: mockPlayers
          .filter((p) => p.status === 'available')
          .map((p) => String(p.id)),
      }).unwrap();

      toast({
        title: 'Playbook Shared',
        description: 'Successfully shared playbook with available players',
      });

      navigator.clipboard.writeText(result.shareUrl);
      setShowSharePlaybookModal(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share playbook',
        variant: 'destructive',
      });
    }
  }, [selectedTeamId, sharePlaybook]);

  const handleApplyAISuggestion = useCallback(
    async (suggestionId: string) => {
      if (!selectedTeamId) return;

      try {
        await applyAISuggestion({
          suggestionId,
          teamId: selectedTeamId,
        }).unwrap();

        toast({
          title: 'AI Suggestion Applied',
          description: 'Successfully applied AI optimization to tactical plan',
        });

        refetchTactical();
        setShowAIDetailsModal(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to apply AI suggestion',
          variant: 'destructive',
        });
      }
    },
    [selectedTeamId, applyAISuggestion, refetchTactical]
  );

  const handleChannelSelect = useCallback((channelId: string) => {
    window.dispatchEvent(new CustomEvent('openChat', { detail: { channelId } }));
  }, []);

  return {
    // Feature flags
    isTacticalDemoMode,
    isEnabled,

    // Tab state
    activeTab,
    setActiveTab,
    selectedPlayer,
    setSelectedPlayer,

    // Team selection
    selectedTeamId,
    setSelectedTeamId,
    teams,
    teamsLoading,

    // API data
    apiData,
    isLoading,
    privateChannels,
    channelsLoading,
    practicePlans,
    plansLoading,
    drillLibrary,
    drillsLoading,
    tacticalPlans,
    tacticalLoading,
    aiInsights,
    aiLoading,

    // Calculated values
    availabilityStats,

    // Practice modal state
    showCreatePracticeModal,
    setShowCreatePracticeModal,
    showDrillLibraryModal,
    setShowDrillLibraryModal,
    showSessionTimerModal,
    setShowSessionTimerModal,
    showLineGeneratorModal,
    setShowLineGeneratorModal,
    selectedPracticePlan,
    setSelectedPracticePlan,
    drillSearchTerm,
    setDrillSearchTerm,
    drillFilterCategory,
    setDrillFilterCategory,

    // Tactical modal state
    showCreateTacticalModal,
    setShowCreateTacticalModal,
    showAnalyticsModal,
    setShowAnalyticsModal,
    showSharePlaybookModal,
    setShowSharePlaybookModal,
    showAIDetailsModal,
    setShowAIDetailsModal,
    selectedTacticalPlan,
    setSelectedTacticalPlan,
    selectedAIInsightType,
    setSelectedAIInsightType,

    // Practice handlers
    handleCreatePracticePlan,
    handleEditPracticePlan,
    handleDuplicatePracticePlan,
    handleDeletePracticePlan,

    // Tactical handlers
    handleCreateTacticalPlan,
    handleSharePlaybook,
    handleApplyAISuggestion,

    // Channel handlers
    handleChannelSelect,

    // Refetch functions
    refetchPlans,
    refetchTactical,
  };
}

export type UseCoachDashboardReturn = ReturnType<typeof useCoachDashboard>;



