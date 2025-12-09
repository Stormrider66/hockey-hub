'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useTranslation } from '@hockey-hub/translations';
import type { GamePerformance, SpecialTeamsStats } from '../../types/coach-dashboard.types';

interface StatisticsTabProps {
  teamPerformance: GamePerformance[];
  specialTeamsStats: SpecialTeamsStats;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const goalDistribution = [
  { name: 'Even Strength', value: 45 },
  { name: 'Power Play', value: 16 },
  { name: 'Short Handed', value: 3 },
  { name: 'Empty Net', value: 4 },
];

const playerPerformanceData = [
  { subject: 'Shooting', A: 85, B: 72 },
  { subject: 'Passing', A: 78, B: 85 },
  { subject: 'Defense', A: 72, B: 80 },
  { subject: 'Speed', A: 88, B: 75 },
  { subject: 'Physical', A: 65, B: 90 },
  { subject: 'Faceoffs', A: 70, B: 68 },
];

const monthlyStats = [
  { month: 'Oct', wins: 4, losses: 2 },
  { month: 'Nov', wins: 5, losses: 3 },
  { month: 'Dec', wins: 3, losses: 2 },
  { month: 'Jan', wins: 4, losses: 1 },
];

export function StatisticsTab({ teamPerformance, specialTeamsStats }: StatisticsTabProps) {
  const { t } = useTranslation(['coach', 'sports']);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Goal Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('coach:statistics.goalDistribution', 'Goal Distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {goalDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Shot Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>{t('coach:statistics.shotMetrics', 'Shot Metrics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">33.2</div>
                <div className="text-sm text-muted-foreground">
                  {t('coach:statistics.shotsPerGame', 'Shots/Game')}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">9.7%</div>
                <div className="text-sm text-muted-foreground">
                  {t('coach:statistics.shootingPercentage', 'Shooting %')}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">28.5</div>
                <div className="text-sm text-muted-foreground">
                  {t('coach:statistics.shotsAgainstPerGame', 'SA/Game')}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">.918</div>
                <div className="text-sm text-muted-foreground">
                  {t('coach:statistics.savePercentage', 'Save %')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Advanced Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>{t('coach:statistics.advancedMetrics', 'Advanced Metrics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <MetricRow label="Corsi For %" value="52.3%" progress={52.3} />
              <MetricRow label="Fenwick For %" value="51.8%" progress={51.8} />
              <MetricRow label="PDO" value="101.2" progress={50.6} />
              <MetricRow label="Expected Goals %" value="54.2%" progress={54.2} />
            </div>
          </CardContent>
        </Card>

        {/* Player Performance Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('coach:statistics.playerPerformanceMatrix', 'Player Performance Matrix')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={playerPerformanceData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Team Average"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="League Average"
                    dataKey="B"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Season Trends */}
      <Card>
        <CardHeader>
          <CardTitle>{t('coach:statistics.seasonTrends', 'Season Trends')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wins" fill="#10b981" name="Wins" />
                <Bar dataKey="losses" fill="#ef4444" name="Losses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Special Teams Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('sports:situations.powerPlay', 'Power Play')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-lg font-bold">{specialTeamsStats.powerPlay.percentage}%</span>
              </div>
              <Progress value={specialTeamsStats.powerPlay.percentage} className="h-3" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">{specialTeamsStats.powerPlay.goals}</div>
                  <div className="text-xs text-muted-foreground">Goals</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">{specialTeamsStats.powerPlay.opportunities}</div>
                  <div className="text-xs text-muted-foreground">Opportunities</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('sports:situations.penaltyKill', 'Penalty Kill')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-lg font-bold">{specialTeamsStats.penaltyKill.percentage}%</span>
              </div>
              <Progress value={specialTeamsStats.penaltyKill.percentage} className="h-3" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">{specialTeamsStats.penaltyKill.goalsAllowed}</div>
                  <div className="text-xs text-muted-foreground">Goals Allowed</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">{specialTeamsStats.penaltyKill.timesShorthanded}</div>
                  <div className="text-xs text-muted-foreground">Times Shorthanded</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

export default StatisticsTab;



