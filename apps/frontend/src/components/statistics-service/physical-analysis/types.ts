export interface AnthropometricData {
  height: number; // cm
  weight: number; // kg
  bodyFatPercentage?: number; // %
  dateRecorded: string;
}

export interface PowerTestData {
  // Jump Tests
  verticalJump?: number; // cm
  muscleLabCMJ?: {
    height: number; // cm
    power: number; // W
    forceTimeData?: any[];
  };
  squatJump?: number; // cm
  standingLongJump?: number; // cm
  threeStepJump?: number; // cm
}

export interface SpeedTestData {
  // Off-Ice Sprint Tests
  sprint6m?: number; // seconds
  sprint10m?: number; // seconds
  sprint20m?: number; // seconds
  sprint30m?: number; // seconds
  sprint40m?: number; // seconds
  
  // On-Ice Sprint Tests
  onIce6m?: number; // seconds
  onIce10m?: number; // seconds
  onIce20m?: number; // seconds
  onIce30m?: number; // seconds
  onIce40m?: number; // seconds
  onIceFlying10m?: number; // seconds
  
  // Repeated Sprint Tests
  repeatedSprint7x40m?: {
    times: number[];
    meanTime: number;
    fatigueIndex: number; // %
  };
}

export interface AgilityTestData {
  // Off-Ice Agility
  agility10_5_10?: number; // seconds
  
  // On-Ice Agility
  onIceAgility10_5_10?: number; // seconds
  corneringSTest?: number; // seconds
  illinoisAgilityTest?: number; // seconds
  illinoisAgilityTestWithPuck?: number; // seconds
}

export interface StrengthTestData {
  squat1RM?: number; // kg
  benchPress1RM?: number; // kg
  powerClean1RM?: number; // kg
  gripStrengthLeft?: number; // kg
  gripStrengthRight?: number; // kg
  maxWeightPullUp?: number; // kg (weight added)
  maxRepPullUps?: number; // count
}

export interface AerobicTestData {
  vo2Max?: number; // ml/kg/min
  cooperTest?: number; // meters
  beepTestLevel?: string; // e.g., "Level 15.3"
  beepTestVO2Max?: number; // ml/kg/min (estimated)
  onIce30_15IIT?: number; // km/h (final speed)
}

export interface AnaerobicTestData {
  wingatePeakPower?: number; // W
  wingateAveragePower?: number; // W
  wingateFatigueIndex?: number; // %
  repeatedSprint6x54m?: {
    times: number[];
    meanTime: number;
    fatigueIndex: number; // %
  };
}

export interface TestData {
  date: string;
  // Anthropometric
  height?: number;
  weight?: number;
  bodyFat?: number;
  armSpan?: number;
  sittingHeight?: number;
  
  // Power Tests
  verticalJump?: number;
  verticalJumpNoArms?: number;
  squatJump?: number;
  standingLongJump?: number;
  threeStepJump?: number;
  medicineballThrow?: number;
  
  // Speed Tests (Off-Ice)
  sprint6m?: number;
  sprint10m?: number;
  sprint20m?: number;
  sprint30m?: number;
  sprint40m?: number;
  flying10m?: number;
  
  // Speed Tests (On-Ice)
  onIce6m?: number;
  onIce10m?: number;
  onIce20m?: number;
  onIce30m?: number;
  onIce40m?: number;
  onIceFlying10m?: number;
  repeatedSprint7x40?: number;
  repeatedSprintFatigue?: number;
  
  // Agility Tests
  agility10_5_10_offIce?: number;
  agility10_5_10_onIce?: number;
  corneringSTest?: number;
  illinoisAgility?: number;
  illinoisAgilityWithPuck?: number;
  
  // Strength Tests
  squat1RM?: number;
  benchPress1RM?: number;
  deadlift1RM?: number;
  powerClean?: number;
  powerClean1RM?: number;
  gripStrengthLeft?: number;
  gripStrengthRight?: number;
  pullUpMax?: number;
  pullUpMaxReps?: number;
  
  // Aerobic Tests
  vo2Max?: number;
  cooperTest?: number;
  beepTest?: number;
  onIce30_15?: number;
  
  // Anaerobic Tests
  wingatePeakPower?: number;
  wingateAvgPower?: number;
  wingateFatigueIndex?: number;
  repeatedSprint6x54?: number;
  
  // Hockey Specific
  slideBoard?: number;
  slideBoardDistance?: number;
  shotVelocity?: number;
  passAccuracy?: number;
  
  // Environmental & Notes
  temperature?: number;
  humidity?: number;
  notes?: string;
  testConditions?: string;
}

export interface PlayerData {
  id: string;
  name: string;
  position: 'Forward' | 'Defense' | 'Goalie';
  age: number;
  dateOfBirth: string;
  skillLevel: 'elite' | 'sub-elite' | 'junior' | 'youth';
  team: string;
  jerseyNumber: number;
  dominantHand: 'left' | 'right';
  testResults: TestData;
  historicalResults?: TestData[];
  injuryHistory?: InjuryRecord[];
}

export interface InjuryRecord {
  date: string;
  type: string;
  severity: 'minor' | 'moderate' | 'severe';
  recoveryTime: number;
  affectedArea: string;
  notes?: string;
}

export interface CorrelationData {
  test: string;
  correlation: number;
  significance: string;
  pValue?: number;
  explanation: string;
  recommendations: string;
  relatedTo: string;
  strength: 'strong' | 'moderate' | 'weak';
  sampleSize?: number;
}

export interface TestOption {
  label: string;
  unit: string;
  higher_is_better: boolean;
  category: 'anthropometric' | 'power' | 'speed' | 'strength' | 'agility' | 'aerobic' | 'anaerobic' | 'specific';
  protocol?: string;
  equipment?: string[];
  normativeData?: NormativeValues;
}

export interface NormativeValues {
  [skillLevel: string]: {
    excellent: number;
    good: number;
    average: number;
    belowAverage: number;
    poor: number;
  };
}

export interface NormativeData {
  [skillLevel: string]: {
    [test: string]: NormativeValues['elite'];
  };
}

export interface TrainingRecommendation {
  priority: 'high' | 'medium' | 'low';
  area: string;
  suggestion: string;
  impact: string;
  exercises?: string[];
  frequency?: string;
  duration?: string;
}

export interface TestBatch {
  id: string;
  name: string;
  date: string;
  testAdministrator: string;
  location: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  testTypes: string[];
  totalPlayers: number;
  completedPlayers: string[];
  notes?: string;
}

export interface TestProtocol {
  id: string;
  name: string;
  category: string;
  equipment: string[];
  procedure: string[];
  warmUp: string[];
  safetyConsiderations: string[];
  commonErrors: string[];
  videoUrl?: string;
}

export interface TeamStatistics {
  teamId: string;
  averages: Partial<TestData>;
  improvements: {
    [test: string]: number;
  };
  topPerformers: {
    [test: string]: string;
  };
  needsImprovement: {
    [test: string]: string[];
  };
}

export interface PerformanceGoal {
  playerId: string;
  testId: string;
  currentValue: number;
  targetValue: number;
  targetDate: string;
  status: 'active' | 'achieved' | 'missed';
  notes?: string;
}

export interface TestComparison {
  playerId: string;
  test: string;
  dates: string[];
  values: number[];
  percentChange: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface CustomTest {
  id: string;
  name: string;
  category: string;
  unit: string;
  higherIsBetter: boolean;
  description: string;
  protocol: string;
  createdBy: string;
  organizationId: string;
}