"use client";

import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  UserX,
  Video,
  Plus,
  MessageCircle,
  ChevronRight,
  Clipboard,
  Edit,
  Copy,
  Trash2,
  Activity,
  AlertCircle,
  Target,
  TrendingUp,
  Users,
  Trophy,
  MapPin,
  Snowflake,
  Dumbbell,
  FileText,
  BarChart3,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  Timer,
  Shield,
  Zap,
  Heart,
  Brain,
  Flag,
  Share2,
  Settings,
  Star,
  Gamepad2,
  Megaphone,
  Lock,
  Save,
  Eye,
  FolderOpen,
  Search,
  Filter,
  Download,
  Upload,
  X
} from "@/components/icons";
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
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
  Drill,
  TacticalPlan,
  TacticalCategory,
  FormationType
} from "@/store/api/coachApi";
import {
  useGetUserDashboardDataQuery,
  useGetUserStatisticsQuery,
  useGetCommunicationSummaryQuery,
  useGetStatisticsSummaryQuery,
} from "@/store/api/dashboardApi";
import CalendarWidget from '@/features/calendar/components/CalendarWidget';
import IceCoachCalendarView from './components/IceCoachCalendarView';
import PracticeTemplates from './components/PracticeTemplates';
import { PracticePlanBuilder } from './components/PracticePlanBuilder';
import { BroadcastManagement } from '@/features/chat/components/BroadcastManagement';
import { PlayerProfileView } from './components/PlayerProfileView';
import { 
  getEventTypeColor, 
  getStatusColor, 
  getEventTypeIconColor,
} from "@/lib/design-utils";
import { useTranslation } from '@hockey-hub/translations';
import { TeamSelector } from '@/features/physical-trainer/components/TeamSelector';
import { useTeamSelection } from '@/hooks/useTeamSelection';
import { CoachChannelList } from "@/features/chat/components/CoachChannelList";
import { usePrivateCoachChannels } from "@/hooks/usePrivateCoachChannels";
import dynamic from 'next/dynamic';

// Dynamically import PlaySystemEditor to avoid SSR issues with Pixi.js
const PlaySystemEditor = dynamic(
  () => import('./components/tactical/PlaySystemEditor'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading tactical board..." />
      </div>
    )
  }
);

// Import tactical demo toggle
import { TacticalDemoToggle, DemoModeIndicator, DataSourceStatus } from './components/tactical/TacticalDemoToggle';
import { useFeatureFlags } from '@/config/featureFlags';

// Template interface
interface TrainingTemplate {
  id: string;
  name: string;
  duration: number;
  description: string;
  exercises: Array<{
    name: string;
    duration: number;
    type: string;
  }>;
}

// Mock data for comprehensive dashboard
const mockPlayers = [
  { 
    id: 1, 
    name: "Erik Andersson", 
    position: "Forward", 
    number: "15", 
    status: "available", 
    goals: 12, 
    assists: 18, 
    plusMinus: 8,
    faceoffPercentage: 52.3,
    shots: 89,
    hits: 45,
    blocks: 12,
    pim: 16,
    toi: "18:32"
  },
  { 
    id: 2, 
    name: "Marcus Lindberg", 
    position: "Defense", 
    number: "7", 
    status: "limited", 
    goals: 3, 
    assists: 15, 
    plusMinus: 12,
    shots: 67,
    hits: 98,
    blocks: 87,
    pim: 28,
    toi: "22:15"
  },
  { 
    id: 3, 
    name: "Viktor Nilsson", 
    position: "Goalie", 
    number: "23", 
    status: "available", 
    gamesPlayed: 18,
    wins: 12, 
    losses: 4,
    otl: 2,
    gaa: 2.34,
    savePercentage: .918,
    shutouts: 2
  },
  { 
    id: 4, 
    name: "Johan Bergström", 
    position: "Forward", 
    number: "14", 
    status: "available", 
    goals: 8, 
    assists: 12, 
    plusMinus: 5,
    faceoffPercentage: 48.7,
    shots: 54,
    hits: 23,
    blocks: 8,
    pim: 6,
    toi: "15:23"
  },
  { 
    id: 5, 
    name: "Anders Johansson", 
    position: "Defense", 
    number: "22", 
    status: "unavailable", 
    goals: 2, 
    assists: 8, 
    plusMinus: -3,
    shots: 45,
    hits: 76,
    blocks: 92,
    pim: 32,
    toi: "19:45"
  }
];

const todaysSessions = [
  {
    id: 1,
    time: "06:00",
    duration: 60,
    type: "ice-training",
    title: "Morning Skate",
    location: "Main Rink",
    focus: "Power Play Practice",
    attendees: 18,
    status: "completed"
  },
  {
    id: 2,
    time: "10:00",
    duration: 45,
    type: "meeting",
    title: "Video Review",
    location: "Meeting Room",
    focus: "Opponent Analysis - Northern Knights",
    attendees: 22,
    status: "completed"
  },
  {
    id: 3,
    time: "16:00",
    duration: 90,
    type: "ice-training",
    title: "Full Team Practice",
    location: "Main Rink",
    focus: "Defensive Zone Coverage",
    attendees: 22,
    status: "upcoming"
  }
];

const teamPerformance = [
  { game: 1, goals: 3, goalsAgainst: 2, shots: 32, shotsAgainst: 28 },
  { game: 2, goals: 2, goalsAgainst: 3, shots: 29, shotsAgainst: 35 },
  { game: 3, goals: 5, goalsAgainst: 1, shots: 38, shotsAgainst: 22 },
  { game: 4, goals: 2, goalsAgainst: 2, shots: 31, shotsAgainst: 30 },
  { game: 5, goals: 4, goalsAgainst: 3, shots: 36, shotsAgainst: 27 }
];

const lineupCombinations = [
  {
    name: "Line 1",
    forwards: ["Erik Andersson", "Johan Bergström", "Lucas Holm"],
    iceTime: "18:45",
    goalsFor: 8,
    goalsAgainst: 3,
    corsi: 58.2
  },
  {
    name: "Line 2",
    forwards: ["Maria Andersson", "Alex Nilsson", "Filip Berg"],
    iceTime: "16:32",
    goalsFor: 6,
    goalsAgainst: 4,
    corsi: 52.1
  },
  {
    name: "Defense Pair 1",
    defense: ["Marcus Lindberg", "Anders Johansson"],
    iceTime: "22:15",
    goalsFor: 12,
    goalsAgainst: 6,
    corsi: 55.7
  }
];

