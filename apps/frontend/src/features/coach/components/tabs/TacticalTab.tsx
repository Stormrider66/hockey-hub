'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import {
  Plus,
  TrendingUp,
  Brain,
  Eye,
  Share2,
  Save,
  Edit,
  BarChart3,
  Gamepad2,
} from '@/components/icons';
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import dynamic from 'next/dynamic';

// Dynamically import PlaySystemEditor to avoid SSR issues with Pixi.js
const PlaySystemEditor = dynamic(
  () => import('../tactical/PlaySystemEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading tactical board..." />
      </div>
    ),
  }
);

import {
  TacticalDemoToggle,
  DemoModeIndicator,
  DataSourceStatus,
} from '../tactical/TacticalDemoToggle';
import { mockPlayers } from '../../constants/mock-data';

interface TacticalTabProps {
  selectedTeamId: string | null;
  onShowCreateTacticalModal: () => void;
  onShowAnalyticsModal: () => void;
  onShowSharePlaybookModal: () => void;
  onShowAIDetailsModal: (type: 'power_play' | 'defensive' | 'breakout') => void;
}

export function TacticalTab({
  selectedTeamId,
  onShowCreateTacticalModal,
  onShowAnalyticsModal,
  onShowSharePlaybookModal,
  onShowAIDetailsModal,
}: TacticalTabProps) {
  return (
    <div className="space-y-6">
      {/* Demo Mode Toggle and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Tactical Overview</h3>
              <DemoModeIndicator />
            </div>
            <DataSourceStatus />
          </div>
        </div>
        <div className="lg:col-span-1">
          <TacticalDemoToggle compact={true} className="mb-4" />
        </div>
      </div>

      {/* Tactical Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <PlayLibraryCard onCreatePlay={onShowCreateTacticalModal} />

        {/* Success Metrics */}
        <PerformanceMetricsCard />

        {/* AI Suggestions */}
        <AIInsightsCard onShowDetails={onShowAIDetailsModal} />
      </div>

      {/* Main Tactical Board */}
      <Card className="min-h-[600px]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Interactive Tactical Board</CardTitle>
              <CardDescription>Create, edit, and analyze plays with AI assistance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onShowAnalyticsModal}>
                <Eye className="h-4 w-4 mr-2" />
                Analytics View
              </Button>
              <Button variant="outline" size="sm" onClick={onShowSharePlaybookModal}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Playbook
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast({
                    title: 'Changes Saved',
                    description: 'Your tactical changes have been saved successfully',
                  });
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PlaySystemEditor teamId={selectedTeamId || undefined} />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard />
        <PlayerLearningProgressCard />
      </div>
    </div>
  );
}

function PlayLibraryCard({ onCreatePlay }: { onCreatePlay: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          Play Library
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Plays</span>
            <span className="font-bold">24</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Offensive</span>
            <Badge variant="outline">12</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Defensive</span>
            <Badge variant="outline">8</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Special Teams</span>
            <Badge variant="outline">4</Badge>
          </div>
          <Button className="w-full mt-4" onClick={onCreatePlay}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Play
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceMetricsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <span className="font-bold text-green-600">78%</span>
            </div>
            <Progress value={78} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Player Compliance</span>
              <span className="font-bold">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">AI Optimization</span>
              <span className="font-bold text-blue-600">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
          <Badge className="bg-green-100 text-green-800 w-full justify-center">
            +5% improvement this week
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function AIInsightsCard({
  onShowDetails,
}: {
  onShowDetails: (type: 'power_play' | 'defensive' | 'breakout') => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Power Play Optimization</p>
            <p className="text-xs text-blue-700 mt-1">
              Consider adjusting formation for better screening
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs"
              onClick={() => onShowDetails('power_play')}
            >
              View Details
            </Button>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-900">Defensive Coverage</p>
            <p className="text-xs text-orange-700 mt-1">Gap control needs improvement on left side</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs"
              onClick={() => onShowDetails('defensive')}
            >
              View Analysis
            </Button>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900">Breakout Success</p>
            <p className="text-xs text-green-700 mt-1">Current breakout pattern showing 89% success</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs"
              onClick={() => onShowDetails('breakout')}
            >
              Maintain
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityCard() {
  const activities = [
    { time: '2 hours ago', action: 'Created new power play formation', user: 'You', type: 'create' },
    { time: '1 day ago', action: 'Modified breakout pattern #3', user: 'Assistant Coach', type: 'edit' },
    { time: '2 days ago', action: 'AI suggested defensive adjustment', user: 'AI Engine', type: 'ai' },
    { time: '3 days ago', action: 'Shared playbook with players', user: 'You', type: 'share' },
    { time: '4 days ago', action: 'Analyzed game footage for effectiveness', user: 'Video Analyst', type: 'analysis' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Play Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <div
                className={`p-2 rounded-full ${
                  activity.type === 'create'
                    ? 'bg-green-100 text-green-600'
                    : activity.type === 'edit'
                    ? 'bg-blue-100 text-blue-600'
                    : activity.type === 'ai'
                    ? 'bg-purple-100 text-purple-600'
                    : activity.type === 'share'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {activity.type === 'create' && <Plus className="h-4 w-4" />}
                {activity.type === 'edit' && <Edit className="h-4 w-4" />}
                {activity.type === 'ai' && <Brain className="h-4 w-4" />}
                {activity.type === 'share' && <Share2 className="h-4 w-4" />}
                {activity.type === 'analysis' && <BarChart3 className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.user} • {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerLearningProgressCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Learning Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockPlayers.slice(0, 5).map((player) => {
            const mastery = Math.floor(Math.random() * 20) + 80;
            return (
              <div key={player.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{player.number}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{player.name}</span>
                    <span className="text-xs text-muted-foreground">{mastery}% mastery</span>
                  </div>
                  <Progress value={mastery} className="h-2" />
                </div>
              </div>
            );
          })}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              toast({
                title: 'Player Progress',
                description: 'Detailed player progress analytics coming soon!',
              });
            }}
          >
            View All Progress
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TacticalTab;



