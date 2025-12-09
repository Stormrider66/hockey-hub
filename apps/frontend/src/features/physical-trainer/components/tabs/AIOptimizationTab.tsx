import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Zap, Users, Settings, TrendingUp, Target } from 'lucide-react';

// Import the AI optimization components
import AIInsightsDashboard from '../ai-optimization/AIInsightsDashboard';
import WorkoutOptimizationSuggestions from '../ai-optimization/WorkoutOptimizationSuggestions';

// Import mock team composition analyzer component
import TeamCompositionDashboard from '../ai-optimization/TeamCompositionDashboard';
import AnomalyDetectionPanel from '../ai-optimization/AnomalyDetectionPanel';
import AdvancedTeamAnalyzer from '../ai-optimization/AdvancedTeamAnalyzer';

interface AIOptimizationTabProps {
  selectedTeamId?: string;
  organizationId: string;
  className?: string;
}

export function AIOptimizationTab({ 
  selectedTeamId, 
  organizationId,
  className = '' 
}: AIOptimizationTabProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState('insights');

  // Mock workouts for optimization suggestions
  const recentWorkouts = [
    { id: 'workout-001', name: 'Upper Body Strength', date: '2025-01-14', type: 'strength' },
    { id: 'workout-002', name: 'HIIT Conditioning', date: '2025-01-13', type: 'conditioning' },
    { id: 'workout-003', name: 'Power Development', date: '2025-01-12', type: 'hybrid' },
    { id: 'workout-004', name: 'Speed & Agility', date: '2025-01-11', type: 'agility' }
  ];

  const handleRecommendationSelect = (recommendation: any) => {
    console.log('Selected recommendation:', recommendation);
    // Handle recommendation selection - could open a modal or navigate
  };

  const handleApplySuggestion = (suggestionId: string) => {
    console.log('Applying suggestion:', suggestionId);
    // Handle applying the optimization suggestion
  };

  const handleSettingsClick = () => {
    console.log('Opening AI settings');
    // Handle opening AI configuration settings
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold">AI Optimization Suite</h2>
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
            Advanced AI Features
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleSettingsClick}>
            <Settings className="h-4 w-4 mr-2" />
            AI Settings
          </Button>
        </div>
      </div>

      {/* Sub-navigation */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Workout Optimization
          </TabsTrigger>
          <TabsTrigger value="composition" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Composition
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Anomaly Detection
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Advanced Analytics
          </TabsTrigger>
        </TabsList>

        {/* AI Insights Dashboard */}
        <TabsContent value="insights" className="mt-6">
          <AIInsightsDashboard
            teamId={selectedTeamId || 'default-team'}
            onRecommendationSelect={handleRecommendationSelect}
            onSettingsClick={handleSettingsClick}
          />
        </TabsContent>

        {/* Workout Optimization */}
        <TabsContent value="optimization" className="mt-6">
          <div className="space-y-6">
            {/* Workout Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Select Workout for Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Select value={selectedWorkout || ''} onValueChange={setSelectedWorkout}>
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Choose a workout to optimize" />
                    </SelectTrigger>
                    <SelectContent>
                      {recentWorkouts.map(workout => (
                        <SelectItem key={workout.id} value={workout.id}>
                          {workout.name} - {workout.date} ({workout.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPlayer && (
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by player" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Players</SelectItem>
                        <SelectItem value="crosby">Sidney Crosby</SelectItem>
                        <SelectItem value="mcdavid">Connor McDavid</SelectItem>
                        <SelectItem value="mackinnon">Nathan MacKinnon</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Optimization Suggestions */}
            {selectedWorkout ? (
              <WorkoutOptimizationSuggestions
                workoutId={selectedWorkout}
                playerId={selectedPlayer === 'all' ? undefined : selectedPlayer}
                onApplySuggestion={handleApplySuggestion}
                onViewDetails={(id) => console.log('View details:', id)}
              />
            ) : (
              <Card className="bg-gray-50">
                <CardContent className="py-12 text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Select a workout above to view AI-powered optimization suggestions</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Team Composition Analysis */}
        <TabsContent value="composition" className="mt-6">
          <TeamCompositionDashboard
            teamId={selectedTeamId || 'default-team'}
            organizationId={organizationId}
          />
        </TabsContent>

        {/* Anomaly Detection */}
        <TabsContent value="anomalies" className="mt-6">
          <AnomalyDetectionPanel
            teamId={selectedTeamId || 'default-team'}
            organizationId={organizationId}
          />
        </TabsContent>

        {/* Advanced Analytics */}
        <TabsContent value="advanced" className="mt-6">
          <AdvancedTeamAnalyzer
            teamId={selectedTeamId || 'default-team'}
            organizationId={organizationId}
          />
        </TabsContent>
      </Tabs>

      {/* AI Model Information */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="pt-4">
          <div className="text-xs text-gray-700 space-y-1">
            <div className="flex justify-between">
              <span className="font-medium">AI Optimization Engine:</span>
              <span>v4.1.0 - Deep Learning & Reinforcement Learning</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Optimization Algorithms:</span>
              <span>Genetic algorithms, gradient descent, neural architecture search</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Real-time Processing:</span>
              <span>Sub-second recommendations with 95%+ accuracy</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Learning Mode:</span>
              <span>Continuous learning from trainer feedback and outcomes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIOptimizationTab;