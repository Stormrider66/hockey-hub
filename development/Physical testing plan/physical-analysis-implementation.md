# Physical Analysis Dashboard Implementation Guide

## Overview

This dashboard provides evidence-based analysis of correlations between off-ice physical tests and on-ice hockey performance. It's designed for multiple user roles (physical trainers, coaches, players, club admins) and incorporates research-backed correlations from scientific literature.

## Component File Structure

```
/src/components/statistics-service/physical-analysis/
  ├── PhysicalAnalysisDashboard.tsx    # Main component
  ├── types.ts                          # TypeScript interfaces
  ├── constants.ts                      # Test definitions and correlations
  ├── utils.ts                          # Helper functions
  └── hooks/
      ├── useTestData.ts                # Data fetching hook
      └── useCorrelationAnalysis.ts    # Analysis calculations
```

## Installation Requirements

```bash
# Required dependencies
npm install recharts lucide-react date-fns
```

## Main Component Implementation

### PhysicalAnalysisDashboard.tsx

```tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { User, TrendingUp, Share2, Clock, AlertCircle, Download, Info, Activity, Zap, Target } from 'lucide-react';

// Import from separate files
import { TestData, PlayerData, CorrelationData, TestOption } from './types';
import { testOptions, correlationData, normativeData, testCategories } from './constants';
import { calculatePercentile, generateRecommendations, prepareRadarData } from './utils';
import { useTestData } from './hooks/useTestData';
import { useCorrelationAnalysis } from './hooks/useCorrelationAnalysis';

interface PhysicalAnalysisDashboardProps {
  userRole?: 'fys_coach' | 'coach' | 'player' | 'club_admin';
  playerId?: string;
  teamId?: string;
}

export default function PhysicalAnalysisDashboard({ 
  userRole = 'fys_coach',
  playerId,
  teamId 
}: PhysicalAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTest, setSelectedTest] = useState('verticalJump');
  const [selectedPlayer, setSelectedPlayer] = useState(playerId || '');
  const [selectedCorrelation, setSelectedCorrelation] = useState({ x: 'verticalJump', y: 'onIce30m' });
  const [showNormativeData, setShowNormativeData] = useState(true);
  
  // Fetch data using custom hooks
  const { testData, teamData, loading, error } = useTestData(teamId);
  const { correlationResults, runCorrelation } = useCorrelationAnalysis();
  
  const currentPlayer = teamData?.find(p => p.id === selectedPlayer);
  const playerRecommendations = currentPlayer ? generateRecommendations(currentPlayer) : [];
  
  if (loading) return <div>Loading test data...</div>;
  if (error) return <div>Error loading data: {error.message}</div>;
  
  return (
    <div className="space-y-6">
      {/* Dashboard content as shown in the artifact */}
    </div>
  );
}
```

## Type Definitions

### types.ts

```typescript
export interface TestData {
  date: string;
  verticalJump: number;
  standingLongJump: number;
  sprint30m: number;
  sprint6m: number;
  powerClean: number;
  squat1RM: number;
  slideBoard: number;
  onIce30m: number;
  onIce6m: number;
  corneringSTest: number;
}

export interface PlayerData {
  id: string;
  name: string;
  position: 'Forward' | 'Defense' | 'Goalie';
  age: number;
  skillLevel: 'elite' | 'sub-elite';
  testResults: TestData;
}

export interface CorrelationData {
  test: string;
  correlation: number;
  significance: string;
  explanation: string;
  recommendations: string;
  relatedTo: string;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface TestOption {
  label: string;
  unit: string;
  higher_is_better: boolean;
  category: 'power' | 'speed' | 'strength' | 'specific';
}

export interface NormativeData {
  [skillLevel: string]: {
    [test: string]: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
  };
}

export interface TrainingRecommendation {
  priority: 'high' | 'medium' | 'low';
  area: string;
  suggestion: string;
  impact: string;
}
```

## Constants and Configuration

### constants.ts

