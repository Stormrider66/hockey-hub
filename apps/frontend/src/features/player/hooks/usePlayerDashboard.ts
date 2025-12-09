/**
 * usePlayerDashboard Hook
 * 
 * Centralizes all state management and API interactions for the Player Dashboard
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation as useTranslationsPkg } from '@hockey-hub/translations';
import { useGetWorkoutSessionsQuery } from '@/store/api/trainingApi';
import { useWellnessChartData, useOptimizedChart } from '@/hooks/useWellnessChartData';
import { useIntervalLauncher } from '@/hooks/useIntervalLauncher';
import { 
  useGetPlayerOverviewQuery,
  useSubmitWellnessMutation,
  useCompleteTrainingMutation
} from '@/store/api/playerApi';
import {
  useGetUserDashboardDataQuery,
  useGetUserStatisticsQuery,
  useGetCommunicationSummaryQuery,
  useGetStatisticsSummaryQuery,
} from '@/store/api/dashboardApi';
import type { 
  WellnessForm, 
  WellnessData, 
  HrvData, 
  PlayerTabValue 
} from '../types';
import { 
  generateHistoricalData, 
  calculateWellnessInsights 
} from '../constants';

const initialWellnessForm: WellnessForm = {
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
  hrvDevice: 'whoop',
  notes: '',
  symptoms: [],
  injuries: [],
};

const initialHrvData: HrvData = {
  current: 55,
  sevenDayAvg: 52,
  thirtyDayAvg: 51,
  trend: 'up',
  trendValue: 5.8
};

export function usePlayerDashboard() {
  const isTestEnv = (process.env as Record<string, string>).JEST_TEST_ENV === 'true';
  const { t } = isTestEnv
    ? { t: (key: string) => key } as ReturnType<typeof useTranslationsPkg>
    : useTranslationsPkg(['player', 'common']);

  const router = useRouter();
  
  // Tab state
  const [tab, setTab] = useState<PlayerTabValue>('today');
  const [wellnessTimeRange, setWellnessTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  
  // Submission state
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [wellnessSubmitSuccess, setWellnessSubmitSuccess] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Chart refs for optimization
  const wellnessTrendsChartRef = useRef<HTMLDivElement>(null);
  const hrvChartRef = useRef<HTMLDivElement>(null);
  const readinessChartRef = useRef<HTMLDivElement>(null);
  const sleepChartRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<HTMLDivElement>(null);
  
  // Wellness form state
  const [wellnessForm, setWellnessForm] = useState<WellnessForm>(initialWellnessForm);
  const [hrvData] = useState<HrvData>(initialHrvData);
  
  // Memoize historical data generation
  const historicalWellnessData = useMemo(() => generateHistoricalData(30), []);
  const wellnessInsights = useMemo(
    () => calculateWellnessInsights(historicalWellnessData),
    [historicalWellnessData]
  );
  
  // Interval launcher hook
  const { isViewerOpen, selectedWorkout, launchInterval, closeViewer } = useIntervalLauncher();
  
  // Get today's date for workout query
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  
  // Mock player ID
  const playerId = 'player-123';
  
  // Query today's workouts
  const { data: workoutsData } = useGetWorkoutSessionsQuery({
    date: today.toISOString().split('T')[0],
    playerId: playerId,
    status: 'scheduled'
  });

  // Get player ID from localStorage
  const getUserId = useCallback(() => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (authToken && authToken !== 'mock-jwt-token') {
        return 1;
      }
    } catch (e) {
      console.error('Error getting user ID:', e);
    }
    return 1;
  }, []);
  
  const playerNumericId = useMemo(() => getUserId(), [getUserId]);
  
  // API queries
  const { data: apiData, isLoading, error } = useGetPlayerOverviewQuery(playerNumericId);
  const [submitWellness, { isLoading: isSubmittingWellness }] = useSubmitWellnessMutation();
  const [completeTraining] = useCompleteTrainingMutation();
  const { data: userDashboardData } = useGetUserDashboardDataQuery();
  const { data: userStats } = useGetUserStatisticsQuery();
  const { data: communicationSummary } = useGetCommunicationSummaryQuery();
  const { data: statisticsSummary } = useGetStatisticsSummaryQuery({
    type: 'player',
    id: String(playerNumericId)
  });

  // Player info with fallback
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

  // Schedule data with fallback
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

  // Check if insights exists
  const hasInsights = 'insights' in wellnessStats && Array.isArray(wellnessStats.insights) && wellnessStats.insights.length > 0;

  // Calculate readiness score
  const calculateReadinessScore = useMemo(() => {
    const positive = (wellnessForm.sleepQuality + wellnessForm.energyLevel + wellnessForm.mood + wellnessForm.motivation + wellnessForm.hydration + wellnessForm.nutrition) / 6;
    const negative = (wellnessForm.stressLevel + wellnessForm.soreness) / 2;
    const hrvScore = Math.min(10, Math.max(0, (wellnessForm.hrv - 30) / 7));
    return Math.round(((positive * 8) + (hrvScore * 2) - (negative * 5) + 50) * 0.9);
  }, [wellnessForm]);

  // Cache for quarter data
  const quarterDataCache = useRef<WellnessData[] | null>(null);
  
  // Get wellness data for selected time range
  const getWellnessDataForRange = useCallback(() => {
    switch (wellnessTimeRange) {
      case 'week':
        return historicalWellnessData.slice(-7);
      case 'month':
        return historicalWellnessData;
      case 'quarter':
        if (!quarterDataCache.current) {
          quarterDataCache.current = generateHistoricalData(90);
        }
        return quarterDataCache.current;
      default:
        return historicalWellnessData.slice(-7);
    }
  }, [wellnessTimeRange, historicalWellnessData]);
  
  // Clear quarter data cache when switching away
  useEffect(() => {
    if (wellnessTimeRange !== 'quarter' && quarterDataCache.current) {
      quarterDataCache.current = null;
    }
  }, [wellnessTimeRange]);
  
  // Memoize chart data
  const rawChartData = useMemo(() => getWellnessDataForRange(), [getWellnessDataForRange]);
  
  // Use wellness chart data hook
  const { data: chartData, cleanup: cleanupChartData } = useWellnessChartData(rawChartData, {
    maxDataPoints: 90,
    enableAutoCleanup: true,
    optimizationMethod: 'lttb',
    xKey: 'date',
    yKey: 'sleepQuality'
  });
  
  // Cleanup on tab change
  useEffect(() => {
    return () => {
      if (tab !== 'wellness') {
        cleanupChartData();
      }
    };
  }, [tab, cleanupChartData]);
  
  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupChartData();
      quarterDataCache.current = null;
      
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [cleanupChartData]);

  // Wellness form field update
  const updateWellnessField = useCallback((field: string, value: number | string | string[]) => {
    setWellnessForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle wellness submission
  const handleWellnessSubmit = useCallback(async () => {
    if (isSubmitting) {
      console.log("Submission already in progress, ignoring...");
      return;
    }
    
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    submitTimeoutRef.current = setTimeout(async () => {
      console.log("Wellness submit button clicked");
      console.log("Submitting wellness data:", wellnessForm);
      
      setIsSubmitting(true);
      setSubmissionError(null);
      
      try {
        const result = await submitWellness({
          playerId: Number(playerId),
          entry: wellnessForm
        }).unwrap();
        
        console.log("Wellness submitted successfully:", result);
        setWellnessSubmitSuccess(true);
        
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        
        successTimeoutRef.current = setTimeout(() => {
          setWellnessSubmitSuccess(false);
        }, 5000);
        
      } catch (error: unknown) {
        console.error("Failed to submit wellness:", error);
        
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
        
        setTimeout(() => {
          setSubmissionError(null);
        }, 5000);
      } finally {
        setIsSubmitting(false);
      }
    }, 300);
  }, [isSubmitting, wellnessForm, submitWellness, playerId]);

  // Handle training completion
  const handleTrainingComplete = useCallback(async (trainingTitle: string) => {
    try {
      await completeTraining({
        playerId: Number(playerId),
        trainingId: trainingTitle.toLowerCase().replace(/\s+/g, '-'),
        completionNotes: `Completed ${trainingTitle}`
      }).unwrap();
    } catch (error) {
      console.error("Failed to complete training:", error);
    }
  }, [completeTraining, playerId]);

  return {
    // Translation
    t,
    
    // Navigation
    router,
    
    // Tab state
    tab,
    setTab,
    wellnessTimeRange,
    setWellnessTimeRange,
    
    // Loading/error state
    isLoading,
    error,
    
    // Player data
    playerInfo,
    schedule,
    upcoming,
    training,
    developmentGoals,
    readiness,
    wellnessStats,
    hasInsights,
    workoutsData,
    
    // Wellness form
    wellnessForm,
    updateWellnessField,
    hrvData,
    historicalWellnessData,
    wellnessInsights,
    calculateReadinessScore,
    chartData,
    
    // Chart refs
    wellnessTrendsChartRef,
    hrvChartRef,
    readinessChartRef,
    sleepChartRef,
    radarChartRef,
    
    // Submission state
    isSubmitting,
    isSubmittingWellness,
    submissionError,
    wellnessSubmitSuccess,
    handleWellnessSubmit,
    handleTrainingComplete,
    
    // Interval viewer
    isViewerOpen,
    selectedWorkout,
    launchInterval,
    closeViewer,
  };
}

export type UsePlayerDashboardReturn = ReturnType<typeof usePlayerDashboard>;



