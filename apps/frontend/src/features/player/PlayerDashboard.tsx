"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { logout } from "@/utils/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGetWorkoutSessionsQuery } from '@/store/api/trainingApi';
import CalendarWidget from '@/features/calendar/components/CalendarWidget';
import { useTranslation } from '@hockey-hub/translations';
import { useWellnessChartData, useOptimizedChart } from '@/hooks/useWellnessChartData';
import { useIntervalLauncher } from '@/hooks/useIntervalLauncher';
import { PlayerIntervalViewer } from './components/PlayerIntervalViewer';
import { LazyChart } from '@/components/charts/LazyChart';
import { OptimizedResponsiveContainer } from '@/components/charts/OptimizedResponsiveContainer';
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
import { SafeProgress } from '@/components/ui/SafeProgress';
import OptimizedChart from '@/components/charts/OptimizedChart';
import { capProgress } from '@/utils/chartOptimization';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  MessageCircle,
  Dumbbell,
  Clock,
  MapPin,
  Target,
  Activity,
  Heart,
  Moon,
  Zap,
  Smile,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  User,
  Trophy,
  Send,
  Loader2,
  Plus,
  BarChart3,
  Brain,
  Droplets,
  Apple,
  AlertTriangle,
  TrendingDown,
  ChevronRight,
  BedDouble,
  Battery,
  LogOut,
  Frown,
  Meh,
  ArrowUp,
  ArrowDown,
  Equal,
  Info,
  Shield,
  Wind,
  Download,
  CheckCircle2,
  Play,
  X as XIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Area,
  AreaChart,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
} from "recharts";
import { 
  useGetPlayerOverviewQuery,
  useSubmitWellnessMutation,
  useCompleteTrainingMutation
} from "@/store/api/playerApi";
import {
  useGetUserDashboardDataQuery,
  useGetUserStatisticsQuery,
  useGetCommunicationSummaryQuery,
  useGetStatisticsSummaryQuery,
} from "@/store/api/dashboardApi";
import { PlayerCalendarView } from "./PlayerCalendarView";
import { 
  getEventTypeColor, 
  getStatusColor, 
  getPriorityColor,
  spacing,
  grids,
  a11y,
  shadows
} from "@/lib/design-utils";

// Wellness metric configuration
const wellnessMetrics = [
  { key: "sleepQuality", label: "Sleep Quality", icon: Moon, color: "#6366f1" },
  { key: "energyLevel", label: "Energy Level", icon: Battery, color: "#10b981" },
  { key: "mood", label: "Mood", icon: Smile, color: "#f59e0b" },
  { key: "motivation", label: "Motivation", icon: Zap, color: "#8b5cf6" },
  { key: "stressLevel", label: "Stress Level", icon: Brain, color: "#ef4444", inverse: true },
  { key: "soreness", label: "Muscle Soreness", icon: Activity, color: "#ec4899", inverse: true },
  { key: "hydration", label: "Hydration", icon: Droplets, color: "#06b6d4" },
  { key: "nutrition", label: "Nutrition Quality", icon: Apple, color: "#84cc16" },
];

// Generate secure random number in range [min, max)
function secureRandom(min: number, max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] / (0xffffffff + 1)) * (max - min);
}

// Generate secure random integer in range [min, max]
function secureRandomInt(min: number, max: number): number {
  return Math.floor(secureRandom(min, max + 1));
}

// Generate historical wellness data with secure random values
const generateHistoricalData = (days: number = 30) => {
  const data = [];
  const maxDays = Math.min(days, 90); // Limit to 90 days max
  for (let i = maxDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      sleepHours: secureRandom(7, 9),
      sleepQuality: secureRandomInt(5, 10),
      energyLevel: secureRandomInt(5, 10),
      mood: secureRandomInt(5, 10),
      motivation: secureRandomInt(6, 10),
      stressLevel: secureRandomInt(2, 6),
      soreness: secureRandomInt(2, 6),
      hydration: secureRandomInt(7, 10),
      nutrition: secureRandomInt(7, 10),
      readinessScore: secureRandomInt(75, 95),
      hrv: secureRandomInt(40, 70), // HRV typically 40-70ms for athletes
      restingHeartRate: secureRandomInt(45, 60), // RHR typically 45-60 for athletes
    });
  }
  return data;
};

// Types for wellness data
interface WellnessData {
  date: string;
  sleepHours: number;
  sleepQuality: number;
  energyLevel: number;
  mood: number;
  motivation: number;
  stressLevel: number;
  soreness: number;
  hydration: number;
  nutrition: number;
  readinessScore: number;
  hrv: number;
  restingHeartRate: number;
}

interface WellnessAverages {
  sleepQuality: number;
  energyLevel: number;
  mood: number;
  readinessScore: number;
}

