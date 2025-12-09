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
import { Calendar, MessageCircle, Lock, Users } from "lucide-react";
// Fallback: use dashboardApi to unblock build
import { useGetUserDashboardDataQuery } from "@/store/api/dashboardApi";
import { useTranslation } from '@hockey-hub/translations';
import { CoachChannelList } from "@/features/chat/components/CoachChannelList";
import { usePrivateCoachChannels } from "@/hooks/usePrivateCoachChannels";
import { ScheduleDiscussionCard } from "./components/ScheduleDiscussionCard";

export default function ParentDashboard() {
  const { t } = useTranslation(['parent', 'common', 'calendar']);
  const [tab, setTab] = useState("overview");
  const children = [
    { id: "c1", name: "Emma Johansson", team: "U14", number: 15 },
    { id: "c2", name: "Victor Johansson", team: "U12", number: 4 },
  ] as const;
  const [activeChildId, setActiveChild] = useState<string>(children[0].id);
  const child = children.find((c) => c.id === activeChildId)!;

  const { data, isLoading } = useGetUserDashboardDataQuery();
  const { channels: coachChannels, loading: channelsLoading } = usePrivateCoachChannels();

  const events = data?.upcoming ?? [
    { date: "Today", title: "Practice", location: "Main Rink", time: "16:30" },
    { date: "Fri", title: "Home Game", location: "Main Rink", time: "18:00" },
  ];

  const fullSchedule = data?.fullSchedule ?? events;
  
  // Filter channels for the active child
  const childCoachChannels = coachChannels.filter(
    channel => channel.metadata?.playerId === activeChildId
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('parent:dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('parent:dashboard.subtitle')}</p>
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
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-3">
          <TabsTrigger value="overview">{t('parent:tabs.overview')}</TabsTrigger>
          <TabsTrigger value="schedule">{t('parent:tabs.schedule')}</TabsTrigger>
          <TabsTrigger value="coaches">{t('parent:tabs.coaches', 'Coaches')}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('parent:upcomingEvents.title')}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t('common:loading')}</p>
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
          {/* Schedule Discussions */}
          <ScheduleDiscussionCard
            teamId={child.team}
            userId="parent-user-id" // In real app, get from auth context
            organizationId="org-id" // In real app, get from auth context
          />

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('parent:quickActions.title')}</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              <Button size="sm" className="flex-1 min-w-[120px]">
                <MessageCircle className="h-4 w-4 mr-1" /> {t('parent:quickActions.messageCoach')}
              </Button>
              <Button size="sm" variant="outline" className="flex-1 min-w-[120px]">
                <Calendar className="h-4 w-4 mr-1" /> {t('parent:quickActions.syncCalendar')}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('parent:schedule.fullScheduleTitle')}</CardTitle>
              <CardDescription>{t('parent:schedule.nextDays', { days: 7 })}</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t('common:loading')}</p>
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
                {t('parent:actions.viewEquipmentChecklist')}
              </Button>
            </CardDescription>
          </Card>
        </TabsContent>

        {/* Coaches Tab */}
        <TabsContent value="coaches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('parent:coaches.privateChannels', 'Private Coach Channels')}
              </CardTitle>
              <CardDescription>
                {t('parent:coaches.privateChannelsDesc', 'Confidential communication with your child\'s coaches')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {channelsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('common:loading')}</p>
                </div>
              ) : childCoachChannels.length > 0 ? (
                <CoachChannelList
                  channels={childCoachChannels}
                  onChannelSelect={(channelId) => {
                    // Open chat with selected channel
                    // This would integrate with your chat system
                    window.dispatchEvent(new CustomEvent('openChat', { detail: { channelId } }));
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t('parent:coaches.noChannels', 'No coach channels available')}</p>
                  <p className="text-sm mt-1">
                    {t('parent:coaches.noChannelsDesc', 'Channels will be created when coaches are assigned to the team')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('parent:coaches.teamCoaches', 'Team Coaching Staff')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>HC</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">John Smith</p>
                      <p className="text-sm text-muted-foreground">Head Coach</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>AC</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Sarah Johnson</p>
                      <p className="text-sm text-muted-foreground">Assistant Coach</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 