const upcomingGames = [
  {
    id: 1,
    date: "2024-01-22",
    time: "19:00",
    opponent: "Northern Knights",
    location: "Away",
    venue: "North Arena",
    importance: "League",
    record: "W-L-W",
    keyPlayer: "Max Johnson - 23G, 31A"
  },
  {
    id: 2,
    date: "2024-01-25",
    time: "18:30",
    opponent: "Ice Breakers",
    location: "Home",
    venue: "Home Arena",
    importance: "Playoff",
    record: "W-W-L",
    keyPlayer: "Sarah Smith - .925 SV%"
  },
  {
    id: 3,
    date: "2024-02-01",
    time: "17:00",
    opponent: "Polar Bears",
    location: "Away",
    venue: "Polar Stadium",
    importance: "League",
    record: "L-W-W",
    keyPlayer: "Tom Wilson - 19G, 28A"
  }
];

const specialTeamsStats = {
  powerPlay: {
    percentage: 18.5,
    opportunities: 87,
    goals: 16,
    trend: "up"
  },
  penaltyKill: {
    percentage: 82.3,
    timesShorthanded: 79,
    goalsAllowed: 14,
    trend: "stable"
  }
};

const playerDevelopment = [
  {
    player: "Erik Andersson",
    goals: [
      { skill: "Shot Accuracy", target: 85, current: 72, progress: 84 },
      { skill: "Defensive Positioning", target: 80, current: 65, progress: 81 },
      { skill: "Faceoff Win %", target: 55, current: 52.3, progress: 95 }
    ]
  },
  {
    player: "Marcus Lindberg",
    goals: [
      { skill: "First Pass Success", target: 90, current: 82, progress: 91 },
      { skill: "Gap Control", target: 85, current: 78, progress: 92 },
      { skill: "Shot Blocking", target: 100, current: 87, progress: 87 }
    ]
  }
];

