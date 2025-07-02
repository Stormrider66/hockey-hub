"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, AlertTriangle, TrendingUp, Clock, 
  Calendar, Search, Filter, ChevronRight,
  UserCheck, UserX, AlertCircle, Timer,
  Zap, Target, Shield, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMedicalData } from "@/hooks/useMedicalData";

interface InjuryStatus {
  playerId: string;
  playerName: string;
  playerNumber: string;
  injury: string;
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'acute' | 'rehab' | 'rtp' | 'cleared';
  daysInjured: number;
  estimatedReturn: string;
  progress: number;
  nextCheckup: string;
  compliance: number;
  risk: 'low' | 'medium' | 'high';
}

export function MedicalStatusOverlay() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("injuries");
  const { data: medicalData } = useMedicalData("senior");

  // Mock data - would come from API
  const injuryStatuses: InjuryStatus[] = [
    {
      playerId: "15",
      playerName: "Erik Andersson",
      playerNumber: "15",
      injury: "ACL Tear",
      bodyPart: "Knee",
      severity: "severe",
      status: "rehab",
      daysInjured: 45,
      estimatedReturn: "4-6 months",
      progress: 25,
      nextCheckup: "Tomorrow",
      compliance: 95,
      risk: "high"
    },
    {
      playerId: "7",
      playerName: "Marcus Lindberg",
      playerNumber: "7",
      injury: "Hamstring Strain",
      bodyPart: "Hamstring",
      severity: "moderate",
      status: "rtp",
      daysInjured: 21,
      estimatedReturn: "1 week",
      progress: 80,
      nextCheckup: "Today",
      compliance: 100,
      risk: "medium"
    },
    {
      playerId: "23",
      playerName: "Viktor Nilsson",
      playerNumber: "23",
      injury: "Concussion",
      bodyPart: "Head",
      severity: "moderate",
      status: "acute",
      daysInjured: 5,
      estimatedReturn: "2-3 weeks",
      progress: 20,
      nextCheckup: "Daily",
      compliance: 100,
      risk: "high"
    },
    {
      playerId: "14",
      playerName: "Johan Bergström",
      playerNumber: "14",
      injury: "Ankle Sprain",
      bodyPart: "Ankle",
      severity: "mild",
      status: "cleared",
      daysInjured: 0,
      estimatedReturn: "Cleared",
      progress: 100,
      nextCheckup: "Follow-up in 1 week",
      compliance: 100,
      risk: "low"
    }
  ];

  const filteredStatuses = injuryStatuses.filter(status =>
    status.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    status.injury.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeInjuries = filteredStatuses.filter(s => s.status !== 'cleared');
  const clearedPlayers = filteredStatuses.filter(s => s.status === 'cleared');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'text-red-600 bg-red-50';
      case 'moderate': return 'text-amber-600 bg-amber-50';
      case 'mild': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'acute': return <AlertCircle className="h-4 w-4" />;
      case 'rehab': return <Activity className="h-4 w-4" />;
      case 'rtp': return <Target className="h-4 w-4" />;
      case 'cleared': return <UserCheck className="h-4 w-4" />;
      default: return null;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return <Badge variant="destructive" className="text-xs">High Risk</Badge>;
      case 'medium': return <Badge variant="default" className="text-xs">Medium Risk</Badge>;
      case 'low': return <Badge variant="secondary" className="text-xs">Low Risk</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="w-96 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Medical Status
          </span>
          <Badge variant="outline">
            {activeInjuries.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search player or injury..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="injuries">
              Injuries ({activeInjuries.length})
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="injuries" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {activeInjuries.map(status => (
                  <Card key={status.playerId} className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded", getSeverityColor(status.severity))}>
                            {getStatusIcon(status.status)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{status.playerName}</p>
                            <p className="text-xs text-muted-foreground">#{status.playerNumber}</p>
                          </div>
                        </div>
                        {getRiskBadge(status.risk)}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">{status.injury}</p>
                        <p className="text-xs text-muted-foreground">{status.bodyPart} • Day {status.daysInjured}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Recovery Progress</span>
                          <span>{status.progress}%</span>
                        </div>
                        <Progress value={status.progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">ETR</p>
                          <p className="font-medium">{status.estimatedReturn}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Checkup</p>
                          <p className="font-medium">{status.nextCheckup}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">Compliance: {status.compliance}%</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          View Details
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {clearedPlayers.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Recently Cleared</h4>
                    {clearedPlayers.map(player => (
                      <div key={player.playerId} className="flex items-center justify-between p-2 rounded hover:bg-accent">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{player.playerName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{player.nextCheckup}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground mb-2">Recovery Timeline</div>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  {activeInjuries.map((status, index) => (
                    <div key={status.playerId} className="flex gap-4 mb-6">
                      <div className="relative">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          getSeverityColor(status.severity)
                        )}>
                          <span className="text-xs font-bold">{status.playerNumber}</span>
                        </div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">{status.playerName}</p>
                        <p className="text-xs text-muted-foreground mb-2">{status.injury}</p>
                        <div className="bg-muted rounded p-2 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Started: {status.daysInjured} days ago</span>
                            <span>ETR: {status.estimatedReturn}</span>
                          </div>
                          <Progress value={status.progress} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Injured</p>
                      <p className="text-2xl font-bold">{activeInjuries.length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">High Risk</p>
                      <p className="text-2xl font-bold">{activeInjuries.filter(i => i.risk === 'high').length}</p>
                    </div>
                    <Shield className="h-8 w-8 text-red-600" />
                  </div>
                </Card>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">By Severity</h4>
                {['severe', 'moderate', 'mild'].map(severity => {
                  const count = activeInjuries.filter(i => i.severity === severity).length;
                  const percentage = activeInjuries.length > 0 ? (count / activeInjuries.length) * 100 : 0;
                  return (
                    <div key={severity} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{severity}</span>
                        <span>{count} players</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Upcoming Checkups</h4>
                <div className="space-y-1">
                  {activeInjuries
                    .filter(i => i.nextCheckup === 'Today' || i.nextCheckup === 'Tomorrow')
                    .map(injury => (
                      <div key={injury.playerId} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                        <span>{injury.playerName}</span>
                        <Badge variant={injury.nextCheckup === 'Today' ? 'default' : 'outline'} className="text-xs">
                          {injury.nextCheckup}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}