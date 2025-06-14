import { TestOption, CorrelationData, NormativeData, TestProtocol } from './types';

export const testOptions: Record<string, TestOption> = {
  // Anthropometric Tests
  height: { 
    label: 'Height', 
    unit: 'cm', 
    higher_is_better: true, 
    category: 'anthropometric',
    equipment: ['Stadiometer']
  },
  weight: { 
    label: 'Weight', 
    unit: 'kg', 
    higher_is_better: false, 
    category: 'anthropometric',
    equipment: ['Digital scale']
  },
  bodyFatPercentage: { 
    label: 'Body Fat %', 
    unit: '%', 
    higher_is_better: false, 
    category: 'anthropometric',
    equipment: ['Skinfold calipers', 'BIA analyzer']
  },
  armSpan: { 
    label: 'Arm Span', 
    unit: 'cm', 
    higher_is_better: true, 
    category: 'anthropometric'
  },
  sittingHeight: { 
    label: 'Sitting Height', 
    unit: 'cm', 
    higher_is_better: true, 
    category: 'anthropometric'
  },
  
  // Power Tests
  verticalJump: { 
    label: 'Vertical Jump (CMJ)', 
    unit: 'cm', 
    higher_is_better: true, 
    category: 'power',
    equipment: ['Vertec', 'Jump mat'],
    protocol: 'Countermovement jump with arm swing'
  },
  verticalJumpNoArms: { 
    label: 'Vertical Jump (No Arms)', 
    unit: 'cm',
    higher_is_better: true,
    category: 'power',
    equipment: ['Jump mat', 'Force platform'],
    protocol: 'CMJ with hands on hips'
  },
  squatJump: {
    label: 'Squat Jump',
    unit: 'cm',
    higher_is_better: true,
    category: 'power',
    equipment: ['Jump mat', 'Force platform'],
    protocol: 'From static squat position, no countermovement'
  },
  standingLongJump: { 
    label: 'Standing Long Jump', 
    unit: 'cm', 
    higher_is_better: true, 
    category: 'power',
    equipment: ['Measuring tape'],
    protocol: 'Maximum horizontal jump from standing'
  },
  threeStepJump: {
    label: '3-Step Jump',
    unit: 'cm',
    higher_is_better: true,
    category: 'power',
    equipment: ['Measuring tape'],
    protocol: 'Three consecutive bounds'
  },
  medicineballThrow: { 
    label: 'Medicine Ball Throw', 
    unit: 'cm', 
    higher_is_better: true, 
    category: 'power',
    equipment: ['3kg medicine ball'],
    protocol: 'Overhead backward throw'
  },
  
  // Speed Tests (Off-Ice)
  sprint6m: { 
    label: '6.1m Sprint (Off-Ice)', 
    unit: 's', 
    higher_is_better: false, 
    category: 'speed',
    equipment: ['Timing gates'],
    protocol: 'Maximum effort sprint, stationary start'
  },
  sprint10m: {
    label: '10m Sprint (Off-Ice)',
    unit: 's',
    higher_is_better: false,
    category: 'speed',
    equipment: ['Timing gates']
  },
  sprint20m: {
    label: '20m Sprint (Off-Ice)',
    unit: 's',
    higher_is_better: false,
    category: 'speed',
    equipment: ['Timing gates']
  },
  sprint30m: { 
    label: '30m Sprint (Off-Ice)', 
    unit: 's', 
    higher_is_better: false, 
    category: 'speed',
    equipment: ['Timing gates']
  },
  sprint40m: {
    label: '40m Sprint (Off-Ice)',
    unit: 's',
    higher_is_better: false,
    category: 'speed',
    equipment: ['Timing gates']
  },
  flying10m: {
    label: 'Flying 10m Sprint',
    unit: 's',
    higher_is_better: false,
    category: 'speed',
    equipment: ['Timing gates']
  },
  
  // Speed Tests (On-Ice)
  onIce6m: { 
    label: '6.1m On-Ice Sprint', 
    unit: 's', 
    higher_is_better: false, 
    category: 'speed',
    equipment: ['Timing gates', 'Ice rink']
  },
  onIce10m: {
    label: '10m On-Ice Sprint',
    unit: 's',
    higher_is_better: false,
    category: 'speed',
    equipment: ['Timing gates', 'Ice rink']
  },
  onIce20m: {
    label: '20m On-Ice Sprint',
    unit: 's',
    higher_is_better: false,
    category: 'speed',
    equipment: ['Timing gates', 'Ice rink']
  },
  onIce30m: { 
    label: '30m On-Ice Sprint', 
    unit: 's', 
    higher_is_better: false, 
    category: 'speed',
    equipment: ['Timing gates', 'Ice rink']
  },
  onIce40m: {
    label: '40m On-Ice Sprint',
    unit: 's',
    higher_is_better: false,
    category: 'speed',
    equipment: ['Timing gates', 'Ice rink']
  },
  onIceFlying10m: {
    label: 'Flying 10m (On-Ice)',
    unit: 's',
    higher_is_better: false,
    category: 'speed',
    equipment: ['Timing gates', 'Ice rink'],
    protocol: 'Maximum speed maintenance test'
  },  
  repeatedSprint7x40: {
    label: '7x40m Repeated Sprint',
    unit: 's',
    higher_is_better: false,
    category: 'speed',
    equipment: ['Timing gates']
  },
  
  // Agility Tests
  agility10_5_10_offIce: {
    label: '10-5-10 Agility (Off-Ice)',
    unit: 's',
    higher_is_better: false,
    category: 'agility',
    equipment: ['Timing gates', 'Cones']
  },
  onIceAgility10_5_10: {
    label: '10-5-10 Agility (On-Ice)',
    unit: 's',
    higher_is_better: false,
    category: 'agility',
    equipment: ['Timing gates', 'Cones', 'Ice rink']
  },
  corneringSTest: { 
    label: 'Cornering S Test', 
    unit: 's', 
    higher_is_better: false, 
    category: 'specific',
    equipment: ['Timing gates', 'Cones', 'Ice rink']
  },
  illinoisAgilityTest: {
    label: 'Illinois Agility Test',
    unit: 's',
    higher_is_better: false,
    category: 'agility',
    equipment: ['Timing gates', 'Cones', 'Ice rink']
  },
  illinoisAgilityTestWithPuck: {
    label: 'Illinois Agility (w/ Puck)',
    unit: 's',
    higher_is_better: false,
    category: 'agility',
    equipment: ['Timing gates', 'Cones', 'Ice rink', 'Puck']
  },  
  // Strength Tests
  squat1RM: { 
    label: 'Squat 1RM', 
    unit: 'kg', 
    higher_is_better: true, 
    category: 'strength',
    equipment: ['Squat rack', 'Barbell', 'Weight plates']
  },
  benchPress1RM: {
    label: 'Bench Press 1RM',
    unit: 'kg',
    higher_is_better: true,
    category: 'strength',
    equipment: ['Bench press', 'Barbell', 'Weight plates']
  },
  powerClean1RM: { 
    label: 'Power Clean 1RM', 
    unit: 'kg', 
    higher_is_better: true, 
    category: 'power',
    equipment: ['Olympic bar', 'Bumper plates', 'Platform']
  },
  gripStrengthLeft: {
    label: 'Grip Strength (Left)',
    unit: 'kg',
    higher_is_better: true,
    category: 'strength',
    equipment: ['Hand dynamometer']
  },
  gripStrengthRight: {
    label: 'Grip Strength (Right)',
    unit: 'kg',
    higher_is_better: true,
    category: 'strength',
    equipment: ['Hand dynamometer']
  },
  maxWeightPullUp: {
    label: 'Max Weight Pull-Up',
    unit: 'kg',
    higher_is_better: true,
    category: 'strength',
    equipment: ['Pull-up bar', 'Weight belt']
  },
  maxRepPullUps: {
    label: 'Max Rep Pull-Ups',
    unit: 'reps',
    higher_is_better: true,
    category: 'strength',
    equipment: ['Pull-up bar']
  },  
  // Aerobic Tests
  vo2Max: {
    label: 'VO2 Max',
    unit: 'ml/kg/min',
    higher_is_better: true,
    category: 'aerobic',
    equipment: ['Metabolic cart', 'Treadmill/Bike']
  },
  cooperTest: {
    label: 'Cooper Test (12-min)',
    unit: 'm',
    higher_is_better: true,
    category: 'aerobic',
    equipment: ['Track', 'Stopwatch']
  },
  beepTestLevel: {
    label: 'BEEP Test Level',
    unit: 'level',
    higher_is_better: true,
    category: 'aerobic',
    equipment: ['20m course', 'Audio system']
  },
  onIce30_15IIT: {
    label: '30-15 IIT (On-Ice)',
    unit: 'km/h',
    higher_is_better: true,
    category: 'aerobic',
    equipment: ['Ice rink', 'Cones', 'Whistle']
  },
  
  // Anaerobic Tests
  wingatePeakPower: {
    label: 'Wingate Peak Power',
    unit: 'W',
    higher_is_better: true,
    category: 'anaerobic',
    equipment: ['Cycle ergometer']
  },
  wingateAveragePower: {
    label: 'Wingate Average Power',
    unit: 'W',
    higher_is_better: true,
    category: 'anaerobic',
    equipment: ['Cycle ergometer']
  },
  wingateFatigueIndex: {
    label: 'Wingate Fatigue Index',
    unit: '%',
    higher_is_better: false,
    category: 'anaerobic',
    equipment: ['Cycle ergometer']
  },
  repeatedSprint6x54: {
    label: '6x54m Repeated Sprint',
    unit: 's',
    higher_is_better: false,
    category: 'anaerobic',
    equipment: ['Timing gates']
  },
  
  // Hockey Specific
  slideBoard: { 
    label: 'Slide Board', 
    unit: 'reps/30s', 
    higher_is_better: true, 
    category: 'specific',
    equipment: ['Slide board'],
    protocol: 'Maximum reps in 30 seconds'
  },
  shotVelocity: {
    label: 'Shot Velocity',
    unit: 'km/h',
    higher_is_better: true,
    category: 'specific'
  },
  passAccuracy: {
    label: 'Pass Accuracy',
    unit: '%',
    higher_is_better: true,
    category: 'specific'
  },
};

