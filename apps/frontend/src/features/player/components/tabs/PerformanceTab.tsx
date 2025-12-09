"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SafeProgress } from '@/components/ui/SafeProgress';
import { cn } from "@/lib/utils";
import {
  Calendar,
  Download,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Dumbbell,
  Activity,
  Brain,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import OptimizedChart from '@/components/charts/OptimizedChart';
import { 
  mockTestCategories, 
  mockTeamRankings, 
  mockPerformanceGoals,
  mockPerformanceTrends,
  mockPerformanceRadar
} from '../../constants';

export function PerformanceTab() {
  return (
    <div className="space-y-6">
      {/* Physical Test Results by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Physical Test Results by Category</CardTitle>
          <CardDescription>Your latest test results compared to team goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockTestCategories.map((category) => (
              <div key={category.category} className={cn("p-4 rounded-lg", category.bgColor)}>
                <div className="flex items-center gap-2 mb-4">
                  {React.createElement(category.icon, {
                    className: cn("h-5 w-5", category.color)
                  })}
                  <h4 className="font-semibold">{category.category}</h4>
                </div>
                <div className="space-y-3">
                  {category.tests.map((test) => (
                    <div key={test.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{test.name}</span>
                        <span className="font-medium tabular-nums">
                          {test.value}{test.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SafeProgress 
                          value={test.value}
                          max={test.goal}
                          className="h-2 flex-1"
                          showOverflow={true}
                        />
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            test.percentile >= 80 && "border-green-600 text-green-600",
                            test.percentile >= 60 && test.percentile < 80 && "border-blue-600 text-blue-600",
                            test.percentile < 60 && "border-amber-600 text-amber-600"
                          )}
                        >
                          {test.percentile}th
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Goal: {test.goal}{test.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Trends */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Track your progress over time</CardDescription>
              </div>
              <select 
                className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Select performance metric to display"
              >
                <option>Vertical Jump</option>
                <option>10m Sprint</option>
                <option>Squat 1RM</option>
                <option>VO2 Max</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <OptimizedChart
                data={mockPerformanceTrends}
                type="line"
                xKey="date"
                yKeys={['value', 'teamAvg']}
                height={256}
                maxDataPoints={100}
                colors={['#3b82f6', '#94a3b8']}
                showGrid={true}
                showLegend={true}
                onDataOptimized={(original, optimized) => {
                  console.log(`Performance chart: ${original} → ${optimized} points`);
                }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">+12% improvement</span>
              </div>
              <span className="text-muted-foreground">Since Aug 2024</span>
            </div>
          </CardContent>
        </Card>

        {/* Team Comparison Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Profile</CardTitle>
            <CardDescription>Your strengths compared to team average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={mockPerformanceRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar 
                    name="You" 
                    dataKey="you" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                  <Radar 
                    name="Team Average" 
                    dataKey="team" 
                    stroke="#94a3b8" 
                    fill="#94a3b8" 
                    fillOpacity={0.1}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Strength: Agility & Endurance</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                <span>Focus: Strength training</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Test Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Detailed Test Results</CardTitle>
              <CardDescription>Complete breakdown of your latest physical tests</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recent">Recent Tests</TabsTrigger>
              <TabsTrigger value="rankings">Team Rankings</TabsTrigger>
              <TabsTrigger value="goals">Goals & Targets</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Dec 15, 2024</h4>
                    <Badge variant="outline">Pre-season Testing</Badge>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Vertical Jump', value: 65, unit: 'cm', change: +2, rank: 5 },
                      { name: '10m Sprint', value: 1.72, unit: 's', change: -0.03, rank: 4 },
                      { name: 'Squat 1RM', value: 140, unit: 'kg', change: +5, rank: 8 },
                      { name: 'VO2 Max', value: 58, unit: 'ml/kg/min', change: +2, rank: 3 }
                    ].map((test) => (
                      <div key={test.name} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{test.name}</p>
                          <p className="text-2xl font-bold mt-1 tabular-nums">
                            {test.value}{test.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Change</p>
                            <p className={cn(
                              "font-medium tabular-nums",
                              test.change > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {test.change > 0 && '+'}{test.change}{test.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Team Rank</p>
                            <p className="font-medium tabular-nums">#{test.rank}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rankings" className="mt-4">
              <div className="space-y-3">
                {mockTeamRankings.map((item) => (
                  <div key={item.test} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{item.test}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your rank: #{item.rank} of 22
                        </p>
                      </div>
                      <Badge className={cn(
                        item.rank <= 3 && "bg-amber-100 text-amber-800",
                        item.rank > 3 && item.rank <= 10 && "bg-blue-100 text-blue-800",
                        item.rank > 10 && "bg-gray-100 text-gray-800"
                      )}>
                        {item.rank <= 3 ? 'Top 3' :
                         item.rank <= 10 ? 'Top 10' : 'Mid-pack'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Team leader: {item.leader.name}</span>
                        <span className="font-medium">{item.leader.value}</span>
                      </div>
                      <div className="relative">
                        <Progress value={(item.rank / 22) * 100} className="h-6" />
                        <div 
                          className="absolute top-0 h-6 w-1 bg-primary"
                          style={{ left: `${(item.rank / 22) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="goals" className="mt-4">
              <div className="space-y-4">
                {mockPerformanceGoals.map((goal) => (
                  <div key={goal.test} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{goal.test}</h4>
                        <p className="text-sm text-muted-foreground">
                          Target by {goal.deadline}
                        </p>
                      </div>
                      <Badge className={cn(
                        goal.status === 'achieved' && "bg-green-100 text-green-800",
                        goal.status === 'on-track' && "bg-blue-100 text-blue-800",
                        goal.status === 'needs-work' && "bg-amber-100 text-amber-800"
                      )}>
                        {goal.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current: {goal.current}</span>
                        <span>Goal: {goal.goal}</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        {goal.progress}% complete
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Training Recommendations
          </CardTitle>
          <CardDescription>Based on your test results and goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Dumbbell className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Focus on Strength</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Your squat performance is below team average. Add 2 extra strength sessions 
                    per week focusing on lower body power.
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-amber-900">Recommended exercises:</p>
                    <ul className="text-xs text-amber-700 list-disc list-inside">
                      <li>Back Squats - 4x6 @ 85% 1RM</li>
                      <li>Bulgarian Split Squats - 3x10 each leg</li>
                      <li>Box Jumps - 4x5</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Maintain Endurance</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your aerobic capacity is excellent. Continue current training volume 
                    with 1-2 high-intensity intervals per week.
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    Next test target: VO2 Max 60+ ml/kg/min
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Speed Development</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Small improvements needed in acceleration. Add plyometric exercises 
                    and sprint technique work.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900">Next Testing</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Mid-season testing scheduled for February 15, 2025. 
                    Focus on your target areas over the next 8 weeks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PerformanceTab;



