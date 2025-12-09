'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Star,
  Target,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  Share2,
  BookOpen
} from '@/components/icons';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'scenario' | 'positioning';
  question: string;
  description?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  mediaUrl?: string; // For diagram/video questions
  playerRole?: string;
  commonMistakes?: string[];
}

interface QuizResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
  points: number;
}

interface TacticalQuizProps {
  playId: string;
  onClose: () => void;
  onComplete: (score: number) => void;
}

export function TacticalQuiz({ playId, onClose, onComplete }: TacticalQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizResult[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [startTime] = useState(Date.now());

  // Mock quiz questions based on play
  const questions: QuizQuestion[] = [
    {
      id: '1',
      type: 'multiple-choice',
      question: 'What is your primary responsibility as a center during a power play setup?',
      description: 'Consider your positioning and role in the offensive zone.',
      options: [
        'Stay at the blue line for defensive coverage',
        'Position yourself in front of the net for deflections',
        'Control the puck in the high slot and distribute to wingers',
        'Chase the puck into the corners'
      ],
      correctAnswer: 2,
      explanation: 'As a center on the power play, your primary role is to control the puck in the high slot area, read the defense, and distribute the puck to your wingers or defense for the best scoring opportunity.',
      difficulty: 'medium',
      points: 20,
      playerRole: 'Center',
      commonMistakes: [
        'Getting too deep in the offensive zone',
        'Not maintaining proper spacing with wingers'
      ]
    },
    {
      id: '2',
      type: 'scenario',
      question: 'The opposing team has just cleared the puck. What should you do?',
      description: 'You are on a power play and the puck has been cleared to center ice.',
      options: [
        'Immediately chase after the puck',
        'Retreat to your own zone for defense',
        'Support the defenseman retrieving the puck while maintaining structure',
        'Change lines immediately'
      ],
      correctAnswer: 2,
      explanation: 'Maintain your power play structure while supporting the defenseman. This allows for a quick regroup and maintains possession while keeping your formation intact.',
      difficulty: 'hard',
      points: 30,
      playerRole: 'Center'
    },
    {
      id: '3',
      type: 'true-false',
      question: 'On a power play, you should always pass to the player with the most space.',
      options: ['True', 'False'],
      correctAnswer: 1,
      explanation: 'False. While space is important, you should pass to the player in the best position to create a scoring chance, considering shooting lanes, defensive pressure, and time/score situation.',
      difficulty: 'easy',
      points: 15
    },
    {
      id: '4',
      type: 'positioning',
      question: 'Where should you position yourself when your team wins a faceoff in the offensive zone?',
      description: 'The faceoff is in the left circle of the offensive zone.',
      options: [
        'Immediately drive to the net',
        'Move to the high slot for a potential pass',
        'Stay at the faceoff dot for a rebound',
        'Go to the boards to support the winger'
      ],
      correctAnswer: 1,
      explanation: 'Moving to the high slot gives you the best position to receive a pass from the faceoff win and allows you to survey all your passing options while being in a prime scoring position.',
      difficulty: 'medium',
      points: 25,
      mediaUrl: '/diagrams/faceoff-positioning.svg'
    },
    {
      id: '5',
      type: 'multiple-choice',
      question: 'What is the most important factor when deciding to shoot or pass?',
      options: [
        'How hard you can shoot',
        'The quality of the shooting lane and goalie position',
        'Whether your teammates are calling for the puck',
        'The time remaining on the power play'
      ],
      correctAnswer: 1,
      explanation: 'The quality of your shooting lane and the goalie\'s positioning are the most critical factors. A clear shot with the goalie out of position is usually better than a pass to a covered teammate.',
      difficulty: 'hard',
      points: 25
    }
  ];

  useEffect(() => {
    if (!quizComplete && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !quizComplete) {
      handleQuizComplete();
    }
  }, [timeRemaining, quizComplete]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correctAnswer;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000) - (300 - timeRemaining);
    
    const result: QuizResult = {
      questionId: question.id,
      selectedAnswer,
      isCorrect,
      timeSpent,
      points: isCorrect ? question.points : 0
    };

    setAnswers([...answers, result]);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      handleQuizComplete();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0 && !showExplanation) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]?.selectedAnswer || null);
    }
  };

  const handleQuizComplete = () => {
    const totalPoints = answers.reduce((sum, answer) => sum + answer.points, 0);
    const maxPoints = questions.reduce((sum, question) => sum + question.points, 0);
    const score = Math.round((totalPoints / maxPoints) * 100);
    
    setQuizComplete(true);
    onComplete(score);
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizComplete(false);
    setTimeRemaining(300);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'Excellent!', color: 'bg-green-100 text-green-700' };
    if (score >= 70) return { text: 'Good Job!', color: 'bg-blue-100 text-blue-700' };
    if (score >= 50) return { text: 'Keep Trying!', color: 'bg-orange-100 text-orange-700' };
    return { text: 'Needs Work', color: 'bg-red-100 text-red-700' };
  };

  if (quizComplete) {
    const totalPoints = answers.reduce((sum, answer) => sum + answer.points, 0);
    const maxPoints = questions.reduce((sum, question) => sum + question.points, 0);
    const score = Math.round((totalPoints / maxPoints) * 100);
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const badge = getScoreBadge(score);

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <div className="mb-6">
              <div className={`inline-flex p-4 rounded-full mb-4 ${
                score >= 70 ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <Trophy className={`h-12 w-12 ${score >= 70 ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
              <Badge className={badge.color}>{badge.text}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</div>
                <div className="text-sm text-gray-500">Final Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{correctAnswers}</div>
                <div className="text-sm text-gray-500">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">{questions.length - correctAnswers}</div>
                <div className="text-sm text-gray-500">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{totalPoints}</div>
                <div className="text-sm text-gray-500">XP Earned</div>
              </div>
            </div>

            {/* Question Review */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Question Review</h3>
                <div className="space-y-2">
                  {questions.map((question, index) => {
                    const answer = answers[index];
                    return (
                      <div key={question.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            answer?.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {answer?.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Question {index + 1}</div>
                            <div className="text-sm text-gray-500">
                              {question.difficulty} • {question.points} points
                            </div>
                          </div>
                        </div>
                        <Badge variant={answer?.isCorrect ? 'default' : 'secondary'}>
                          {answer?.isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button onClick={handleRetakeQuiz} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
              <Button onClick={() => {}}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Result
              </Button>
              <Button onClick={onClose}>
                <BookOpen className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>Tactical Quiz</span>
              <Badge variant="outline">Question {currentQuestion + 1} of {questions.length}</Badge>
            </DialogTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className={`font-mono ${timeRemaining <= 60 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="capitalize">
                {question.type.replace('-', ' ')}
              </Badge>
              <Badge 
                variant="outline"
                className={`${
                  question.difficulty === 'hard' ? 'border-red-200 text-red-700' :
                  question.difficulty === 'medium' ? 'border-orange-200 text-orange-700' :
                  'border-green-200 text-green-700'
                }`}
              >
                {question.difficulty} • {question.points} points
              </Badge>
              {question.playerRole && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {question.playerRole}
                </Badge>
              )}
            </div>
          </div>

          {/* Question Content */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{question.question}</h3>
                  {question.description && (
                    <p className="text-gray-600">{question.description}</p>
                  )}
                </div>

                {question.mediaUrl && (
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Diagram/Video would be displayed here</p>
                  </div>
                )}

                {/* Answer Options */}
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showExplanation}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                        showExplanation
                          ? index === question.correctAnswer
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : selectedAnswer === index && index !== question.correctAnswer
                            ? 'border-red-500 bg-red-50 text-red-800'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                          : selectedAnswer === index
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                          showExplanation
                            ? index === question.correctAnswer
                              ? 'border-green-500 bg-green-500 text-white'
                              : selectedAnswer === index && index !== question.correctAnswer
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-gray-300'
                            : selectedAnswer === index
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{option}</span>
                        {showExplanation && index === question.correctAnswer && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {showExplanation && selectedAnswer === index && index !== question.correctAnswer && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className={`border-l-4 ${
                  selectedAnswer === question.correctAnswer ? 'border-l-green-500 bg-green-50' : 'border-l-orange-500 bg-orange-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        selectedAnswer === question.correctAnswer ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        {selectedAnswer === question.correctAnswer ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-2 ${
                          selectedAnswer === question.correctAnswer ? 'text-green-800' : 'text-orange-800'
                        }`}>
                          {selectedAnswer === question.correctAnswer ? 'Correct!' : 'Not quite right'}
                        </h4>
                        <p className="text-gray-700 mb-3">{question.explanation}</p>
                        
                        {question.commonMistakes && selectedAnswer !== question.correctAnswer && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <h5 className="font-medium text-orange-800 mb-2">Common Mistakes:</h5>
                            <ul className="text-sm text-orange-700 space-y-1">
                              {question.commonMistakes.map((mistake, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                                  <span>{mistake}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              onClick={handlePreviousQuestion}
              variant="outline"
              disabled={currentQuestion === 0 || showExplanation}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-gray-500">
              Progress: {currentQuestion + 1} of {questions.length}
            </div>

            {!showExplanation ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
              >
                Submit Answer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                {currentQuestion < questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Finish Quiz
                    <Trophy className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}