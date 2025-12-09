'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PlayCircle,
  Brain,
  Target,
  Book,
  Clock,
  Star,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Users,
  Trophy,
  ArrowRight,
  Lock
} from '@/components/icons';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TacticalPlay {
  id: string;
  name: string;
  type: 'powerplay' | 'penalty-kill' | 'even-strength' | 'faceoff';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  description: string;
  playerRole: {
    position: string;
    keyResponsibilities: string[];
    commonMistakes: string[];
  };
  masteryLevel: 'not-started' | 'learning' | 'proficient' | 'mastered';
  progress: number; // 0-100
  lastStudied?: Date;
  completedModes: ('watch' | 'quiz' | 'practice' | 'review')[];
  quizScore?: number;
  coachNotes?: string;
  isLocked?: boolean;
  unlockRequirement?: string;
}

interface TacticalLearningCardProps {
  play: TacticalPlay;
  mode: 'watch' | 'quiz' | 'practice' | 'review';
  onSelect: (playId: string) => void;
  onStartQuiz: () => void;
}

export function TacticalLearningCard({ play, mode, onSelect, onStartQuiz }: TacticalLearningCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'mastered': return 'green';
      case 'proficient': return 'blue';
      case 'learning': return 'orange';
      default: return 'gray';
    }
  };

  const getMasteryIcon = (level: string) => {
    switch (level) {
      case 'mastered': return <Trophy className="h-4 w-4" />;
      case 'proficient': return <CheckCircle2 className="h-4 w-4" />;
      case 'learning': return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'advanced': return 'red';
      case 'intermediate': return 'orange';
      default: return 'green';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'powerplay': return '⚡';
      case 'penalty-kill': return '🛡️';
      case 'faceoff': return '🏒';
      default: return '🥅';
    }
  };

  const getModeIcon = (currentMode: string) => {
    switch (currentMode) {
      case 'watch': return <PlayCircle className="h-4 w-4" />;
      case 'quiz': return <Brain className="h-4 w-4" />;
      case 'practice': return <Target className="h-4 w-4" />;
      case 'review': return <Book className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const handleCardClick = () => {
    if (play.isLocked) return;
    onSelect(play.id);
  };

  const handleQuizStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (play.isLocked) return;
    onStartQuiz();
  };

  if (play.isLocked) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="relative overflow-hidden bg-gray-100 border-gray-200 opacity-75">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{getTypeIcon(play.type)}</span>
                  <h3 className="font-semibold text-gray-500">{play.name}</h3>
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{play.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center py-4">
              <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Locked</p>
              <p className="text-xs text-gray-400 mt-1">{play.unlockRequirement}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card 
        className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{getTypeIcon(play.type)}</span>
                <h3 className="font-semibold">{play.name}</h3>
                <Badge 
                  variant="secondary" 
                  className={`bg-${getDifficultyColor(play.difficulty)}-100 text-${getDifficultyColor(play.difficulty)}-700`}
                >
                  {play.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{play.description}</p>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <Badge 
                variant="outline" 
                className={`bg-${getMasteryColor(play.masteryLevel)}-50 text-${getMasteryColor(play.masteryLevel)}-700 border-${getMasteryColor(play.masteryLevel)}-200`}
              >
                <span className="mr-1">{getMasteryIcon(play.masteryLevel)}</span>
                {play.masteryLevel.charAt(0).toUpperCase() + play.masteryLevel.slice(1)}
              </Badge>
              
              {play.quizScore !== undefined && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Quiz: {play.quizScore}%
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{Math.round(play.progress)}%</span>
            </div>
            <Progress value={play.progress} className="h-2" />
          </div>

          {/* Player Role Summary */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-900">Your Role: {play.playerRole.position}</span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              {play.playerRole.keyResponsibilities.slice(0, 2).map((responsibility, index) => (
                <li key={index} className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{responsibility}</span>
                </li>
              ))}
              {play.playerRole.keyResponsibilities.length > 2 && (
                <li className="text-blue-500">+{play.playerRole.keyResponsibilities.length - 2} more...</li>
              )}
            </ul>
          </div>

          {/* Time and Modes */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{play.estimatedTime} min</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {['watch', 'quiz', 'practice', 'review'].map((modeOption) => (
                <div
                  key={modeOption}
                  className={`p-1 rounded ${
                    play.completedModes.includes(modeOption as any)
                      ? 'bg-green-100 text-green-600'
                      : mode === modeOption
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  title={modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
                >
                  {getModeIcon(modeOption)}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button 
              variant={mode === 'quiz' ? 'default' : 'outline'} 
              size="sm" 
              className="flex-1"
              onClick={handleQuizStart}
            >
              <Brain className="h-4 w-4 mr-2" />
              Quiz
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              {getModeIcon(mode)}
              <span className="ml-2 capitalize">{mode}</span>
            </Button>
          </div>

          {/* Coach Notes */}
          {play.coachNotes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-yellow-800">Coach Notes</p>
                  <p className="text-xs text-yellow-700 mt-1">{play.coachNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Last Studied */}
          {play.lastStudied && (
            <div className="text-xs text-gray-500 text-center">
              Last studied: {play.lastStudied.toLocaleDateString()}
            </div>
          )}
        </CardContent>

        {/* Hover Overlay */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-blue-600/5 flex items-center justify-center"
          >
            <div className="bg-white rounded-full p-3 shadow-lg">
              <ArrowRight className="h-6 w-6 text-blue-600" />
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}