"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MessageCircle } from "lucide-react";
import { useGetChildOverviewQuery } from "@/store/api/parentApi";

export default function ParentDashboard() {
  const [tab, setTab] = useState("overview");
  const children = [
    { id: "c1", name: "Emma Johansson", team: "U14", number: 15 },
    { id: "c2", name: "Victor Johansson", team: "U12", number: 4 },
  ] as const;
  const [activeChildId, setActiveChild] = useState<string>(children[0].id);
  const child = children.find((c) => c.id === activeChildId)!;

  const { data, isLoading } = useGetChildOverviewQuery(activeChildId);

  const events = data?.upcoming ?? [
    { date: "Today", title: "Practice", location: "Main Rink", time: "16:30" },
    { date: "Fri", title: "Home Game", location: "Main Rink", time: "18:00" },
  ];

  const fullSchedule = data?.fullSchedule ?? events;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground">Manage your child's activities</p>
        </div>
        <div className="flex gap-2">
          {children.map((c) => (
            <Button key={c.id} variant={c.id === activeChildId ? "default" : "outline"} onClick={() => setActiveChild(c.id)}>
              {c.name.split(" ")[0]}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-muted/40 p-4 rounded">
        <Avatar>
          <AvatarFallback>{child.number}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-bold">{child.name}</h2>
          <Badge>{child.team}</Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : (
                events.map((e) => (
                  <div key={e.title} className="flex justify-between py-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <p>{e.title}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{e.date} • {e.time}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="space-y-4">
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              <Button size="sm" className="flex-1 min-w-[120px]">
                <MessageCircle className="h-4 w-4 mr-1" /> Message Coach
              </Button>
              <Button size="sm" variant="outline" className="flex-1 min-w-[120px]">
                <Calendar className="h-4 w-4 mr-1" /> Sync Calendar
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Full Schedule</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : (
                fullSchedule.map((e) => (
                  <div key={e.title} className="flex justify-between py-2 first:pt-0 last:pb-0">
                    <div>{e.date}</div>
                    <div>{e.title}</div>
                    <div>{e.time}</div>
                    <div>{e.location}</div>
                  </div>
                ))
              )}
            </CardContent>
            <CardDescription className="p-4">
              <Button size="sm" variant="outline">
                View Equipment Checklist
              </Button>
            </CardDescription>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 