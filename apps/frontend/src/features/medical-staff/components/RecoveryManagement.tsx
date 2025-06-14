"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  CheckCircle, 
  Clock, 
  Trophy, 
  Target, 
  Activity, 
  Calendar,
  Plus,
  Save,
  AlertCircle,
  TrendingUp,
  FileText,
  Play,
  MessageSquare,
  ChevronRight,
  Heart,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailySessionsManager } from './DailySessionsManager';
import { ProgressTrackingManager } from './ProgressTrackingManager';
import { RTPAssessmentManager } from './RTPAssessmentManager';

// Mock data
const todaysSessions = [
  { id: 1, time: "09:00", player: "Marcus Lindberg", type: "Physiotherapy", location: "Treatment Room", duration: 45 },
  { id: 2, time: "10:00", player: "Erik Andersson", type: "Post-Op Assessment", location: "Medical Office", duration: 30 },
  { id: 3, time: "11:30", player: "Viktor Nilsson", type: "Cognitive Testing", location: "Testing Room", duration: 60 },
  { id: 4, time: "14:00", player: "Johan Bergström", type: "Return to Play Test", location: "Training Field", duration: 90 }
];

const mockInjuries = [
  {
    id: 1,
    player: "Erik Andersson",
    injury: "ACL Tear - Right Knee",
    severity: "severe",
    status: "rehab",
    dateOccurred: "2024-01-12",
    estimatedReturn: "6-8 months",
    progress: 35
  },
  {
    id: 2,
    player: "Marcus Lindberg",
    injury: "Hamstring Strain Grade 2", 
    severity: "moderate",
    status: "rehab",
    dateOccurred: "2024-01-05",
    estimatedReturn: "3-4 weeks",
    progress: 78
  }
];

const MOCK_PATIENT_PROGRESS = {
  patientName: 'Erik Andersson',
  protocolName: 'ACL Reconstruction Rehabilitation',
  category: 'ACL Injury',
  startDate: '2024-01-15',
  overallProgress: 35,
  currentPhase: 1,
  lastUpdate: '2024-01-20',
  medicalStaff: 'Dr. Sarah Johnson',
  phases: [
    {
      phaseName: 'Sub-Acute Phase',
      status: 'in-progress',
      progress: 65,
      startDate: '2024-01-23',
      milestones: [
        {
          id: 'm3',
          name: 'Full ROM Recovery',
          description: 'Achieve full passive range of motion',
          status: 'in-progress',
          priority: 'high',
          targetDate: '2024-01-30'
        }
      ]
    }
  ]
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'severe': return <Badge className="bg-red-100 text-red-800">Severe</Badge>;
    case 'moderate': return <Badge className="bg-amber-100 text-amber-800">Moderate</Badge>;
    case 'mild': return <Badge className="bg-yellow-100 text-yellow-800">Mild</Badge>;
    default: return <Badge>Unknown</Badge>;
  }
};

export function RecoveryManagement() {
  const [activeSubTab, setActiveSubTab] = useState('daily');

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Recovery Management</h2>
        <p className="text-muted-foreground">
          Comprehensive recovery tracking combining daily sessions, progress monitoring, and RTP assessments
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Daily Sessions
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress Tracking
          </TabsTrigger>
          <TabsTrigger value="rtp" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            RTP Assessments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <DailySessionsManager />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <ProgressTrackingManager />
        </TabsContent>

        <TabsContent value="rtp" className="mt-6">
          <RTPAssessmentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
} 