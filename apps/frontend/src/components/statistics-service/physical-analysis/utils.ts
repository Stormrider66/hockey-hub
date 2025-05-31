import { PlayerData, TrainingRecommendation, TestData } from './types';
import { testOptions, normativeData } from './constants';

export function calculatePercentile(
  value: number, 
  test: string, 
  skillLevel: 'elite' | 'sub-elite' | 'junior' | 'youth' = 'elite'
): number {
  const norms = normativeData[skillLevel]?.[test];
  if (!norms) return 50;
  
  const isHigherBetter = testOptions[test]?.higher_is_better;
  if (isHigherBetter) {
    if (value >= norms.excellent) return 90;
    if (value >= norms.good) return 70;
    if (value >= norms.average) return 50;
    if (value >= norms.belowAverage) return 30;
    if (value >= norms.poor) return 10;
    return 5;
  } else {
    if (value <= norms.excellent) return 90;
    if (value <= norms.good) return 70;
    if (value <= norms.average) return 50;
    if (value <= norms.belowAverage) return 30;
    if (value <= norms.poor) return 10;
    return 5;
  }
}

export function calculateZScore(
  value: number | undefined,
  mean: number,
  stdDev: number
): number {
  if (value === undefined || value === null) return 0;
  return (value - mean) / stdDev;
}

