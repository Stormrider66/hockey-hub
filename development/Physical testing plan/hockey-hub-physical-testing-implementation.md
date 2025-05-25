# Hockey Hub - Physical Testing Implementation Guide

## Overview

This guide outlines the implementation strategy for adding physical testing capabilities to the Hockey Hub platform. Based on the scientific research on correlations between off-ice physical tests and on-ice performance, this functionality will enable evidence-based training decisions for hockey organizations.

## Table of Contents

1. [Architectural Integration](#architectural-integration)
2. [Database Schema Extensions](#database-schema-extensions)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [Implementation Phases](#implementation-phases)
6. [Testing Strategy](#testing-strategy)

## Architectural Integration

The physical testing functionality will be integrated primarily into two existing microservices:

### Training Service (Port 3004)
- Test definitions and protocols
- Test results storage
- Test scheduling and administration
- Basic data visualization

### Statistics Service (Port 3007)
- Advanced statistical analysis
- Correlation calculations
- Predictive modeling
- Performance comparisons

## Database Schema Extensions

### Training Service Extensions

#### Table: `test_definitions`
```sql
CREATE TABLE test_definitions (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'power', 'strength', 'speed', 'endurance', etc.
  description TEXT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  protocol TEXT NOT NULL,
  is_higher_better BOOLEAN NOT NULL DEFAULT true,
  is_on_ice BOOLEAN NOT NULL DEFAULT false,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id UUID NOT NULL,
  organization_id UUID NULL, -- NULL for system-wide tests
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

#### Table: `test_results`
```sql
CREATE TABLE test_results (
  id UUID PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES test_definitions(id),
  player_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  notes TEXT NULL,
  administrator_id UUID NOT NULL,
  team_id UUID NULL REFERENCES teams(id),
  batch_id UUID NULL REFERENCES test_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Statistics Service Extensions

#### Table: `test_correlations`
```sql
CREATE TABLE test_correlations (
  id UUID PRIMARY KEY,
  x_axis_test_id UUID NOT NULL REFERENCES test_definitions(id),
  y_axis_test_id UUID NOT NULL REFERENCES test_definitions(id),
  organization_id UUID NOT NULL,
  correlation_coefficient DECIMAL(4,3) NOT NULL,
  p_value DECIMAL(6,5) NOT NULL,
  sample_size INTEGER NOT NULL,
  filter_criteria JSONB NULL,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### Table: `predictive_models`
```sql
CREATE TABLE predictive_models (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target_test_id UUID NOT NULL REFERENCES test_definitions(id),
  model_formula TEXT NOT NULL,
  model_parameters JSONB NOT NULL,
  r_squared DECIMAL(4,3) NOT NULL,
  organization_id UUID NOT NULL,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## API Endpoints

### Training Service Endpoints

#### Test Definitions
- `GET /tests` - List test definitions
- `POST /tests` - Create test definition
- `GET /tests/:id` - Get test details
- `PUT /tests/:id` - Update test definition
- `DELETE /tests/:id` - Delete test definition

#### Test Results
- `GET /test-results` - Get test results (with filtering)
- `POST /test-results` - Record test result
- `GET /test-results/:id` - Get specific test result
- `PUT /test-results/:id` - Update test result
- `GET /test-results/player/:id` - Get all results for a player
- `GET /test-results/team/:id` - Get results for a team

### Statistics Service Endpoints

#### Correlation Analysis
- `POST /analytics/correlations` - Calculate correlation between two tests
- `GET /analytics/correlations` - List saved correlations
- `GET /analytics/correlations/:id` - Get specific correlation
- `DELETE /analytics/correlations/:id` - Delete correlation

#### Predictive Modeling
- `POST /analytics/models` - Create predictive model
- `GET /analytics/models` - List available models
- `GET /analytics/models/:id` - Get specific model
- `POST /analytics/models/:id/predict` - Make prediction using model
- `DELETE /analytics/models/:id` - Delete model

## Frontend Components

### 1. PhysicalTestingForm Component

This component will handle data collection for all physical tests:

```tsx
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";

export function PhysicalTestingForm({ playerId, onSubmit }) {
  const [activeTab, setActiveTab] = useState("power");
  const form = useForm();
  
  const handleSubmit = (data) => {
    onSubmit(data);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Physical Test Data Collection</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="power">Power</TabsTrigger>
                <TabsTrigger value="speed">Speed</TabsTrigger>
                <TabsTrigger value="strength">Strength</TabsTrigger>
                <TabsTrigger value="endurance">Endurance</TabsTrigger>
                <TabsTrigger value="onice">On-Ice</TabsTrigger>
              </TabsList>
              
              <TabsContent value="power">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="verticalJump"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vertical Jump (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0.0" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="standingLongJump"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standing Long Jump (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0.0" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="threeStepJump"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>3-Step Jump (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0.0" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Additional tabs for other test categories */}
            </Tabs>
            
            <div className="mt-6 flex justify-end">
              <Button type="submit">Save Test Results</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

### 2. PhysicalAnalysisDashboard Component

This component will display test results and visualize correlations:

```tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ResponsiveContainer } from 'recharts';

export function PhysicalAnalysisDashboard({ playerData, teamData }) {
  const [activeTab, setActiveTab] = useState('player');
  const [selectedTest, setSelectedTest] = useState('verticalJump');
  const [selectedPlayer, setSelectedPlayer] = useState(playerData[0]?.id);
  
  const currentPlayer = playerData.find(p => p.id === selectedPlayer);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Physical Performance Analysis</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="player">Player Progress</TabsTrigger>
          <TabsTrigger value="correlations">Off-Ice to On-Ice Correlations</TabsTrigger>
          <TabsTrigger value="team">Team Comparison</TabsTrigger>
          <TabsTrigger value="predictions">Performance Predictions</TabsTrigger>
        </TabsList>
        
        {/* Tab content for each section */}
        <TabsContent value="player">
          {/* Player selection and progress charts */}
        </TabsContent>
        
        <TabsContent value="correlations">
          {/* Correlation visualization between tests */}
        </TabsContent>
        
        <TabsContent value="team">
          {/* Team comparison charts */}
        </TabsContent>
        
        <TabsContent value="predictions">
          {/* Performance prediction tools */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 3. CustomTestCorrelationTool Component

This component enables custom correlation analysis:

```tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function CustomTestCorrelationTool({ testDefinitions, onRunAnalysis }) {
  const [xAxisTest, setXAxisTest] = useState('');
  const [yAxisTest, setYAxisTest] = useState('');
  const [correlationData, setCorrelationData] = useState(null);
  
  const handleRunAnalysis = async () => {
    const result = await onRunAnalysis(xAxisTest, yAxisTest);
    setCorrelationData(result);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Test Correlation Analysis</CardTitle>
        <CardDescription>
          Select two tests to analyze their relationship
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">X-Axis Test</label>
              <Select value={xAxisTest} onValueChange={setXAxisTest}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test" />
                </SelectTrigger>
                <SelectContent>
                  {testDefinitions.map(test => (
                    <SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Y-Axis Test</label>
              <Select value={yAxisTest} onValueChange={setYAxisTest}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test" />
                </SelectTrigger>
                <SelectContent>
                  {testDefinitions.map(test => (
                    <SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={handleRunAnalysis}>Run Analysis</Button>
          
          {correlationData && (
            <div className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="xValue" 
                      name={correlationData.xAxisName} 
                      unit={correlationData.xAxisUnit} 
                    />
                    <YAxis 
                      type="number" 
                      dataKey="yValue" 
                      name={correlationData.yAxisName} 
                      unit={correlationData.yAxisUnit} 
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Players" data={correlationData.data} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              <div className="p-4 bg-muted rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Correlation Coefficient</p>
                    <p className="text-2xl font-bold">{correlationData.coefficient.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Significance (p-value)</p>
                    <p className="text-2xl font-bold">{correlationData.pValue.toFixed(3)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium">Interpretation</p>
                  <p className="text-sm mt-1">{correlationData.interpretation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Implementation Phases

### Phase 1: Core Testing Framework (2-3 weeks)

1. Database schema extensions for test definitions and results
2. Basic API endpoints for test management
3. Physical test data collection forms
4. Test protocol documentation
5. Player progress tracking

### Phase 2: Basic Analysis (2-3 weeks)

1. Test result visualization dashboard
2. Team comparison features
3. Simple correlation analysis
4. Progress charts and trend analysis
5. Basic historical data import utilities

### Phase 3: Advanced Analytics (3-4 weeks)

1. Custom test correlation tool
2. Multiple regression modeling
3. Performance prediction capabilities
4. Training recommendations based on analysis
5. Advanced filtering and data exploration tools

## Testing Strategy

### Unit Tests

- Test all statistical calculation functions
- Validate the test data collection forms
- Ensure correlation calculations are accurate
- Verify prediction models function correctly

### Integration Tests

- Test API endpoints with mock data
- Verify database interactions
- Check inter-service communication
- Validate permissions and access controls

### End-to-End Tests

- Complete user flows for test administration
- Test visualization and analysis tools
- Verify multi-role functionality

## Role-Based Permissions

### Physical Trainer (fys_coach)
- Create, edit, and delete test definitions
- Administer tests and record results
- Run correlation analyses and create models
- View all test results and team comparisons

### Coach (coach)
- View test results and correlations
- View player progress over time
- Access simplified analytics dashboards
- Get training recommendations

### Player (player)
- View own test results and progress
- See how their performance compares to team averages
- Access simplified explanations of test relationships

### Parent (parent)
- View child's test results and progress
- Access simplified explanations of test significance
