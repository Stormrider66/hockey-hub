'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Gamepad2,
  Brain,
  Trophy,
  Star,
  CheckCircle,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Eye,
  Play,
  Plus,
  Edit,
  Share2,
  Save,
  ArrowLeft,
  Target,
  Clock,
  Zap
} from '@/components/icons';
import Link from 'next/link';

// Mock tactical data for demonstration
const mockTacticalData = {
  coach: {
    totalPlays: 24,
    categories: {
      offensive: 12,
      defensive: 8,
      specialTeams: 4
    },
    successRate: 78,
    playerCompliance: 92,
    aiOptimization: 85,
    recentActivity: [
      { time: '2 hours ago', action: 'Created new power play formation', user: 'You', type: 'create' },
      { time: '1 day ago', action: 'Modified breakout pattern #3', user: 'Assistant Coach', type: 'edit' },
      { time: '2 days ago', action: 'AI suggested defensive adjustment', user: 'AI Engine', type: 'ai' },
      { time: '3 days ago', action: 'Shared playbook with players', user: 'You', type: 'share' }
    ],
    playerProgress: [
      { name: 'Erik Andersson', number: '15', mastery: 95 },
      { name: 'Marcus Lindberg', number: '7', mastery: 87 },
      { name: 'Viktor Nilsson', number: '23', mastery: 82 },
      { name: 'Johan Bergström', number: '14', mastery: 90 },
      { name: 'Anders Johansson', number: '22', mastery: 78 }
    ]
  },
  player: {
    mastery: 87,
    successRate: 92,
    learningStreak: 12,
    playsAssigned: [
      {
        name: "Power Play Formation A",
        category: "Special Teams", 
        status: "mastered",
        progress: 100,
        lastStudied: "2 days ago",
        difficulty: "Intermediate"
      },
      {
        name: "Defensive Zone Coverage",
        category: "Defense",
        status: "in-progress", 
        progress: 75,
        lastStudied: "Yesterday",
        difficulty: "Advanced"
      },
      {
        name: "Breakout Pattern #3",
        category: "Transition",
        status: "new",
        progress: 25,
        lastStudied: "Just assigned",
        difficulty: "Beginner"
      }
    ],
    achievements: [
      {
        name: "Quick Learner",
        description: "Master 5 plays in one week",
        earned: true,
        icon: "🚀",
        dateEarned: "Jan 15"
      },
      {
        name: "Power Play Expert",
        description: "Perfect all power play formations", 
        earned: true,
        icon: "⚡",
        dateEarned: "Jan 10"
      },
      {
        name: "Strategic Mind", 
        description: "Study plays for 10 consecutive days",
        earned: true,
        icon: "🧠",
        dateEarned: "Jan 18"
      },
      {
        name: "Team Player",
        description: "Help 3 teammates learn plays",
        earned: false,
        icon: "🤝",
        progress: "1/3"
      }
    ]
  }
};

