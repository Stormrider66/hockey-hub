"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Plus,
  Calendar,
  Target,
  Activity,
  User,
  ChevronRight,
  Settings,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock,
  Edit,
  Eye
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface InjuryMetric {
  id: string;
  name: string;
  unit: string;
  type: 'number' | 'scale' | 'percentage' | 'boolean' | 'time';
  category: 'mobility' | 'strength' | 'pain' | 'function' | 'psychological';
  targetValue?: number;
  normalRange?: { min: number; max: number };
  description: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  isActive: boolean;
}

interface MetricEntry {
  id: string;
  metricId: string;
  playerId: string;
  injuryId: string;
  value: number;
  date: string;
  notes?: string;
  measuredBy: string;
  sessionId?: string;
}

interface InjuryProgressPlan {
  id: string;
  injuryId: string;
  injuryType: string;
  playerId: string;
  playerName: string;
  startDate: string;
  estimatedDuration: number; // weeks
  currentPhase: number;
  totalPhases: number;
  metrics: InjuryMetric[];
  milestones: Milestone[];
  overallProgress: number;
  createdBy: string;
  lastUpdated: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
  phase: number;
  criteria: string[];
}

// Mock data with injury-specific metrics
const mockProgressPlans: InjuryProgressPlan[] = [
  {
    id: "1",
    injuryId: "1",
    injuryType: "ACL Tear - Right Knee",
    playerId: "15",
    playerName: "Erik Andersson (#15)",
    startDate: "2024-01-15",
    estimatedDuration: 24,
    currentPhase: 2,
    totalPhases: 4,
    overallProgress: 35,
    createdBy: "Dr. Sarah Johnson",
    lastUpdated: "2024-06-09",
    metrics: [
      {
        id: "m1",
        name: "Knee Flexion ROM",
        unit: "degrees",
        type: "number",
        category: "mobility",
        targetValue: 135,
        normalRange: { min: 130, max: 145 },
        description: "Range of motion for knee flexion",
        frequency: "weekly",
        isActive: true
      },
      {
        id: "m2",
        name: "Quadriceps Strength",
        unit: "Nm",
        type: "number",
        category: "strength",
        targetValue: 200,
        normalRange: { min: 180, max: 220 },
        description: "Peak torque measurement for quadriceps",
        frequency: "biweekly",
        isActive: true
      },
      {
        id: "m3",
        name: "Pain Level (Activity)",
        unit: "VAS 0-10",
        type: "scale",
        category: "pain",
        targetValue: 0,
        normalRange: { min: 0, max: 2 },
        description: "Pain during functional activities",
        frequency: "daily",
        isActive: true
      },
      {
        id: "m4",
        name: "Single Leg Hop Test",
        unit: "% of uninjured",
        type: "percentage",
        category: "function",
        targetValue: 90,
        normalRange: { min: 85, max: 100 },
        description: "Functional performance comparison",
        frequency: "monthly",
        isActive: true
      }
    ],
    milestones: [
      {
        id: "ms1",
        name: "Full ROM Achievement",
        description: "Achieve 90% of normal knee range of motion",
        targetDate: "2024-02-15",
        completed: true,
        completedDate: "2024-02-12",
        phase: 1,
        criteria: ["Flexion ≥120°", "Extension 0°", "No pain during ROM"]
      },
      {
        id: "ms2",
        name: "Weight Bearing Progression",
        description: "Progress to full weight bearing without aids",
        targetDate: "2024-03-01",
        completed: false,
        phase: 2,
        criteria: ["Pain-free walking", "Normal gait pattern", "Single leg stance 30s"]
      }
    ]
  },
  {
    id: "2",
    injuryId: "2",
    injuryType: "Hamstring Strain - Grade 2",
    playerId: "7",
    playerName: "Marcus Lindberg (#7)",
    startDate: "2024-01-05",
    estimatedDuration: 6,
    currentPhase: 3,
    totalPhases: 3,
    overallProgress: 78,
    createdBy: "Physical Therapist Lisa Chen",
    lastUpdated: "2024-06-09",
    metrics: [
      {
        id: "h1",
        name: "Hamstring Flexibility",
        unit: "degrees",
        type: "number",
        category: "mobility",
        targetValue: 80,
        normalRange: { min: 75, max: 85 },
        description: "Passive straight leg raise test",
        frequency: "weekly",
        isActive: true
      },
      {
        id: "h2",
        name: "Sprint Speed",
        unit: "% of baseline",
        type: "percentage",
        category: "function",
        targetValue: 95,
        normalRange: { min: 90, max: 100 },
        description: "Sprint performance relative to baseline",
        frequency: "weekly",
        isActive: true
      }
    ],
    milestones: [
      {
        id: "hms1",
        name: "Pain-Free Running",
        description: "Return to pain-free running at moderate intensity",
        targetDate: "2024-01-20",
        completed: true,
        completedDate: "2024-01-18",
        phase: 2,
        criteria: ["70% sprint speed", "No pain during/after", "Normal running mechanics"]
      }
    ]
  }
];

