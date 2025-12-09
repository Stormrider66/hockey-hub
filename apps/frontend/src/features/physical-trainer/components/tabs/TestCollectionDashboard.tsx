'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "../../../../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  TestTube2,
  Plus,
  FileText,
  Timer,
  Activity,
  Zap,
  Heart,
  TrendingUp,
  User,
  CheckCircle2,
  AlertCircle,
  Copy,
  Settings,
  Download,
  ChevronRight,
  MapPin
} from 'lucide-react';
import type { Player, Team, TestType, TestBatch } from '../../types';
import { useGetTestSessionsQuery, useCreateTestSessionMutation } from '@/store/api/trainingApi';
import { toast } from 'react-hot-toast';

interface TestCollectionDashboardProps {
  players: Player[];
  teams?: Team[];
}

interface TestSession {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  testTypes: TestType[];
  assignedPlayers: string[];
  assignedTeams: string[];
  status: 'scheduled' | 'in-progress' | 'completed';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

interface TestTemplate {
  id: string;
  name: string;
  description: string;
  testTypes: TestType[];
  estimatedDuration: number; // minutes
  category: 'pre-season' | 'mid-season' | 'post-injury' | 'custom';
}

const TEST_CATEGORIES = [
  { 
    name: 'Power',
    icon: Zap,
    tests: ['verticalJump', 'broadJump', 'pullUps']
  },
  { 
    name: 'Strength',
    icon: Activity,
    tests: ['benchPress1RM', 'squat1RM', 'deadlift1RM']
  },
  { 
    name: 'Speed',
    icon: Timer,
    tests: ['sprint10m', 'sprint30m', 'agility5105']
  },
  { 
    name: 'Endurance',
    icon: Heart,
    tests: ['vo2Max', 'cooperTest', 'yoyoTest']
  },
  { 
    name: 'Flexibility',
    icon: TrendingUp,
    tests: ['flexibility', 'balanceTest', 'reactionTime']
  }
];

const TEST_TEMPLATES: TestTemplate[] = [
  {
    id: '1',
    name: 'Pre-Season Complete',
    description: 'Comprehensive fitness assessment for start of season',
    testTypes: ['verticalJump', 'broadJump', 'sprint30m', 'vo2Max', 'squat1RM', 'benchPress1RM'],
    estimatedDuration: 120,
    category: 'pre-season'
  },
  {
    id: '2',
    name: 'Speed & Power Battery',
    description: 'Focus on explosive power and sprint performance',
    testTypes: ['verticalJump', 'broadJump', 'sprint10m', 'sprint30m', 'agility5105'],
    estimatedDuration: 60,
    category: 'mid-season'
  },
  {
    id: '3',
    name: 'Return to Play Assessment',
    description: 'Progressive testing for players returning from injury',
    testTypes: ['flexibility', 'balanceTest', 'reactionTime', 'cooperTest'],
    estimatedDuration: 45,
    category: 'post-injury'
  },
  {
    id: '4',
    name: 'Strength Testing',
    description: 'Complete strength assessment for all major lifts',
    testTypes: ['benchPress1RM', 'squat1RM', 'deadlift1RM', 'pullUps'],
    estimatedDuration: 90,
    category: 'custom'
  }
];

const TEST_TYPE_INFO: Record<TestType, { name: string; unit: string; icon: any }> = {
  verticalJump: { name: 'Vertical Jump', unit: 'cm', icon: Zap },
  broadJump: { name: 'Broad Jump', unit: 'cm', icon: Zap },
  sprint10m: { name: '10m Sprint', unit: 'seconds', icon: Timer },
  sprint30m: { name: '30m Sprint', unit: 'seconds', icon: Timer },
  vo2Max: { name: 'VO2 Max', unit: 'ml/kg/min', icon: Heart },
  benchPress1RM: { name: 'Bench Press 1RM', unit: 'kg', icon: Activity },
  squat1RM: { name: 'Squat 1RM', unit: 'kg', icon: Activity },
  deadlift1RM: { name: 'Deadlift 1RM', unit: 'kg', icon: Activity },
  pullUps: { name: 'Pull-ups', unit: 'reps', icon: Activity },
  plank: { name: 'Plank Hold', unit: 'seconds', icon: Activity },
  flexibility: { name: 'Flexibility', unit: 'cm', icon: TrendingUp },
  balanceTest: { name: 'Balance Test', unit: 'seconds', icon: TrendingUp },
  reactionTime: { name: 'Reaction Time', unit: 'ms', icon: TrendingUp },
  agility5105: { name: '5-10-5 Agility', unit: 'seconds', icon: Timer },
  cooperTest: { name: 'Cooper Test', unit: 'meters', icon: Heart },
  yoyoTest: { name: 'Yo-Yo Test', unit: 'level', icon: Heart },
  custom: { name: 'Custom Test', unit: 'custom', icon: TestTube2 }
};

export default function TestCollectionDashboard({ players, teams = [] }: TestCollectionDashboardProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedTests, setSelectedTests] = useState<TestType[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionLocation, setSessionLocation] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // API hooks
  const { data: testSessions = [], isLoading } = useGetTestSessionsQuery();
  const [createTestSession, { isLoading: isCreating }] = useCreateTestSessionMutation();