export const correlationData: CorrelationData[] = [
  { 
    test: 'Vertical Jump (CMJ)', 
    correlation: -0.65, 
    significance: 'p < 0.01', 
    explanation: 'Strong negative correlation with on-ice sprint times. Higher jumps correlate with faster skating speeds.',
    recommendations: 'Focus on plyometric exercises: box jumps, depth jumps, and explosive squat jumps',
    relatedTo: 'Initial acceleration (0-6m)',
    strength: 'strong'
  },
  { 
    test: 'Standing Long Jump', 
    correlation: -0.53, 
    significance: 'p < 0.01', 
    explanation: 'Moderate negative correlation showing horizontal power relates to skating speed.',
    recommendations: 'Include broad jumps, horizontal bounds, and single-leg horizontal jumps',
    relatedTo: 'Acceleration phase (0-10m)',
    strength: 'moderate'
  },
  { 
    test: '30m Sprint (Off-Ice)', 
    correlation: 0.71, 
    significance: 'p < 0.01', 
    explanation: 'Strong positive correlation between off-ice and on-ice sprint times.',
    recommendations: 'Sprint training with focus on acceleration technique and maximum velocity',
    relatedTo: 'Maximum skating speed',
    strength: 'strong'
  },
  { 
    test: 'Slide Board (reps)', 
    correlation: -0.62, 
    significance: 'p < 0.01', 
    explanation: 'Strong negative correlation - more reps predict faster skating. Most specific off-ice test.',
    recommendations: 'Regular slide board training 2-3 times per week, 30-45 seconds intervals',
    relatedTo: 'Overall skating efficiency',
    strength: 'strong'
  },
  { 
    test: 'Power Clean (kg/bw)', 
    correlation: -0.56, 
    significance: 'p < 0.05', 
    explanation: 'Moderate correlation between relative power and skating speed.',
    recommendations: 'Olympic lifting program focusing on explosive triple extension',
    relatedTo: 'Power development',
    strength: 'moderate'
  },
  { 
    test: 'Squat 1RM', 
    correlation: -0.15, 
    significance: 'p > 0.05', 
    explanation: 'Weak correlation with sprint times. Strength is important but not directly predictive.',
    recommendations: 'Maintain strength base but focus on power conversion',
    relatedTo: 'General strength base',
    strength: 'weak'
  },
];

