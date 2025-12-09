'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Users,
  ChevronRight,
  ArrowUp,
  Snowflake,
  Video,
  Plus,
  Gamepad2,
  BarChart3,
} from '@/components/icons';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts';
import { useTranslation } from '@hockey-hub/translations';
import CalendarWidget from '@/features/calendar/components/CalendarWidget';
import type { AvailabilityStats, SpecialTeamsStats, CoachTab } from '../../types/coach-dashboard.types';
import { mockPlayers, todaysSessions, teamPerformance } from '../../constants/mock-data';

interface OverviewTabProps {
  availabilityStats: AvailabilityStats;
  selectedTeamId: string | null;
  specialTeamsStats: SpecialTeamsStats;
  onNavigateToTab: (tab: CoachTab) => void;
}

export function OverviewTab({
  availabilityStats,
  selectedTeamId,
  specialTeamsStats,
  onNavigateToTab,
}: OverviewTabProps) {
  const { t } = useTranslation(['coach', 'common', 'sports']);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:overview.nextGame')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{t('common:vs')} Northern Knights</div>
            <p className="text-xs text-muted-foreground mt-1">{t('common:time.tomorrow')}, 19:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:overview.teamRecord')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">12-5-3</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('coach:overview.divisionPosition', { position: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:overview.availablePlayers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {availabilityStats.available}/{mockPlayers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {availabilityStats.limited} {t('common:status.limited')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('coach:overview.goalsPerGame')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold">3.2</div>
              <Badge variant="outline" className="text-xs">
                <ArrowUp className="h-3 w-3 mr-1" />
                +0.3
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('coach:overview.lastGames', { count: 5 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('sports:situations.powerPlay')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{specialTeamsStats.powerPlay.percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {specialTeamsStats.powerPlay.goals}/{specialTeamsStats.powerPlay.opportunities}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('sports:situations.penaltyKill')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{specialTeamsStats.penaltyKill.percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('coach:overview.leagueRank', { rank: 14 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActionsGrid onNavigateToTab={onNavigateToTab} />

      <div className="grid grid-cols-2 gap-6">
        {/* Calendar Widget */}
        <CalendarWidget
          organizationId="org-123"
          userId="coach-123"
          teamId={selectedTeamId}
          days={14}
        />

        {/* Today's Schedule */}
        <TodaysScheduleCard />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Tactical Overview */}
        <TacticalOverviewCard onNavigateToTactical={() => onNavigateToTab('tactical')} />

        {/* Player Status Overview */}
        <PlayerAvailabilityCard availabilityStats={availabilityStats} />
      </div>

      {/* Recent Performance */}
      <PerformanceTrendsCard />
    </div>
  );
}

// Sub-components
function QuickActionsGrid({ onNavigateToTab }: { onNavigateToTab: (tab: CoachTab) => void }) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Gamepad2 className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-base">Tactical Board</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Create and analyze plays</p>
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => onNavigateToTab('tactical')}
          >
            Open Tactical Board
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-base">Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Performance insights</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onNavigateToTab('statistics')}
          >
            View Analytics
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <CardTitle className="text-base">Team Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Manage roster & lines</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onNavigateToTab('team')}
          >
            Manage Team
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Snowflake className="h-5 w-5 text-orange-600" />
            </div>
            <CardTitle className="text-base">Practice Plans</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Training sessions</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onNavigateToTab('training')}
          >
            Plan Practice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TodaysScheduleCard() {
  const { t } = useTranslation(['coach', 'common']);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t('coach:todaysSchedule.title')}</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t('coach:todaysSchedule.addSession')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todaysSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">{session.time}</div>
                  <div className="text-xs text-muted-foreground">{session.duration} min</div>
                </div>
                <div
                  className={cn(
                    'h-10 w-1 rounded-full',
                    session.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                  )}
                />
                <div>
                  <div className="font-medium">{session.title}</div>
                  <div className="text-sm text-muted-foreground">{session.focus}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {session.attendees}
                </Badge>
                {session.type === 'ice-training' && <Snowflake className="h-4 w-4 text-blue-500" />}
                {session.type === 'meeting' && <Video className="h-4 w-4 text-purple-500" />}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TacticalOverviewCard({ onNavigateToTactical }: { onNavigateToTactical: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Tactical Overview
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigateToTactical}>
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Plays</span>
              <span className="text-lg font-bold">24</span>
            </div>
            <Progress value={75} className="h-2 mb-3" />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Offensive</span>
                <Badge variant="outline">12 plays</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Defensive</span>
                <Badge variant="outline">8 plays</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Special Teams</span>
                <Badge variant="outline">4 plays</Badge>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-lg font-bold text-green-600">78%</span>
            </div>
            <Progress value={78} className="h-2 mb-3" />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">This Week</span>
                <Badge className="bg-green-100 text-green-800">+5%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Most Effective</span>
                <Badge variant="outline">Power Play</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">AI Suggestions</span>
                <Badge className="bg-blue-100 text-blue-800">3 new</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerAvailabilityCard({ availabilityStats }: { availabilityStats: AvailabilityStats }) {
  const { t } = useTranslation(['coach', 'common']);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t('coach:playerAvailability.title')}</CardTitle>
          <Button variant="ghost" size="sm">
            {t('common:actions.viewDetails')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{availabilityStats.available}</div>
              <div className="text-xs text-muted-foreground">{t('common:status.available')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{availabilityStats.limited}</div>
              <div className="text-xs text-muted-foreground">{t('common:status.limited')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{availabilityStats.unavailable}</div>
              <div className="text-xs text-muted-foreground">{t('common:status.unavailable')}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {mockPlayers.slice(0, 5).map((player) => (
            <div key={player.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{player.number}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{player.name}</div>
                  <div className="text-xs text-muted-foreground">{player.position}</div>
                </div>
              </div>
              <Badge
                className={cn(
                  player.status === 'available' && 'bg-green-100 text-green-800',
                  player.status === 'limited' && 'bg-amber-100 text-amber-800',
                  player.status === 'unavailable' && 'bg-red-100 text-red-800'
                )}
              >
                {t(`common:status.${player.status}`)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceTrendsCard() {
  const { t } = useTranslation(['coach']);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('coach:performance.trendTitle')}</CardTitle>
        <CardDescription>{t('coach:performance.lastGamesAnalysis', { count: 5 })}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={teamPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="game" label={{ value: 'Game', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="goals" stroke="#10b981" name="Goals For" strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="goalsAgainst"
                stroke="#ef4444"
                name="Goals Against"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="shots"
                stroke="#3b82f6"
                name="Shots"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default OverviewTab;