// Mock metric entries for demonstration
const mockMetricEntries: MetricEntry[] = [
  // Erik Andersson - ACL metrics
  { id: "e1", metricId: "m1", playerId: "15", injuryId: "1", value: 110, date: "2024-06-01", measuredBy: "Dr. Johnson" },
  { id: "e2", metricId: "m1", playerId: "15", injuryId: "1", value: 115, date: "2024-06-08", measuredBy: "Dr. Johnson" },
  { id: "e3", metricId: "m3", playerId: "15", injuryId: "1", value: 3, date: "2024-06-08", measuredBy: "Erik Andersson" },
  { id: "e4", metricId: "m3", playerId: "15", injuryId: "1", value: 2, date: "2024-06-09", measuredBy: "Erik Andersson" },
  
  // Marcus Lindberg - Hamstring metrics
  { id: "m1", metricId: "h1", playerId: "7", injuryId: "2", value: 75, date: "2024-06-01", measuredBy: "Lisa Chen" },
  { id: "m2", metricId: "h1", playerId: "7", injuryId: "2", value: 78, date: "2024-06-08", measuredBy: "Lisa Chen" },
];

export function ProgressTrackingManager() {
  const [selectedPlan, setSelectedPlan] = useState<InjuryProgressPlan | null>(null);
  const [showMetricDialog, setShowMetricDialog] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<InjuryMetric | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const getMetricData = (planId: string, metricId: string) => {
    return mockMetricEntries
      .filter(entry => entry.metricId === metricId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString(),
        value: entry.value
      }));
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Progress Tracking</h3>
          <p className="text-muted-foreground">Monitor injury-specific metrics and recovery milestones</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Progress Plan
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Active Plans ({mockProgressPlans.length})</TabsTrigger>
          <TabsTrigger value="metrics">Metric Library</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {mockProgressPlans.map((plan) => (
              <ProgressPlanCard 
                key={plan.id} 
                plan={plan} 
                onClick={() => setSelectedPlan(plan)}
                getMetricData={getMetricData}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <MetricLibrary onEditMetric={(metric) => {
            setSelectedMetric(metric);
            setShowMetricDialog(true);
          }} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ProgressAnalytics plans={mockProgressPlans} entries={mockMetricEntries} />
        </TabsContent>
      </Tabs>

      {/* Plan Details Modal */}
      {selectedPlan && (
        <PlanDetailsModal 
          plan={selectedPlan} 
          onClose={() => setSelectedPlan(null)}
          getMetricData={getMetricData}
        />
      )}

      {/* Metric Editor Modal */}
      {showMetricDialog && selectedMetric && (
        <MetricEditorModal
          metric={selectedMetric}
          onClose={() => {
            setShowMetricDialog(false);
            setSelectedMetric(null);
          }}
        />
      )}
    </div>
  );
}

// Progress Plan Card Component
function ProgressPlanCard({ 
  plan, 
  onClick, 
  getMetricData 
}: { 
  plan: InjuryProgressPlan; 
  onClick: () => void;
  getMetricData: (planId: string, metricId: string) => any[];
}) {
  const activeMetrics = plan.metrics.filter(m => m.isActive);
  const completedMilestones = plan.milestones.filter(m => m.completed).length;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{plan.playerName}</h3>
                <Badge variant="outline">{plan.injuryType}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Phase {plan.currentPhase}/{plan.totalPhases} • {activeMetrics.length} metrics tracked
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Started: {new Date(plan.startDate).toLocaleDateString()}</span>
                <span>•</span>
                <span>Milestones: {completedMilestones}/{plan.milestones.length}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">{plan.overallProgress}%</span>
              <Progress value={plan.overallProgress} className="h-2 w-24" />
            </div>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground mt-2 ml-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Plan Details Modal Component
function PlanDetailsModal({ 
  plan, 
  onClose, 
  getMetricData 
}: { 
  plan: InjuryProgressPlan; 
  onClose: () => void;
  getMetricData: (planId: string, metricId: string) => any[];
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan.playerName} - Progress Details</DialogTitle>
          <DialogDescription>
            {plan.injuryType} • Started {new Date(plan.startDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{plan.overallProgress}%</p>
                  <p className="text-sm text-muted-foreground">Overall</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{plan.currentPhase}/{plan.totalPhases}</p>
                  <p className="text-sm text-muted-foreground">Phase</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold">{plan.metrics.filter(m => m.isActive).length}</p>
                  <p className="text-sm text-muted-foreground">Active Metrics</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                  <p className="text-2xl font-bold">{plan.milestones.filter(m => m.completed).length}/{plan.milestones.length}</p>
                  <p className="text-sm text-muted-foreground">Milestones</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Metric Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {plan.metrics.filter(m => m.isActive).map((metric) => {
                  const data = getMetricData(plan.id, metric.id);
                  const latestValue = data[data.length - 1]?.value;
                  const status = (() => {
                    if (!latestValue || !metric.targetValue) return "no-data";
                    const percentageOfTarget = (latestValue / metric.targetValue) * 100;
                    if (percentageOfTarget >= 90) return "on-track";
                    if (percentageOfTarget >= 70) return "improving";
                    return "behind";
                  })();
                  
                  return (
                    <div key={metric.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{metric.name}</h4>
                          <p className="text-sm text-muted-foreground">{metric.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={(() => {
                            switch (status) {
                              case "on-track": return "bg-green-100 text-green-800";
                              case "improving": return "bg-yellow-100 text-yellow-800";
                              case "behind": return "bg-red-100 text-red-800";
                              default: return "bg-gray-100 text-gray-800";
                            }
                          })()}>
                            {status === "on-track" ? "On Track" : 
                             status === "improving" ? "Improving" : 
                             status === "behind" ? "Behind" : "No Data"}
                          </Badge>
                          {latestValue && (
                            <p className="text-sm mt-1">
                              Latest: {latestValue} {metric.unit}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {data.length > 0 && (
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                              <XAxis dataKey="date" fontSize={12} />
                              <YAxis fontSize={12} />
                              <Tooltip />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                dot={{ r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle>Recovery Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      milestone.completed ? "bg-green-100" : "bg-gray-100"
                    )}>
                      {milestone.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{milestone.name}</h4>
                        <Badge variant="outline">Phase {milestone.phase}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Target: {new Date(milestone.targetDate).toLocaleDateString()}
                        {milestone.completed && milestone.completedDate && (
                          <span className="ml-2 text-green-600">
                            • Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Metric Library Component
function MetricLibrary({ onEditMetric }: { onEditMetric: (metric: InjuryMetric) => void }) {
  const allMetrics = mockProgressPlans.flatMap(plan => plan.metrics);
  const uniqueMetrics = allMetrics.filter((metric, index, self) => 
    index === self.findIndex(m => m.id === metric.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Metric Library</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Metric
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {uniqueMetrics.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">{metric.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{metric.category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metric.frequency} • {metric.unit}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onEditMetric(metric)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Progress Analytics Component
function ProgressAnalytics({ plans, entries }: { plans: InjuryProgressPlan[]; entries: MetricEntry[] }) {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recovery Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plans.map(plan => ({
                  player: plan.playerName.split(' ')[0],
                  progress: plan.overallProgress
                }))}>
                  <XAxis dataKey="player" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metric Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['mobility', 'strength', 'pain', 'function', 'psychological'].map(category => {
                const count = plans.flatMap(p => p.metrics).filter(m => m.category === category).length;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <span className="capitalize">{category}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Metric Editor Modal Component
function MetricEditorModal({ metric, onClose }: { metric: InjuryMetric; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Metric Details - {metric.name}</DialogTitle>
          <DialogDescription>
            View and edit metric configuration
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Badge className="ml-2">{metric.category}</Badge>
            </div>
            <div>
              <Label>Unit</Label>
              <p className="text-sm font-medium">{metric.unit}</p>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <p className="text-sm">{metric.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Target Value</Label>
              <p className="text-sm font-medium">{metric.targetValue}</p>
            </div>
            <div>
              <Label>Frequency</Label>
              <p className="text-sm font-medium">{metric.frequency}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 