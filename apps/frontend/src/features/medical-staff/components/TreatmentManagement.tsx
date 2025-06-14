"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  List, 
  Plus, 
  Clock, 
  MapPin, 
  User,
  Edit,
  Trash2,
  Filter,
  FileText,
  Target,
  Activity,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Import existing components
import { TreatmentCalendar } from './TreatmentCalendar';
import { ProtocolBuilder } from './ProtocolBuilder';
import { InjuryRegistrationForm } from './InjuryRegistrationForm';

// Types for the integrated system
interface Injury {
  id: string;
  playerId: string;
  playerName: string;
  type: string;
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  mechanism: string;
  dateOfInjury: string;
  assessmentNotes: string;
  estimatedRecovery: number;
  status: 'acute' | 'rehab' | 'rtp' | 'assessment';
}

interface Protocol {
  id: string;
  name: string;
  category: string;
  description: string;
  phases: ProtocolPhase[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ProtocolPhase {
  id: string;
  name: string;
  duration: number;
  goals: string[];
  exercises: Exercise[];
  criteria: string[];
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  duration: number;
  sets?: number;
  reps?: number;
}

interface TreatmentPlan {
  id: string;
  playerId: string;
  playerName: string;
  injuryId: string;
  protocolId: string;
  protocolName: string;
  currentPhase: number;
  totalPhases: number;
  startDate: string;
  estimatedEndDate: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  nextSession?: string;
}

interface Treatment {
  id: string;
  planId: string;
  date: string;
  time: string;
  player: string;
  playerId: string;
  type: string;
  location: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  phaseId?: string;
  exercises?: Exercise[];
}

// Mock data
const mockInjuries: Injury[] = [
  {
    id: '1',
    playerId: '7',
    playerName: 'Marcus Lindberg',
    type: 'Hamstring Strain',
    bodyPart: 'Left Hamstring',
    severity: 'moderate',
    mechanism: 'Sprint acceleration',
    dateOfInjury: '2025-06-05',
    assessmentNotes: 'Grade 2 strain, MRI shows muscle fiber disruption',
    estimatedRecovery: 21,
    status: 'rehab'
  },
  {
    id: '2',
    playerId: '15',
    playerName: 'Erik Andersson',
    type: 'ACL Injury',
    bodyPart: 'Right Knee',
    severity: 'severe',
    mechanism: 'Non-contact pivot',
    dateOfInjury: '2025-05-20',
    assessmentNotes: 'Complete ACL tear, surgery completed',
    estimatedRecovery: 180,
    status: 'rehab'
  }
];

const mockProtocols: Protocol[] = [
  {
    id: '1',
    name: 'Hamstring Strain Rehabilitation',
    category: 'Hamstring Strain',
    description: 'Progressive rehabilitation for hamstring muscle strains',
    difficulty: 'intermediate',
    phases: [
      {
        id: '1',
        name: 'Acute Phase',
        duration: 7,
        goals: ['Reduce pain and inflammation', 'Protect healing tissue'],
        exercises: [],
        criteria: ['Pain level < 3/10', 'No increase in swelling']
      },
      {
        id: '2',
        name: 'Strengthening Phase',
        duration: 14,
        goals: ['Restore strength', 'Improve flexibility'],
        exercises: [],
        criteria: ['80% strength return', 'Full range of motion']
      }
    ]
  }
];

const mockTreatmentPlans: TreatmentPlan[] = [
  {
    id: '1',
    playerId: '7',
    playerName: 'Marcus Lindberg',
    injuryId: '1',
    protocolId: '1',
    protocolName: 'Hamstring Strain Rehabilitation',
    currentPhase: 2,
    totalPhases: 3,
    startDate: '2025-06-06',
    estimatedEndDate: '2025-06-27',
    status: 'active',
    progress: 65,
    nextSession: '2025-06-11'
  }
];

const mockTreatments: Treatment[] = [
  {
    id: '1',
    planId: '1',
    date: '2025-06-10',
    time: '09:00',
    player: 'Marcus Lindberg',
    playerId: '7',
    type: 'physiotherapy',
    location: 'Treatment Room 1',
    duration: 60,
    status: 'scheduled',
    notes: 'Hamstring strengthening exercises',
    phaseId: '2'
  },
  {
    id: '2',
    planId: '1',
    date: '2025-06-11',
    time: '14:00',
    player: 'Marcus Lindberg',
    playerId: '7',
    type: 'rehabilitation',
    location: 'Gym',
    duration: 45,
    status: 'scheduled',
    notes: 'Progressive loading exercises'
  }
];

export function TreatmentManagement() {
  const [activeTab, setActiveTab] = useState('planning');
  const [injuries, setInjuries] = useState<Injury[]>(mockInjuries);
  const [protocols] = useState<Protocol[]>(mockProtocols);
  const [treatmentPlans] = useState<TreatmentPlan[]>(mockTreatmentPlans);
  const [treatments] = useState<Treatment[]>(mockTreatments);
  const [showInjuryForm, setShowInjuryForm] = useState(false);
  const [showProtocolBuilder, setShowProtocolBuilder] = useState(false);
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null);

  const handleSaveInjury = (injury: Injury) => {
    setInjuries(prev => [...prev, injury]);
    console.log('New injury registered:', injury);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTreatmentPlanningTab = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Treatment Planning Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button 
              className="h-24 flex flex-col gap-2 items-center justify-center"
              onClick={() => setShowInjuryForm(true)}
            >
              <AlertTriangle className="h-6 w-6" />
              <span>Register New Injury</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 items-center justify-center"
              onClick={() => setShowProtocolBuilder(true)}
            >
              <FileText className="h-6 w-6" />
              <span>Create Protocol</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 items-center justify-center"
            >
              <Target className="h-6 w-6" />
              <span>Generate Treatment Plan</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Injuries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Current Injuries ({injuries.length})
            </CardTitle>
            <Button size="sm" onClick={() => setShowInjuryForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Injury
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {injuries.map(injury => (
              <div key={injury.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-medium">{injury.playerName}</div>
                    <div className="text-sm text-muted-foreground">{injury.type} - {injury.bodyPart}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getSeverityColor(injury.severity)} variant="outline">
                        {injury.severity}
                      </Badge>
                      <Badge variant="outline">
                        {injury.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    Injured: {format(new Date(injury.dateOfInjury), 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Est. Recovery: {injury.estimatedRecovery} days
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setSelectedInjury(injury)}
                  >
                    Create Treatment Plan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Protocols */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Protocols ({protocols.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {protocols.map(protocol => (
              <div key={protocol.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium">{protocol.name}</div>
                    <div className="text-sm text-muted-foreground">{protocol.category}</div>
                  </div>
                  <Badge variant="outline">
                    {protocol.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{protocol.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    {protocol.phases.length} phases
                  </div>
                  <Button size="sm" variant="outline">
                    Use Protocol
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveTreatmentsTab = () => (
    <div className="space-y-6">
      {/* Active Treatment Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Treatment Plans ({treatmentPlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {treatmentPlans.map(plan => (
              <div key={plan.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-medium">{plan.playerName}</div>
                    <div className="text-sm text-muted-foreground">{plan.protocolName}</div>
                  </div>
                  <Badge className={getStatusColor(plan.status)} variant="outline">
                    {plan.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Current Phase</div>
                    <div className="font-medium">{plan.currentPhase}/{plan.totalPhases}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Progress</div>
                    <div className="font-medium">{plan.progress}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Started</div>
                    <div className="font-medium">{format(new Date(plan.startDate), 'MMM d')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Est. End</div>
                    <div className="font-medium">{format(new Date(plan.estimatedEndDate), 'MMM d')}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Next session: {plan.nextSession ? format(new Date(plan.nextSession), 'MMM d, HH:mm') : 'Not scheduled'}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm">
                      Schedule Session
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProtocolLibraryTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Protocol Library</h3>
          <p className="text-sm text-muted-foreground">Manage and create treatment protocols</p>
        </div>
        <Button onClick={() => setShowProtocolBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Protocol
        </Button>
      </div>
      
      {showProtocolBuilder ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Create New Protocol</h4>
            <Button variant="outline" onClick={() => setShowProtocolBuilder(false)}>
              Back to Library
            </Button>
          </div>
          <ProtocolBuilder />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {protocols.map(protocol => (
            <Card key={protocol.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{protocol.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{protocol.category}</p>
                  </div>
                  <Badge variant="outline">
                    {protocol.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{protocol.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span>{protocol.phases.length} phases</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm">
                      Use
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Treatment Management</h2>
          <p className="text-muted-foreground">Comprehensive injury and treatment workflow</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Treatment Planning
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Active Treatments
          </TabsTrigger>
          <TabsTrigger value="protocols" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Protocol Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning">
          {renderTreatmentPlanningTab()}
        </TabsContent>

        <TabsContent value="calendar">
          <TreatmentCalendar
            treatments={treatments}
            onAddTreatment={() => {}}
            onEditTreatment={() => {}}
          />
        </TabsContent>

        <TabsContent value="active">
          {renderActiveTreatmentsTab()}
        </TabsContent>

        <TabsContent value="protocols">
          {renderProtocolLibraryTab()}
        </TabsContent>
      </Tabs>

      {/* Modals and Forms */}
      <InjuryRegistrationForm
        isOpen={showInjuryForm}
        onClose={() => setShowInjuryForm(false)}
        onSave={handleSaveInjury}
      />
    </div>
  );
}