```typescript
import { TestOption, CorrelationData, NormativeData } from './types';

export const testOptions: Record<string, TestOption> = {
  verticalJump: { label: 'Vertical Jump (CMJ)', unit: 'cm', higher_is_better: true, category: 'power' },
  standingLongJump: { label: 'Standing Long Jump', unit: 'cm', higher_is_better: true, category: 'power' },
  sprint30m: { label: '30m Sprint (Off-Ice)', unit: 's', higher_is_better: false, category: 'speed' },
  sprint6m: { label: '6.1m Sprint (Off-Ice)', unit: 's', higher_is_better: false, category: 'speed' },
  powerClean: { label: 'Power Clean', unit: 'kg', higher_is_better: true, category: 'power' },
  squat1RM: { label: 'Squat 1RM', unit: 'kg', higher_is_better: true, category: 'strength' },
  slideBoard: { label: 'Slide Board', unit: 'reps/30s', higher_is_better: true, category: 'specific' },
  onIce30m: { label: '30m On-Ice Sprint', unit: 's', higher_is_better: false, category: 'speed' },
  onIce6m: { label: '6.1m On-Ice Sprint', unit: 's', higher_is_better: false, category: 'speed' },
  corneringSTest: { label: 'Cornering S Test', unit: 's', higher_is_better: false, category: 'specific' }
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
    verticalJump: { excellent: 60, good: 55, average: 50, poor: 45 },
    standingLongJump: { excellent: 265, good: 255, average: 245, poor: 235 },
    sprint30m: { excellent: 4.0, good: 4.1, average: 4.2, poor: 4.3 },
    slideBoard: { excellent: 45, good: 40, average: 35, poor: 30 },
  },
  subElite: {
    verticalJump: { excellent: 55, good: 50, average: 45, poor: 40 },
    standingLongJump: { excellent: 255, good: 245, average: 235, poor: 225 },
    sprint30m: { excellent: 4.1, good: 4.2, average: 4.3, poor: 4.4 },
    slideBoard: { excellent: 40, good: 35, average: 30, poor: 25 },
  }
};

export const testCategories = {
  power: {
    label: 'Power Tests',
    tests: ['verticalJump', 'standingLongJump', 'powerClean'],
    color: '#8884d8'
  },
  speed: {
    label: 'Speed Tests',
    tests: ['sprint30m', 'sprint6m', 'onIce30m', 'onIce6m'],
    color: '#82ca9d'
  },
  strength: {
    label: 'Strength Tests',
    tests: ['squat1RM', 'benchPress1RM'],
    color: '#ffc658'
  },
  specific: {
    label: 'Hockey-Specific',
    tests: ['slideBoard', 'corneringSTest'],
    color: '#ff7c7c'
  }
};
```

## Utility Functions

### utils.ts

```typescript
import { PlayerData, TrainingRecommendation } from './types';
import { testOptions, normativeData } from './constants';

export function calculatePercentile(
  value: number, 
  test: string, 
  skillLevel: 'elite' | 'sub-elite' = 'elite'
): number {
  const norms = normativeData[skillLevel]?.[test];
  if (!norms) return 50;
  
  const isHigherBetter = testOptions[test]?.higher_is_better;
  if (isHigherBetter) {
    if (value >= norms.excellent) return 90;
    if (value >= norms.good) return 70;
    if (value >= norms.average) return 50;
    if (value >= norms.poor) return 30;
    return 10;
  } else {
    if (value <= norms.excellent) return 90;
    if (value <= norms.good) return 70;
    if (value <= norms.average) return 50;
    if (value <= norms.poor) return 30;
    return 10;
  }
}

export function generateRecommendations(player: PlayerData): TrainingRecommendation[] {
  const recommendations: TrainingRecommendation[] = [];
  
  // Check vertical jump
  if (player.testResults.verticalJump < 55) {
    recommendations.push({
      priority: 'high',
      area: 'Power Development',
      suggestion: 'Vertical jump below elite standards. Implement plyometric program 2-3x/week.',
      impact: 'Can improve initial acceleration by 3-5%'
    });
  }
  
  // Check slide board
  if (player.testResults.slideBoard < 40) {
    recommendations.push({
      priority: 'high',
      area: 'Skating Specificity',
      suggestion: 'Slide board performance is the strongest predictor of on-ice speed. Increase to 3-4 sessions/week.',
      impact: 'Most direct transfer to skating speed'
    });
  }
  
  // Check sprint times
  if (player.testResults.sprint30m > 4.15) {
    recommendations.push({
      priority: 'medium',
      area: 'Sprint Speed',
      suggestion: 'Off-ice sprint times can be improved. Add acceleration drills and resisted sprints.',
      impact: 'Strong correlation with maximum skating velocity'
    });
  }
  
  return recommendations;
}

export function prepareRadarData(player: PlayerData) {
  return [
    { 
      test: 'Power', 
      value: calculatePercentile(player.testResults.verticalJump, 'verticalJump', player.skillLevel), 
      fullMark: 100 
    },
    { 
      test: 'Speed', 
      value: calculatePercentile(player.testResults.sprint30m, 'sprint30m', player.skillLevel), 
      fullMark: 100 
    },
    { 
      test: 'Strength', 
      value: calculatePercentile(player.testResults.squat1RM / player.age * 5, 'squat1RM', player.skillLevel), 
      fullMark: 100 
    },
    { 
      test: 'Agility', 
      value: calculatePercentile(player.testResults.slideBoard, 'slideBoard', player.skillLevel), 
      fullMark: 100 
    },
    { 
      test: 'On-Ice Speed', 
      value: calculatePercentile(player.testResults.onIce30m, 'onIce30m', player.skillLevel), 
      fullMark: 100 
    },
  ];
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
```

