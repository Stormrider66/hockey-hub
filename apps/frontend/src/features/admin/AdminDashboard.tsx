"use client";

import React, { useState } from "react";
import { useGetAdminOverviewQuery } from "@/store/api/adminApi";
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
import {
  Bell,
  Settings,
  Users,
  AlertCircle,
  Globe,
  Database,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  BarChart,
  Bar,
} from "recharts";

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const { data: apiData, isLoading } = useGetAdminOverviewQuery();

  const services = apiData?.services ?? [
    { name: "User Service", status: "healthy", uptime: 99.98 },
    { name: "Calendar Service", status: "healthy", uptime: 99.95 },
    { name: "Training Service", status: "healthy", uptime: 99.97 },
    { name: "Medical Service", status: "degraded", uptime: 99.82 },
  ];

  const systemMetrics = apiData?.systemMetrics ?? [
    { date: "05-12", errors: 12, response: 230 },
    { date: "05-13", errors: 8, response: 210 },
    { date: "05-14", errors: 15, response: 250 },
    { date: "05-15", errors: 5, response: 190 },
    { date: "05-16", errors: 7, response: 200 },
    { date: "05-17", errors: 9, response: 220 },
    { date: "05-18", errors: 6, response: 210 },
  ];

  const organizations = apiData?.organizations ?? [
    { name: "Active organizations", value: 152, change: 5 },
    { name: "In trial period", value: 24, change: 2 },
    { name: "Pending renewal", value: 7, change: -1 },
  ];

  const revenue = apiData?.revenue ?? [];
  const tasks = apiData?.tasks ?? [];

  /* ──────────── Render ──────────── */
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button size="sm" variant="outline">
            <Bell className="h-4 w-4 mr-2" /> Alerts
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="admin">Administration</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          {/* Service status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {services.map((svc) => (
              <Card key={svc.name} className={svc.status === "degraded" ? "border-amber-400" : ""}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">{svc.name}</p>
                    <Badge
                      className={
                        svc.status === "healthy"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      {svc.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{svc.uptime}%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Error rate chart */}
          <Card>
            <CardHeader>
              <CardTitle>Error Rate (last 7 days)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={systemMetrics} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="errors" stroke="#ef4444" name="Errors" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations */}
        <TabsContent value="organizations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <Card key={org.name}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">{org.name}</p>
                      <h3 className="text-2xl font-bold">{org.value}</h3>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Administration */}
        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Administrative Tasks</CardTitle>
              <CardDescription>Resolve outstanding approvals and reviews.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {tasks.map((t) => (
                <div key={t.task} className="flex justify-between py-2 first:pt-0 last:pb-0">
                  <span>{t.task}</span>
                  <Badge variant="outline">{t.owner}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Recurring Revenue</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenue.length ? revenue : [
                    { month: "Jan", mrr: 4200 },
                    { month: "Feb", mrr: 4400 },
                    { month: "Mar", mrr: 4950 },
                    { month: "Apr", mrr: 5300 },
                    { month: "May", mrr: 5750 },
                  ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="mrr" fill="#3b82f6" name="MRR" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 