export default function CoachDashboard() {
  const { t } = useTranslation(['coach', 'common', 'sports']);
  const { isTacticalDemoMode, isEnabled } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLineup, setSelectedLineup] = useState(null);
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
  // Team selection management - Ice Coach only sees their assigned teams
  const {
    selectedTeamId,
    setSelectedTeamId,
    teams,
    teamsLoading
  } = useTeamSelection({
    storageKey: 'iceCoach_selectedTeamId',
    includeAllOption: false,  // Ice coaches focus on specific teams
    includePersonalOption: false
  });

  const { data: apiData, isLoading } = useGetCoachOverviewQuery(selectedTeamId || "senior");
  const { channels: privateChannels, loading: channelsLoading } = usePrivateCoachChannels();
  
  // Practice plans API hooks
  const { data: practicePlans, isLoading: plansLoading, refetch: refetchPlans } = useGetPracticePlansQuery({
    teamId: selectedTeamId,
    page: 1,
    pageSize: 20
  });
  
  const [createPracticePlan] = useCreatePracticePlanMutation();
  const [updatePracticePlan] = useUpdatePracticePlanMutation();
  const [deletePracticePlan] = useDeletePracticePlanMutation();
  const [duplicatePracticePlan] = useDuplicatePracticePlanMutation();
  
  const { data: drillLibrary, isLoading: drillsLoading } = useGetDrillLibraryQuery({
    category: drillFilterCategory !== 'all' ? drillFilterCategory : undefined,
    search: drillSearchTerm
  });
  
  // Tactical plans API hooks
  const { data: tacticalPlans, isLoading: tacticalLoading, refetch: refetchTactical } = useGetTacticalPlansQuery({
    teamId: selectedTeamId,
    page: 1,
    pageSize: 20
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

  // Availability calculation
  const availabilityStats = {
    available: mockPlayers.filter(p => p.status === 'available').length,
    limited: mockPlayers.filter(p => p.status === 'limited').length,
    unavailable: mockPlayers.filter(p => p.status === 'unavailable').length
  };
  
  // Practice plan handlers
  const handleCreatePracticePlan = async (plan: any) => {
    try {
      await createPracticePlan({
        name: plan.name,
        date: plan.date,
        teamId: selectedTeamId || 'team-senior',
        objectives: plan.objectives,
        drills: plan.drills,
        notes: plan.notes,
        primaryFocus: plan.primaryFocus
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
  };
  
  const handleEditPracticePlan = async (planId: string) => {
    const plan = practicePlans?.data?.find(p => p.id === planId);
    if (plan) {
      setSelectedPracticePlan(plan);
      setShowCreatePracticeModal(true);
    }
  };
  
  const handleDuplicatePracticePlan = async (planId: string) => {
    try {
      await duplicatePracticePlan({
        id: planId,
        newTitle: 'Copy of Practice Plan'
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
  };
  
  const handleDeletePracticePlan = async (planId: string) => {
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
  };
  
  // Tactical plan handlers
  const handleCreateTacticalPlan = async (plan: any) => {
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
  };
  
  const handleSharePlaybook = async () => {
    if (!selectedTeamId) return;
    
    try {
      const result = await sharePlaybook({
        teamId: selectedTeamId,
        playerIds: mockPlayers.filter(p => p.status === 'available').map(p => String(p.id))
      }).unwrap();
      
      toast({
        title: 'Playbook Shared',
        description: 'Successfully shared playbook with available players',
      });
      
      // Could copy shareUrl to clipboard here
      navigator.clipboard.writeText(result.shareUrl);
      setShowSharePlaybookModal(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share playbook',
        variant: 'destructive',
      });
    }
  };
  
  const handleApplyAISuggestion = async (suggestionId: string) => {
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
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:overview.nextGame')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{t('common:vs')} Northern Knights</div>
            <p className="text-xs text-muted-foreground mt-1">{t('common:time.tomorrow')}, 19:00</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:overview.teamRecord')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">12-5-3</div>
            <p className="text-xs text-muted-foreground mt-1">{t('coach:overview.divisionPosition', { position: 2 })}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:overview.availablePlayers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{availabilityStats.available}/{mockPlayers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{availabilityStats.limited} {t('common:status.limited')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:overview.goalsPerGame')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold">3.2</div>
              <Badge variant="outline" className="text-xs">
                <ArrowUp className="h-3 w-3 mr-1" />
                +0.3
              </Badge>
        </div>
            <p className="text-xs text-muted-foreground mt-1">{t('coach:overview.lastGames', { count: 5 })}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('sports:situations.powerPlay')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{specialTeamsStats.powerPlay.percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {specialTeamsStats.powerPlay.goals}/{specialTeamsStats.powerPlay.opportunities}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('sports:situations.penaltyKill')}</CardTitle>
              </CardHeader>
              <CardContent>
            <div className="text-lg font-bold">{specialTeamsStats.penaltyKill.percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">{t('coach:overview.leagueRank', { rank: 14 })}</p>
          </CardContent>
        </Card>
                      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Gamepad2 className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-base">Tactical Board</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Create and analyze plays</p>
            <Button 
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setActiveTab("tactical")}
            >
              Open Tactical Board
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-base">Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Performance insights</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => setActiveTab("statistics")}
            >
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-base">Team Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Manage roster & lines</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => setActiveTab("team")}
            >
              Manage Team
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Snowflake className="h-5 w-5 text-orange-600" />
              </div>
              <CardTitle className="text-base">Practice Plans</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Training sessions</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => setActiveTab("training")}
            >
              Plan Practice
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Calendar Widget */}
        <CalendarWidget 
          organizationId="org-123" 
          userId="coach-123"
          teamId={selectedTeamId}
          days={14}
        />

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('coach:todaysSchedule.title')}</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {t('coach:todaysSchedule.addSession')}
              </Button>
                    </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysSessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">{session.time}</div>
                      <div className="text-xs text-muted-foreground">{session.duration} min</div>
                        </div>
                    <div className={cn(
                      "h-10 w-1 rounded-full",
                      session.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    )} />
                    <div>
                      <div className="font-medium">{session.title}</div>
                      <div className="text-sm text-muted-foreground">{session.focus}</div>
                          </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {session.attendees}
                    </Badge>
                    {session.type === 'ice-training' && (
                      <Snowflake className="h-4 w-4 text-blue-500" />
                    )}
                    {session.type === 'meeting' && (
                      <Video className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                    </div>
              ))}
                </div>
              </CardContent>
            </Card>

        {/* Tactical Overview */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Tactical Overview
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("tactical")}>
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Plays</span>
                  <span className="text-lg font-bold">24</span>
                </div>
                <Progress value={75} className="h-2 mb-3" />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Offensive</span>
                    <Badge variant="outline">12 plays</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Defensive</span>
                    <Badge variant="outline">8 plays</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Special Teams</span>
                    <Badge variant="outline">4 plays</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-lg font-bold text-green-600">78%</span>
                </div>
                <Progress value={78} className="h-2 mb-3" />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">This Week</span>
                    <Badge className="bg-green-100 text-green-800">+5%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Most Effective</span>
                    <Badge variant="outline">Power Play</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">AI Suggestions</span>
                    <Badge className="bg-blue-100 text-blue-800">3 new</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Player Status Overview */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('coach:playerAvailability.title')}</CardTitle>
              <Button variant="ghost" size="sm">
                {t('common:actions.viewDetails')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
              </CardHeader>
              <CardContent>
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{availabilityStats.available}</div>
                  <div className="text-xs text-muted-foreground">{t('common:status.available')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">{availabilityStats.limited}</div>
                  <div className="text-xs text-muted-foreground">{t('common:status.limited')}</div>
                          </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{availabilityStats.unavailable}</div>
                  <div className="text-xs text-muted-foreground">{t('common:status.unavailable')}</div>
                        </div>
                    </div>
            </div>
            
            <div className="space-y-2">
              {mockPlayers.slice(0, 5).map(player => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{player.number}</AvatarFallback>
                          </Avatar>
                    <div>
                      <div className="text-sm font-medium">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.position}</div>
                          </div>
                        </div>
                  <Badge className={cn(
                    player.status === 'available' && 'bg-green-100 text-green-800',
                    player.status === 'limited' && 'bg-amber-100 text-amber-800',
                    player.status === 'unavailable' && 'bg-red-100 text-red-800'
                  )}>
                    {t(`common:status.${player.status}`)}
                        </Badge>
                      </div>
              ))}
                </div>
              </CardContent>
            </Card>
      </div>

      {/* Recent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{t('coach:performance.trendTitle')}</CardTitle>
          <CardDescription>{t('coach:performance.lastGamesAnalysis', { count: 5 })}</CardDescription>
              </CardHeader>
              <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="game" label={{ value: 'Game', position: 'insideBottom', offset: -5 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="goals" stroke="#10b981" name="Goals For" strokeWidth={2} />
                <Line type="monotone" dataKey="goalsAgainst" stroke="#ef4444" name="Goals Against" strokeWidth={2} />
                <Line type="monotone" dataKey="shots" stroke="#3b82f6" name="Shots" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTacticalTab = () => (
    <div className="space-y-6">
      {/* Demo Mode Toggle and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Tactical Overview</h3>
              <DemoModeIndicator />
            </div>
            <DataSourceStatus />
          </div>
        </div>
        <div className="lg:col-span-1">
          <TacticalDemoToggle compact={true} className="mb-4" />
        </div>
      </div>

      {/* Tactical Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Play Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Plays</span>
                <span className="font-bold">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Offensive</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Defensive</span>
                <Badge variant="outline">8</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Special Teams</span>
                <Badge variant="outline">4</Badge>
              </div>
              <Button 
                className="w-full mt-4"
                onClick={() => setShowCreateTacticalModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Play
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-bold text-green-600">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Player Compliance</span>
                  <span className="font-bold">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">AI Optimization</span>
                  <span className="font-bold text-blue-600">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <Badge className="bg-green-100 text-green-800 w-full justify-center">
                +5% improvement this week
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Power Play Optimization</p>
                <p className="text-xs text-blue-700 mt-1">Consider adjusting formation for better screening</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2 text-xs"
                  onClick={() => {
                    setSelectedAIInsightType('power_play');
                    setShowAIDetailsModal(true);
                  }}
                >
                  View Details
                </Button>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-900">Defensive Coverage</p>
                <p className="text-xs text-orange-700 mt-1">Gap control needs improvement on left side</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2 text-xs"
                  onClick={() => {
                    setSelectedAIInsightType('defensive');
                    setShowAIDetailsModal(true);
                  }}
                >
                  View Analysis
                </Button>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">Breakout Success</p>
                <p className="text-xs text-green-700 mt-1">Current breakout pattern showing 89% success</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2 text-xs"
                  onClick={() => {
                    setSelectedAIInsightType('breakout');
                    setShowAIDetailsModal(true);
                  }}
                >
                  Maintain
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tactical Board */}
      <Card className="min-h-[600px]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Interactive Tactical Board</CardTitle>
              <CardDescription>Create, edit, and analyze plays with AI assistance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAnalyticsModal(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Analytics View
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSharePlaybookModal(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Playbook
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  toast({
                    title: 'Changes Saved',
                    description: 'Your tactical changes have been saved successfully',
                  });
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PlaySystemEditor teamId={selectedTeamId || undefined} />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Play Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: '2 hours ago', action: 'Created new power play formation', user: 'You', type: 'create' },
                { time: '1 day ago', action: 'Modified breakout pattern #3', user: 'Assistant Coach', type: 'edit' },
                { time: '2 days ago', action: 'AI suggested defensive adjustment', user: 'AI Engine', type: 'ai' },
                { time: '3 days ago', action: 'Shared playbook with players', user: 'You', type: 'share' },
                { time: '4 days ago', action: 'Analyzed game footage for effectiveness', user: 'Video Analyst', type: 'analysis' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'create' ? 'bg-green-100 text-green-600' :
                    activity.type === 'edit' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'ai' ? 'bg-purple-100 text-purple-600' :
                    activity.type === 'share' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.type === 'create' && <Plus className="h-4 w-4" />}
                    {activity.type === 'edit' && <Edit className="h-4 w-4" />}
                    {activity.type === 'ai' && <Brain className="h-4 w-4" />}
                    {activity.type === 'share' && <Share2 className="h-4 w-4" />}
                    {activity.type === 'analysis' && <BarChart3 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Learning Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPlayers.slice(0, 5).map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{player.number}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{player.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(Math.random() * 20) + 80}% mastery
                      </span>
                    </div>
                    <Progress 
                      value={Math.floor(Math.random() * 20) + 80} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  toast({
                    title: 'Player Progress',
                    description: 'Detailed player progress analytics coming soon!',
                  });
                }}
              >
                View All Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCalendarTab = () => (
    <div className="h-[800px]">
      <IceCoachCalendarView
        organizationId="org-123"
        userId="coach-123"
        teamId={selectedTeamId || "team-senior"}
      />
    </div>
  );

  const renderTeamManagementTab = () => {
    // If a player is selected, show their profile
    if (selectedPlayer) {
      return (
        <PlayerProfileView
          playerId={selectedPlayer}
          organizationId="org-123" // In real app, this would come from context
          teamId="team-senior" // In real app, this would come from context
          onBack={() => setSelectedPlayer(null)}
        />
      );
    }

    // Otherwise show the roster
    return (
      <div className="space-y-6">
      {/* Roster Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('coach:teamManagement.rosterTitle')}</CardTitle>
              <CardDescription>{t('coach:teamManagement.rosterDescription')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                {t('common:actions.export')}
              </Button>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                {t('coach:teamManagement.editLines')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockPlayers.map(player => (
              <Card 
                key={player.id} 
                className="hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setSelectedPlayer(player.id.toString())}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{player.number}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{player.name}</h3>
                          <Badge variant="outline">{player.position}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn(
                            player.status === 'available' && 'bg-green-100 text-green-800',
                            player.status === 'limited' && 'bg-amber-100 text-amber-800',
                            player.status === 'unavailable' && 'bg-red-100 text-red-800'
                          )}>
                            {t(`common:status.${player.status}`)}
                          </Badge>
                          {player.toi && (
                            <span className="text-xs text-muted-foreground">TOI: {player.toi}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="grid grid-cols-4 gap-6 text-sm flex-1">
                      {player.position !== "Goalie" ? (
                        <>
                  <div className="text-center">
                            <div className="font-semibold">{player.goals}</div>
                            <div className="text-xs text-muted-foreground">{t('sports:stats.goals')}</div>
                  </div>
                  <div className="text-center">
                            <div className="font-semibold">{player.assists}</div>
                            <div className="text-xs text-muted-foreground">{t('sports:stats.assists')}</div>
                  </div>
                          <div className="text-center">
                            <div className="font-semibold">{(player.goals || 0) + (player.assists || 0)}</div>
                            <div className="text-xs text-muted-foreground">{t('sports:stats.points')}</div>
                </div>
                          <div className="text-center">
                            <div className="font-semibold">{player.plusMinus && player.plusMinus > 0 ? '+' : ''}{player.plusMinus || 0}</div>
                            <div className="text-xs text-muted-foreground">{t('sports:stats.plusMinus')}</div>
                  </div>
                        </>
                      ) : (
                        <>
                          <div className="text-center">
                            <div className="font-semibold">{player.wins}-{player.losses}-{player.otl}</div>
                            <div className="text-xs text-muted-foreground">{t('common:labels.record')}</div>
                  </div>
                          <div className="text-center">
                            <div className="font-semibold">{player.gaa}</div>
                            <div className="text-xs text-muted-foreground">{t('sports:goalieStats.goalsAgainstAverage')}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{player.savePercentage}</div>
                            <div className="text-xs text-muted-foreground">{t('sports:goalieStats.savePercentage')}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{player.shutouts}</div>
                            <div className="text-xs text-muted-foreground">{t('sports:goalieStats.shutouts')}</div>
                          </div>
                        </>
                      )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Line Combinations */}
            <Card>
              <CardHeader>
          <CardTitle>Line Combinations & Performance</CardTitle>
          <CardDescription>Current lineup effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
            {lineupCombinations.map((line, index) => (
              <Card key={index} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                        <div>
                      <h4 className="font-semibold">{line.name}</h4>
                      <div className="text-sm text-muted-foreground mt-1">
                        {line.forwards ? line.forwards.join(" - ") : line.defense.join(" - ")}
                        </div>
                      </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{line.iceTime}</div>
                        <div className="text-xs text-muted-foreground">TOI/Game</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">+{line.goalsFor}</div>
                        <div className="text-xs text-muted-foreground">GF</div>
                    </div>
                      <div className="text-center">
                        <div className="font-semibold text-red-600">-{line.goalsAgainst}</div>
                        <div className="text-xs text-muted-foreground">GA</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{line.corsi}%</div>
                        <div className="text-xs text-muted-foreground">Corsi</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
      </div>
    );
  };

  const renderTrainingPlansTab = () => {
    const handleApplyTemplate = (template: any, date?: Date, time?: string) => {
      // Apply the template to create a new practice plan
      const newPlan = {
        ...template,
        date: date,
        teamId: selectedTeamId || 'team-senior',
      };
      setSelectedPracticePlan(newPlan);
      setShowCreatePracticeModal(true);
    };

    return (
      <div className="space-y-6">
        {/* Practice Templates */}
        <PracticeTemplates onApplyTemplate={handleApplyTemplate} />

        {/* Ice Training Sessions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('coach:training.iceTrainingTitle')}</CardTitle>
                <CardDescription>{t('coach:training.iceTrainingDescription')}</CardDescription>
              </div>
              <Button onClick={() => {
                setSelectedPracticePlan(null);
                setShowCreatePracticeModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('coach:training.createSession')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('coach:training.sessionTemplates')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "Power Play Systems", duration: 45, drills: 6 },
                    { name: "Defensive Zone Coverage", duration: 60, drills: 8 },
                    { name: "Breakout Patterns", duration: 40, drills: 5 },
                    { name: "Special Teams Practice", duration: 50, drills: 7 },
                    { name: "Game Day Morning Skate", duration: 30, drills: 4 }
                  ].map((template, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                        <div>
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.duration} min • {template.drills} drills</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Play className="h-4 w-4" />
                      </Button>
                      </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('coach:training.drillLibrary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { category: "Offensive Drills", count: 24 },
                    { category: "Defensive Drills", count: 18 },
                    { category: "Transition Drills", count: 15 },
                    { category: "Goalie Drills", count: 12 },
                    { category: "Conditioning", count: 10 }
                  ].map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-2">
                      <span className="text-sm">{category.category}</span>
                      <Badge variant="outline">{category.count}</Badge>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setShowDrillLibraryModal(true)}
                >
                  {t('coach:training.browseAllDrills')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Sessions */}
          <div>
            <h3 className="font-semibold mb-3">{t('coach:training.thisWeeksSchedule')}</h3>
            <div className="space-y-2">
              {[
                { day: "Monday", time: "16:00", focus: "Power Play", rink: "Main" },
                { day: "Tuesday", time: "06:00", focus: "Morning Skate", rink: "Main" },
                { day: "Wednesday", time: "16:00", focus: "Full Practice", rink: "Main" },
                { day: "Thursday", time: "16:00", focus: "Special Teams", rink: "Practice" },
                { day: "Friday", time: "10:00", focus: "Pre-Game Skate", rink: "Main" }
              ].map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{session.day}</p>
                      <p className="text-sm text-muted-foreground">{session.time}</p>
                    </div>
                    <div>
                      <p className="text-sm">{session.focus}</p>
                      <p className="text-xs text-muted-foreground">{session.rink} Rink</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Planning Tools */}
          <Card>
            <CardHeader>
          <CardTitle>Practice Planning Tools</CardTitle>
          <CardDescription>Resources for effective training sessions</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                setSelectedPracticePlan(null);
                setShowCreatePracticeModal(true);
              }}
            >
              <Clipboard className="h-6 w-6" />
              <span className="text-xs">Drill Builder</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => setShowSessionTimerModal(true)}
            >
              <Timer className="h-6 w-6" />
              <span className="text-xs">Session Timer</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => setShowLineGeneratorModal(true)}
            >
              <Users className="h-6 w-6" />
              <span className="text-xs">Line Generator</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                toast({
                  title: 'Share Plans',
                  description: 'Practice plan sharing functionality coming soon!',
                });
              }}
            >
              <Share2 className="h-6 w-6" />
              <span className="text-xs">Share Plans</span>
            </Button>
          </div>
            </CardContent>
          </Card>
          
      {/* Recent Practice Plans */}
      {practicePlans?.data && practicePlans.data.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Practice Plans</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetchPlans()}
              >
                <ChevronRight className="h-4 w-4 mr-1" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {practicePlans.data.slice(0, 5).map((plan) => (
                <div 
                  key={plan.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.duration} min • {plan.drills?.length || 0} drills
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEditPracticePlan(plan.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDuplicatePracticePlan(plan.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeletePracticePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    );
  };

  const renderGamesTab = () => (
    <div className="space-y-6">
      {/* Upcoming Games */}
            <Card>
              <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Game Schedule & Preparation</CardTitle>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Full Schedule
            </Button>
          </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
            {upcomingGames.map(game => (
              <Card key={game.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          {new Date(game.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-2xl font-bold">
                          {new Date(game.date).getDate()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(game.date).toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                      </div>
                      <div className="h-16 w-0.5 bg-border" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{game.opponent}</h3>
                      <Badge variant={game.importance === "Playoff" ? "destructive" : "secondary"}>
                        {game.importance}
                      </Badge>
                    </div>
                        <p className="text-sm text-muted-foreground">
                          {game.location} • {game.venue} • {game.time}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recent form: {game.record} • Key player: {game.keyPlayer}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Video className="h-4 w-4 mr-2" />
                        Scout Report
                      </Button>
                      <Button size="sm">
                        <Gamepad2 className="h-4 w-4 mr-2" />
                        Game Plan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

      {/* Tactical Planning */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Tactical Board</CardTitle>
          <CardDescription>Draw plays and strategies for your team</CardDescription>
        </CardHeader>
        <CardContent>
          <PlaySystemEditor teamId={selectedTeamId || undefined} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Special Teams Analysis</CardTitle>
            <CardDescription>Power play and penalty kill performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                      <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Power Play</h4>
                  <Badge variant={specialTeamsStats.powerPlay.trend === 'up' ? 'default' : 'secondary'}>
                    {specialTeamsStats.powerPlay.percentage}%
                  </Badge>
                      </div>
                <Progress value={specialTeamsStats.powerPlay.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {specialTeamsStats.powerPlay.goals} goals on {specialTeamsStats.powerPlay.opportunities} opportunities
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Penalty Kill</h4>
                  <Badge variant="secondary">
                    {specialTeamsStats.penaltyKill.percentage}%
                      </Badge>
                </div>
                <Progress value={specialTeamsStats.penaltyKill.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {specialTeamsStats.penaltyKill.goalsAllowed} goals allowed on {specialTeamsStats.penaltyKill.timesShorthanded} times shorthanded
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">PP Rank</p>
                  <p className="text-xl font-bold">8th</p>
                  <p className="text-xs text-green-600">↑ 2 from last month</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">PK Rank</p>
                  <p className="text-xl font-bold">14th</p>
                  <p className="text-xs text-gray-600">— No change</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="space-y-6">
      {/* Team Performance Overview */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Goal Distribution</CardTitle>
            <CardDescription>Goals by period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: '1st Period', value: 22, fill: '#3b82f6' },
                      { name: '2nd Period', value: 28, fill: '#10b981' },
                      { name: '3rd Period', value: 31, fill: '#f59e0b' },
                      { name: 'Overtime', value: 3, fill: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {/* Cells defined inline above */}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shot Metrics</CardTitle>
            <CardDescription>Shooting effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Shots/Game</span>
                  <span className="font-medium">33.2</span>
                </div>
                <Progress value={66} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Shooting %</span>
                  <span className="font-medium">9.7%</span>
                </div>
                <Progress value={48} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>High-Danger Shots</span>
                  <span className="font-medium">12.4/game</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Shot Location Heat Map</p>
                <div className="h-20 bg-gradient-to-r from-blue-100 via-yellow-100 to-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Heat map visualization</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Metrics</CardTitle>
            <CardDescription>Team analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Corsi For %</span>
                <Badge variant="outline">52.3%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Fenwick For %</span>
                <Badge variant="outline">51.8%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">PDO</span>
                <Badge variant="outline">101.2</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Zone Starts (O/D)</span>
                <Badge variant="outline">52/48</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Faceoff Win %</span>
                <Badge variant="outline">48.9%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Penalty Minutes/Game</span>
                <Badge variant="outline">8.2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Performance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Player Performance Matrix</CardTitle>
          <CardDescription>Individual contributions and advanced stats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { stat: 'Goals', A: 85, B: 70, fullMark: 100 },
                { stat: 'Assists', A: 92, B: 85, fullMark: 100 },
                { stat: 'Shots', A: 78, B: 82, fullMark: 100 },
                { stat: 'Hits', A: 65, B: 88, fullMark: 100 },
                { stat: 'Blocks', A: 45, B: 92, fullMark: 100 },
                { stat: 'Faceoffs', A: 72, B: 0, fullMark: 100 },
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="stat" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Erik Andersson" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="Marcus Lindberg" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Historical Trends */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Season Trends</CardTitle>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { month: 'Oct', wins: 3, losses: 1, ties: 0 },
                { month: 'Nov', wins: 4, losses: 2, ties: 1 },
                { month: 'Dec', wins: 5, losses: 1, ties: 2 },
                { month: 'Jan', wins: 0, losses: 1, ties: 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wins" stackId="a" fill="#10b981" />
                <Bar dataKey="losses" stackId="a" fill="#ef4444" />
                <Bar dataKey="ties" stackId="a" fill="#6b7280" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDevelopmentTab = () => (
    <div className="space-y-6">
      {/* Player Development Goals */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Individual Development Plans</CardTitle>
              <CardDescription>Track player skill progression and goals</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {playerDevelopment.map((player, playerIndex) => (
              <Card key={playerIndex}>
                <CardHeader>
                  <CardTitle className="text-lg">{player.player}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {player.goals.map((goal, goalIndex) => (
                      <div key={goalIndex}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="font-medium text-sm">{goal.skill}</p>
                            <p className="text-xs text-muted-foreground">
                              Current: {goal.current} → Target: {goal.target}
                            </p>
                          </div>
                          <Badge variant="outline">{goal.progress}%</Badge>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill Development Programs */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skill Development Programs</CardTitle>
            <CardDescription>Structured improvement plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Shooting Accuracy Program", duration: "4 weeks", enrolled: 5 },
                { name: "Defensive Positioning", duration: "3 weeks", enrolled: 8 },
                { name: "Faceoff Specialist", duration: "2 weeks", enrolled: 3 },
                { name: "Goalie Fundamentals", duration: "6 weeks", enrolled: 2 },
                { name: "Power Skating", duration: "4 weeks", enrolled: 12 }
              ].map((program, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{program.name}</p>
                    <p className="text-xs text-muted-foreground">{program.duration} • {program.enrolled} players</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Schedule</CardTitle>
            <CardDescription>Upcoming skill evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: "Jan 25", type: "Shooting Test", players: "All forwards" },
                { date: "Jan 28", type: "Skating Speed", players: "Full team" },
                { date: "Feb 2", type: "Defensive Skills", players: "Defense" },
                { date: "Feb 5", type: "Goalie Evaluation", players: "Goalies" },
                { date: "Feb 10", type: "Team Fitness", players: "Full team" }
              ].map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {assessment.date.split(' ')[0]}
                      </p>
                      <p className="font-bold">
                        {assessment.date.split(' ')[1]}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{assessment.type}</p>
                      <p className="text-xs text-muted-foreground">{assessment.players}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Season Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Season Development Timeline</CardTitle>
          <CardDescription>Long-term planning and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-6">
              {[
                { phase: "Pre-Season", status: "completed", focus: "Fitness & Fundamentals", date: "Aug-Sep" },
                { phase: "Early Season", status: "completed", focus: "System Implementation", date: "Oct-Nov" },
                { phase: "Mid-Season", status: "active", focus: "Performance Optimization", date: "Dec-Jan" },
                { phase: "Late Season", status: "upcoming", focus: "Playoff Preparation", date: "Feb-Mar" },
                { phase: "Playoffs", status: "upcoming", focus: "Peak Performance", date: "Apr-May" }
              ].map((phase, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center z-10 bg-background",
                    phase.status === 'completed' && 'bg-green-100',
                    phase.status === 'active' && 'bg-blue-100',
                    phase.status === 'upcoming' && 'bg-gray-100'
                  )}>
                    {phase.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {phase.status === 'active' && <Zap className="h-4 w-4 text-blue-600" />}
                    {phase.status === 'upcoming' && <Clock className="h-4 w-4 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{phase.phase}</p>
                        <p className="text-sm text-muted-foreground">{phase.focus}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{phase.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBroadcastsTab = () => (
    <BroadcastManagement
      teamId="team-123" // In a real app, this would come from context or props
      organizationId="org-123"
      coachId="coach-123"
    />
  );

  const renderParentChannelsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('coach:parentChannels.title', 'Private Parent Channels')}
          </CardTitle>
          <CardDescription>
            {t('coach:parentChannels.description', 'Confidential communication channels with parents')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {channelsLoading ? (
            <LoadingSpinner size="lg" text={t('common:loading')} />
          ) : privateChannels.length > 0 ? (
            <CoachChannelList
              channels={privateChannels}
              onChannelSelect={(channelId) => {
                // Open chat with selected channel
                window.dispatchEvent(new CustomEvent('openChat', { detail: { channelId } }));
              }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('coach:parentChannels.noChannels', 'No parent channels available')}</p>
              <p className="text-sm mt-1">
                {t('coach:parentChannels.noChannelsDesc', 'Channels will be created when players are added to your team')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats about Parent Communication */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:parentChannels.stats.activeChats', 'Active Chats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{privateChannels.filter(c => c.unreadCount > 0).length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('coach:parentChannels.stats.withUnreadMessages', 'With unread messages')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:parentChannels.stats.totalParents', 'Total Parents')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{privateChannels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('coach:parentChannels.stats.connectedParents', 'Connected parents')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:parentChannels.stats.pendingMeetings', 'Pending Meetings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{privateChannels.filter(c => c.hasPendingMeetingRequest).length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('coach:parentChannels.stats.requestsToReview', 'Requests to review')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Office Hours */}
      <Card>
        <CardHeader>
          <CardTitle>{t('coach:parentChannels.officeHours.title', 'Your Office Hours')}</CardTitle>
          <CardDescription>
            {t('coach:parentChannels.officeHours.description', 'When parents can schedule meetings with you')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Monday & Wednesday</p>
                <p className="text-sm text-muted-foreground">4:00 PM - 6:00 PM</p>
              </div>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                {t('common:edit')}
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Friday</p>
                <p className="text-sm text-muted-foreground">3:00 PM - 5:00 PM</p>
              </div>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                {t('common:edit')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full">{/* Removed padding and max-width since it's handled by parent */}
      
      {/* Team Selector for Ice Coach */}
      <div className="mb-6">
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
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="tactical" className="mt-6">
          {renderTacticalTab()}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          {renderCalendarTab()}
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          {renderTeamManagementTab()}
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          {renderTrainingPlansTab()}
        </TabsContent>

        <TabsContent value="games" className="mt-6">
          {renderGamesTab()}
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          {renderStatisticsTab()}
        </TabsContent>

        <TabsContent value="development" className="mt-6">
          {renderDevelopmentTab()}
        </TabsContent>

        <TabsContent value="broadcasts" className="mt-6">
          {renderBroadcastsTab()}
        </TabsContent>

        <TabsContent value="parents" className="mt-6">
          {renderParentChannelsTab()}
        </TabsContent>
      </Tabs>

      {/* Practice Plan Modal */}
      <Dialog open={showCreatePracticeModal} onOpenChange={setShowCreatePracticeModal}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedPracticePlan ? 'Edit Practice Plan' : 'Create Practice Plan'}
            </DialogTitle>
            <DialogDescription>
              Build a comprehensive practice plan with drills and objectives
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <PracticePlanBuilder
              onSavePlan={handleCreatePracticePlan}
              existingPlan={selectedPracticePlan}
              teamId={selectedTeamId}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Drill Library Modal */}
      <Dialog open={showDrillLibraryModal} onOpenChange={setShowDrillLibraryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Drill Library</DialogTitle>
            <DialogDescription>
              Browse and search our comprehensive drill collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search drills..."
                value={drillSearchTerm}
                onChange={(e) => setDrillSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={drillFilterCategory} onValueChange={setDrillFilterCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="warmup">Warm-up</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                  <SelectItem value="tactics">Tactics</SelectItem>
                  <SelectItem value="conditioning">Conditioning</SelectItem>
                  <SelectItem value="scrimmage">Scrimmage</SelectItem>
                  <SelectItem value="cooldown">Cool-down</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {drillsLoading ? (
                  <LoadingSpinner text="Loading drills..." />
                ) : drillLibrary && drillLibrary.length > 0 ? (
                  drillLibrary.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {category.drills.map((drill) => (
                          <Card key={drill.id} className="p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{drill.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {drill.duration} min • {drill.zone} • {drill.intensity}
                                </p>
                                {drill.objectives && (
                                  <div className="flex gap-1 mt-1">
                                    {drill.objectives.slice(0, 2).map((obj, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {obj}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  toast({
                                    title: 'Drill Added',
                                    description: `${drill.name} can be added to your practice plan`,
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Snowflake className="h-12 w-12 mx-auto mb-3" />
                    <p>No drills found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDrillLibraryModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Timer Modal */}
      <Dialog open={showSessionTimerModal} onOpenChange={setShowSessionTimerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Practice Session Timer</DialogTitle>
            <DialogDescription>
              Keep track of time during your practice sessions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="text-5xl font-bold mb-4">00:00</div>
              <div className="flex gap-2 justify-center">
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
                <Button variant="outline">
                  <Timer className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Session Notes</Label>
              <Textarea
                placeholder="Add notes about the session..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessionTimerModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Line Generator Modal */}
      <Dialog open={showLineGeneratorModal} onOpenChange={setShowLineGeneratorModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Line Generator</DialogTitle>
            <DialogDescription>
              Automatically generate optimal line combinations based on player skills
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Generation Strategy</Label>
              <Select defaultValue="balanced">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanced Lines</SelectItem>
                  <SelectItem value="scoring">Scoring Focus</SelectItem>
                  <SelectItem value="defensive">Defensive Focus</SelectItem>
                  <SelectItem value="development">Player Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Generated Lines</h4>
              <div className="space-y-3">
                {[1, 2, 3].map((lineNum) => (
                  <div key={lineNum} className="p-3 bg-muted rounded">
                    <div className="font-medium mb-1">Line {lineNum}</div>
                    <div className="text-sm text-muted-foreground">
                      Player 1 - Player 2 - Player 3
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLineGeneratorModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: 'Lines Generated',
                description: 'Line combinations have been generated successfully',
              });
              setShowLineGeneratorModal(false);
            }}>
              Apply Lines
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tactical Plan Modal */}
      <Dialog open={showCreateTacticalModal} onOpenChange={setShowCreateTacticalModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTacticalPlan ? 'Edit Tactical Plan' : 'Create New Tactical Plan'}
            </DialogTitle>
            <DialogDescription>
              Design and save tactical plays for your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Play Name</Label>
              <Input placeholder="e.g., Power Play Formation A" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select defaultValue="powerplay">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="powerplay">Power Play</SelectItem>
                  <SelectItem value="penalty_kill">Penalty Kill</SelectItem>
                  <SelectItem value="even_strength">Even Strength</SelectItem>
                  <SelectItem value="offensive_zone">Offensive Zone</SelectItem>
                  <SelectItem value="defensive_zone">Defensive Zone</SelectItem>
                  <SelectItem value="neutral_zone">Neutral Zone</SelectItem>
                  <SelectItem value="faceoff">Faceoff</SelectItem>
                  <SelectItem value="breakout">Breakout</SelectItem>
                  <SelectItem value="forecheck">Forecheck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the tactical play..."
                rows={3}
              />
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                Interactive tactical board would appear here
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTacticalModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              handleCreateTacticalPlan({
                name: 'Power Play Formation A',
                category: 'powerplay' as TacticalCategory,
                formation: {
                  type: 'powerplay' as FormationType,
                  zones: {
                    offensive: [],
                    neutral: [],
                    defensive: []
                  }
                },
                playerAssignments: [],
                description: 'Basic power play setup'
              });
            }}>
              Save Tactical Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Modal */}
      <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Tactical Analytics</DialogTitle>
            <DialogDescription>
              Detailed analytics and performance metrics for your tactical plays
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Success Rate by Play Type</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Power Play</span>
                      <span className="text-sm font-bold">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                    <div className="flex justify-between">
                      <span className="text-sm">Penalty Kill</span>
                      <span className="text-sm font-bold">82%</span>
                    </div>
                    <Progress value={82} className="h-2" />
                    <div className="flex justify-between">
                      <span className="text-sm">Breakout</span>
                      <span className="text-sm font-bold">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Most Used Plays</h4>
                  <div className="space-y-2">
                    {['Power Play A', 'Defensive Box', 'Quick Breakout'].map((play) => (
                      <div key={play} className="flex justify-between items-center">
                        <span className="text-sm">{play}</span>
                        <Badge variant="outline">12 times</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <Card className="p-4">
                <h4 className="font-medium mb-3">Performance Trends</h4>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart visualization would appear here
                </div>
              </Card>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnalyticsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Playbook Modal */}
      <Dialog open={showSharePlaybookModal} onOpenChange={setShowSharePlaybookModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Playbook</DialogTitle>
            <DialogDescription>
              Share your tactical playbook with players and assistant coaches
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Share With</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  <SelectItem value="available">Available Players Only</SelectItem>
                  <SelectItem value="coaches">Coaching Staff</SelectItem>
                  <SelectItem value="selected">Selected Players</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select defaultValue="view">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">View and Comment</SelectItem>
                  <SelectItem value="edit">Full Edit Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry</Label>
              <Select defaultValue="never">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSharePlaybookModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSharePlaybook}>
              <Share2 className="h-4 w-4 mr-2" />
              Generate Share Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Insights Modal */}
      <Dialog open={showAIDetailsModal} onOpenChange={setShowAIDetailsModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Tactical Insights</DialogTitle>
            <DialogDescription>
              AI-powered analysis and recommendations for your tactical plays
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="p-4">
              <h4 className="font-medium mb-2">
                {selectedAIInsightType === 'power_play' && 'Power Play Optimization'}
                {selectedAIInsightType === 'defensive' && 'Defensive Coverage Analysis'}
                {selectedAIInsightType === 'breakout' && 'Breakout Pattern Success'}
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Key Finding</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {selectedAIInsightType === 'power_play' && 'Your current formation lacks sufficient net-front presence during cross-ice passes.'}
                    {selectedAIInsightType === 'defensive' && 'Left side defensive gap control needs improvement, especially during rush situations.'}
                    {selectedAIInsightType === 'breakout' && 'Your quick-up breakout pattern shows 89% success rate - maintain current strategy.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Recommended Adjustments</h5>
                  <ul className="space-y-1">
                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Adjust player positioning during offensive zone entry</span>
                    </li>
                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Implement staggered formation for better spacing</span>
                    </li>
                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Practice quick transition from defense to offense</span>
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Expected Improvement</p>
                  <p className="text-sm text-green-700 mt-1">
                    Implementing these changes could improve success rate by 12-15%
                  </p>
                </div>
              </div>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDetailsModal(false)}>
              Dismiss
            </Button>
            <Button onClick={() => handleApplyAISuggestion('ai-suggestion-1')}>
              Apply Recommendations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatLabel({ label, value, color }: { label: string; value: number; color: "green" | "amber" | "red" }) {
  const colorClasses = {
    green: "text-green-600",
    amber: "text-amber-600",
    red: "text-red-600"
  };

  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${colorClasses[color]}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
} 