export const normativeData: NormativeData = {
  elite: {
    height: { excellent: 185, good: 182, average: 180, belowAverage: 178, poor: 175 },
    weight: { excellent: 88, good: 85, average: 82, belowAverage: 80, poor: 77 },
    bodyFat: { excellent: 8, good: 10, average: 12, belowAverage: 14, poor: 16 },
    verticalJump: { excellent: 60, good: 55, average: 50, belowAverage: 45, poor: 40 },
    standingLongJump: { excellent: 265, good: 255, average: 245, belowAverage: 235, poor: 225 },
    threeStepJump: { excellent: 800, good: 750, average: 700, belowAverage: 650, poor: 600 },
    sprint30m: { excellent: 4.0, good: 4.1, average: 4.2, belowAverage: 4.3, poor: 4.4 },
    sprint6m: { excellent: 1.05, good: 1.08, average: 1.11, belowAverage: 1.14, poor: 1.17 },
    onIce30m: { excellent: 4.15, good: 4.25, average: 4.35, belowAverage: 4.45, poor: 4.55 },
    onIce6m: { excellent: 1.08, good: 1.11, average: 1.14, belowAverage: 1.17, poor: 1.20 },
    squat1RM: { excellent: 160, good: 145, average: 130, belowAverage: 115, poor: 100 },
    powerClean1RM: { excellent: 100, good: 90, average: 80, belowAverage: 70, poor: 60 },
    vo2Max: { excellent: 60, good: 56, average: 52, belowAverage: 48, poor: 44 },
    cooperTest: { excellent: 3200, good: 3000, average: 2800, belowAverage: 2600, poor: 2400 },
    wingatePeakPower: { excellent: 15, good: 13.5, average: 12, belowAverage: 10.5, poor: 9 },
    slideBoard: { excellent: 45, good: 40, average: 35, belowAverage: 30, poor: 25 },
  },
  subElite: {
    height: { excellent: 182, good: 179, average: 176, belowAverage: 173, poor: 170 },
    weight: { excellent: 82, good: 85, average: 88, belowAverage: 91, poor: 94 },
    bodyFatPercentage: { excellent: 10, good: 12, average: 14, belowAverage: 16, poor: 18 },
    verticalJump: { excellent: 55, good: 50, average: 45, belowAverage: 40, poor: 35 },
    standingLongJump: { excellent: 255, good: 245, average: 235, belowAverage: 225, poor: 215 },
    sprint30m: { excellent: 4.1, good: 4.2, average: 4.3, belowAverage: 4.4, poor: 4.5 },
    sprint6m: { excellent: 1.05, good: 1.1, average: 1.15, belowAverage: 1.17, poor: 1.2 },
    onIce30m: { excellent: 4.0, good: 4.1, average: 4.2, belowAverage: 4.3, poor: 4.4 },
    squat1RM: { excellent: 160, good: 140, average: 120, belowAverage: 100, poor: 80 },
    vo2Max: { excellent: 55, good: 50, average: 45, belowAverage: 42, poor: 40 },
    cooperTest: { excellent: 3000, good: 2800, average: 2600, belowAverage: 2500, poor: 2400 },
  },
  junior: {
    height: { excellent: 179, good: 176, average: 173, belowAverage: 171, poor: 170 },
    weight: { excellent: 75, good: 78, average: 81, belowAverage: 83, poor: 84 },
    bodyFatPercentage: { excellent: 11, good: 13, average: 15, belowAverage: 17, poor: 18 },
    verticalJump: { excellent: 50, good: 45, average: 40, belowAverage: 37, poor: 35 },
    standingLongJump: { excellent: 245, good: 235, average: 225, belowAverage: 220, poor: 215 },
    sprint30m: { excellent: 4.2, good: 4.3, average: 4.4, belowAverage: 4.45, poor: 4.5 },
    squat1RM: { excellent: 140, good: 120, average: 100, belowAverage: 90, poor: 80 },
  },
  youth: {
    height: { excellent: 170, good: 167, average: 164, belowAverage: 162, poor: 161 },
    weight: { excellent: 65, good: 68, average: 71, belowAverage: 73, poor: 74 },
    bodyFatPercentage: { excellent: 12, good: 14, average: 16, belowAverage: 18, poor: 19 },
    verticalJump: { excellent: 45, good: 40, average: 35, belowAverage: 32, poor: 30 },
    standingLongJump: { excellent: 225, good: 215, average: 205, belowAverage: 200, poor: 195 },
    sprint30m: { excellent: 4.3, good: 4.4, average: 4.5, belowAverage: 4.55, poor: 4.6 },
  }
};