export function generateRecommendations(player: PlayerData): TrainingRecommendation[] {
  const recommendations: TrainingRecommendation[] = [];
  const results = player.testResults;
  
  // Check vertical jump
  if (results.verticalJump) {
    const percentile = calculatePercentile(results.verticalJump, 'verticalJump', player.skillLevel);
    if (percentile < 50) {
      recommendations.push({
        priority: 'high',
        area: 'Power Development',
        suggestion: 'Vertical jump below elite standards. Implement plyometric program 2-3x/week.',
        impact: 'Can improve initial acceleration by 3-5%',
        exercises: ['Box jumps', 'Depth jumps', 'Jump squats', 'Single-leg bounds'],
        frequency: '2-3 times per week',
        duration: '30-45 minutes'
      });
    }
  }
  
  // Check slide board
  if (results.slideBoard) {
    const percentile = calculatePercentile(results.slideBoard, 'slideBoard', player.skillLevel);
    if (percentile < 70) {
      recommendations.push({
        priority: 'high',
        area: 'Skating Specificity',
        suggestion: 'Slide board performance is the strongest predictor of on-ice speed. Increase to 3-4 sessions/week.',
        impact: 'Most direct transfer to skating speed',
        exercises: ['30s intervals', '45s intervals', 'Single-leg slide board'],
        frequency: '3-4 times per week',
        duration: '20-30 minutes'
      });
    }
  }
  
  // Check sprint times
  if (results.sprint30m) {
    const percentile = calculatePercentile(results.sprint30m, 'sprint30m', player.skillLevel);
    if (percentile < 50) {
      recommendations.push({
        priority: 'medium',
        area: 'Sprint Speed',
        suggestion: 'Off-ice sprint times can be improved. Add acceleration drills and resisted sprints.',
        impact: 'Strong correlation with maximum skating velocity',
        exercises: ['10m accelerations', 'Resisted sprints', 'Flying 20m sprints'],
        frequency: '2 times per week',
        duration: '20-30 minutes'
      });
    }
  }
  
  // Check strength levels
  if (results.squat1RM && results.weight) {
    const relativeStrength = results.squat1RM / results.weight;
    if (relativeStrength < 1.5) {
      recommendations.push({
        priority: 'medium',
        area: 'Strength Base',
        suggestion: 'Relative strength below optimal levels. Focus on building strength foundation.',
        impact: 'Foundation for power development',
        exercises: ['Back squats', 'Front squats', 'Bulgarian split squats'],
        frequency: '2-3 times per week',
        duration: '45-60 minutes'
      });
    }
  }
  
  // Check body composition
  if (results.bodyFat) {
    const percentile = calculatePercentile(results.bodyFat, 'bodyFat', player.skillLevel);
    if (percentile < 30) {
      recommendations.push({
        priority: 'low',
        area: 'Body Composition',
        suggestion: 'Body fat percentage above optimal range. Consider nutritional adjustments.',
        impact: 'Improved power-to-weight ratio',
        exercises: ['High-intensity intervals', 'Metabolic conditioning'],
        frequency: '3-4 times per week',
        duration: '30-45 minutes'
      });
    }
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export function prepareRadarData(player: PlayerData) {
  const categories = [
    { test: 'Power', key: 'verticalJump' },
    { test: 'Speed', key: 'sprint30m' },
    { test: 'Strength', key: 'squat1RM' },
    { test: 'Agility', key: 'corneringSTest' },
    { test: 'On-Ice Speed', key: 'onIce30m' },
    { test: 'Endurance', key: 'vo2Max' }
  ];
  
  return categories.map(({ test, key }) => {
    const value = player.testResults[key as keyof TestData] as number;
    const percentile = value ? calculatePercentile(value, key, player.skillLevel) : 0;
    return { 
      test, 
      value: percentile, 
      fullMark: 100 
    };
  });
}

export function generateScatterData(xTest: string, yTest: string, correlation: number): any[] {
  const data = [];
  const n = 30;
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 20 + 45;
    const noise = (Math.random() - 0.5) * 5;
    const y = correlation < 0 
      ? 5.5 - (x - 45) * 0.03 + noise * 0.1
      : 3.8 + (x - 45) * 0.02 + noise * 0.1;
    data.push({ x: x.toFixed(1), y: y.toFixed(2) });
  }
  return data;
}

export function calculateFatigueIndex(times: number[]): number {
  if (times.length === 0) return 0;
  const slowest = Math.max(...times);
  const fastest = Math.min(...times);
  return ((slowest - fastest) / fastest) * 100;
}

export function calculateMeanTime(times: number[]): number {
  if (times.length === 0) return 0;
  return times.reduce((a, b) => a + b, 0) / times.length;
}

export function formatTestValue(value: number | undefined, test: string): string {
  if (value === undefined || value === null) return 'N/A';
  const testOption = testOptions[test];
  if (!testOption) return value.toString();
  
  return `${value.toFixed(testOption.unit === 's' ? 2 : 1)} ${testOption.unit}`;
}

export function getTestCategory(testKey: string): string {
  const test = testOptions[testKey];
  return test ? test.category : 'unknown';
}

export function calculateTeamAverages(teamData: PlayerData[]): Partial<TestData> {
  const averages: Partial<TestData> = {};
  const tests = Object.keys(testOptions);
  
  tests.forEach(test => {
    const values = teamData
      .map(player => player.testResults[test as keyof TestData] as number)
      .filter(val => val !== undefined && val !== null);
    
    if (values.length > 0) {
      const sum = values.reduce((acc, val) => acc + val, 0);
      averages[test as keyof TestData] = sum / values.length as any;
    }
  });
  
  return averages;
}

export function exportToCSV(data: PlayerData[], filename: string = 'physical-test-data.csv') {
  const headers = [
    'Player Name',
    'Position',
    'Age',
    'Skill Level',
    ...Object.keys(testOptions).map(key => testOptions[key].label)
  ];
  
  const rows = data.map(player => {
    const row = [
      player.name,
      player.position,
      player.age.toString(),
      player.skillLevel,
      ...Object.keys(testOptions).map(key => {
        const value = player.testResults[key as keyof TestData];
        return value !== undefined ? value.toString() : '';
      })
    ];
    return row;
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function calculateImprovements(
  currentData: TestData, 
  previousData: TestData
): Record<string, number> {
  const improvements: Record<string, number> = {};
  
  Object.keys(testOptions).forEach(test => {
    const current = currentData[test as keyof TestData] as number;
    const previous = previousData[test as keyof TestData] as number;
    
    if (current !== undefined && previous !== undefined && previous !== 0) {
      const percentChange = ((current - previous) / previous) * 100;
      // Invert for tests where lower is better
      improvements[test] = testOptions[test].higher_is_better ? percentChange : -percentChange;
    }
  });
  
  return improvements;
}

export function filterTestsByCategory(category: string): string[] {
  return Object.entries(testOptions)
    .filter(([_, test]) => test.category === category)
    .map(([key, _]) => key);
}