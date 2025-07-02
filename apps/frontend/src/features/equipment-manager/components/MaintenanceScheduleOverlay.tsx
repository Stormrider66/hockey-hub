"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wrench, Clock, Calendar, AlertTriangle, 
  CheckCircle, XCircle, Users, FileText,
  ChevronRight, Activity, Timer, BarChart3,
  TrendingUp, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, isAfter, isBefore } from "date-fns";

interface MaintenanceTask {
  id: string;
  equipment: string;
  type: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastCompleted?: Date;
  nextDue: Date;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // in minutes
  assignedTo?: string;
  status: 'overdue' | 'due_soon' | 'scheduled' | 'completed';
  notes?: string;
  category: string;
}

interface MaintenanceStats {
  totalTasks: number;
  completedThisMonth: number;
  overdueCount: number;
  dueSoonCount: number;
  averageCompletionTime: number;
  complianceRate: number;
}

export function MaintenanceScheduleOverlay() {
  const [activeTab, setActiveTab] = useState("schedule");

  // Mock data - would come from API
  const maintenanceTasks: MaintenanceTask[] = [
    {
      id: "1",
      equipment: "Skate Sharpening Machine",
      type: "Calibration",
      frequency: "weekly",
      lastCompleted: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      nextDue: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      priority: "high",
      estimatedTime: 30,
      assignedTo: "Equipment Manager",
      status: "overdue",
      category: "Equipment Maintenance",
      notes: "Check blade alignment and hollow depth settings"
    },
    {
      id: "2",
      equipment: "All Helmets",
      type: "Safety Inspection",
      frequency: "monthly",
      lastCompleted: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      nextDue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: "high",
      estimatedTime: 120,
      assignedTo: "Safety Officer",
      status: "due_soon",
      category: "Safety Equipment",
      notes: "Check for cracks, proper fit, and certification dates"
    },
    {
      id: "3",
      equipment: "Ice Resurfacer",
      type: "Oil Change",
      frequency: "quarterly",
      lastCompleted: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      nextDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      priority: "medium",
      estimatedTime: 90,
      assignedTo: "Maintenance Staff",
      status: "scheduled",
      category: "Rink Equipment"
    },
    {
      id: "4",
      equipment: "Team Jerseys",
      type: "Deep Clean & Repair",
      frequency: "monthly",
      lastCompleted: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      nextDue: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      priority: "low",
      estimatedTime: 180,
      assignedTo: "Equipment Manager",
      status: "scheduled",
      category: "Team Apparel",
      notes: "Check for tears, loose threads, and number/name plate adhesion"
    },
    {
      id: "5",
      equipment: "First Aid Kits",
      type: "Inventory & Expiry Check",
      frequency: "monthly",
      lastCompleted: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      nextDue: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      priority: "high",
      estimatedTime: 45,
      assignedTo: "Medical Staff",
      status: "overdue",
      category: "Medical Equipment"
    },
    {
      id: "6",
      equipment: "Protective Gear Storage",
      type: "Sanitization",
      frequency: "weekly",
      lastCompleted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      nextDue: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: "medium",
      estimatedTime: 60,
      assignedTo: "Equipment Manager",
      status: "due_soon",
      category: "Storage Areas"
    }
  ];

  const stats: MaintenanceStats = {
    totalTasks: maintenanceTasks.length,
    completedThisMonth: 18,
    overdueCount: maintenanceTasks.filter(t => t.status === 'overdue').length,
    dueSoonCount: maintenanceTasks.filter(t => t.status === 'due_soon').length,
    averageCompletionTime: 75,
    complianceRate: 82
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600 bg-red-50';
      case 'due_soon':
        return 'text-amber-600 bg-amber-50';
      case 'scheduled':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <XCircle className="h-3 w-3" />;
      case 'due_soon':
        return <AlertTriangle className="h-3 w-3" />;
      case 'scheduled':
        return <Clock className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDaysUntilDue = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const upcomingTasks = maintenanceTasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime());

  const tasksByCategory = maintenanceTasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, MaintenanceTask[]>);

  return (
    <Card className="w-96 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {stats.overdueCount} Overdue
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stats.dueSoonCount} Due Soon
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="px-4 pb-4 mt-4">
            <ScrollArea className="h-80">
              <div className="space-y-2 pr-4">
                {upcomingTasks.map(task => {
                  const daysUntil = getDaysUntilDue(task.nextDue);
                  return (
                    <Card key={task.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{task.equipment}</p>
                          <p className="text-xs text-muted-foreground">{task.type}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs gap-1", getStatusColor(task.status))}
                        >
                          {getStatusIcon(task.status)}
                          {task.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Due Date</span>
                          <span className={cn("font-medium", {
                            "text-red-600": daysUntil < 0,
                            "text-amber-600": daysUntil >= 0 && daysUntil <= 7,
                            "text-green-600": daysUntil > 7
                          })}>
                            {daysUntil < 0 
                              ? `${Math.abs(daysUntil)} days overdue`
                              : daysUntil === 0 
                              ? 'Due today'
                              : `Due in ${daysUntil} days`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {task.estimatedTime} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {task.assignedTo}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Priority</span>
                          <span className={cn("font-medium capitalize", getPriorityColor(task.priority))}>
                            {task.priority}
                          </span>
                        </div>

                        {task.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground italic">
                              {task.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button variant="ghost" size="sm" className="w-full mt-2 justify-between">
                        Mark Complete
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="by-category" className="px-4 pb-4 mt-4">
            <ScrollArea className="h-80">
              <div className="space-y-3 pr-4">
                {Object.entries(tasksByCategory).map(([category, tasks]) => (
                  <Card key={category} className="p-3">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between py-1">
                          <div>
                            <p className="text-sm">{task.equipment}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.type} • {task.frequency}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getStatusColor(task.status))}
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="stats" className="px-4 pb-4 mt-4">
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Maintenance Overview
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Tasks</span>
                    <span className="text-sm font-bold">{stats.totalTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed This Month</span>
                    <span className="text-sm font-bold text-green-600">{stats.completedThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Completion Time</span>
                    <span className="text-sm font-bold">{stats.averageCompletionTime} min</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Compliance Rate
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Rate</span>
                    <span className="text-2xl font-bold">{stats.complianceRate}%</span>
                  </div>
                  <Progress value={stats.complianceRate} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    Based on on-time completion of scheduled maintenance
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Allocation
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Daily Tasks</span>
                    <span>~45 min/day</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Weekly Tasks</span>
                    <span>~3 hours/week</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Monthly Tasks</span>
                    <span>~8 hours/month</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}