export default function TacticalDemoPage() {
  const [activeView, setActiveView] = useState<'coach' | 'player'>('coach');
  const { coach, player } = mockTacticalData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/coach" className="text-white/80 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-4xl font-bold">Tactical System Demo</h1>
          </div>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl">
            Experience Hockey Hub's comprehensive tactical learning system. Create plays, track progress, 
            and watch your team master complex strategies with AI-powered insights.
          </p>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Gamepad2 className="h-6 w-6" />
                <h3 className="font-semibold">Interactive Tactical Board</h3>
              </div>
              <p className="text-blue-100 text-sm">
                Draw plays, animate movements, and share strategies with your team in real-time.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="h-6 w-6" />
                <h3 className="font-semibold">AI-Powered Analytics</h3>
              </div>
              <p className="text-blue-100 text-sm">
                Get intelligent suggestions and performance insights based on real game data.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="h-6 w-6" />
                <h3 className="font-semibold">Progress Tracking</h3>
              </div>
              <p className="text-blue-100 text-sm">
                Monitor player learning with detailed progress reports and achievement badges.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* View Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            <Button
              variant={activeView === 'coach' ? 'default' : 'ghost'}
              onClick={() => setActiveView('coach')}
              className="px-6 py-2"
            >
              <Users className="h-4 w-4 mr-2" />
              Coach View
            </Button>
            <Button
              variant={activeView === 'player' ? 'default' : 'ghost'}
              onClick={() => setActiveView('player')}
              className="px-6 py-2"
            >
              <Target className="h-4 w-4 mr-2" />
              Player View
            </Button>
          </div>
        </div>

        {/* Coach View */}
        {activeView === 'coach' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Coach Dashboard</h2>
              <p className="text-gray-600">Manage your team's tactical development</p>
            </div>

            {/* Coach Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-blue-600" />
                    Play Library
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 mb-2">{coach.totalPlays}</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Offensive</span>
                      <Badge variant="outline">{coach.categories.offensive}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Defensive</span>
                      <Badge variant="outline">{coach.categories.defensive}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Special Teams</span>
                      <Badge variant="outline">{coach.categories.specialTeams}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 mb-2">{coach.successRate}%</div>
                  <Progress value={coach.successRate} className="h-2 mb-2" />
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    +5% this week
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    AI Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 mb-2">{coach.aiOptimization}%</div>
                  <Progress value={coach.aiOptimization} className="h-2 mb-2" />
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    3 new suggestions
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Coach Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Player Learning Progress</CardTitle>
                  <CardDescription>How well your players are mastering the plays</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {coach.playerProgress.map((player, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{player.number}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{player.name}</span>
                            <span className="text-xs text-muted-foreground">{player.mastery}%</span>
                          </div>
                          <Progress value={player.mastery} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest tactical board updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {coach.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'create' ? 'bg-green-100 text-green-600' :
                          activity.type === 'edit' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'ai' ? 'bg-purple-100 text-purple-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {activity.type === 'create' && <Plus className="h-4 w-4" />}
                          {activity.type === 'edit' && <Edit className="h-4 w-4" />}
                          {activity.type === 'ai' && <Brain className="h-4 w-4" />}
                          {activity.type === 'share' && <Share2 className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Player View */}
        {activeView === 'player' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Player Dashboard</h2>
              <p className="text-gray-600">Track your tactical learning progress</p>
            </div>

            {/* Player Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Play Mastery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 mb-2">{player.mastery}%</div>
                  <Progress value={player.mastery} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">14 of 17 plays mastered</p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 mb-2">{player.successRate}%</div>
                  <Progress value={player.successRate} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">In practice execution</p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    Learning Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600 mb-2">{player.learningStreak}</div>
                  <div className="text-xs text-muted-foreground mb-2">Days consecutive study</div>
                  <Badge className="bg-orange-100 text-orange-800 text-xs w-full justify-center">
                    Personal best!
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Player Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Plays</CardTitle>
                  <CardDescription>Plays your coach wants you to master</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {player.playsAssigned.map((play, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className={`p-2 rounded-lg ${
                          play.status === 'mastered' ? 'bg-green-100 text-green-600' :
                          play.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {play.status === 'mastered' && <CheckCircle className="h-4 w-4" />}
                          {play.status === 'in-progress' && <Brain className="h-4 w-4" />}
                          {play.status === 'new' && <Star className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{play.name}</h4>
                            <Badge variant="outline" className="text-xs">{play.category}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex-1">
                              <Progress value={play.progress} className="h-2" />
                            </div>
                            <span className="text-sm font-medium">{play.progress}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Last studied: {play.lastStudied}</p>
                        </div>
                        <Button size="sm" variant={play.status === 'new' ? 'default' : 'outline'}>
                          {play.status === 'new' ? 'Start Learning' : 'Continue'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Achievement Badges</CardTitle>
                  <CardDescription>Your tactical learning milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {player.achievements.map((badge, index) => (
                      <div key={index} className={`p-4 rounded-lg border text-center ${
                        badge.earned ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className={`text-2xl mb-2 ${badge.earned ? '' : 'grayscale'}`}>
                          {badge.icon}
                        </div>
                        <h4 className={`font-medium text-sm mb-1 ${badge.earned ? 'text-amber-800' : 'text-muted-foreground'}`}>
                          {badge.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {badge.description}
                        </p>
                        {badge.earned ? (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            {badge.dateEarned}
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            <Progress value={33} className="h-1" />
                            <p className="text-xs text-muted-foreground">{badge.progress}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="py-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Ready to Experience the Full System?</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                This demo shows just a glimpse of Hockey Hub's tactical features. 
                Access the complete system with interactive play creation, AI analytics, and team collaboration.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/coach">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                    <Users className="h-5 w-5 mr-2" />
                    Go to Coach Dashboard
                  </Button>
                </Link>
                <Link href="/player">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                    <Target className="h-5 w-5 mr-2" />
                    Go to Player Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}