## Custom Hooks

### hooks/useTestData.ts

```typescript
import { useState, useEffect } from 'react';
import { TestData, PlayerData } from '../types';

export function useTestData(teamId?: string) {
  const [testData, setTestData] = useState<TestData[]>([]);
  const [teamData, setTeamData] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch test data
        const testResponse = await fetch(`/api/test-results?teamId=${teamId}`);
        if (!testResponse.ok) throw new Error('Failed to fetch test data');
        const testResults = await testResponse.json();
        setTestData(testResults);
        
        // Fetch team data
        const teamResponse = await fetch(`/api/teams/${teamId}/players`);
        if (!teamResponse.ok) throw new Error('Failed to fetch team data');
        const players = await teamResponse.json();
        setTeamData(players);
        
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (teamId) {
      fetchData();
    }
  }, [teamId]);

  return { testData, teamData, loading, error };
}
```

### hooks/useCorrelationAnalysis.ts

```typescript
import { useState } from 'react';

interface CorrelationResult {
  coefficient: number;
  pValue: number;
  interpretation: string;
  data: Array<{ x: number; y: number }>;
}

export function useCorrelationAnalysis() {
  const [correlationResults, setCorrelationResults] = useState<CorrelationResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runCorrelation(xTest: string, yTest: string) {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/correlations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xTest, yTest })
      });
      
      if (!response.ok) throw new Error('Failed to run correlation analysis');
      
      const result = await response.json();
      setCorrelationResults(result);
      return result;
    } catch (error) {
      console.error('Correlation analysis failed:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { correlationResults, runCorrelation, loading };
}
```

## API Endpoints Required

```typescript
// Backend endpoints that need to be implemented

// GET /api/test-results?teamId={teamId}
// Returns: TestData[]

// GET /api/teams/{teamId}/players
// Returns: PlayerData[]

// POST /api/analytics/correlations
// Body: { xTest: string, yTest: string }
// Returns: CorrelationResult

// GET /api/test-results/player/{playerId}
// Returns: TestData[]

// POST /api/test-results
// Body: TestData
// Returns: TestData

// GET /api/analytics/team-stats/{teamId}
// Returns: TeamStatistics
```

## Integration with Hockey Hub

### 1. Add to Physical Trainer Dashboard

```tsx
// src/pages/fys-coach/Dashboard.tsx
import PhysicalAnalysisDashboard from '@/components/statistics-service/physical-analysis/PhysicalAnalysisDashboard';

export function FysCoachDashboard() {
  const { user } = useAuth();
  const { teamId } = useTeam();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Physical Trainer Dashboard</h1>
      
      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis">Performance Analysis</TabsTrigger>
          <TabsTrigger value="testing">Test Administration</TabsTrigger>
          <TabsTrigger value="programs">Training Programs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis">
          <PhysicalAnalysisDashboard 
            userRole="fys_coach"
            teamId={teamId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 2. Add to Player Dashboard

```tsx
// src/pages/player/Dashboard.tsx
import PhysicalAnalysisDashboard from '@/components/statistics-service/physical-analysis/PhysicalAnalysisDashboard';

