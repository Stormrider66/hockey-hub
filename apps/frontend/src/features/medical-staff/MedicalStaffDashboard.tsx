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
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Stethoscope, Calendar, Activity, Bell, Plus, FileText,
  AlertTriangle, Clock, CheckCircle, XCircle, TrendingUp,
  User, ChevronRight, Upload, Filter, Search, BarChart3,
  FileCheck, Heart, Brain, Zap, Shield, Timer, Users,
  ArrowUp, ArrowDown, Minus, Target, Clipboard, MessageSquare
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useMedicalData } from "@/hooks/useMedicalData";
import { MedicalDocumentUpload } from "./components/MedicalDocumentUpload";
import { PlayerAvailabilityManager } from "./components/PlayerAvailabilityManager";
import { TreatmentManager } from "./components/TreatmentManager";
import { ProtocolBuilder } from "./components/ProtocolBuilder";
import { RecoveryManagement } from "./components/RecoveryManagement";
import { TreatmentManagement } from "./components/TreatmentManagement";
import { InjuryRegistrationForm } from "./components/InjuryRegistrationForm";
import { TreatmentForm } from "./components/TreatmentForm";
import { InjuryDetailModal } from "./components/InjuryDetailModal";
import { UrgentNotificationComposer } from "./components/UrgentNotificationComposer";
import { UrgentNotificationCenter } from "./components/UrgentNotificationCenter";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useGetMedicalDocumentsQuery, useGetDocumentSignedUrlQuery } from "../../store/api/medicalApi";
import { MedicalCalendarView } from "./MedicalCalendarView";
import { AppointmentReminderSettings } from "./components/AppointmentReminderSettings";
import { useTranslation } from '@hockey-hub/translations';

// Note: Mock data moved to useMedicalData hook for progressive integration
const legacyMockInjuries = [
  {
    id: 1,
    player: "Erik Andersson",
    playerId: "15",
    injury: "ACL Tear - Right Knee",
    bodyPart: "Knee",
    severity: "severe",
    status: "acute",
    dateOccurred: "2024-01-12",
    estimatedReturn: "6-8 months",
    phase: 1,
    totalPhases: 5,
    progress: 15,
    mechanism: "Non-contact twist during game",
    notes: "Surgery scheduled for next week"
  },
  {
    id: 2,
    player: "Marcus Lindberg",
    playerId: "7",
    injury: "Hamstring Strain Grade 2",
    bodyPart: "Hamstring",
    severity: "moderate",
    status: "rehab",
    dateOccurred: "2024-01-05",
    estimatedReturn: "3-4 weeks",
    phase: 3,
    totalPhases: 4,
    progress: 65,
    mechanism: "Sprint during practice",
    notes: "Responding well to treatment"
  },
  {
    id: 3,
    player: "Viktor Nilsson",
    playerId: "23",
    injury: "Concussion Protocol",
    bodyPart: "Head",
    severity: "moderate",
    status: "assessment",
    dateOccurred: "2024-01-15",
    estimatedReturn: "TBD",
    phase: 1,
    totalPhases: 5,
    progress: 20,
    mechanism: "Collision during game",
    notes: "Following return-to-play protocol"
  },
  {
    id: 4,
    player: "Johan Bergström",
    playerId: "14",
    injury: "Ankle Sprain Grade 1",
    bodyPart: "Ankle",
    severity: "mild",
    status: "rtp",
    dateOccurred: "2024-01-01",
    estimatedReturn: "Ready",
    phase: 4,
    totalPhases: 4,
    progress: 95,
    mechanism: "Awkward landing",
    notes: "Cleared for full participation"
  }
];

