/**
 * PlayerDashboard Mock Data and Helper Functions
 * 
 * Extracted from PlayerDashboard.tsx for better maintainability
 */

import { 
  Moon, Battery, Smile, Zap, Brain, Activity, Droplets, Apple,
  Dumbbell, Heart
} from 'lucide-react';
import type { 
  WellnessMetric, 
  WellnessData, 
  WellnessAverages, 
  WellnessInsight,
  AssignedPlay,
  AchievementBadge,
  TestCategory,
  TeamRanking,
  PerformanceGoal
} from '../types';

// Wellness metric configuration
export const wellnessMetrics: WellnessMetric[] = [
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
export function secureRandom(min: number, max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] / (0xffffffff + 1)) * (max - min);
}

// Generate secure random integer in range [min, max]
export function secureRandomInt(min: number, max: number): number {
  return Math.floor(secureRandom(min, max + 1));
}

// Generate historical wellness data with secure random values
export const generateHistoricalData = (days: number = 30): WellnessData[] => {
  const data: WellnessData[] = [];
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
      hrv: secureRandomInt(40, 70),
      restingHeartRate: secureRandomInt(45, 60),
    });
  }
  return data;
};

// Calculate wellness insights
export const calculateWellnessInsights = (data: WellnessData[]) => {
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

export const generateInsights = (recent: WellnessAverages, previous: WellnessAverages): WellnessInsight[] => {
  const insights: WellnessInsight[] = [];
  
  if (recent.sleepQuality > previous.sleepQuality) {
    insights.push({ type: 'positive' as const, text: 'Your sleep quality has improved this week', icon: Moon });
  } else if (recent.sleepQuality < previous.sleepQuality - 0.5) {
    insights.push({ type: 'warning' as const, text: 'Sleep quality declining - consider adjusting bedtime routine', icon: Moon });
  }
  
  if (recent.readinessScore > 85) {
    insights.push({ type: 'positive' as const, text: 'Excellent readiness scores - you\'re in peak condition', icon: Activity });
  }
  
  if (recent.energyLevel < 7) {
    insights.push({ type: 'warning' as const, text: 'Energy levels below optimal - ensure adequate recovery', icon: Battery });
  }
  
  return insights;
};

// Mock assigned plays data
export const mockAssignedPlays: AssignedPlay[] = [
  {
    name: "Power Play Formation A",
    category: "Special Teams",
    status: "mastered",
    progress: 100,
    lastStudied: "2 days ago",
    difficulty: "Intermediate"
  },
  {
    name: "Defensive Zone Coverage",
    category: "Defense",
    status: "in-progress",
    progress: 75,
    lastStudied: "Yesterday",
    difficulty: "Advanced"
  },
  {
    name: "Breakout Pattern #3",
    category: "Transition",
    status: "new",
    progress: 25,
    lastStudied: "Just assigned",
    difficulty: "Beginner"
  }
];

// Mock achievement badges
export const mockAchievementBadges: AchievementBadge[] = [
  {
    name: "Quick Learner",
    description: "Master 5 plays in one week",
    earned: true,
    icon: "🚀",
    dateEarned: "Jan 15"
  },
  {
    name: "Power Play Expert", 
    description: "Perfect all power play formations",
    earned: true,
    icon: "⚡",
    dateEarned: "Jan 10"
  },
  {
    name: "Strategic Mind",
    description: "Study plays for 10 consecutive days", 
    earned: true,
    icon: "🧠",
    dateEarned: "Jan 18"
  },
  {
    name: "Team Player",
    description: "Help 3 teammates learn plays",
    earned: false,
    icon: "🤝",
    progress: "1/3"
  }
];

// Mock test categories for performance
export const mockTestCategories: TestCategory[] = [
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
];

// Mock team rankings
export const mockTeamRankings: TeamRanking[] = [
  { test: 'Vertical Jump', rank: 5, value: 65, leader: { name: 'Andersson', value: 72 } },
  { test: '10m Sprint', rank: 4, value: 1.72, leader: { name: 'Lindberg', value: 1.68 } },
  { test: 'VO2 Max', rank: 3, value: 58, leader: { name: 'Nilsson', value: 62 } },
  { test: 'Squat 1RM', rank: 8, value: 140, leader: { name: 'Johansson', value: 165 } },
];

// Mock performance goals
export const mockPerformanceGoals: PerformanceGoal[] = [
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
];

// Mock performance trend data
export const mockPerformanceTrends = [
  { date: 'Aug', value: 58, teamAvg: 56 },
  { date: 'Sep', value: 60, teamAvg: 57 },
  { date: 'Oct', value: 62, teamAvg: 58 },
  { date: 'Nov', value: 63, teamAvg: 59 },
  { date: 'Dec', value: 65, teamAvg: 60 },
];

// Mock radar data for performance profile
export const mockPerformanceRadar = [
  { category: 'Power', you: 85, team: 75 },
  { category: 'Speed', you: 82, team: 78 },
  { category: 'Strength', you: 68, team: 72 },
  { category: 'Agility', you: 90, team: 80 },
  { category: 'Endurance', you: 88, team: 82 },
  { category: 'Flexibility', you: 75, team: 70 },
];



