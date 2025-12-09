'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Trophy, 
  Target, 
  PlayCircle, 
  Brain, 
  MessageCircle,
  BarChart3,
  Star,
  Award,
  Flame,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  Zap
} from '@/components/icons';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { TacticalLearningCard } from '@/features/player/components/TacticalLearningCard';
import { PlayMasteryTracker } from '@/features/player/components/PlayMasteryTracker';
import { TacticalQuiz } from '@/features/player/components/TacticalQuiz';
import { useTacticalLearning } from '@/features/player/hooks/useTacticalLearning';

export default function TacticalLearningPage() {
  const {
    assignedPlays,
    learningProgress,
    achievements,
    dailyStreak,
    weeklyGoals,
    leaderboard,
    currentXP,
    nextLevelXP,
    masteryLevels,
    isLoading
  } = useTacticalLearning();

  const [selectedPlay, setSelectedPlay] = useState<string | null>(null);
  const [learningMode, setLearningMode] = useState<'watch' | 'quiz' | 'practice' | 'review'>('watch');
  const [showQuiz, setShowQuiz] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tactical Learning</h1>
              <p className="text-blue-100">Master the game, one play at a time</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="font-semibold">{dailyStreak} day streak</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100">Level Progress</div>
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-bold">{currentXP} XP</div>
                  <div className="w-20 bg-blue-500 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentXP / nextLevelXP) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm">{nextLevelXP}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{assignedPlays.length}</div>
              <div className="text-sm text-blue-100">Assigned Plays</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{achievements.length}</div>
              <div className="text-sm text-blue-100">Achievements</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{Math.round(learningProgress * 100)}%</div>
              <div className="text-sm text-blue-100">Overall Progress</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">#{leaderboard.playerRank}</div>
              <div className="text-sm text-blue-100">Team Rank</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="learn" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="learn" className="flex items-center space-x-2">
              <Book className="h-4 w-4" />
              <span>Learn</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Progress</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span>Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="discuss" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>Discuss</span>
            </TabsTrigger>
          </TabsList>

          {/* Learn Tab */}
          <TabsContent value="learn" className="space-y-6">
            {/* Daily Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span>Daily Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {weeklyGoals.map((goal, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${goal.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {goal.completed ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{goal.title}</div>
                        <Progress value={(goal.current / goal.target) * 100} className="h-2 mt-1" />
                        <div className="text-sm text-gray-500 mt-1">
                          {goal.current} / {goal.target} {goal.unit}
                        </div>
                      </div>
                      {goal.completed && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          +{goal.xpReward} XP
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Modes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { mode: 'watch', icon: PlayCircle, title: 'Watch', desc: 'View animated plays', color: 'blue' },
                { mode: 'quiz', icon: Brain, title: 'Quiz', desc: 'Test your knowledge', color: 'purple' },
                { mode: 'practice', icon: Target, title: 'Practice', desc: 'Interactive walkthrough', color: 'green' },
                { mode: 'review', icon: Book, title: 'Review', desc: 'Study completed plays', color: 'orange' }
              ].map(({ mode, icon: Icon, title, desc, color }) => (
                <Card 
                  key={mode}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    learningMode === mode ? `ring-2 ring-${color}-500 bg-${color}-50` : 'hover:shadow-md'
                  }`}
                  onClick={() => setLearningMode(mode as any)}
                >
                  <CardContent className="p-4 text-center">
                    <Icon className={`h-8 w-8 mx-auto mb-2 text-${color}-600`} />
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Assigned Plays */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Plays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedPlays.map((play) => (
                    <TacticalLearningCard
                      key={play.id}
                      play={play}
                      mode={learningMode}
                      onSelect={setSelectedPlay}
                      onStartQuiz={() => setShowQuiz(true)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <div className="space-y-6">
              <PlayMasteryTracker 
                masteryLevels={masteryLevels}
                currentProgress={learningProgress}
              />
              
              {/* Position-Specific Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Position Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { position: 'Center', progress: 85, plays: 12, mastered: 8 },
                      { position: 'Left Wing', progress: 70, plays: 8, mastered: 5 },
                      { position: 'Right Wing', progress: 60, plays: 8, mastered: 4 },
                      { position: 'Defense', progress: 45, plays: 6, mastered: 2 }
                    ].map((pos) => (
                      <div key={pos.position} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{pos.position}</span>
                            <span className="text-sm text-gray-500">
                              {pos.mastered}/{pos.plays} mastered
                            </span>
                          </div>
                          <Progress value={pos.progress} className="h-2" />
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          {pos.progress}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">24</div>
                    <div className="text-sm text-gray-500">Plays Studied</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">18</div>
                    <div className="text-sm text-gray-500">Quiz Attempts</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">4.2h</div>
                    <div className="text-sm text-gray-500">Study Time</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className={`${achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50'}`}>
                    <CardContent className="p-6 text-center">
                      <div className={`inline-flex p-3 rounded-full mb-4 ${
                        achievement.unlocked 
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Trophy className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-2">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                      
                      {achievement.unlocked ? (
                        <div className="space-y-2">
                          <Badge className="bg-green-100 text-green-700">
                            Unlocked!
                          </Badge>
                          <div className="text-sm text-gray-500">
                            +{achievement.xpReward} XP earned
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Progress value={(achievement.progress / achievement.target) * 100} />
                          <div className="text-sm text-gray-500">
                            {achievement.progress} / {achievement.target}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span>Team Leaderboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.rankings.map((player, index) => (
                    <div 
                      key={player.id}
                      className={`flex items-center space-x-4 p-4 rounded-lg ${
                        player.isCurrentPlayer ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium flex items-center space-x-2">
                          <span>{player.name}</span>
                          {player.isCurrentPlayer && (
                            <Badge variant="secondary">You</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{player.position}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">{player.xp} XP</div>
                        <div className="text-sm text-gray-500">
                          {player.playsCompleted} plays completed
                        </div>
                      </div>
                      
                      {index < 3 && (
                        <Award className={`h-5 w-5 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-orange-500'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discuss Tab */}
          <TabsContent value="discuss">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <span>Ask Your Coaches</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Questions About Tactics?</h3>
                  <p className="text-gray-600 mb-4">
                    Connect with your coaches to discuss plays, ask questions, and get personalized feedback.
                  </p>
                  <Button>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && selectedPlay && (
          <TacticalQuiz
            playId={selectedPlay}
            onClose={() => {
              setShowQuiz(false);
              setSelectedPlay(null);
            }}
            onComplete={(score) => {
              console.log('Quiz completed with score:', score);
              setShowQuiz(false);
              setSelectedPlay(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}