import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  TrendingUp,
  Heart,
  Activity,
  MessageCircle,
  FileText,
  Calendar,
  Users,
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Info,
  Target,
  BarChart3,
  Clock,
  Shield,
} from 'lucide-react';
import { ParentCommunicationLog } from './ParentCommunicationLog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PlayerProfileViewProps {
  playerId: string;
  organizationId: string;
  teamId: string;
  onBack: () => void;
}

// Mock player data - in real app this would come from API
const mockPlayerData = {
  id: '1',
  name: 'Erik Andersson',
  number: '15',
  position: 'Forward',
  age: 16,
  height: "5'10\"",
  weight: '165 lbs',
  shoots: 'Right',
  hometown: 'Stockholm, Sweden',
  status: 'available',
  email: 'erik.andersson@example.com',
  phone: '+46 70 123 4567',
  parents: [
    {
      id: 'parent1',
      name: 'Anna Andersson',
      relationship: 'Mother',
      email: 'anna.andersson@example.com',
      phone: '+46 70 987 6543',
      primaryContact: true,
    },
    {
      id: 'parent2',
      name: 'Lars Andersson',
      relationship: 'Father',
      email: 'lars.andersson@example.com',
      phone: '+46 70 456 7890',
      primaryContact: false,
    },
  ],
  stats: {
    gamesPlayed: 24,
    goals: 12,
    assists: 18,
    points: 30,
    plusMinus: 8,
    pim: 16,
    shots: 89,
    shootingPercentage: 13.5,
    faceoffWinPercentage: 52.3,
    hits: 45,
    blocks: 12,
    takeaways: 28,
    giveaways: 15,
    toi: '18:32',
  },
  recentGames: [
    { date: '2024-01-15', opponent: 'Djurgården', goals: 2, assists: 1, plusMinus: 2 },
    { date: '2024-01-12', opponent: 'AIK', goals: 0, assists: 2, plusMinus: 1 },
    { date: '2024-01-10', opponent: 'Frölunda', goals: 1, assists: 0, plusMinus: -1 },
    { date: '2024-01-08', opponent: 'Färjestad', goals: 1, assists: 1, plusMinus: 0 },
    { date: '2024-01-05', opponent: 'Luleå', goals: 0, assists: 1, plusMinus: 1 },
  ],
  injuryHistory: [
    { date: '2023-11-20', injury: 'Lower body', duration: '7 days', status: 'recovered' },
    { date: '2023-09-15', injury: 'Concussion protocol', duration: '14 days', status: 'recovered' },
  ],
  development: {
    strengths: ['Skating speed', 'Offensive awareness', 'Shot accuracy'],
    areasToImprove: ['Defensive positioning', 'Physical strength', 'Face-off technique'],
    currentGoals: [
      { goal: 'Improve face-off win % to 55%', progress: 75 },
      { goal: 'Increase shot power', progress: 60 },
      { goal: 'Master penalty kill positioning', progress: 40 },
    ],
  },
};

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
  playerId,
  organizationId,
  teamId,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const player = mockPlayerData; // In real app, fetch based on playerId

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Player Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Age:</span>
                <span className="font-medium">{player.age} years</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Position:</span>
                <span className="font-medium">{player.position}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Height/Weight:</span>
                <span className="font-medium">{player.height} / {player.weight}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Shoots:</span>
                <span className="font-medium">{player.shoots}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Hometown:</span>
                <span className="font-medium">{player.hometown}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="font-medium">{player.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Phone:</span>
                <span className="font-medium">{player.phone}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Season Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Season Statistics</CardTitle>
          <CardDescription>Current season performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-accent/50 rounded">
              <div className="text-2xl font-bold">{player.stats.gamesPlayed}</div>
              <div className="text-sm text-muted-foreground">Games</div>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded">
              <div className="text-2xl font-bold">{player.stats.goals}</div>
              <div className="text-sm text-muted-foreground">Goals</div>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded">
              <div className="text-2xl font-bold">{player.stats.assists}</div>
              <div className="text-sm text-muted-foreground">Assists</div>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded">
              <div className="text-2xl font-bold">{player.stats.points}</div>
              <div className="text-sm text-muted-foreground">Points</div>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-4">
            <div className="text-center">
              <div className="font-semibold">
                {player.stats.plusMinus > 0 ? '+' : ''}{player.stats.plusMinus}
              </div>
              <div className="text-xs text-muted-foreground">+/-</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{player.stats.pim}</div>
              <div className="text-xs text-muted-foreground">PIM</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{player.stats.shots}</div>
              <div className="text-xs text-muted-foreground">Shots</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{player.stats.shootingPercentage}%</div>
              <div className="text-xs text-muted-foreground">S%</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{player.stats.faceoffWinPercentage}%</div>
              <div className="text-xs text-muted-foreground">FO%</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{player.stats.toi}</div>
              <div className="text-xs text-muted-foreground">TOI</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Games */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {player.recentGames.map((game, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-accent/50 rounded"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(game.date), 'MMM d')}
                  </div>
                  <div className="font-medium">vs {game.opponent}</div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="font-semibold">{game.goals}</span>
                    <span className="text-muted-foreground ml-1">G</span>
                  </div>
                  <div>
                    <span className="font-semibold">{game.assists}</span>
                    <span className="text-muted-foreground ml-1">A</span>
                  </div>
                  <div>
                    <span className={cn(
                      "font-semibold",
                      game.plusMinus > 0 && "text-green-600",
                      game.plusMinus < 0 && "text-red-600"
                    )}>
                      {game.plusMinus > 0 ? '+' : ''}{game.plusMinus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDevelopmentTab = () => (
    <div className="space-y-6">
      {/* Strengths & Areas to Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {player.development.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full" />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {player.development.areasToImprove.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-amber-600 rounded-full" />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Development Goals</CardTitle>
          <CardDescription>Current progress on personal goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {player.development.currentGoals.map((goal, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{goal.goal}</span>
                  <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMedicalTab = () => (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Medical Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge className={cn(
              "text-lg px-4 py-2",
              player.status === 'available' && "bg-green-100 text-green-800",
              player.status === 'limited' && "bg-amber-100 text-amber-800",
              player.status === 'unavailable' && "bg-red-100 text-red-800"
            )}>
              {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
            </Badge>
            <span className="text-muted-foreground">
              Last medical check: {format(new Date(), 'PPP')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Injury History */}
      <Card>
        <CardHeader>
          <CardTitle>Injury History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {player.injuryHistory.map((injury, index) => (
              <Card key={index} className="bg-accent/50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{injury.injury}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {format(new Date(injury.date), 'PPP')} • Duration: {injury.duration}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {injury.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderParentInfoTab = () => (
    <div className="space-y-6">
      {/* Parent/Guardian Information */}
      <Card>
        <CardHeader>
          <CardTitle>Parent/Guardian Information</CardTitle>
          <CardDescription>Primary contacts for {player.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {player.parents.map((parent) => (
              <Card key={parent.id} className={cn(
                "relative",
                parent.primaryContact && "ring-2 ring-primary"
              )}>
                {parent.primaryContact && (
                  <Badge className="absolute top-2 right-2" variant="default">
                    Primary Contact
                  </Badge>
                )}
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">{parent.name}</h4>
                      <p className="text-sm text-muted-foreground">{parent.relationship}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{parent.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{parent.phone}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parent Communication Log */}
      <ParentCommunicationLog
        playerId={playerId}
        teamId={teamId}
        organizationId={organizationId}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Roster
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl font-bold">
                {player.number}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{player.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{player.position}</Badge>
                <Badge className={cn(
                  player.status === 'available' && "bg-green-100 text-green-800",
                  player.status === 'limited' && "bg-amber-100 text-amber-800",
                  player.status === 'unavailable' && "bg-red-100 text-red-800"
                )}>
                  {player.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="parents">Parents & Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="development" className="mt-6">
          {renderDevelopmentTab()}
        </TabsContent>

        <TabsContent value="medical" className="mt-6">
          {renderMedicalTab()}
        </TabsContent>

        <TabsContent value="parents" className="mt-6">
          {renderParentInfoTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};