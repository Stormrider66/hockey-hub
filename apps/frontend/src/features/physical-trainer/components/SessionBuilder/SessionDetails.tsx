import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  Clock, 
  Activity,
  Calculator,
  Save,
  Share,
  BarChart,
  Dumbbell,
  Heart,
  Brain,
  Target
} from '@/components/icons';
import { 
  SessionTemplate, 
  SessionBuilderAnalytics,
  IntensityLevel
} from '../../types/session-builder.types';
import { LoadCalculator } from './LoadCalculator';
import { UnifiedScheduler, UnifiedSchedule } from '../shared/UnifiedScheduler';

interface SessionDetailsProps {
  session: SessionTemplate;
  onUpdate: (session: SessionTemplate) => void;
  schedule: UnifiedSchedule;
  onScheduleUpdate: (schedule: UnifiedSchedule) => void;
}

export const SessionDetails: React.FC<SessionDetailsProps> = ({ session, onUpdate, schedule, onScheduleUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate session analytics
  const analytics: SessionBuilderAnalytics = useMemo(() => {
    let totalVolume = 0;
    let estimatedCalories = 0;
    const muscleGroupDistribution: Record<string, number> = {};
    const equipmentSet = new Set<string>();
    let totalWorkTime = 0;
    let totalRestTime = 0;
    let peakIntensity: any = 'warmup';
    let maxIntensityScore = 0;

    session.phases.forEach((phase) => {
      phase.exercises.forEach((exercise) => {
        // Volume calculation (sets x reps x approximate load)
        if (exercise.sets && exercise.reps) {
          totalVolume += exercise.sets * exercise.reps;
        }

        // Work and rest time (convert to minutes)
        const workTimeMinutes = exercise.duration 
          ? exercise.duration / 60  // Convert seconds to minutes
          : (exercise.sets * (exercise.reps || 0) * 3) / 60;
        const restTimeMinutes = (exercise.rest * (exercise.sets - 1)) / 60;
        totalWorkTime += workTimeMinutes;
        totalRestTime += restTimeMinutes;

        // Advanced calorie estimation based on multiple factors
        const baseCalorieRates: Record<string, number> = {
          warmup: 5,
          main: 10,
          accessory: 10,
          core: 8,
          cooldown: 5
        };
        
        let calorieRate = baseCalorieRates[phase.type] || 8;
        
        // Adjust for exercise intensity level
        const intensityMultipliers: Record<IntensityLevel, number> = {
          low: 0.7,
          medium: 1.0,
          high: 1.3,
          max: 1.5
        };
        const intensityMultiplier = intensityMultipliers[exercise.intensity || 'medium'];
        
        // Adjust for load percentage (if strength training)
        let loadMultiplier = 1.0;
        if (exercise.loadCalculation?.percentage) {
          // Higher percentage of max = higher calorie burn
          // 50% = 0.8x, 70% = 1.0x, 85% = 1.2x, 95% = 1.4x
          loadMultiplier = 0.3 + (exercise.loadCalculation.percentage / 100);
        }
        
        // Adjust for RPE (Rate of Perceived Exertion)
        let rpeMultiplier = 1.0;
        if (exercise.targetRPE) {
          // RPE 6 = 0.8x, RPE 8 = 1.1x, RPE 10 = 1.3x
          rpeMultiplier = 0.5 + (exercise.targetRPE * 0.08);
        }
        
        // Special handling for cardio exercises
        if (exercise.name.toLowerCase().includes('bike') || 
            exercise.name.toLowerCase().includes('row') || 
            exercise.name.toLowerCase().includes('run')) {
          // For cardio, base rate is higher and pace matters more
          calorieRate = 12; // Base cardio rate
          
          // If duration-based (steady state), use moderate multiplier
          // If interval-based (high/low), average out to higher burn
          if (exercise.intensity === 'high' || exercise.intensity === 'max') {
            calorieRate = 15; // High intensity cardio
          }
        }
        
        // Calculate final calorie burn
        const finalCalorieRate = calorieRate * intensityMultiplier * loadMultiplier * rpeMultiplier;
        estimatedCalories += workTimeMinutes * finalCalorieRate;

        // Muscle group distribution
        exercise.muscleGroups.forEach(mg => {
          muscleGroupDistribution[mg] = (muscleGroupDistribution[mg] || 0) + 1;
        });

        // Equipment tracking
        exercise.equipment.forEach(eq => equipmentSet.add(eq));

        // Peak intensity tracking
        const intensityScores = { low: 1, medium: 2, high: 3, max: 4 };
        const score = intensityScores[exercise.intensity || 'medium'];
        if (score > maxIntensityScore) {
          maxIntensityScore = score;
          peakIntensity = phase.type;
        }
      });
    });

    const restToWorkRatio = totalWorkTime > 0 ? totalRestTime / totalWorkTime : 0;
    
    // Difficulty score (0-10 scale)
    const difficultyFactors = {
      volume: Math.min(totalVolume / 300, 1) * 3, // Max 3 points
      duration: Math.min(session.totalDuration / 90, 1) * 2, // Max 2 points
      intensity: (maxIntensityScore / 4) * 3, // Max 3 points
      variety: Math.min(Object.keys(muscleGroupDistribution).length / 5, 1) * 2 // Max 2 points
    };
    const difficultyScore = Object.values(difficultyFactors).reduce((a, b) => a + b, 0);

    return {
      totalVolume,
      estimatedCalories: Math.round(estimatedCalories),
      muscleGroupDistribution,
      equipmentNeeded: Array.from(equipmentSet),
      difficultyScore: Math.round(difficultyScore * 10) / 10,
      restToWorkRatio: Math.round(restToWorkRatio * 100) / 100,
      peakIntensityPhase: peakIntensity
    };
  }, [session]);

  const handleSaveAsTemplate = () => {
    // TODO: Implement save as template
    console.log('Saving as template...');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Sharing session...');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Session Details</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loads">Loads</TabsTrigger>
          <TabsTrigger value="schedule">Schedule & Assignment</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 space-y-4">
            {/* Quick Stats */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">Session Analytics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Duration</span>
                  </div>
                  <span className="font-medium">{session.totalDuration} min</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>Total Volume</span>
                  </div>
                  <span className="font-medium">{analytics.totalVolume} reps</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>Est. Calories</span>
                  </div>
                  <span className="font-medium">{analytics.estimatedCalories} cal</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                    <span>Difficulty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{analytics.difficultyScore}/10</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${analytics.difficultyScore * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span>Work:Rest Ratio</span>
                  </div>
                  <span className="font-medium">1:{analytics.restToWorkRatio}</span>
                </div>
              </div>
            </Card>

            {/* Muscle Groups */}
            {Object.keys(analytics.muscleGroupDistribution).length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium mb-3">Muscle Groups Targeted</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.muscleGroupDistribution).map(([muscle, count]) => (
                    <div key={muscle} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{muscle}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{count} exercises</span>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(analytics.muscleGroupDistribution))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Equipment Needed */}
            {analytics.equipmentNeeded.length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium mb-3">Equipment Required</h4>
                <div className="flex flex-wrap gap-2">
                  {analytics.equipmentNeeded.map((equipment) => (
                    <Badge key={equipment} variant="secondary">
                      {equipment}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Session Settings */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">Session Settings</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select 
                    value={session.difficulty} 
                    onValueChange={(value: any) => onUpdate({ ...session, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="public">Make Public</Label>
                  <Switch
                    id="public"
                    checked={session.isPublic || false}
                    onCheckedChange={(checked) => onUpdate({ ...session, isPublic: checked })}
                  />
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={handleSaveAsTemplate}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save as Template
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={handleShare}
                  >
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Loads Tab */}
          <TabsContent value="loads" className="p-4">
            <LoadCalculator 
              session={session}
              onUpdate={onUpdate}
            />
          </TabsContent>

          {/* Schedule & Assignment Tab */}
          <TabsContent value="schedule" className="p-4">
            <UnifiedScheduler
              schedule={schedule}
              onScheduleUpdate={onScheduleUpdate}
              duration={session.totalDuration}
              title="Schedule & Assignment"
              description="Set the schedule and assign players or teams to this workout"
              showLocation={true}
              showRecurrence={true}
              showReminders={true}
              showConflictCheck={true}
              variant="inline"
              collapsible={false}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};