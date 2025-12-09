/**
 * PlayerDashboard Type Definitions
 * 
 * Extracted from PlayerDashboard.tsx for better maintainability
 */

// Wellness metric configuration type
export interface WellnessMetric {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  inverse?: boolean;
}

// Types for wellness data
export interface WellnessData {
  date: string;
  dayOfWeek?: string;
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

export interface WellnessAverages {
  sleepQuality: number;
  energyLevel: number;
  mood: number;
  readinessScore: number;
}

export interface WellnessInsight {
  type: 'positive' | 'warning';
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface WellnessTrends {
  sleepQuality: number;
  energyLevel: number;
  mood: number;
  readinessScore: number;
}

export interface WellnessInsights {
  trends: WellnessTrends;
  averages: WellnessAverages;
  insights: WellnessInsight[];
}

export interface WellnessForm {
  sleepHours: number;
  sleepQuality: number;
  energyLevel: number;
  mood: number;
  motivation: number;
  stressLevel: number;
  soreness: number;
  hydration: number;
  nutrition: number;
  bodyWeight: number;
  restingHeartRate: number;
  hrv: number;
  hrvDevice: 'whoop' | 'oura' | 'garmin' | 'polar' | 'manual';
  notes: string;
  symptoms: string[];
  injuries: string[];
}

export interface HrvData {
  current: number;
  sevenDayAvg: number;
  thirtyDayAvg: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

// Player info types
export interface PlayerInfo {
  name: string;
  number: number;
  position: string;
  team: string;
  age?: number;
  height?: string;
  weight?: string;
  organization?: string;
}

// Schedule event types
export interface ScheduleEvent {
  time: string;
  title: string;
  location: string;
  type: 'meeting' | 'ice-training' | 'physical-training' | 'video' | 'other';
  mandatory?: boolean;
  notes?: string;
}

export interface UpcomingEvent {
  date: string;
  title: string;
  time: string;
  location: string;
  type: 'meeting' | 'ice-training' | 'physical-training' | 'video' | 'other';
  importance: 'High' | 'Medium' | 'Low';
}

// Training types
export interface TrainingAssignment {
  title: string;
  due: string;
  progress: number;
  type: 'strength' | 'cardio' | 'skills' | 'recovery';
  description: string;
  assignedBy: string;
  estimatedTime: string;
}

export interface DevelopmentGoal {
  goal: string;
  progress: number;
  target: string;
  category: 'technical' | 'physical' | 'tactical' | 'mental';
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
}

// Tactical types
export interface AssignedPlay {
  name: string;
  category: string;
  status: 'mastered' | 'in-progress' | 'new';
  progress: number;
  lastStudied: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface AchievementBadge {
  name: string;
  description: string;
  earned: boolean;
  icon: string;
  dateEarned?: string;
  progress?: string;
}

// Performance test types
export interface PhysicalTest {
  name: string;
  value: number;
  unit: string;
  goal: number;
  percentile: number;
}

export interface TestCategory {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  tests: PhysicalTest[];
}

export interface PerformanceGoal {
  test: string;
  current: number;
  goal: number;
  deadline: string;
  progress: number;
  status: 'achieved' | 'on-track' | 'needs-work';
}

export interface TeamRanking {
  test: string;
  rank: number;
  value: number;
  leader: {
    name: string;
    value: number;
  };
}

// Tab types
export type PlayerTabValue = 'today' | 'training' | 'tactical' | 'wellness' | 'performance' | 'calendar';



