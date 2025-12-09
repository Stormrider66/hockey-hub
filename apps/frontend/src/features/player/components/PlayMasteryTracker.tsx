'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Trophy,
  Star,
  TrendingUp,
  Clock,
  Brain,
  CheckCircle2,
  BarChart3,
  Flame,
  Award,
  Calendar,
  Users,
  ArrowUp,
  ArrowDown,
  Minus
} from '@/components/icons';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MasteryLevel {
  level: 'beginner' | 'learning' | 'proficient' | 'master';
  name: string;
  description: string;
  xpRequired: number;
  currentXP: number;
  color: string;
  icon: React.ReactNode;
  benefits: string[];
  requirements: string[];
  unlocksAt: number;
}

interface PositionProgress {
  position: string;
  level: number;
  xp: number;
  nextLevelXP: number;
  playsAssigned: number;
  playsCompleted: number;
  playsMastered: number;
  averageQuizScore: number;
  timeSpent: number; // minutes
  lastActivity: Date;
  weeklyGoal: number;
  weeklyProgress: number;
  trend: 'up' | 'down' | 'stable';
}

interface PlayMasteryTrackerProps {
  masteryLevels: MasteryLevel[];
  currentProgress: number;
}

export function PlayMasteryTracker({ masteryLevels, currentProgress }: PlayMasteryTrackerProps) {
  const [selectedPosition, setSelectedPosition] = useState<string>('overall');

  // Mock position data
  const positionProgress: PositionProgress[] = [
    {
      position: 'Center',
      level: 3,
      xp: 2450,
      nextLevelXP: 3000,
      playsAssigned: 15,
      playsCompleted: 12,
      playsMastered: 8,
      averageQuizScore: 87,
      timeSpent: 240,
      lastActivity: new Date(),
      weeklyGoal: 3,
      weeklyProgress: 2,
      trend: 'up'
    },
    {
      position: 'Left Wing',
      level: 2,
      xp: 1200,
      nextLevelXP: 1500,
      playsAssigned: 10,
      playsCompleted: 7,
      playsMastered: 4,
      averageQuizScore: 78,
      timeSpent: 150,
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      weeklyGoal: 2,
      weeklyProgress: 1,
      trend: 'stable'
    },
    {
      position: 'Right Wing',
      level: 2,
      xp: 950,
      nextLevelXP: 1500,
      playsAssigned: 10,
      playsCompleted: 6,
      playsMastered: 3,
      averageQuizScore: 74,
      timeSpent: 120,
      lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      weeklyGoal: 2,
      weeklyProgress: 0,
      trend: 'down'
    },
    {
      position: 'Defense',
      level: 1,
      xp: 600,
      nextLevelXP: 1000,
      playsAssigned: 8,
      playsCompleted: 3,
      playsMastered: 1,
      averageQuizScore: 68,
      timeSpent: 90,
      lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      weeklyGoal: 1,
      weeklyProgress: 0,
      trend: 'stable'
    }
  ];

  const currentLevel = masteryLevels.find(level => 
    currentProgress >= level.unlocksAt / 100 && 
    currentProgress < (masteryLevels[masteryLevels.indexOf(level) + 1]?.unlocksAt || 100) / 100
  ) || masteryLevels[0];

  const nextLevel = masteryLevels[masteryLevels.indexOf(currentLevel) + 1];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position.toLowerCase()) {
      case 'center': return '🏒';
      case 'left wing': return '⬅️';
      case 'right wing': return '➡️';
      case 'defense': return '🛡️';
      default: return '🎯';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-full">
              {currentLevel.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentLevel.name}</h2>
              <p className="text-blue-100">{currentLevel.description}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Progress to {nextLevel?.name || 'Max Level'}</span>
                <span className="font-semibold">{Math.round(currentProgress * 100)}%</span>
              </div>
              <Progress 
                value={currentProgress * 100} 
                className="h-3 bg-white/20"
              />
              <div className="text-sm text-blue-100">
                {currentLevel.currentXP} / {nextLevel?.xpRequired || currentLevel.xpRequired} XP
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm text-blue-100">Plays Studied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">18</div>
                <div className="text-sm text-blue-100">Completed</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-blue-100">Current Level Benefits:</div>
              <ul className="text-sm space-y-1">
                {currentLevel.benefits.slice(0, 2).map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="positions">Position Progress</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* Position Progress Tab */}
        <TabsContent value="positions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {positionProgress.map((position) => (
              <motion.div
                key={position.position}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getPositionIcon(position.position)}</span>
                        <div>
                          <h3 className="font-semibold">{position.position}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">Level {position.level}</Badge>
                            {getTrendIcon(position.trend)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{Math.round((position.xp / position.nextLevelXP) * 100)}%</div>
                        <div className="text-sm text-gray-500">to next level</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <Progress value={(position.xp / position.nextLevelXP) * 100} className="h-2" />
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{position.playsCompleted}</div>
                        <div className="text-gray-500">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{position.playsMastered}</div>
                        <div className="text-gray-500">Mastered</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{position.averageQuizScore}%</div>
                        <div className="text-gray-500">Quiz Avg</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{Math.round(position.timeSpent / 60)} hours studied</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-500">
                          {Math.floor((Date.now() - position.lastActivity.getTime()) / (24 * 60 * 60 * 1000))} days ago
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Weekly Goal</span>
                        <span className="text-sm text-gray-500">
                          {position.weeklyProgress} / {position.weeklyGoal} plays
                        </span>
                      </div>
                      <Progress value={(position.weeklyProgress / position.weeklyGoal) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'First Steps',
                description: 'Complete your first tactical play',
                icon: <Star className="h-6 w-6" />,
                earned: true,
                progress: 100,
                xpReward: 50
              },
              {
                title: 'Quiz Master',
                description: 'Score 90%+ on 5 quizzes',
                icon: <Brain className="h-6 w-6" />,
                earned: true,
                progress: 100,
                xpReward: 150
              },
              {
                title: 'Speed Learner',
                description: 'Complete 3 plays in one day',
                icon: <Flame className="h-6 w-6" />,
                earned: false,
                progress: 67,
                xpReward: 100
              },
              {
                title: 'Position Expert',
                description: 'Master all plays for your primary position',
                icon: <Trophy className="h-6 w-6" />,
                earned: false,
                progress: 53,
                xpReward: 300
              },
              {
                title: 'Consistent Study',
                description: 'Study for 7 consecutive days',
                icon: <Calendar className="h-6 w-6" />,
                earned: false,
                progress: 43,
                xpReward: 200
              },
              {
                title: 'Team Player',
                description: 'Help 3 teammates with discussions',
                icon: <Users className="h-6 w-6" />,
                earned: false,
                progress: 33,
                xpReward: 175
              }
            ].map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${achievement.earned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : ''}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex p-3 rounded-full mb-4 ${
                      achievement.earned 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {achievement.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    
                    {achievement.earned ? (
                      <Badge className="bg-green-100 text-green-700">
                        <Award className="h-3 w-3 mr-1" />
                        Earned!
                      </Badge>
                    ) : (
                      <div className="space-y-2">
                        <Progress value={achievement.progress} />
                        <div className="text-sm text-gray-500">
                          {achievement.progress}% complete
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-500 mt-2">
                      +{achievement.xpReward} XP reward
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Learning Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Total Study Time', value: '12.5 hours', trend: '+2.3h this week' },
                    { label: 'Average Quiz Score', value: '84%', trend: '+5% improvement' },
                    { label: 'Plays Per Week', value: '4.2', trend: 'Above team average' },
                    { label: 'Completion Rate', value: '87%', trend: '+12% this month' }
                  ].map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{stat.label}</div>
                        <div className="text-sm text-gray-500">{stat.trend}</div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Performance analytics will be available after more data is collected.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Current Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Master Center Position',
                      description: 'Complete all 15 center plays',
                      progress: 80,
                      deadline: '2 weeks',
                      priority: 'high'
                    },
                    {
                      title: 'Improve Quiz Scores',
                      description: 'Achieve 90%+ average',
                      progress: 45,
                      deadline: '1 month',
                      priority: 'medium'
                    },
                    {
                      title: 'Daily Study Streak',
                      description: 'Study for 14 consecutive days',
                      progress: 43,
                      deadline: '10 days',
                      priority: 'low'
                    }
                  ].map((goal, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{goal.title}</h4>
                          <p className="text-sm text-gray-500">{goal.description}</p>
                        </div>
                        <Badge 
                          variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {goal.priority}
                        </Badge>
                      </div>
                      <Progress value={goal.progress} className="mb-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Due in {goal.deadline}</span>
                        <span className="font-medium">{goal.progress}% complete</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4">
                  <Target className="h-4 w-4 mr-2" />
                  Set New Goal
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Challenge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
                    <Trophy className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Power Play Master</h3>
                  <p className="text-gray-600 mb-4">
                    Complete 5 power play scenarios this week and score 85%+ on all quizzes.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>3/5 completed</span>
                    </div>
                    <Progress value={60} />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">
                    Reward: 250 XP + Special Badge
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}