  // Calculate which players are selected (directly or via team)
  const getSelectedPlayerIds = () => {
    const directPlayers = new Set(selectedPlayers);
    selectedTeams.forEach(teamId => {
      const team = teams.find(t => t.id === teamId);
      if (team?.playerIds) {
        team.playerIds.forEach(playerId => directPlayers.add(playerId));
      }
    });
    return Array.from(directPlayers);
  };

  const handleTestToggle = (testType: TestType) => {
    setSelectedTests(prev => 
      prev.includes(testType) 
        ? prev.filter(t => t !== testType)
        : [...prev, testType]
    );
  };

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(p => p !== playerId)
        : [...prev, playerId]
    );
  };

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(t => t !== teamId)
        : [...prev, teamId]
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = TEST_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTests(template.testTypes);
      setSessionName(template.name);
      setSelectedTemplate(templateId);
    }
  };

  const handleScheduleSession = async () => {
    if (!selectedDate || !selectedTime || selectedTests.length === 0) {
      toast.error('Please select date, time, and at least one test');
      return;
    }

    const allPlayerIds = getSelectedPlayerIds();
    if (allPlayerIds.length === 0) {
      toast.error('Please select at least one player or team');
      return;
    }

    try {
      await createTestSession({
        name: sessionName || `Test Session - ${format(selectedDate, 'MMM dd')}`,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        location: sessionLocation || 'Training Facility',
        testTypes: selectedTests,
        assignedPlayers: allPlayerIds,
        assignedTeams: selectedTeams,
        notes: sessionNotes,
        status: 'scheduled'
      }).unwrap();

      toast.success('Test session scheduled successfully!');
      
      // Reset form
      setSessionName('');
      setSelectedTests([]);
      setSelectedPlayers([]);
      setSelectedTeams([]);
      setSessionNotes('');
      setSelectedTemplate('');
    } catch (error) {
      toast.error('Failed to schedule test session');
    }
  };

  const upcomingSessions = testSessions
    .filter(s => s.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">{t('physicalTrainer:testing.collection.tabs.schedule')}</TabsTrigger>
          <TabsTrigger value="upcoming">{t('physicalTrainer:testing.collection.tabs.upcoming')}</TabsTrigger>
          <TabsTrigger value="protocols">{t('physicalTrainer:testing.collection.tabs.protocols')}</TabsTrigger>
        </TabsList>

        {/* Schedule New Test Session */}
        <TabsContent value="schedule" className="mt-6 space-y-6">
          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle>{t('physicalTrainer:testing.collection.quickTemplates')}</CardTitle>
              <CardDescription>{t('physicalTrainer:testing.collection.quickTemplatesDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {TEST_TEMPLATES.map(template => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    className="justify-start h-auto p-4"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="text-left">
                      <div className="font-semibold">{template.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {template.testTypes.length} tests • {template.estimatedDuration} min
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Details */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:testing.collection.sessionDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="session-name">{t('physicalTrainer:testing.collection.sessionName')}</Label>
                    <Input
                      id="session-name"
                      placeholder={t('physicalTrainer:testing.collection.sessionNamePlaceholder')}
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('physicalTrainer:testing.collection.date')}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : t('physicalTrainer:testing.collection.selectDate')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="time">{t('physicalTrainer:testing.collection.time')}</Label>
                      <Input
                        id="time"
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">{t('physicalTrainer:testing.collection.location')}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder={t('physicalTrainer:testing.collection.locationPlaceholder')}
                        value={sessionLocation}
                        onChange={(e) => setSessionLocation(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">{t('physicalTrainer:testing.collection.notes')}</Label>
                    <Input
                      id="notes"
                      placeholder={t('physicalTrainer:testing.collection.notesPlaceholder')}
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Test Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:testing.collection.selectTests')}</CardTitle>
                  <CardDescription>
                    {selectedTests.length} {t('physicalTrainer:testing.collection.testsSelected')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {TEST_CATEGORIES.map(category => (
                        <div key={category.name}>
                          <div className="flex items-center gap-2 mb-2">
                            <category.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="space-y-2 ml-6">
                            {category.tests.map(testType => {
                              const testInfo = TEST_TYPE_INFO[testType as TestType];
                              return (
                                <div key={testType} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={testType}
                                    checked={selectedTests.includes(testType as TestType)}
                                    onCheckedChange={() => handleTestToggle(testType as TestType)}
                                  />
                                  <label
                                    htmlFor={testType}
                                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {testInfo.name}
                                    <Badge variant="outline" className="text-xs">
                                      {testInfo.unit}
                                    </Badge>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          <Separator className="mt-3" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Player Assignment */}
            <div className="space-y-6">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:testing.collection.assignPlayers')}</CardTitle>
                  <CardDescription>
                    {getSelectedPlayerIds().length} {t('physicalTrainer:testing.collection.playersSelected')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="individual">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="individual">{t('physicalTrainer:testing.collection.individual')}</TabsTrigger>
                      <TabsTrigger value="teams">{t('physicalTrainer:testing.collection.teams')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="individual" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {players.map(player => (
                            <div key={player.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`player-${player.id}`}
                                checked={selectedPlayers.includes(player.id.toString())}
                                onCheckedChange={() => handlePlayerToggle(player.id.toString())}
                              />
                              <label
                                htmlFor={`player-${player.id}`}
                                className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                <User className="h-4 w-4" />
                                {player.name}
                                <Badge variant="outline" className="text-xs">
                                  {player.position}
                                </Badge>
                                {player.status === 'injured' && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t('common:injured')}
                                  </Badge>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="teams" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {teams.map(team => (
                            <div key={team.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`team-${team.id}`}
                                checked={selectedTeams.includes(team.id.toString())}
                                onCheckedChange={() => handleTeamToggle(team.id.toString())}
                              />
                              <label
                                htmlFor={`team-${team.id}`}
                                className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                <Users className="h-4 w-4" />
                                {team.name}
                                <Badge variant="outline" className="text-xs">
                                  {team.playerIds?.length || 0} {t('physicalTrainer:testing.collection.players')}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline">
              {t('common:cancel')}
            </Button>
            <Button 
              onClick={handleScheduleSession}
              disabled={isCreating || selectedTests.length === 0 || getSelectedPlayerIds().length === 0}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t('physicalTrainer:testing.collection.scheduling')}
                </>
              ) : (
                <>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {t('physicalTrainer:testing.collection.scheduleSession')}
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Upcoming Sessions */}
        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </CardContent>
              </Card>
            ) : upcomingSessions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-32 text-center">
                  <TestTube2 className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{t('physicalTrainer:testing.collection.noUpcoming')}</p>
                </CardContent>
              </Card>
            ) : (
              upcomingSessions.map(session => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{session.name}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {format(new Date(session.date), 'PPP')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {session.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {session.location}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">{t('physicalTrainer:testing.collection.tests')}:</p>
                        <div className="flex flex-wrap gap-2">
                          {session.testTypes.map(testType => {
                            const testInfo = TEST_TYPE_INFO[testType];
                            return (
                              <Badge key={testType} variant="outline">
                                <testInfo.icon className="h-3 w-3 mr-1" />
                                {testInfo.name}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">
                          {t('physicalTrainer:testing.collection.assigned')}: {session.assignedPlayers.length} {t('physicalTrainer:testing.collection.players')}
                        </p>
                        {session.notes && (
                          <p className="text-sm text-muted-foreground">{session.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          {t('physicalTrainer:testing.collection.viewProtocols')}
                        </Button>
                        <Button size="sm">
                          {t('physicalTrainer:testing.collection.startSession')}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Test Protocols */}
        <TabsContent value="protocols" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            {TEST_CATEGORIES.map(category => (
              <Card key={category.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="h-5 w-5" />
                    {category.name} {t('physicalTrainer:testing.collection.protocols')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.tests.map(testType => {
                      const testInfo = TEST_TYPE_INFO[testType as TestType];
                      return (
                        <div key={testType} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{testInfo.name}</h4>
                            <Badge variant="outline">{testInfo.unit}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {t(`physicalTrainer:testing.protocols.${testType}.description`)}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              {t('physicalTrainer:testing.collection.viewProtocol')}
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              {t('physicalTrainer:testing.collection.download')}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}