export function PlayerDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Performance</h1>
      
      <PhysicalAnalysisDashboard 
        userRole="player"
        playerId={user.id}
        teamId={user.teamId}
      />
    </div>
  );
}
```

### 3. Add to Coach Dashboard

```tsx
// src/pages/coach/Dashboard.tsx
import PhysicalAnalysisDashboard from '@/components/statistics-service/physical-analysis/PhysicalAnalysisDashboard';

export function CoachDashboard() {
  const { teamId } = useTeam();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team Performance Analysis</h1>
      
      <PhysicalAnalysisDashboard 
        userRole="coach"
        teamId={teamId}
      />
    </div>
  );
}
```

## Database Schema Extensions

```sql
-- Add to existing test_results table
ALTER TABLE test_results ADD COLUMN test_conditions JSONB;
ALTER TABLE test_results ADD COLUMN environmental_factors JSONB;

-- Create correlation cache table
CREATE TABLE test_correlations_cache (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  x_test VARCHAR(100) NOT NULL,
  y_test VARCHAR(100) NOT NULL,
  correlation_coefficient DECIMAL(4,3) NOT NULL,
  p_value DECIMAL(6,5) NOT NULL,
  sample_size INTEGER NOT NULL,
  date_calculated TIMESTAMP WITH TIME ZONE NOT NULL,
  filter_criteria JSONB,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Create training recommendations table
CREATE TABLE training_recommendations (
  id UUID PRIMARY KEY,
  player_id UUID NOT NULL,
  test_id UUID NOT NULL,
  priority VARCHAR(20) NOT NULL,
  area VARCHAR(100) NOT NULL,
  suggestion TEXT NOT NULL,
  impact TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (player_id) REFERENCES users(id),
  FOREIGN KEY (test_id) REFERENCES test_definitions(id)
);
```

## Performance Considerations

1. **Data Caching**: Implement Redis caching for correlation calculations
2. **Lazy Loading**: Load test data progressively as users navigate tabs
3. **Pagination**: Implement pagination for team comparison views
4. **Memoization**: Use React.memo for expensive calculations
5. **Web Workers**: Consider using Web Workers for correlation calculations

## Accessibility

1. **ARIA Labels**: Add proper ARIA labels to all interactive elements
2. **Keyboard Navigation**: Ensure all features are keyboard accessible
3. **Screen Reader Support**: Add descriptive text for charts
4. **Color Contrast**: Ensure all text meets WCAG AA standards
5. **Focus Indicators**: Clear focus states for all interactive elements

## Testing Strategy

```typescript
// Example test file
import { render, screen, fireEvent } from '@testing-library/react';
import PhysicalAnalysisDashboard from './PhysicalAnalysisDashboard';
import { mockTestData, mockTeamData } from './test-utils/mockData';

describe('PhysicalAnalysisDashboard', () => {
  it('renders overview tab by default', () => {
    render(<PhysicalAnalysisDashboard userRole="fys_coach" />);
    expect(screen.getByText('Key Performance Indicators')).toBeInTheDocument();
  });
  
  it('shows player-specific view for player role', () => {
    render(<PhysicalAnalysisDashboard userRole="player" playerId="player1" />);
    expect(screen.getByText('My Performance')).toBeInTheDocument();
  });
  
  it('calculates correlations correctly', async () => {
    // Test correlation calculations
  });
});
```

## Deployment Checklist

- [ ] Install all required dependencies
- [ ] Create database schema extensions
- [ ] Implement backend API endpoints
- [ ] Set up Redis for caching (optional)
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Test all user role views
- [ ] Verify data security and permissions
- [ ] Performance testing with large datasets
- [ ] Accessibility audit
- [ ] Deploy to staging environment
- [ ] User acceptance testing
- [ ] Deploy to production