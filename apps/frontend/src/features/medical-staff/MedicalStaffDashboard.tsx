"use client";

import React, { useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Stethoscope,
  Calendar,
  Activity,
  Bell,
  Plus,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useGetMedicalOverviewQuery } from "@/store/api/medicalApi";

export default function MedicalStaffDashboard() {
  const [tab, setTab] = useState("overview");
  const { data: apiData, isLoading } = useGetMedicalOverviewQuery("senior");

  const appointments = apiData?.appointments ?? [
    { time: "14:00", player: "Oskar Lind", type: "Assessment", location: "Med Room" },
    { time: "15:00", player: "Johan Berg", type: "Rehab", location: "Rehab Gym" },
  ];
  const availability = apiData?.availability ?? { full: 18, limited: 3, rehab: 2, out: 1 };
  const injuries = apiData?.injuries ?? [
    { player: "Oskar Lind", injury: "Knee Sprain", status: "Acute" },
    { player: "Johan Berg", injury: "Shoulder", status: "Rehab" },
    { player: "Emma Lindberg", injury: "Ankle", status: "RTP" },
  ];

  const pieData = [
    { name: "Full", value: availability.full, color: "#10b981" },
    { name: "Limited", value: availability.limited, color: "#f59e0b" },
    { name: "Rehab", value: availability.rehab, color: "#3b82f6" },
    { name: "Out", value: availability.out, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Medical Dashboard</h1>
        <Button size="sm" variant="outline">
          <Bell className="h-4 w-4 mr-2" /> Alerts
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="injuries">Injuries</TabsTrigger>
          <TabsTrigger value="rehab">Rehabilitation</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Appointments */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Today's Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (<p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>) : appointments.map((a) => (
                  <div key={a.time} className="flex items-start space-x-4 border-b py-2 last:border-0">
                    <div className="p-2 bg-amber-100 rounded">
                      <Stethoscope className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{a.player}</p>
                      <p className="text-muted-foreground text-xs">
                        {a.time} • {a.type} • {a.location}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Schedule
                </Button>
              </CardFooter>
            </Card>

            {/* Availability pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Player Availability</CardTitle>
              </CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70}>
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Active injuries */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Active Injuries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : injuries.map((inj) => (
                  <div key={inj.player} className="flex justify-between text-sm border-b py-1 last:border-0">
                    <span>{inj.player}</span>
                    <Badge variant="outline">{inj.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Injuries */}
        <TabsContent value="injuries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Injuries</CardTitle>
              <CardDescription>Players who are currently injured or in rehabilitation.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : injuries.map((inj) => (
                <div key={inj.player} className="flex justify-between py-2 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="font-medium leading-none">{inj.player}</p>
                    <p className="text-xs text-muted-foreground">{inj.injury}</p>
                  </div>
                  <Badge variant="outline">{inj.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rehabilitation */}
        <TabsContent value="rehab" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rehabilitation Progress</CardTitle>
              <CardDescription>Overview of players currently in rehab and their progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : injuries
                .filter((inj) => inj.status === "Rehab")
                .map((inj) => (
                  <div key={inj.player} className="space-y-1">
                    <div className="flex justify-between">
                      <p>{inj.player}</p>
                      <span className="text-sm text-muted-foreground">Phase 2 / 4</span>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                ))}
              {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : injuries.filter((inj) => inj.status === "Rehab").length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No players currently in rehabilitation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Records */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Medical Records</CardTitle>
              <CardDescription>Last 5 entries across the team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : [
                { date: "2024-05-18", player: "Oskar Lind", note: "MRI results uploaded" },
                { date: "2024-05-17", player: "Emma Lindberg", note: "Clearance for light practice" },
                { date: "2024-05-15", player: "Johan Berg", note: "Follow-up assessment" },
                { date: "2024-05-14", player: "Alex Nilsson", note: "Concussion baseline test" },
                { date: "2024-05-13", player: "Erik Johansson", note: "Physio note added" },
              ].map((rec) => (
                <div key={`${rec.date}-${rec.player}`} className="flex justify-between text-sm border-b py-1 last:border-0">
                  <div>
                    <p className="font-medium leading-none">{rec.player}</p>
                    <p className="text-xs text-muted-foreground">{rec.note}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{rec.date}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 