"use client";

import React, { useState } from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Calendar,
  Shield,
  User,
  Bell,
  Settings,
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, addDays, isSameMonth, isSameDay } from "date-fns";
// API imports commented out for now - using mock data
// import { useGetClubOverviewQuery } from "@/store/api/clubAdminApi";

export default function ClubAdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Mock API state for now
  const apiData = null;
  const isLoading = false;

  const orgStats = apiData?.orgStats ?? { teams: 8, activeMembers: 243, coachingStaff: 18, upcomingEvents: 28 };

  const teams = apiData?.teams ?? [
    { id: 1, name: "Senior Team", members: 32, category: "Senior", attendance: 92 },
    { id: 2, name: "Junior A", members: 28, category: "Junior", attendance: 88 },
    { id: 3, name: "U16 Boys", members: 24, category: "Youth", attendance: 90 },
  ];

  const roleBreakdown = apiData?.roleBreakdown ?? [
    { name: "Players", value: 180, color: "#3b82f6" },
    { name: "Coaches", value: 15, color: "#10b981" },
    { name: "Parents", value: 35, color: "#6366f1" },
  ];

  const members = apiData?.members ?? [];
  const tasks = apiData?.tasks ?? [];

  const eventsByDate = React.useMemo(() => {
    const evts = apiData?.events ?? [];
    const map: Record<string, typeof evts> = {};
    evts.forEach((ev) => {
      const key = format(new Date(ev.date), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [apiData?.events]);

  const calendarDays = React.useMemo(() => generateCalendarCells(currentMonth), [currentMonth]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Club Administration"
        subtitle="Manage teams, members, and club operations"
        role="clubadmin"
      />
      <div className="space-y-6 p-6">
        {/* Quick Actions */}
        <div className="flex justify-end items-center">
          <div className="flex gap-4">
            <Button size="sm" variant="outline">
              <Bell className="h-4 w-4 mr-2" /> Alerts
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" /> Settings
            </Button>
          </div>
        </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="admin">Administration</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Teams" value={orgStats.teams} />
            <StatCard icon={User} label="Active Members" value={orgStats.activeMembers} />
            <StatCard icon={Shield} label="Coaching Staff" value={orgStats.coachingStaff} />
            <StatCard icon={Calendar} label="Upcoming Events" value={orgStats.upcomingEvents} />
          </div>

          {/* Teams + role chart */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Teams list */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>Quick overview</CardDescription>
              </CardHeader>
              <CardContent className="h-72 overflow-auto">
                {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : teams.map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center border-b py-2 last:border-0">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarFallback>{t.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.category} • {t.members} members
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{t.attendance}%</Badge>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Team
                </Button>
              </CardFooter>
            </Card>

            {/* Role pie */}
            <Card>
              <CardHeader>
                <CardTitle>Members by Role</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleBreakdown}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(d) => `${d.name}`}
                    >
                      {roleBreakdown.map((seg: any) => (
                        <Cell key={seg.name} fill={seg.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Teams */}
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Teams</CardTitle>
              <CardDescription>Manage teams in your organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Search teams…" className="flex-1" />
                <Button size="sm"><Plus className="h-4 w-4 mr-2"/>Add Team</Button>
              </div>
              <div className="divide-y">
                {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : teams.map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{t.name.slice(0,2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium leading-none">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.category}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{t.members} members</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Members</CardTitle>
              <CardDescription>All registered people in your club.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Search members…" className="flex-1" />
                <Button size="sm"><Plus className="h-4 w-4 mr-2"/>Invite</Button>
              </div>
              <div className="divide-y">
                {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (members.length? members : [
                  { name: "Erik Johansson", role: "Player", team: "Senior", status: "Active" },
                  { name: "Maria Andersson", role: "Coach", team: "Junior A", status: "Active" },
                  { name: "Johan Berg", role: "Player", team: "Senior", status: "Inactive" },
                ]).map((m) => (
                  <div key={m.name} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback>{m.name.slice(0,2)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium leading-none">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role} • {m.team}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{m.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <Button size="icon" variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 text-xs font-medium mb-2">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                  <div key={d} className="text-center">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-border text-sm">
                {calendarDays.map((day) => {
                  const iso = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsByDate[iso] ?? [];
                  return (
                    <div key={iso} className={`p-2 h-24 border bg-background ${!isSameMonth(day, currentMonth) ? "text-muted-foreground bg-muted" : ""}`}
                    >
                      <div className={`text-right text-xs ${isSameDay(day, new Date()) ? "font-bold text-primary" : ""}`}>{format(day, "d")}</div>
                      {dayEvents.slice(0,2).map((ev) => (
                        <p key={ev.title} className="truncate text-[10px] leading-tight">• {ev.title}</p>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[10px] text-muted-foreground">+{dayEvents.length-2} more</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Administration */}
        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Club Tasks</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (tasks.length? tasks : [
                { task: "Approve membership applications", owner: "Registrar" },
                { task: "Review budget proposal", owner: "Treasurer" },
                { task: "Plan summer camp", owner: "Board" },
              ]).map((t) => (
                <div key={t.task} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                  <span>{t.task}</span>
                  <Badge variant="outline">{t.owner}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

/* ────────── helpers ────────── */
function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* Helper to build calendar cell dates */
function generateCalendarCells(month: Date): Date[] {
  const startMonth = startOfMonth(month);
  const endMonth = endOfMonth(month);
  const startDate = startOfWeek(startMonth, { weekStartsOn: 0 });
  const endDate = endOfWeek(endMonth, { weekStartsOn: 0 });
  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
} 