export const testCategories = {
  anthropometric: {
    label: 'Anthropometric',
    tests: ['height', 'weight', 'bodyFatPercentage', 'armSpan', 'sittingHeight'],
    color: '#94a3b8',
    icon: 'Ruler',
    description: 'Basic body measurements and composition'
  },
  power: {
    label: 'Power Tests',
    tests: ['verticalJump', 'standingLongJump', 'threeStepJump', 'powerClean1RM', 'medicineballThrow'],
    color: '#8b5cf6',
    icon: 'Zap',
    description: 'Explosive power and jumping ability'
  },
  speed: {
    label: 'Speed Tests',
    tests: ['sprint30m', 'sprint6m', 'onIce30m', 'onIce6m', 'sprint10m', 'sprint20m', 'sprint40m', 'onIce10m', 'onIce20m', 'onIce40m', 'onIceFlying10m', 'repeatedSprint7x40'],
    color: '#3b82f6',
    icon: 'Timer',
    description: 'Linear speed and acceleration'
  },
  strength: {
    label: 'Strength Tests',
    tests: ['squat1RM', 'benchPress1RM', 'gripStrengthLeft', 'gripStrengthRight', 'maxWeightPullUp', 'maxRepPullUps'],
    color: '#f59e0b',
    icon: 'Dumbbell',
    description: 'Maximum strength in key lifts'
  },
  agility: {
    label: 'Agility Tests',
    tests: ['agility10_5_10_offIce', 'onIceAgility10_5_10', 'corneringSTest', 'illinoisAgilityTest', 'illinoisAgilityTestWithPuck'],
    color: '#10b981',
    icon: 'Navigation',
    description: 'Change of direction and agility'
  },
  specific: {
    label: 'Hockey-Specific',
    tests: ['slideBoard', 'shotVelocity', 'passAccuracy'],
    color: '#ef4444',
    icon: 'Target',
    description: 'Sport-specific skills and movements'
  },
  aerobic: {
    label: 'Aerobic Capacity',
    tests: ['vo2Max', 'cooperTest', 'beepTestLevel', 'onIce30_15IIT'],
    color: '#06b6d4',
    icon: 'Wind',
    description: 'Cardiovascular endurance'
  },
  anaerobic: {
    label: 'Anaerobic Power',
    tests: ['wingatePeakPower', 'wingateAveragePower', 'wingateFatigueIndex', 'repeatedSprint6x54'],
    color: '#ec4899',
    icon: 'Flame',
    description: 'High-intensity power output'
  }
};

