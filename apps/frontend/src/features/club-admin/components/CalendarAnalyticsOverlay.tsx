"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  X, TrendingUp, Users, Calendar, Clock, DollarSign,
  Activity, PieChart, BarChart3, Download, Filter
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface CalendarAnalyticsOverlayProps {
  onClose: () => void;
  events: any[];
}

export function CalendarAnalyticsOverlay({ onClose, events }: CalendarAnalyticsOverlayProps) {
  const [timeRange, setTimeRange] = useState("30d");
  const [view, setView] = useState<'overview' | 'teams' | 'facilities' | 'costs'>('overview');

  // Process events data for analytics
  const eventsByType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(eventsByType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: getColorForType(name)
  }));

  const eventsByTeam = [
    { team: "Senior Team", events: 45, hours: 120, cost: 18000 },
    { team: "Junior A", events: 38, hours: 95, cost: 14250 },
    { team: "U16 Boys", events: 32, hours: 80, cost: 12000 },
    { team: "U14 Boys", events: 28, hours: 70, cost: 10500 },
    { team: "U12 Boys", events: 24, hours: 48, cost: 7200 },
    { team: "Others", events: 33, hours: 66, cost: 9900 }
  ];

  const facilityUsage = [
    { facility: "Main Rink", hours: 280, utilization: 85, revenue: 70000 },
    { facility: "Practice Rink", hours: 180, utilization: 65, revenue: 27000 },
    { facility: "Gym", hours: 120, utilization: 60, revenue: 6000 },
    { facility: "Meeting Room A", hours: 40, utilization: 35, revenue: 0 },
    { facility: "Meeting Room B", hours: 25, utilization: 22, revenue: 0 }
  ];

  const monthlyTrend = [
    { month: "Jan", events: 145, cost: 58000, hours: 580 },
    { month: "Feb", events: 162, cost: 64800, hours: 648 },
    { month: "Mar", events: 178, cost: 71200, hours: 712 },
    { month: "Apr", events: 156, cost: 62400, hours: 624 },
    { month: "May", events: 189, cost: 75600, hours: 756 },
    { month: "Jun", events: 201, cost: 80400, hours: 804 }
  ];

  const peakHours = [
    { hour: "6am", weekday: 5, weekend: 2 },
    { hour: "7am", weekday: 12, weekend: 5 },
    { hour: "8am", weekday: 8, weekend: 8 },
    { hour: "9am", weekday: 6, weekend: 15 },
    { hour: "10am", weekday: 4, weekend: 18 },
    { hour: "11am", weekday: 3, weekend: 20 },
    { hour: "12pm", weekday: 5, weekend: 16 },
    { hour: "1pm", weekday: 8, weekend: 12 },
    { hour: "2pm", weekday: 10, weekend: 10 },
    { hour: "3pm", weekday: 15, weekend: 8 },
    { hour: "4pm", weekday: 22, weekend: 6 },
    { hour: "5pm", weekday: 28, weekend: 5 },
    { hour: "6pm", weekday: 35, weekend: 8 },
    { hour: "7pm", weekday: 32, weekend: 12 },
    { hour: "8pm", weekday: 25, weekend: 15 },
    { hour: "9pm", weekday: 18, weekend: 10 }
  ];

  function getColorForType(type: string) {
    const colors: Record<string, string> = {
      training: "#3b82f6",
      game: "#10b981",
      meeting: "#6366f1",
      tournament: "#f59e0b",
      fundraiser: "#ec4899",
      other: "#64748b"
    };
    return colors[type] || colors.other;
  }

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto">
      <div className="container max-w-7xl mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Calendar Analytics Dashboard
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Comprehensive insights into facility usage and event patterns
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={view} onValueChange={(v: any) => setView(v)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Team Analysis</TabsTrigger>
            <TabsTrigger value="facilities">Facility Usage</TabsTrigger>
            <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                      <p className="text-2xl font-bold">201</p>
                      <p className="text-xs text-green-600 mt-1">+12% vs last month</p>
                    </div>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-bold">804</p>
                      <p className="text-xs text-muted-foreground mt-1">26.8 hours/day avg</p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Facility Revenue</p>
                      <p className="text-2xl font-bold">$103k</p>
                      <p className="text-xs text-green-600 mt-1">+8% vs target</p>
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Utilization</p>
                      <p className="text-2xl font-bold">73.4%</p>
                      <p className="text-xs text-amber-600 mt-1">Target: 80%</p>
                    </div>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              {/* Event Types Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Types Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Event Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="events" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Events"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Hours"
                        yAxisId="right"
                      />
                      <YAxis yAxisId="right" orientation="right" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Peak Hours Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Usage Hours</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Average events per hour (weekday vs weekend)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="weekday" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weekend" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eventsByTeam.map((team) => (
                    <div key={team.team} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{team.team}</h4>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{team.events} events</span>
                          <span>{team.hours} hours</span>
                          <span>${team.cost.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ${(team.cost / team.hours).toFixed(0)}/hour
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {((team.hours / 804) * 100).toFixed(0)}% of total
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facilities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Facility Utilization & Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={facilityUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="facility" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="hours" 
                      fill="#3b82f6" 
                      name="Hours Used"
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="utilization" 
                      fill="#10b981" 
                      name="Utilization %"
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="revenue" 
                      fill="#f59e0b" 
                      name="Revenue ($)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown & Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Monthly Cost Trend</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                        <Area 
                          type="monotone" 
                          dataKey="cost" 
                          stroke="#f59e0b" 
                          fill="#f59e0b"
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-4">Cost Categories</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Ice Rental</span>
                        <span className="font-medium">$68,400 (85%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Equipment</span>
                        <span className="font-medium">$6,420 (8%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Officials</span>
                        <span className="font-medium">$4,020 (5%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Other</span>
                        <span className="font-medium">$1,560 (2%)</span>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center font-medium">
                          <span>Total</span>
                          <span>$80,400</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}