export default function MedicalStaffDashboard() {
  const { t } = useTranslation(['medical', 'common']);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedInjury, setSelectedInjury] = useState<any>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [showProtocolBuilder, setShowProtocolBuilder] = useState(false);
  const [showInjuryRegistration, setShowInjuryRegistration] = useState(false);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [selectedInjuryDetail, setSelectedInjuryDetail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showUrgentNotification, setShowUrgentNotification] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const { data: medicalData, isLoading, error, isBackendIntegrated } = useMedicalData("senior");

  // Use integrated data or fallback to legacy mock data
  const mockInjuries = medicalData?.injuries || legacyMockInjuries;
  
  // Filter injuries based on search and filters
  const filteredInjuries = mockInjuries.filter(injury => {
    const matchesSearch = searchQuery === "" || 
      injury.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
      injury.injury.toLowerCase().includes(searchQuery.toLowerCase()) ||
      injury.bodyPart.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || injury.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || injury.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });
  const todaysTreatments = medicalData?.treatments || [
    { id: 1, time: "09:00", player: "Marcus Lindberg", type: "Physiotherapy", location: "Treatment Room", duration: 45 },
    { id: 2, time: "10:00", player: "Erik Andersson", type: "Post-Op Assessment", location: "Medical Office", duration: 30 },
    { id: 3, time: "11:30", player: "Viktor Nilsson", type: "Cognitive Testing", location: "Testing Room", duration: 60 },
    { id: 4, time: "14:00", player: "Johan Bergström", type: "Return to Play Test", location: "Training Field", duration: 90 },
    { id: 5, time: "16:00", player: "Anders Johansson", type: "Preventive Care", location: "Treatment Room", duration: 30 }
  ];
  const playerAvailability = medicalData?.playerAvailability || {
    full: 18,
    limited: 3,
    individual: 2,
    rehab: 4,
    unavailable: 2
  };

  // Use integrated data or fallback to default values
  const recoveryTrends = medicalData?.recoveryTrends || [
    { week: 'W1', injuries: 8, recovered: 2 },
    { week: 'W2', injuries: 6, recovered: 3 },
    { week: 'W3', injuries: 7, recovered: 4 },
    { week: 'W4', injuries: 5, recovered: 5 },
    { week: 'W5', injuries: 4, recovered: 3 },
    { week: 'W6', injuries: 4, recovered: 2 }
  ];

  const injuryByType = medicalData?.injuryByType || [
    { type: 'Muscle', count: 12, percentage: 35 },
    { type: 'Joint', count: 8, percentage: 23 },
    { type: 'Ligament', count: 6, percentage: 18 },
    { type: 'Bone', count: 4, percentage: 12 },
    { type: 'Concussion', count: 3, percentage: 9 },
    { type: 'Other', count: 1, percentage: 3 }
  ];

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'individual': return 'bg-orange-100 text-orange-800';
      case 'rehab': return 'bg-red-100 text-red-800';
      case 'unavailable': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'severe': return <Badge className="bg-red-100 text-red-800">{t('medical:severity.severe')}</Badge>;
      case 'moderate': return <Badge className="bg-amber-100 text-amber-800">{t('medical:severity.moderate')}</Badge>;
      case 'mild': return <Badge className="bg-yellow-100 text-yellow-800">{t('medical:severity.mild')}</Badge>;
      default: return <Badge>{t('common:unknown')}</Badge>;
    }
  };

  const pieData = [
    { name: "Full", value: playerAvailability.full, color: "#10b981" },
    { name: "Limited", value: playerAvailability.limited, color: "#eab308" },
    { name: "Individual", value: playerAvailability.individual, color: "#f97316" },
    { name: "Rehab", value: playerAvailability.rehab, color: "#ef4444" },
    { name: "Unavailable", value: playerAvailability.unavailable, color: "#6b7280" }
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('medical:overview.activeInjuries')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInjuries.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('medical:overview.newThisWeek', { count: 2 })}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('medical:overview.todaysTreatments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysTreatments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('medical:overview.nextAt', { time: '14:00' })}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('medical:overview.inRehabilitation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerAvailability.rehab}</div>
            <Badge variant="outline" className="text-xs mt-1">
              <ArrowDown className="h-3 w-3 mr-1" />
              {t('medical:overview.changeFromLastWeek', { change: -1 })}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('medical:overview.returnToPlay')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">{t('common:time.thisWeek')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('medical:overview.teamAvailability')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((playerAvailability.full / (playerAvailability.full + playerAvailability.limited + playerAvailability.individual + playerAvailability.rehab + playerAvailability.unavailable)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('medical:overview.fullyAvailable')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Today's Treatment Schedule */}
            <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('medical:treatments.todaysSchedule')}</CardTitle>
              <Button size="sm" onClick={() => setShowTreatmentForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {t('medical:treatments.addTreatment')}
              </Button>
            </div>
              </CardHeader>
              <CardContent>
            <div className="space-y-3">
              {todaysTreatments.slice(0, 4).map(treatment => (
                <div key={treatment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">{treatment.time}</div>
                      <div className="text-xs text-muted-foreground">{treatment.duration} min</div>
                    </div>
                    <div className="h-10 w-1 bg-gray-300 rounded-full" />
                    <div>
                      <div className="font-medium">{treatment.player}</div>
                      <div className="text-sm text-muted-foreground">{treatment.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {treatment.location}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    </div>
                  </div>
                ))}
            </div>
              </CardContent>
            </Card>

        {/* Player Availability Chart */}
            <Card>
          <CardHeader>
            <CardTitle>Player Availability Status</CardTitle>
              </CardHeader>
          <CardContent>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie 
                    data={pieData} 
                    dataKey="value" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className={cn("h-3 w-3 rounded-full")} style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Injuries */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Critical Injuries Requiring Attention</CardTitle>
            <Button variant="outline" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockInjuries.filter(inj => inj.severity === 'severe' || inj.status === 'acute').map(injury => (
              <div key={injury.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold">{injury.player}</div>
                    <div className="text-sm text-muted-foreground">{injury.injury}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getSeverityBadge(injury.severity)}
                      <span className="text-xs text-muted-foreground">• {injury.dateOccurred}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">ETR: {injury.estimatedReturn}</div>
                  <Progress value={injury.progress} className="h-2 w-24 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInjuriesTab = () => (
    <div className="space-y-6">
      {/* Injury Management Tools */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Injury Management</CardTitle>
              <CardDescription>Track and manage all player injuries</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="acute">Acute</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="rehab">Rehabilitation</SelectItem>
                  <SelectItem value="rtp">Return to Play</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setShowInjuryRegistration(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register New Injury
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by player name or injury type..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredInjuries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No injuries match your search criteria.</p>
                <Button variant="link" onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSeverityFilter("all");
                }}>
                  Clear filters
                </Button>
              </div>
            )}
            {filteredInjuries.map(injury => (
              <Card key={injury.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{injury.player.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{injury.player}</h3>
                          <Badge variant="outline">#{injury.playerId}</Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{injury.injury}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Occurred: {injury.dateOccurred}</span>
                          <span>•</span>
                          <span>Body Part: {injury.bodyPart}</span>
                          <span>•</span>
                          <span>Mechanism: {injury.mechanism}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {getSeverityBadge(injury.severity)}
                          <Badge variant="outline" className={cn(
                            injury.status === 'acute' && 'bg-red-100 text-red-800',
                            injury.status === 'rehab' && 'bg-blue-100 text-blue-800',
                            injury.status === 'rtp' && 'bg-green-100 text-green-800'
                          )}>
                            {injury.status === 'acute' ? 'Acute Phase' : 
                             injury.status === 'rehab' ? 'Rehabilitation' : 
                             injury.status === 'rtp' ? 'Return to Play' : 
                             injury.status === 'assessment' ? 'Assessment' : injury.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">ETR: {injury.estimatedReturn}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Phase {injury.phase}/{injury.totalPhases}</span>
                          <span>{injury.progress}%</span>
                        </div>
                        <Progress value={injury.progress} className="h-2 w-32" />
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-3"
                        onClick={() => setSelectedInjuryDetail(injury)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTreatmentPlansTab = () => (
    <TreatmentManager isLoading={isLoading} />
  );



  const renderMedicalRecordsTab = () => (
    <div className="space-y-6">
          <Card>
            <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Player Medical Records</CardTitle>
              <CardDescription>Comprehensive medical history and documentation</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDocumentUpload(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>
          </div>
            </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="Search player medical records..." 
              className="max-w-sm"
            />
          </div>

          <div className="space-y-3">
            {[
              { player: "Erik Andersson", lastUpdate: "2024-01-15", records: 12, allergies: ["Penicillin"], conditions: ["Previous ACL surgery (2022)"] },
              { player: "Marcus Lindberg", lastUpdate: "2024-01-12", records: 8, allergies: ["None"], conditions: ["Recurrent hamstring issues"] },
              { player: "Viktor Nilsson", lastUpdate: "2024-01-15", records: 15, allergies: ["Latex"], conditions: ["History of concussions (2)"] },
              { player: "Johan Bergström", lastUpdate: "2024-01-10", records: 6, allergies: ["None"], conditions: ["None"] }
            ].map(record => (
              <Card key={record.player} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{record.player.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{record.player}</p>
                        <p className="text-sm text-muted-foreground">Last updated: {record.lastUpdate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Records</p>
                        <p className="font-medium">{record.records}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Allergies</p>
                        <p className="font-medium">{record.allergies.join(', ')}</p>
                      </div>
                      <div className="text-sm max-w-xs">
                        <p className="text-muted-foreground">Conditions</p>
                        <p className="font-medium truncate">{record.conditions.join(', ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPlayer({ id: record.player.toLowerCase().replace(' ', '_'), name: record.player });
                            setShowAvailabilityManager(true);
                          }}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Availability
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          View Records
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                ))}
          </div>
            </CardContent>
          </Card>

      {/* Medical Documents */}
          <Card>
            <CardHeader>
          <CardTitle>Recent Medical Documents</CardTitle>
          <CardDescription>Scans, reports, and medical documentation</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { type: "MRI Scan", player: "Erik Andersson", date: "2024-01-14", size: "2.4 MB" },
              { type: "Surgery Report", player: "Erik Andersson", date: "2024-01-13", size: "156 KB" },
              { type: "X-Ray Results", player: "Marcus Lindberg", date: "2024-01-12", size: "1.8 MB" },
              { type: "CT Scan", player: "Viktor Nilsson", date: "2024-01-15", size: "3.2 MB" },
              { type: "Blood Test Results", player: "Team-wide", date: "2024-01-10", size: "89 KB" }
            ].map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{doc.type}</p>
                    <p className="text-xs text-muted-foreground">{doc.player} • {doc.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{doc.size}</span>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Injury Analytics */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Injury Trends</CardTitle>
            <CardDescription>Weekly injury and recovery statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recoveryTrends}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="injuries" stroke="#ef4444" name="New Injuries" />
                  <Line type="monotone" dataKey="recovered" stroke="#10b981" name="Recovered" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Injuries by Type</CardTitle>
            <CardDescription>Distribution of injury categories this season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={injuryByType}>
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Recovery Time</p>
                <p className="text-2xl font-bold">3.2 weeks</p>
              </div>
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowDown className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600">-0.5 weeks from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Injury Rate</p>
                <p className="text-2xl font-bold">2.1/month</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUp className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-600">+0.3 from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prevention Success</p>
                <p className="text-2xl font-bold">78%</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600">+5% improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">RTP Success Rate</p>
                <p className="text-2xl font-bold">92%</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Minus className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-600">No change</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Generate Reports</CardTitle>
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Monthly Injury Report", description: "Comprehensive injury statistics for the past month", lastGenerated: "2024-01-01" },
              { name: "Player Medical Summary", description: "Individual medical history and status reports", lastGenerated: "2024-01-05" },
              { name: "Recovery Time Analysis", description: "Analysis of recovery times by injury type", lastGenerated: "2024-01-08" },
              { name: "Prevention Program Effectiveness", description: "Evaluation of injury prevention initiatives", lastGenerated: "2024-01-10" }
            ].map(report => (
              <Card key={report.name} className="hover:bg-accent/50 transition-colors">
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-1">{report.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Last: {report.lastGenerated}</span>
                    <Button size="sm" variant="outline">
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </CardContent>
          </Card>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Dashboard</h1>
          <p className="text-muted-foreground">Manage injuries, treatments, and player health</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant={isBackendIntegrated ? "default" : "secondary"}>
            {isBackendIntegrated ? "🔗 Backend Connected" : "📋 Demo Mode"}
          </Badge>
          {isLoading && <Badge variant="outline">Loading...</Badge>}
          {error && <Badge variant="destructive">Connection Error</Badge>}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowNotificationCenter(true)}
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            <Badge className="ml-2" variant="destructive">3</Badge>
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setShowUrgentNotification(true)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Urgent Alert
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-9 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="injuries" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Injuries
          </TabsTrigger>
          <TabsTrigger value="treatment" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Treatment
          </TabsTrigger>
          <TabsTrigger value="rehab" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Recovery
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Records
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="urgent" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Urgent Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <MedicalCalendarView />
        </TabsContent>

        <TabsContent value="injuries" className="mt-6">
          {renderInjuriesTab()}
        </TabsContent>

        <TabsContent value="treatment" className="mt-6">
          <TreatmentManagement />
        </TabsContent>

        <TabsContent value="rehab" className="mt-6">
          <RecoveryManagement />
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          {renderMedicalRecordsTab()}
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <AppointmentReminderSettings />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          {renderReportsTab()}
        </TabsContent>

        <TabsContent value="urgent" className="mt-6">
          <UrgentNotificationCenter />
        </TabsContent>
      </Tabs>

      {/* Modal Dialogs */}
      <MedicalDocumentUpload
        isOpen={showDocumentUpload}
        onClose={() => setShowDocumentUpload(false)}
      />

      {showAvailabilityManager && selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <PlayerAvailabilityManager
            playerId={selectedPlayer.id}
            playerName={selectedPlayer.name}
            onClose={() => {
              setShowAvailabilityManager(false);
              setSelectedPlayer(null);
            }}
            onUpdate={(status) => {
              console.log('Availability updated:', status);
              setShowAvailabilityManager(false);
              setSelectedPlayer(null);
            }}
          />
        </div>
      )}

      <InjuryRegistrationForm
        isOpen={showInjuryRegistration}
        onClose={() => setShowInjuryRegistration(false)}
        onSave={(injury) => {
          console.log('Injury created:', injury);
          // The injury is already saved to the backend via the form
          // The useMedicalData hook will automatically refetch and update the UI
        }}
      />

      {showTreatmentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <TreatmentForm
            onSave={(treatment) => {
              console.log('Treatment scheduled:', treatment);
              // Treatment scheduling integrated with backend via TreatmentForm component
              // The TreatmentForm component handles the API call internally
              setShowTreatmentForm(false);
            }}
            onCancel={() => setShowTreatmentForm(false)}
          />
        </div>
      )}

      <InjuryDetailModal
        injury={selectedInjuryDetail}
        isOpen={!!selectedInjuryDetail}
        onClose={() => setSelectedInjuryDetail(null)}
        onUpdate={(updatedInjury) => {
          console.log('Injury updated:', updatedInjury);
          // The injury data will be refreshed automatically
          setSelectedInjuryDetail(null);
        }}
      />
    </div>
  );
} 