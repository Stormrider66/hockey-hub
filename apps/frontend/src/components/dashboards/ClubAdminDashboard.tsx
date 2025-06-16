"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, DollarSign, Calendar, Trophy, AlertCircle, TrendingUp,
  UserPlus, Settings, FileText, CreditCard, Shield, Bell,
  BarChart3, PieChart, Activity, Clock, CheckCircle2, XCircle
} from "lucide-react";

export function ClubAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for club administration
  const clubStats = {
    totalMembers: 245,
    activeTeams: 8,
    monthlyRevenue: 125000,
    pendingPayments: 15,
    upcomingEvents: 12,
    facilityBookings: 28
  };

  const teamData = [
    { name: "Senior A", members: 25, coach: "Robert Ohlsson", status: "active", budget: 45000 },
    { name: "Senior B", members: 22, coach: "Erik Lindqvist", status: "active", budget: 35000 },
    { name: "Junior A", members: 20, coach: "Anna Svensson", status: "active", budget: 25000 },
    { name: "Junior B", members: 18, coach: "Lars Andersson", status: "active", budget: 20000 },
    { name: "Youth U16", members: 24, coach: "Maria Johansson", status: "active", budget: 18000 },
    { name: "Youth U14", members: 26, coach: "Per Nilsson", status: "active", budget: 15000 },
    { name: "Youth U12", members: 28, coach: "Sara Karlsson", status: "active", budget: 12000 },
    { name: "Youth U10", members: 30, coach: "Johan Petersson", status: "active", budget: 10000 }
  ];

  const recentActivities = [
    { action: "New member registration", details: "Emma Lindström joined Youth U14", time: "2 hours ago", type: "member" },
    { action: "Payment received", details: "Monthly fee from Senior A team", time: "4 hours ago", type: "payment" },
    { action: "Facility booking", details: "Main rink reserved for tournament", time: "6 hours ago", type: "facility" },
    { action: "Coach assignment", details: "New assistant coach for Junior A", time: "1 day ago", type: "staff" },
    { action: "Equipment order", details: "New jerseys ordered for Senior teams", time: "2 days ago", type: "equipment" }
  ];

  const financialOverview = [
    { category: "Membership Fees", amount: 85000, percentage: 68 },
    { category: "Facility Rental", amount: 25000, percentage: 20 },
    { category: "Equipment Sales", amount: 10000, percentage: 8 },
    { category: "Sponsorships", amount: 5000, percentage: 4 }
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubStats.totalMembers}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+8 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubStats.activeTeams}</div>
            <p className="text-xs text-muted-foreground mt-1">All operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubStats.monthlyRevenue.toLocaleString()} SEK</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+12% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubStats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubStats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Facility Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubStats.facilityBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Teams Overview</CardTitle>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamData.slice(0, 5).map(team => (
              <div key={team.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">Coach: {team.coach}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{team.members}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{team.budget.toLocaleString()} SEK</p>
                    <p className="text-xs text-muted-foreground">Budget</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {team.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`h-2 w-2 rounded-full mt-2 ${
                  activity.type === 'member' ? 'bg-blue-500' :
                  activity.type === 'payment' ? 'bg-green-500' :
                  activity.type === 'facility' ? 'bg-purple-500' :
                  activity.type === 'staff' ? 'bg-orange-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFinancialTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialOverview.map(item => (
                <div key={item.category}>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{item.category}</span>
                    <span className="font-medium">{item.amount.toLocaleString()} SEK</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Paid on time</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">230 members</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending payment</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">15 members</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Overdue</span>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">0 members</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="teams">Teams</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="facilities">Facilities</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        {renderOverviewTab()}
      </TabsContent>

      <TabsContent value="teams">
        <Card>
          <CardHeader>
            <CardTitle>All Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamData.map(team => (
                <div key={team.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">Coach: {team.coach}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">{team.members}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{team.budget.toLocaleString()} SEK</p>
                      <p className="text-xs text-muted-foreground">Budget</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {team.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="financial">
        {renderFinancialTab()}
      </TabsContent>

      <TabsContent value="facilities">
        <Card>
          <CardHeader>
            <CardTitle>Facility Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Facility management features coming soon</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 