// Test protocols for reference
export const testProtocols: Record<string, TestProtocol> = {
  verticalJump: {
    id: 'verticalJump',
    name: 'Vertical Jump (CMJ)',
    category: 'power',
    equipment: ['Vertec or jump mat'],
    procedure: [
      'Stand with feet shoulder-width apart',
      'Perform a quick countermovement by bending knees to approximately 90 degrees',
      'Jump as high as possible with arm swing',
      'Record best of three attempts to nearest 0.1 cm'
    ],
    warmUp: [
      'Dynamic warm-up including leg swings, high knees, and practice jumps',
      '5 minutes general movement',
      '10 bodyweight squats',
      '5 practice jumps at 50%, 75%, and 90% effort'
    ],
    safetyConsiderations: [
      'Ensure landing surface is appropriate',
      'Check for adequate overhead clearance',
      'Warm up thoroughly before maximal attempts'
    ],
    commonErrors: [
      'Insufficient countermovement depth',
      'Poor arm swing timing',
      'Landing with stiff legs',
      'Inconsistent technique between attempts'
    ],
    videoUrl: ''
  },
  sprint30m: {
    id: 'sprint30m',
    name: '30m Sprint Test',
    category: 'speed',
    equipment: ['Timing gates', 'Measuring tape'],
    procedure: [
      'Set up timing gates at 0m, 6.1m, and 30m',
      'Start from stationary position, 0.5m behind first gate',
      'Sprint at maximum effort',
      'Record time at both 6.1m (acceleration) and 30m (top speed)'
    ],
    warmUp: [
      'Progressive sprints at 60%, 80%, and 90% intensity',
      '5 minutes general warm-up',
      'Dynamic stretching focusing on hip flexors and hamstrings',
      '2-3 practice starts'
    ],
    safetyConsiderations: [
      'Ensure running surface is dry and clear',
      'Check for adequate run-off area',
      'Proper footwear required'
    ],
    commonErrors: [
      'False starts or rolling starts',
      'Decelerating before finish line',
      'Poor starting position',
      'Inconsistent effort between attempts'
    ],
    videoUrl: ''
  },
  slideBoard: {
    id: 'slideBoard',
    name: 'Slide Board',
    category: 'specific',
    equipment: ['Slide board'],
    procedure: [
      'Stand on slide board with proper footwear/booties',
      'Push off from one side to the other',
      'Maintain low athletic position throughout',
      'Count complete cycles (both sides = 1 rep)',
      'Perform for 30 seconds at maximum pace'
    ],
    warmUp: [
      '5 minutes general warm-up',
      '2 sets of 10 lateral lunges each side',
      '1 set of 15 seconds slide board at easy pace',
      '1 set of 10 seconds slide board at moderate pace'
    ],
    safetyConsiderations: [
      'Check slide board surface is clean',
      'Ensure proper footwear/booties are used',
      'Clear area around slide board'
    ],
    commonErrors: [
      'Standing too upright',
      'Not pushing fully to each side',
      'Losing rhythm during test',
      'Improper footwear causing slipping'
    ],
    videoUrl: ''
  },
  // Add more protocols as needed
};