interface WellnessInsight {
  type: 'positive' | 'warning';
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Calculate wellness insights
const calculateWellnessInsights = (data: WellnessData[]) => {
  const recent = data.slice(-7);
  const previous = data.slice(-14, -7);
  
  const avgRecent = {
    sleepQuality: recent.reduce((sum, d) => sum + d.sleepQuality, 0) / recent.length,
    energyLevel: recent.reduce((sum, d) => sum + d.energyLevel, 0) / recent.length,
    mood: recent.reduce((sum, d) => sum + d.mood, 0) / recent.length,
    readinessScore: recent.reduce((sum, d) => sum + d.readinessScore, 0) / recent.length,
  };
  
  const avgPrevious = {
    sleepQuality: previous.reduce((sum, d) => sum + d.sleepQuality, 0) / previous.length,
    energyLevel: previous.reduce((sum, d) => sum + d.energyLevel, 0) / previous.length,
    mood: previous.reduce((sum, d) => sum + d.mood, 0) / previous.length,
    readinessScore: previous.reduce((sum, d) => sum + d.readinessScore, 0) / previous.length,
  };
  
  return {
    trends: {
      sleepQuality: ((avgRecent.sleepQuality - avgPrevious.sleepQuality) / avgPrevious.sleepQuality) * 100,
      energyLevel: ((avgRecent.energyLevel - avgPrevious.energyLevel) / avgPrevious.energyLevel) * 100,
      mood: ((avgRecent.mood - avgPrevious.mood) / avgPrevious.mood) * 100,
      readinessScore: ((avgRecent.readinessScore - avgPrevious.readinessScore) / avgPrevious.readinessScore) * 100,
    },
    averages: avgRecent,
    insights: generateInsights(avgRecent, avgPrevious),
  };
};

const generateInsights = (recent: WellnessAverages, previous: WellnessAverages): WellnessInsight[] => {
  const insights: WellnessInsight[] = [];
  
  if (recent.sleepQuality > previous.sleepQuality) {
    insights.push({ type: 'positive' as const, text: 'Your sleep quality has improved this week', icon: Moon });
  } else if (recent.sleepQuality < previous.sleepQuality - 0.5) {
    insights.push({ type: 'warning' as const, text: 'Sleep quality declining - consider adjusting bedtime routine', icon: Moon });
  }
  
  if (recent.readinessScore > 85) {
    insights.push({ type: 'positive' as const, text: 'Excellent readiness scores - you\'re in peak condition', icon: Shield });
  }
  
  if (recent.energyLevel < 7) {
    insights.push({ type: 'warning' as const, text: 'Energy levels below optimal - ensure adequate recovery', icon: Battery });
  }
  
  return insights;
};

export default function PlayerDashboard() {
  const { t } = useTranslation(['player', 'common']);
  const [tab, setTab] = useState("today");
  const [wellnessTimeRange, setWellnessTimeRange] = useState("week");
  
  // Refs for debounce and submission state
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // Chart container refs for optimization
  const wellnessTrendsChartRef = useRef<HTMLDivElement>(null);
  const hrvChartRef = useRef<HTMLDivElement>(null);
  const readinessChartRef = useRef<HTMLDivElement>(null);
  const sleepChartRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<HTMLDivElement>(null);
  
  // Memoize historical data generation to prevent recreation on every render
  const historicalWellnessData = useMemo(() => generateHistoricalData(30), []);
  
  // Memoize wellness insights calculation
  const wellnessInsights = useMemo(
    () => calculateWellnessInsights(historicalWellnessData),
    [historicalWellnessData]
  );
  
  // Use optimized chart hooks
  useOptimizedChart(wellnessTrendsChartRef);
  useOptimizedChart(hrvChartRef);
  useOptimizedChart(readinessChartRef);
  useOptimizedChart(sleepChartRef);
  useOptimizedChart(radarChartRef);
  const [hrvData, setHrvData] = useState({
    current: 55,
    sevenDayAvg: 52,
    thirtyDayAvg: 51,
    trend: 'up' as 'up' | 'down' | 'stable',
    trendValue: 5.8
  });
  const [wellnessForm, setWellnessForm] = useState({
    sleepHours: 8,
    sleepQuality: 7,
    energyLevel: 7,
    mood: 7,
    motivation: 8,
    stressLevel: 3,
    soreness: 3,
    hydration: 7,
    nutrition: 7,
    bodyWeight: 180,
    restingHeartRate: 55,
    hrv: 55,
    hrvDevice: "whoop" as "whoop" | "oura" | "garmin" | "polar" | "manual",
    notes: "",
    symptoms: [] as string[],
    injuries: [] as string[],
  });

  const router = useRouter();
  const { isViewerOpen, selectedWorkout, launchInterval, closeViewer } = useIntervalLauncher();
  
  // Get today's date for workout query
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Mock player ID - in production this would come from auth context
  const playerId = "player-123";
  
  // Query today's workouts
  const { data: workoutsData } = useGetWorkoutSessionsQuery({
    date: today.toISOString().split('T')[0],
    playerId: playerId,
    status: 'scheduled'
  });

  // Get player ID from localStorage (from login response)
  const getUserId = () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (authToken && authToken !== 'mock-jwt-token') {
        // In a real app, you'd decode the JWT to get the user ID
        // For now, we'll use a default ID
        return 1;
      }
    } catch (e) {
      console.error('Error getting user ID:', e);
    }
    return 1; // Default player ID
  };
  
  const playerId = getUserId();
  const { data: apiData, isLoading, error } = useGetPlayerOverviewQuery(playerId);
  const [submitWellness, { isLoading: isSubmittingWellness }] = useSubmitWellnessMutation();
  const [completeTraining] = useCompleteTrainingMutation();

  // Use new cached endpoints for improved performance
  const { data: userDashboardData } = useGetUserDashboardDataQuery();
  const { data: userStats } = useGetUserStatisticsQuery();
  const { data: communicationSummary } = useGetCommunicationSummaryQuery();
  const { data: statisticsSummary } = useGetStatisticsSummaryQuery({ 
    type: 'player', 
    id: playerId.toString() 
  });

  // Rich fallback data matching API structure - enhanced with cached user data
  const playerInfo = apiData?.playerInfo ?? {
    name: userDashboardData?.user?.fullName || "Erik Johansson",
    number: 10,
    position: "Forward",
    team: userDashboardData?.teams?.[0]?.name || "Senior Team",
    age: 22,
    height: "5'11\"",
    weight: "180 lbs",
    organization: userDashboardData?.organization?.name
  };

  const schedule = apiData?.schedule ?? [
    { time: "15:00", title: "Team Meeting", location: "Video Room", type: "meeting" as const, mandatory: true, notes: "Game plan review" },
    { time: "16:00", title: "Ice Practice", location: "Main Rink", type: "ice-training" as const, mandatory: true, notes: "Power play focus" },
  ];

  const upcoming = apiData?.upcoming ?? [
    { date: "Tomorrow", title: "Team Practice", time: "16:00", location: "Main Rink", type: "ice-training" as const, importance: "High" as const },
    { date: "Wed", title: "Gym – Upper Body", time: "17:00", location: "Weight Room", type: "physical-training" as const, importance: "Medium" as const },
  ];

  const training = apiData?.training ?? [
    { title: "Leg Strength", due: "Today", progress: 40, type: "strength" as const, description: "Focus on quad development", assignedBy: "Physical Trainer", estimatedTime: "45 min" },
    { title: "Core Stability", due: "Tomorrow", progress: 10, type: "strength" as const, description: "Planks and stability work", assignedBy: "Physical Trainer", estimatedTime: "30 min" },
  ];

  const developmentGoals = apiData?.developmentGoals ?? [
    { goal: "Improve shot accuracy", progress: 75, target: "Jun 15", category: "technical" as const, priority: "High" as const, notes: "Focus on wrist shot technique" },
    { goal: "Increase skating speed", progress: 60, target: "Jun 30", category: "physical" as const, priority: "Medium" as const, notes: "Work on stride length" },
  ];

  const readiness = apiData?.readiness ?? historicalWellnessData.slice(-5);

  const wellnessStats = apiData?.wellnessStats ?? {
    weeklyAverage: wellnessInsights.averages,
    trends: Object.entries(wellnessInsights.trends).map(([metric, change]) => ({
      metric: metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      direction: change > 0 ? "up" : change < 0 ? "down" : "stable" as const,
      change: Math.abs(change as number)
    })),
    recommendations: [
      "Great job maintaining consistent sleep schedule",
      "Consider adding more recovery time between intense sessions",
      "Your hydration levels are optimal - keep it up!"
    ],
    insights: wellnessInsights.insights
  };

  // Check if insights exists in wellnessStats
  const hasInsights = 'insights' in wellnessStats && Array.isArray(wellnessStats.insights) && wellnessStats.insights.length > 0;

  const [wellnessSubmitSuccess, setWellnessSubmitSuccess] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleWellnessSubmit = async () => {
    // Prevent rapid submissions with debounce
    if (isSubmitting) {
      console.log("Submission already in progress, ignoring...");
      return;
    }
    
    // Clear any existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    // Set debounce timeout
    submitTimeoutRef.current = setTimeout(async () => {
      console.log("Wellness submit button clicked");
      console.log("Submitting wellness data:", wellnessForm);
      console.log("Player ID:", playerId);
      
      setIsSubmitting(true);
      setSubmissionError(null);
      
      try {
        const result = await submitWellness({
          playerId,
          entry: wellnessForm
        }).unwrap();
        
        // Show success message
        console.log("Wellness submitted successfully:", result);
        setWellnessSubmitSuccess(true);
        
        // Clear any existing success timeout
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        
        // Hide success message after 5 seconds (extended from 3s)
        successTimeoutRef.current = setTimeout(() => {
          setWellnessSubmitSuccess(false);
        }, 5000);
        
        // Optional: Show a confirmation dialog
        // if (window.confirm('Wellness data submitted successfully! Would you like to view your wellness trends?')) {
        //   setTab('wellness');
        // }
        
      } catch (error: unknown) {
        console.error("Failed to submit wellness:", error);
        
        // Type-safe error handling
        let errorMessage = 'Failed to submit wellness data';
        if (error && typeof error === 'object') {
          if ('data' in error) {
            const apiError = error.data as { message?: string; error?: string };
            errorMessage = apiError.message || apiError.error || 'Failed to submit wellness data';
          } else if ('message' in error) {
            errorMessage = (error as { message: string }).message;
          }
        }
        
        console.error("Error details:", errorMessage);
        setSubmissionError(errorMessage);
        
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          setSubmissionError(null);
        }, 5000);
      } finally {
        setIsSubmitting(false);
      }
    }, 300); // 300ms debounce delay
  };

  const handleTrainingComplete = async (trainingTitle: string) => {
    try {
      await completeTraining({
        playerId,
        trainingId: trainingTitle.toLowerCase().replace(/\s+/g, '-'),
        completionNotes: `Completed ${trainingTitle}`
      }).unwrap();
    } catch (error) {
      console.error("Failed to complete training:", error);
    }
  };

  const updateWellnessField = useCallback((field: string, value: number | string | string[]) => {
    setWellnessForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Calculate current readiness score - memoized to prevent recalculation
  const calculateReadinessScore = useMemo(() => {
    const positive = (wellnessForm.sleepQuality + wellnessForm.energyLevel + wellnessForm.mood + wellnessForm.motivation + wellnessForm.hydration + wellnessForm.nutrition) / 6;
    const negative = (wellnessForm.stressLevel + wellnessForm.soreness) / 2;
    // Include HRV in the calculation (normalized to 0-10 scale)
    const hrvScore = Math.min(10, Math.max(0, (wellnessForm.hrv - 30) / 7));
    return Math.round(((positive * 8) + (hrvScore * 2) - (negative * 5) + 50) * 0.9);
  }, [wellnessForm]);

  // Cache for quarter data to prevent regeneration
  const quarterDataCache = useRef<WellnessData[] | null>(null);
  
  // Memoize wellness data for selected time range to prevent unnecessary recalculations
  const getWellnessDataForRange = useCallback(() => {
    switch (wellnessTimeRange) {
      case 'week':
        return historicalWellnessData.slice(-7);
      case 'month':
        return historicalWellnessData;
      case 'quarter':
        // Use cached data if available, otherwise generate once
        if (!quarterDataCache.current) {
          quarterDataCache.current = generateHistoricalData(90);
        }
        return quarterDataCache.current;
      default:
        return historicalWellnessData.slice(-7);
    }
  }, [wellnessTimeRange, historicalWellnessData]);
  
  // Clear quarter data cache when switching away from quarter view
  useEffect(() => {
    if (wellnessTimeRange !== 'quarter' && quarterDataCache.current) {
      quarterDataCache.current = null;
    }
  }, [wellnessTimeRange]);
  
  // Memoize the chart data to prevent recreating on every render
  const rawChartData = useMemo(() => getWellnessDataForRange(), [getWellnessDataForRange]);
  
  // Use wellness chart data hook for memory management with LTTB optimization
  const { data: chartData, cleanup: cleanupChartData, originalSize, optimizedSize } = useWellnessChartData(rawChartData, {
    maxDataPoints: 90,
    enableAutoCleanup: true,
    optimizationMethod: 'lttb',
    xKey: 'date',
    yKey: 'sleepQuality'
  });
  
  // Cleanup on tab change to free memory
  useEffect(() => {
    return () => {
      if (tab !== 'wellness') {
        cleanupChartData();
      }
    };
  }, [tab, cleanupChartData]);
  
  // Global cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear all chart data and caches
      cleanupChartData();
      quarterDataCache.current = null;
      
      // Clear any pending timeouts
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      
      // Force garbage collection hint (browser may ignore)
      if (window.gc) {
        window.gc();
      }
    };
  }, [cleanupChartData]);

  if (error) {
    return (
      <div className={`p-6 ${spacing.section}`} role="alert">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{t('common:messages.error')}. {t('common:actions.retry')}.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 ${spacing.section}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-bold">{playerInfo.number}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{playerInfo.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge>#{playerInfo.number}</Badge>
              <Badge variant="outline">{playerInfo.position}</Badge>
              <Badge variant="outline">{playerInfo.team}</Badge>
            </div>
            {playerInfo.age && (
              <p className="text-sm text-muted-foreground mt-1">
                Age {playerInfo.age} • {playerInfo.height} • {playerInfo.weight}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => router.push('/chat')}
            className={cn(a11y.focusVisible, "min-w-fit")}
          >
            <MessageCircle className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('player:communication.coachMessages')}</span>
            <span className="sm:hidden">Messages</span>
          </Button>
          <Button size="sm" variant="outline" onClick={logout} className={cn(a11y.focusVisible, "min-w-fit")}>
            <LogOut className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('common:navigation.logout')}</span>
            <span className="sm:hidden">Logout</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className={spacing.card}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5" role="tablist">
          <TabsTrigger value="today" id="today-tab" aria-controls="today-panel">{t('common:time.today')}</TabsTrigger>
          <TabsTrigger value="training" id="training-tab" aria-controls="training-panel">{t('player:training.title')}</TabsTrigger>
          <TabsTrigger value="wellness" id="wellness-tab" aria-controls="wellness-panel">{t('player:wellness.title')}</TabsTrigger>
          <TabsTrigger value="performance" id="performance-tab" aria-controls="performance-panel">{t('player:performance.title')}</TabsTrigger>
          <TabsTrigger value="calendar" id="calendar-tab" aria-controls="calendar-panel">{t('common:navigation.calendar')}</TabsTrigger>
        </TabsList>

        {/* ───────────  TODAY  ─────────── */}
        <TabsContent value="today" className={spacing.card} role="tabpanel" id="today-panel" aria-labelledby="today-tab">
          <div className={grids.dashboard}>
            {/* Today's Schedule */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                  {t('player:dashboard.todaySchedule')}
                </CardTitle>
                <CardDescription>Monday, May 19, 2025</CardDescription>
            </CardHeader>
              <CardContent>
                <div className={spacing.card} role="list" aria-label="Today's events">
              {isLoading ? (
                    <div className="py-8 text-center" role="status" aria-live="polite">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <span className={a11y.srOnly}>Loading schedule...</span>
                    </div>
                  ) : (
                    schedule.map((event, index) => (
                      <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0" role="listitem">
                        <div className={`p-2 rounded-md ${getEventTypeColor(event.type || '')}`}>
                          {event.type === 'meeting' ? (
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                          ) : event.type === 'ice-training' ? (
                            <Activity className="h-4 w-4" aria-hidden="true" />
                          ) : event.type === 'physical-training' ? (
                            <Dumbbell className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Clock className="h-4 w-4" aria-hidden="true" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <p className="font-medium text-sm">{event.title}</p>
                            <div className="flex items-center gap-2">
                              {event.mandatory && (
                                <Badge variant="destructive" className="text-xs">{t('common:labels.required')}</Badge>
                              )}
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {event.time}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {event.location}
                          </p>
                          {event.notes && (
                            <p className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded break-words">
                              <span className={a11y.srOnly}>Note: </span>
                              {event.notes}
                            </p>
                          )}
                        </div>
                  </div>
                ))
              )}
                </div>
              </CardContent>
            </Card>

            {/* Today's Workouts */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" aria-hidden="true" />
                  {t('player:training.todaysWorkout')}
                </CardTitle>
                <CardDescription>{t('player:training.assigned')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={spacing.card} role="list" aria-label="Today's workouts">
                  {workoutsData?.data && workoutsData.data.length > 0 ? (
                    workoutsData.data.map((workout) => (
                      <div key={workout.id} className="flex items-start space-x-4 border-b pb-3 last:border-0" role="listitem">
                        <div className={`p-2 rounded-md bg-orange-100 text-orange-600`}>
                          <Dumbbell className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <div>
                              <p className="font-medium text-sm">{workout.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {workout.type} • {workout.estimatedDuration} min
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {workout.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {workout.location}
                          </p>
                          {workout.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {workout.description}
                            </p>
                          )}
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => {
                              // Check if this is a conditioning workout with interval program
                              if (workout.type === 'CARDIO' && workout.intervalProgram) {
                                launchInterval(workout);
                              } else {
                                router.push(`/player/workout/${workout.id}`);
                              }
                            }}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            {workout.type === 'CARDIO' && workout.intervalProgram ? 'Start Interval Training' : 'Start Workout'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      <p className="text-sm">No workouts scheduled for today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Calendar Widget */}
            <CalendarWidget 
              organizationId="org-123" 
              userId={playerId}
              days={7}
            />

            {/* Quick Wellness Check */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" aria-hidden="true" />
                  Today's Readiness
                </CardTitle>
                <CardDescription>Quick wellness status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="relative inline-flex">
                    <div className="text-4xl font-bold text-green-600 tabular-nums">{calculateReadinessScore}</div>
                    <div className="absolute -top-1 -right-3">
                      <span className="text-xs text-muted-foreground">%</span>
                </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {calculateReadinessScore >= 85 ? 'Excellent' : 
                     calculateReadinessScore >= 70 ? 'Good' : 
                     calculateReadinessScore >= 55 ? 'Fair' : 'Low'} Readiness
                  </p>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-blue-500" />
                      Sleep
                    </span>
                    <span className="font-medium">{wellnessForm.sleepQuality}/10</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-green-500" />
                      Energy
                    </span>
                    <span className="font-medium">{wellnessForm.energyLevel}/10</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-500" />
                      Soreness
                    </span>
                    <span className="font-medium">{wellnessForm.soreness}/10</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => {
                    setTab('wellness');
                    // Small delay to ensure tab change completes before potential scroll
                    setTimeout(() => {
                      const wellnessForm = document.getElementById('wellness-form');
                      if (wellnessForm) {
                        wellnessForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                >
                  Update Wellness
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───────────  TRAINING  ─────────── */}
        <TabsContent value="training" className={spacing.card} role="tabpanel" id="training-panel" aria-labelledby="training-tab">
          <div className={grids.cards}>
            {/* Assigned Training */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" aria-hidden="true" />
                  Assigned Training
                </CardTitle>
                <CardDescription>Current training assignments</CardDescription>
            </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {training.map((t, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getEventTypeColor(t.type)}>
                              {t.type}
                            </Badge>
                            <p className="font-medium">{t.title}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 break-words md:break-normal">{t.description}</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Due: {t.due} • Estimated: {t.estimatedTime}</p>
                            <p>Assigned by: {t.assignedBy}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{t.progress}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Progress value={t.progress} className="h-2" aria-label={`Progress: ${t.progress}%`} />
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleTrainingComplete(t.title)}
                            disabled={t.progress === 100}
                            className="min-w-[120px] sm:min-w-0"
                          >
                            {t.progress === 100 ? (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Completed
                              </>
                            ) : (
                              <>
                                <Plus className="mr-1 h-3 w-3" />
                                Mark Complete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>

            {/* Development Goals */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" aria-hidden="true" />
                  Development Goals
                </CardTitle>
                <CardDescription>Personal improvement targets</CardDescription>
            </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {developmentGoals.map((goal, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPriorityColor(goal.priority)}>
                              {goal.priority}
                            </Badge>
                            <Badge variant="outline">
                              {goal.category}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{goal.goal}</p>
                          <p className="text-xs text-muted-foreground mt-1">Target: {goal.target}</p>
                          {goal.notes && (
                            <p className="text-xs text-muted-foreground mt-1 break-words md:break-normal">{goal.notes}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" aria-label={`Goal progress: ${goal.progress}%`} />
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* ───────────  WELLNESS  ─────────── */}
        <TabsContent value="wellness" className={spacing.card} role="tabpanel" id="wellness-panel" aria-labelledby="wellness-tab">
          <div className="space-y-6">
            {/* Wellness Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{t('player:wellness.metrics.readiness')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 tabular-nums">{calculateReadinessScore}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculateReadinessScore >= 85 ? 'Peak performance ready' : 'Good to train'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">7-Day Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">{Math.round(wellnessInsights.averages.readinessScore)}%</div>
                  <div className="flex items-center gap-1 mt-1">
                    {wellnessInsights.trends.readinessScore > 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-600" />
                    ) : wellnessInsights.trends.readinessScore < 0 ? (
                      <ArrowDown className="h-3 w-3 text-red-600" />
                    ) : (
                      <Equal className="h-3 w-3 text-gray-600" />
                    )}
                    <span className={cn(
                      "text-xs",
                      wellnessInsights.trends.readinessScore > 0 && "text-green-600",
                      wellnessInsights.trends.readinessScore < 0 && "text-red-600",
                      wellnessInsights.trends.readinessScore === 0 && "text-gray-600"
                    )}>
                      {Math.abs(wellnessInsights.trends.readinessScore).toFixed(1)}% vs last week
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Sleep Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">{wellnessInsights.averages.sleepQuality.toFixed(1)}/10</div>
                  <p className="text-xs text-muted-foreground mt-1">Past 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Recovery Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">Optimal</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Ready for high intensity</p>
                </CardContent>
              </Card>
            </div>

            {/* Insights & Recommendations */}
            {hasInsights && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Wellness Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {wellnessStats.insights!.map((insight, index) => (
                      <div key={index} className={cn(
                        "flex items-start gap-3 p-3 rounded-lg",
                        insight.type === 'positive' && "bg-green-50 border border-green-200",
                        insight.type === 'warning' && "bg-amber-50 border border-amber-200"
                      )}>
                        {React.createElement(insight.icon, {
                          className: cn(
                            "h-5 w-5 mt-0.5",
                            insight.type === 'positive' && "text-green-600",
                            insight.type === 'warning' && "text-amber-600"
                          )
                        })}
                        <p className={cn(
                          "text-sm",
                          insight.type === 'positive' && "text-green-800",
                          insight.type === 'warning' && "text-amber-800"
                        )}>
                          {insight.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Wellness Form */}
              <Card id="wellness-form">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" aria-hidden="true" />
                  {t('player:wellness.title')}
                </CardTitle>
                <CardDescription>
                    {t('player:wellness.subtitle')}
                </CardDescription>
            </CardHeader>
              <CardContent className="space-y-6">
                  {/* HRV Section */}
                  <div className="p-4 bg-purple-50 rounded-lg space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium text-purple-900">Heart Rate Variability (HRV)</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                  <div>
                        <Label htmlFor="hrv-value">HRV (ms)</Label>
                    <Input
                          id="hrv-value"
                      type="number"
                          min="20"
                          max="100"
                          value={wellnessForm.hrv}
                          onChange={(e) => updateWellnessField('hrv', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                        <p className="text-xs text-muted-foreground mt-1">
                          Normal range: 40-70ms
                        </p>
                  </div>
                  <div>
                        <Label htmlFor="hrv-device">Measurement Device</Label>
                        <select
                          id="hrv-device"
                          value={wellnessForm.hrvDevice}
                          onChange={(e) => updateWellnessField('hrvDevice', e.target.value)}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="whoop">WHOOP</option>
                          <option value="oura">Oura Ring</option>
                          <option value="garmin">Garmin</option>
                          <option value="polar">Polar</option>
                          <option value="manual">Manual Entry</option>
                        </select>
                  </div>
                </div>

                    {/* HRV Status Indicator */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-md">
                  <div>
                        <p className="text-sm font-medium">HRV Status</p>
                        <p className="text-xs text-muted-foreground">
                          Compared to your baseline
                        </p>
                    </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        wellnessForm.hrv >= 60 && "bg-green-100 text-green-800",
                        wellnessForm.hrv >= 45 && wellnessForm.hrv < 60 && "bg-yellow-100 text-yellow-800",
                        wellnessForm.hrv < 45 && "bg-red-100 text-red-800"
                      )}>
                        {wellnessForm.hrv >= 60 ? 'Optimal' : 
                         wellnessForm.hrv >= 45 ? 'Normal' : 'Low'}
                    </div>
                  </div>
                </div>

                  {/* Wellness Sliders */}
                  <div className="space-y-6">
                    {wellnessMetrics.map((metric) => (
                      <div key={metric.key}>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="flex items-center gap-2">
                            {React.createElement(metric.icon, { 
                              className: "h-4 w-4", 
                              style: { color: metric.color }
                            })}
                            {metric.label}
                          </Label>
                          <span className="text-sm font-medium">
                            {wellnessForm[metric.key as keyof typeof wellnessForm]}/10
                          </span>
                    </div>
                      <Slider
                          value={[wellnessForm[metric.key as keyof typeof wellnessForm] as number]}
                          onValueChange={(value: number[]) => updateWellnessField(metric.key, value[0])}
                        min={1}
                        max={10}
                        step={1}
                          className="cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          aria-label={`${metric.label}: ${wellnessForm[metric.key as keyof typeof wellnessForm]} out of 10`}
                          aria-valuemin={1}
                          aria-valuemax={10}
                          aria-valuenow={wellnessForm[metric.key as keyof typeof wellnessForm] as number}
                      />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{metric.inverse ? 'High' : 'Low'}</span>
                          <span>{metric.inverse ? 'Low' : 'High'}</span>
                    </div>
                  </div>
                    ))}
                </div>

                  {/* Additional Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="sleep-hours">Sleep Hours</Label>
                      <Input
                        id="sleep-hours"
                        type="number"
                        min="0"
                        max="12"
                        step="0.5"
                        value={wellnessForm.sleepHours}
                        onChange={(e) => updateWellnessField('sleepHours', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                  </div>
                  <div>
                    <Label htmlFor="body-weight">Body Weight (lbs)</Label>
                    <Input
                      id="body-weight"
                      type="number"
                        min="0"
                        step="0.1"
                      value={wellnessForm.bodyWeight}
                      onChange={(e) => updateWellnessField('bodyWeight', parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  </div>

                  <div>
                    <Label htmlFor="resting-hr">Resting Heart Rate (bpm)</Label>
                    <Input
                      id="resting-hr"
                      type="number"
                      min="30"
                      max="100"
                      value={wellnessForm.restingHeartRate}
                      onChange={(e) => updateWellnessField('restingHeartRate', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="wellness-notes">Additional Notes</Label>
                  <Textarea
                    id="wellness-notes"
                      placeholder="Any symptoms, concerns, or other notes..."
                    value={wellnessForm.notes}
                    onChange={(e) => updateWellnessField('notes', e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                    style={{ minHeight: '80px' }}
                  />
                </div>
                
                {/* Submission tip */}
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 flex items-start gap-2">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Daily wellness tracking helps optimize your training and recovery. Submit your data each morning for best results.</span>
                  </p>
                </div>

                  {/* Submit Button */}
                <Button 
                    className="w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
                  onClick={handleWellnessSubmit} 
                  disabled={isSubmittingWellness || isSubmitting}
                  aria-busy={isSubmittingWellness || isSubmitting}
                >
                  {(isSubmittingWellness || isSubmitting) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common:messages.processing')}...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t('player:wellness.submit')}
                    </>
                  )}
                </Button>
                </CardContent>
          </Card>

              {/* Wellness Trends Chart */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Wellness Trends</CardTitle>
                      <CardDescription>Track your wellness metrics over time</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={wellnessTimeRange === 'week' ? 'default' : 'outline'}
                        onClick={() => setWellnessTimeRange('week')}
                      >
                        Week
                      </Button>
                      <Button
                        size="sm"
                        variant={wellnessTimeRange === 'month' ? 'default' : 'outline'}
                        onClick={() => setWellnessTimeRange('month')}
                      >
                        Month
                      </Button>
                      <Button
                        size="sm"
                        variant={wellnessTimeRange === 'quarter' ? 'default' : 'outline'}
                        onClick={() => setWellnessTimeRange('quarter')}
                      >
                        Quarter
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80" ref={wellnessTrendsChartRef}>
                    <OptimizedChart
                      data={chartData}
                      type="line"
                      xKey="date"
                      yKeys={['sleepQuality', 'energyLevel', 'mood', 'soreness']}
                      height={320}
                      maxDataPoints={100}
                      colors={['#6366f1', '#10b981', '#f59e0b', '#ef4444']}
                      xAxisFormatter={(value) => {
                        const date = new Date(value);
                        return wellnessTimeRange === 'week' 
                          ? date.toLocaleDateString('en', { weekday: 'short' })
                          : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
                      }}
                      yAxisFormatter={(value) => value.toFixed(1)}
                      tooltipFormatter={(value) => `${value.toFixed(1)}/10`}
                      onDataOptimized={(original, optimized) => {
                        if (original > 100) {
                          console.log(`Wellness chart optimized: ${original} → ${optimized} points`);
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Success/Error Messages - Positioned after the form cards for better visibility */}
            <div className="mt-6">
              {wellnessSubmitSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <span className="font-semibold">{t('player:wellness.submitted')}</span>
                    <br />
                    <span className="text-sm">Your wellness data has been recorded successfully. Keep up the great work on tracking your health!</span>
                  </AlertDescription>
                </Alert>
              )}
              
              {submissionError && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <span className="font-semibold">Submission Error</span>
                    <br />
                    <span className="text-sm">{submissionError}</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* HRV Tracking Card */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  HRV Analysis
                </CardTitle>
                <CardDescription>Heart Rate Variability trends and insights</CardDescription>
            </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Current HRV</p>
                    <p className="text-2xl font-bold text-purple-600 tabular-nums">{hrvData.current}ms</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">7-Day Average</p>
                    <p className="text-2xl font-bold text-blue-600 tabular-nums">{hrvData.sevenDayAvg}ms</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">30-Day Average</p>
                    <p className="text-2xl font-bold text-green-600 tabular-nums">{hrvData.thirtyDayAvg}ms</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Trend</p>
                    <div className="flex items-center justify-center gap-1">
                      {hrvData.trend === 'up' && <ArrowUp className="h-5 w-5 text-green-600" />}
                      {hrvData.trend === 'down' && <ArrowDown className="h-5 w-5 text-red-600" />}
                      {hrvData.trend === 'stable' && <Equal className="h-5 w-5 text-gray-600" />}
                      <p className="text-xl font-bold tabular-nums">
                        {hrvData.trendValue}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* HRV Chart */}
                <div className="h-64" ref={hrvChartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorHRV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11 }}
                        interval={wellnessTimeRange === 'week' ? 0 : 'preserveStartEnd'}
                      />
                      <YAxis domain={[30, 80]} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="hrv" 
                        stroke="#8b5cf6" 
                        fillOpacity={1} 
                        fill="url(#colorHRV)" 
                        name="HRV (ms)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* HRV Insights */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                      <p className="text-sm font-medium text-blue-900">Understanding Your HRV</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Higher HRV generally indicates better recovery and readiness. Your current HRV of {hrvData.current}ms is 
                        {hrvData.current >= 60 ? ' excellent for training' : hrvData.current >= 45 ? ' within normal range' : ' below optimal - consider lighter training'}.
                      </p>
                  </div>
                  </div>
                  
                  {hrvData.trend === 'down' && hrvData.trendValue > 10 && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                        <p className="text-sm font-medium text-amber-900">Declining HRV Trend</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Your HRV has decreased by {hrvData.trendValue}% over the past week. Consider additional recovery time or lighter training loads.
                        </p>
                  </div>
                </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Wellness Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Readiness Score Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Readiness Score Trend</CardTitle>
                  <CardDescription>Your overall readiness over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48" ref={readinessChartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorReadiness" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11 }}
                          interval={wellnessTimeRange === 'week' ? 1 : 'preserveStartEnd'}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="readinessScore" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorReadiness)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sleep Pattern */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sleep Pattern</CardTitle>
                  <CardDescription>Hours and quality tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48" ref={sleepChartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData.slice(-7)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dayOfWeek" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" domain={[0, 12]} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                        <Tooltip />
                        <Bar yAxisId="left" dataKey="sleepHours" fill="#6366f1" opacity={0.8} />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="sleepQuality" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Wellness Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Wellness Balance</CardTitle>
                  <CardDescription>Today's metrics visualization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48" ref={radarChartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { metric: 'Sleep', value: wellnessForm.sleepQuality },
                        { metric: 'Energy', value: wellnessForm.energyLevel },
                        { metric: 'Mood', value: wellnessForm.mood },
                        { metric: 'Motivation', value: wellnessForm.motivation },
                        { metric: 'Recovery', value: 10 - wellnessForm.soreness },
                        { metric: 'Stress', value: 10 - wellnessForm.stressLevel },
                        { metric: 'HRV', value: Math.min(10, (wellnessForm.hrv - 30) / 7) },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Radar 
                          name="Current" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.5} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>Based on your wellness trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wellnessStats.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">{rec}</p>
                    </div>
                  ))}
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Monitor recovery closely during high-intensity training periods
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <p className="text-sm text-green-800">
                      Your consistency in wellness tracking is excellent - keep it up!
                    </p>
                  </div>
                </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* ───────────  PERFORMANCE  ─────────── */}
        <TabsContent value="performance" className={spacing.card} role="tabpanel" id="performance-panel" aria-labelledby="performance-tab">
          <div className="space-y-6">
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Overall Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-blue-600 tabular-nums">87.5</div>
                    <Badge variant="outline" className="text-xs">
                      <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="tabular-nums">+3.2</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Performance index</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Last Test Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">Dec 15, 2024</div>
                  <p className="text-xs text-muted-foreground mt-1">Pre-season testing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Team Ranking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-600" />
                    <span className="text-2xl font-bold tabular-nums">5th</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Out of 22 players</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Goal Achievement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 tabular-nums">78%</div>
                  <Progress value={78} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">4 of 5 goals met</p>
                </CardContent>
              </Card>
            </div>

            {/* Test Categories Performance */}
          <Card>
            <CardHeader>
                <CardTitle>Physical Test Results by Category</CardTitle>
                <CardDescription>Your latest test results compared to team goals</CardDescription>
            </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      category: 'Power', 
                      icon: Zap, 
                      color: 'text-yellow-600',
                      bgColor: 'bg-yellow-50',
                      tests: [
                        { name: 'Vertical Jump', value: 65, unit: 'cm', goal: 70, percentile: 75 },
                        { name: 'Standing Long Jump', value: 280, unit: 'cm', goal: 290, percentile: 68 }
                      ]
                    },
                    { 
                      category: 'Speed', 
                      icon: Activity, 
                      color: 'text-blue-600',
                      bgColor: 'bg-blue-50',
                      tests: [
                        { name: '10m Sprint', value: 1.72, unit: 's', goal: 1.70, percentile: 82 },
                        { name: '30m Sprint', value: 4.15, unit: 's', goal: 4.10, percentile: 79 }
                      ]
                    },
                    { 
                      category: 'Strength', 
                      icon: Dumbbell, 
                      color: 'text-purple-600',
                      bgColor: 'bg-purple-50',
                      tests: [
                        { name: 'Squat 1RM', value: 140, unit: 'kg', goal: 150, percentile: 71 },
                        { name: 'Bench Press 1RM', value: 105, unit: 'kg', goal: 110, percentile: 65 }
                      ]
                    },
                    { 
                      category: 'Endurance', 
                      icon: Heart, 
                      color: 'text-red-600',
                      bgColor: 'bg-red-50',
                      tests: [
                        { name: 'VO2 Max', value: 58, unit: 'ml/kg/min', goal: 60, percentile: 85 },
                        { name: 'Beep Test', value: 14.5, unit: 'level', goal: 15, percentile: 88 }
                      ]
                    }
                  ].map((category) => (
                    <div key={category.category} className={cn("p-4 rounded-lg", category.bgColor)}>
                      <div className="flex items-center gap-2 mb-4">
                        {React.createElement(category.icon, {
                          className: cn("h-5 w-5", category.color)
                        })}
                        <h4 className="font-semibold">{category.category}</h4>
                      </div>
                      <div className="space-y-3">
                        {category.tests.map((test) => (
                          <div key={test.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{test.name}</span>
                              <span className="font-medium tabular-nums">
                                {test.value}{test.unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <SafeProgress 
                                value={test.value}
                                max={test.goal}
                                className="h-2 flex-1"
                                showOverflow={true}
                              />
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  test.percentile >= 80 && "border-green-600 text-green-600",
                                  test.percentile >= 60 && test.percentile < 80 && "border-blue-600 text-blue-600",
                                  test.percentile < 60 && "border-amber-600 text-amber-600"
                                )}
                              >
                                {test.percentile}th
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Goal: {test.goal}{test.unit}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Historical Trends */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Performance Trends</CardTitle>
                      <CardDescription>Track your progress over time</CardDescription>
                    </div>
                    <select 
                      className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Select performance metric to display"
                    >
                      <option>Vertical Jump</option>
                      <option>10m Sprint</option>
                      <option>Squat 1RM</option>
                      <option>VO2 Max</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <OptimizedChart
                      data={[
                        { date: 'Aug', value: 58, teamAvg: 56 },
                        { date: 'Sep', value: 60, teamAvg: 57 },
                        { date: 'Oct', value: 62, teamAvg: 58 },
                        { date: 'Nov', value: 63, teamAvg: 59 },
                        { date: 'Dec', value: 65, teamAvg: 60 },
                      ]}
                      type="line"
                      xKey="date"
                      yKeys={['value', 'teamAvg']}
                      height={256}
                      maxDataPoints={100}
                      colors={['#3b82f6', '#94a3b8']}
                      showGrid={true}
                      showLegend={true}
                      onDataOptimized={(original, optimized) => {
                        console.log(`Performance chart: ${original} → ${optimized} points`);
                      }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">+12% improvement</span>
                    </div>
                    <span className="text-muted-foreground">Since Aug 2024</span>
                  </div>
            </CardContent>
          </Card>

              {/* Team Comparison Radar */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Profile</CardTitle>
                  <CardDescription>Your strengths compared to team average</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { category: 'Power', you: 85, team: 75 },
                        { category: 'Speed', you: 82, team: 78 },
                        { category: 'Strength', you: 68, team: 72 },
                        { category: 'Agility', you: 90, team: 80 },
                        { category: 'Endurance', you: 88, team: 82 },
                        { category: 'Flexibility', you: 75, team: 70 },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar 
                          name="You" 
                          dataKey="you" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.3}
                        />
                        <Radar 
                          name="Team Average" 
                          dataKey="team" 
                          stroke="#94a3b8" 
                          fill="#94a3b8" 
                          fillOpacity={0.1}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Strength: Agility & Endurance</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span>Focus: Strength training</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Test Results */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Detailed Test Results</CardTitle>
                    <CardDescription>Complete breakdown of your latest physical tests</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      History
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="recent" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="recent">Recent Tests</TabsTrigger>
                    <TabsTrigger value="rankings">Team Rankings</TabsTrigger>
                    <TabsTrigger value="goals">Goals & Targets</TabsTrigger>
                  </TabsList>

                  <TabsContent value="recent" className="mt-4">
                    <div className="space-y-4">
                      {[
                        {
                          date: 'Dec 15, 2024',
                          tests: [
                            { name: 'Vertical Jump', value: 65, unit: 'cm', change: +2, rank: 5 },
                            { name: '10m Sprint', value: 1.72, unit: 's', change: -0.03, rank: 4 },
                            { name: 'Squat 1RM', value: 140, unit: 'kg', change: +5, rank: 8 },
                            { name: 'VO2 Max', value: 58, unit: 'ml/kg/min', change: +2, rank: 3 }
                          ]
                        }
                      ].map((session) => (
                        <div key={session.date} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">{session.date}</h4>
                            <Badge variant="outline">Pre-season Testing</Badge>
                          </div>
                          <div className="space-y-2">
                            {session.tests.map((test) => (
                              <div key={test.name} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{test.name}</p>
                                  <p className="text-2xl font-bold mt-1 tabular-nums">
                                    {test.value}{test.unit}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Change</p>
                                    <p className={cn(
                                      "font-medium tabular-nums",
                                      test.change > 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                      {test.change > 0 && '+'}{test.change}{test.unit}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Team Rank</p>
                                    <p className="font-medium tabular-nums">#{test.rank}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="rankings" className="mt-4">
                    <div className="space-y-3">
                      {[
                        { test: 'Vertical Jump', rank: 5, value: 65, leader: { name: 'Andersson', value: 72 } },
                        { test: '10m Sprint', rank: 4, value: 1.72, leader: { name: 'Lindberg', value: 1.68 } },
                        { test: 'VO2 Max', rank: 3, value: 58, leader: { name: 'Nilsson', value: 62 } },
                        { test: 'Squat 1RM', rank: 8, value: 140, leader: { name: 'Johansson', value: 165 } },
                      ].map((item) => (
                        <div key={item.test} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{item.test}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Your rank: #{item.rank} of 22
                              </p>
                            </div>
                            <Badge className={cn(
                              item.rank <= 3 && "bg-amber-100 text-amber-800",
                              item.rank > 3 && item.rank <= 10 && "bg-blue-100 text-blue-800",
                              item.rank > 10 && "bg-gray-100 text-gray-800"
                            )}>
                              {item.rank <= 3 ? 'Top 3' :
                               item.rank <= 10 ? 'Top 10' : 'Mid-pack'}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Team leader: {item.leader.name}</span>
                              <span className="font-medium">{item.leader.value}</span>
                            </div>
                            <div className="relative">
                              <Progress value={(item.rank / 22) * 100} className="h-6" />
                              <div 
                                className="absolute top-0 h-6 w-1 bg-primary"
                                style={{ left: `${(item.rank / 22) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="goals" className="mt-4">
                    <div className="space-y-4">
                      {[
                        { 
                          test: 'Vertical Jump',
                          current: 65,
                          goal: 70,
                          deadline: 'Mar 2025',
                          progress: 92,
                          status: 'on-track'
                        },
                        { 
                          test: '10m Sprint',
                          current: 1.72,
                          goal: 1.68,
                          deadline: 'Feb 2025',
                          progress: 75,
                          status: 'needs-work'
                        },
                        { 
                          test: 'Squat 1RM',
                          current: 140,
                          goal: 150,
                          deadline: 'Apr 2025',
                          progress: 93,
                          status: 'on-track'
                        },
                        { 
                          test: 'VO2 Max',
                          current: 58,
                          goal: 60,
                          deadline: 'May 2025',
                          progress: 97,
                          status: 'achieved'
                        }
                      ].map((goal) => (
                        <div key={goal.test} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{goal.test}</h4>
                              <p className="text-sm text-muted-foreground">
                                Target by {goal.deadline}
                              </p>
                            </div>
                            <Badge className={cn(
                              goal.status === 'achieved' && "bg-green-100 text-green-800",
                              goal.status === 'on-track' && "bg-blue-100 text-blue-800",
                              goal.status === 'needs-work' && "bg-amber-100 text-amber-800"
                            )}>
                              {goal.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Current: {goal.current}</span>
                              <span>Goal: {goal.goal}</span>
                            </div>
                            <Progress value={goal.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-right">
                              {goal.progress}% complete
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Training Recommendations
                </CardTitle>
                <CardDescription>Based on your test results and goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Dumbbell className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900">Focus on Strength</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Your squat performance is below team average. Add 2 extra strength sessions 
                          per week focusing on lower body power.
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-amber-900">Recommended exercises:</p>
                          <ul className="text-xs text-amber-700 list-disc list-inside">
                            <li>Back Squats - 4x6 @ 85% 1RM</li>
                            <li>Bulgarian Split Squats - 3x10 each leg</li>
                            <li>Box Jumps - 4x5</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">Maintain Endurance</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Your aerobic capacity is excellent. Continue current training volume 
                          with 1-2 high-intensity intervals per week.
                        </p>
                        <p className="text-xs text-green-700 mt-2">
                          Next test target: VO2 Max 60+ ml/kg/min
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Speed Development</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Small improvements needed in acceleration. Add plyometric exercises 
                          and sprint technique work.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-900">Next Testing</h4>
                        <p className="text-sm text-purple-700 mt-1">
                          Mid-season testing scheduled for February 15, 2025. 
                          Focus on your target areas over the next 8 weeks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───────────  CALENDAR  ─────────── */}
        <TabsContent value="calendar" className="h-[calc(100vh-16rem)]" role="tabpanel" id="calendar-panel" aria-labelledby="calendar-tab">
          <PlayerCalendarView />
        </TabsContent>
      </Tabs>

      {/* Interval Training Viewer Modal */}
      <PlayerIntervalViewer
        workout={selectedWorkout}
        isOpen={isViewerOpen}
        onClose={closeViewer}
      />
    </div>
  );
} 