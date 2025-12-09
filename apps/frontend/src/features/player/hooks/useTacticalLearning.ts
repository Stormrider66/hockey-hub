'use client';

import { useState, useEffect } from 'react';
import { Star, Trophy, Brain, Target, Clock, Users, Flame, Award } from 'lucide-react';

interface TacticalPlay {
  id: string;
  name: string;
  type: 'powerplay' | 'penalty-kill' | 'even-strength' | 'faceoff';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  description: string;
  playerRole: {
    position: string;
    keyResponsibilities: string[];
    commonMistakes: string[];
  };
  masteryLevel: 'not-started' | 'learning' | 'proficient' | 'mastered';
  progress: number;
  lastStudied?: Date;
  completedModes: ('watch' | 'quiz' | 'practice' | 'review')[];
  quizScore?: number;
  coachNotes?: string;
  isLocked?: boolean;
  unlockRequirement?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  target: number;
  xpReward: number;
  unlockedDate?: Date;
}

interface WeeklyGoal {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
  xpReward: number;
  deadline: Date;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  position: string;
  xp: number;
  level: number;
  playsCompleted: number;
  averageScore: number;
  isCurrentPlayer: boolean;
}

interface Leaderboard {
  playerRank: number;
  rankings: LeaderboardEntry[];
  weeklyChampion?: LeaderboardEntry;
}

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

export function useTacticalLearning() {
  const [isLoading, setIsLoading] = useState(true);
  const [assignedPlays, setAssignedPlays] = useState<TacticalPlay[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard>({
    playerRank: 0,
    rankings: []
  });
  const [currentXP, setCurrentXP] = useState(0);
  const [nextLevelXP, setNextLevelXP] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [learningProgress, setLearningProgress] = useState(0);

  // Initialize mock data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock assigned plays
      const mockPlays: TacticalPlay[] = [
        {
          id: 'pp1',
          name: 'Power Play 1-3-1 Formation',
          type: 'powerplay',
          difficulty: 'intermediate',
          estimatedTime: 15,
          description: 'Learn the fundamentals of the 1-3-1 power play system focusing on puck movement and positioning.',
          playerRole: {
            position: 'Center',
            keyResponsibilities: [
              'Control puck in high slot',
              'Read defensive coverage',
              'Distribute to open teammates',
              'Provide net-front presence when needed'
            ],
            commonMistakes: [
              'Getting too deep in the offensive zone',
              'Not maintaining proper spacing with wingers',
              'Forcing passes through traffic'
            ]
          },
          masteryLevel: 'learning',
          progress: 65,
          lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          completedModes: ['watch', 'practice'],
          quizScore: 78,
          coachNotes: 'Great progress on positioning. Focus on quicker puck movement next session.'
        },
        {
          id: 'pk1',
          name: 'Penalty Kill Box Formation',
          type: 'penalty-kill',
          difficulty: 'beginner',
          estimatedTime: 12,
          description: 'Master the defensive box formation for penalty killing, emphasizing communication and positioning.',
          playerRole: {
            position: 'Center',
            keyResponsibilities: [
              'Pressure the puck carrier',
              'Communicate coverage to teammates',
              'Block passing lanes',
              'Support defensive zone clears'
            ],
            commonMistakes: [
              'Chasing the puck too aggressively',
              'Leaving the box formation',
              'Poor communication with defense'
            ]
          },
          masteryLevel: 'proficient',
          progress: 85,
          lastStudied: new Date(Date.now() - 24 * 60 * 60 * 1000),
          completedModes: ['watch', 'quiz', 'practice'],
          quizScore: 92
        },
        {
          id: 'fo1',
          name: 'Offensive Zone Faceoffs',
          type: 'faceoff',
          difficulty: 'advanced',
          estimatedTime: 20,
          description: 'Advanced faceoff techniques and positioning for offensive zone draws.',
          playerRole: {
            position: 'Center',
            keyResponsibilities: [
              'Win the draw cleanly',
              'Set up planned plays',
              'Read opposing center\'s tendencies',
              'Support teammates after the draw'
            ],
            commonMistakes: [
              'Not studying opponent tendencies',
              'Poor body positioning',
              'Failing to execute planned plays'
            ]
          },
          masteryLevel: 'learning',
          progress: 40,
          lastStudied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          completedModes: ['watch'],
          quizScore: 65,
          coachNotes: 'Need more practice on timing and technique. Review video examples.'
        },
        {
          id: 'es1',
          name: 'Cycling in the Offensive Zone',
          type: 'even-strength',
          difficulty: 'intermediate',
          estimatedTime: 18,
          description: 'Learn effective puck cycling techniques to maintain offensive zone pressure.',
          playerRole: {
            position: 'Center',
            keyResponsibilities: [
              'Support puck carriers in corners',
              'Maintain proper spacing',
              'Create passing options',
              'Read when to break the cycle'
            ],
            commonMistakes: [
              'Getting too close to puck carrier',
              'Not providing passing support',
              'Breaking the cycle too early'
            ]
          },
          masteryLevel: 'not-started',
          progress: 0,
          completedModes: []
        },
        {
          id: 'pp2',
          name: 'Power Play Umbrella Setup',
          type: 'powerplay',
          difficulty: 'advanced',
          estimatedTime: 25,
          description: 'Advanced power play formation with emphasis on one-timer opportunities and quick puck movement.',
          playerRole: {
            position: 'Center',
            keyResponsibilities: [
              'Quarter-back the play from the slot',
              'Set up one-timer opportunities',
              'Read the penalty kill structure',
              'Provide screening and deflections'
            ],
            commonMistakes: [
              'Holding the puck too long',
              'Not recognizing one-timer setups',
              'Poor positioning for deflections'
            ]
          },
          masteryLevel: 'not-started',
          progress: 0,
          completedModes: [],
          isLocked: true,
          unlockRequirement: 'Complete Power Play 1-3-1 Formation with 80%+ quiz score'
        }
      ];

      // Mock achievements
      const mockAchievements: Achievement[] = [
        {
          id: 'first-study',
          title: 'First Steps',
          description: 'Complete your first tactical play',
          icon: <Star className="h-6 w-6" />,
          unlocked: true,
          progress: 1,
          target: 1,
          xpReward: 50,
          unlockedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'quiz-master',
          title: 'Quiz Master',
          description: 'Score 90%+ on 5 quizzes',
          icon: <Brain className="h-6 w-6" />,
          unlocked: true,
          progress: 5,
          target: 5,
          xpReward: 150,
          unlockedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'speed-learner',
          title: 'Speed Learner',
          description: 'Complete 3 plays in one day',
          icon: <Flame className="h-6 w-6" />,
          unlocked: false,
          progress: 2,
          target: 3,
          xpReward: 100
        },
        {
          id: 'position-expert',
          title: 'Center Specialist',
          description: 'Master all center plays',
          icon: <Trophy className="h-6 w-6" />,
          unlocked: false,
          progress: 8,
          target: 15,
          xpReward: 300
        },
        {
          id: 'consistent-study',
          title: 'Dedicated Learner',
          description: 'Study for 7 consecutive days',
          icon: <Clock className="h-6 w-6" />,
          unlocked: false,
          progress: 3,
          target: 7,
          xpReward: 200
        },
        {
          id: 'team-helper',
          title: 'Team Player',
          description: 'Help 3 teammates in discussions',
          icon: <Users className="h-6 w-6" />,
          unlocked: false,
          progress: 1,
          target: 3,
          xpReward: 175
        }
      ];

      // Mock weekly goals
      const mockWeeklyGoals: WeeklyGoal[] = [
        {
          id: 'study-goal',
          title: 'Complete 3 plays',
          description: 'Finish studying 3 tactical plays',
          current: 2,
          target: 3,
          unit: 'plays',
          completed: false,
          xpReward: 100,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'quiz-goal',
          title: 'Score 85%+ on quizzes',
          description: 'Achieve high quiz scores',
          current: 2,
          target: 3,
          unit: 'quizzes',
          completed: false,
          xpReward: 75,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'time-goal',
          title: 'Study 2 hours',
          description: 'Spend time learning tactics',
          current: 90,
          target: 120,
          unit: 'minutes',
          completed: false,
          xpReward: 50,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      ];

      // Mock leaderboard
      const mockLeaderboard: Leaderboard = {
        playerRank: 3,
        rankings: [
          {
            id: 'player1',
            name: 'Connor McDavid',
            position: 'Center',
            xp: 3250,
            level: 4,
            playsCompleted: 28,
            averageScore: 94,
            isCurrentPlayer: false
          },
          {
            id: 'player2',
            name: 'Nathan MacKinnon',
            position: 'Center',
            xp: 2890,
            level: 3,
            playsCompleted: 25,
            averageScore: 89,
            isCurrentPlayer: false
          },
          {
            id: 'current',
            name: 'You',
            position: 'Center',
            xp: 2450,
            level: 3,
            playsCompleted: 18,
            averageScore: 82,
            isCurrentPlayer: true
          },
          {
            id: 'player4',
            name: 'Auston Matthews',
            position: 'Center',
            xp: 2100,
            level: 2,
            playsCompleted: 20,
            averageScore: 85,
            isCurrentPlayer: false
          },
          {
            id: 'player5',
            name: 'Sidney Crosby',
            position: 'Center',
            xp: 1950,
            level: 2,
            playsCompleted: 16,
            averageScore: 88,
            isCurrentPlayer: false
          }
        ]
      };

      setAssignedPlays(mockPlays);
      setAchievements(mockAchievements);
      setWeeklyGoals(mockWeeklyGoals);
      setLeaderboard(mockLeaderboard);
      setCurrentXP(2450);
      setNextLevelXP(3000);
      setDailyStreak(3);
      setLearningProgress(0.67);
      setIsLoading(false);
    };

    initializeData();
  }, []);

  // Mastery levels configuration
  const masteryLevels: MasteryLevel[] = [
    {
      level: 'beginner',
      name: 'Rookie',
      description: 'Just starting your tactical journey',
      xpRequired: 0,
      currentXP: 0,
      color: 'gray',
      icon: <Target className="h-6 w-6" />,
      benefits: [
        'Access to basic plays',
        'Simple quiz questions',
        'Coach guidance available'
      ],
      requirements: [
        'Complete first tactical play',
        'Pass first quiz'
      ],
      unlocksAt: 0
    },
    {
      level: 'learning',
      name: 'Student',
      description: 'Developing tactical understanding',
      xpRequired: 500,
      currentXP: currentXP,
      color: 'blue',
      icon: <Brain className="h-6 w-6" />,
      benefits: [
        'Intermediate play access',
        'Detailed feedback',
        'Progress tracking',
        'Achievement system'
      ],
      requirements: [
        'Complete 5 tactical plays',
        '75%+ average quiz score'
      ],
      unlocksAt: 20
    },
    {
      level: 'proficient',
      name: 'Tactician',
      description: 'Strong grasp of game situations',
      xpRequired: 1500,
      currentXP: currentXP,
      color: 'green',
      icon: <Trophy className="h-6 w-6" />,
      benefits: [
        'Advanced play access',
        'Leadership opportunities',
        'Mentor other players',
        'Custom study plans'
      ],
      requirements: [
        'Complete 15 tactical plays',
        '85%+ average quiz score',
        'Help 3 teammates'
      ],
      unlocksAt: 60
    },
    {
      level: 'master',
      name: 'Strategist',
      description: 'Master of tactical hockey',
      xpRequired: 3000,
      currentXP: currentXP,
      color: 'purple',
      icon: <Award className="h-6 w-6" />,
      benefits: [
        'All content unlocked',
        'Create custom plays',
        'Coach consultation',
        'Team captain privileges'
      ],
      requirements: [
        'Master all assigned plays',
        '90%+ average quiz score',
        'Leadership achievements'
      ],
      unlocksAt: 90
    }
  ];

  // Update play progress
  const updatePlayProgress = (playId: string, progress: Partial<TacticalPlay>) => {
    setAssignedPlays(plays =>
      plays.map(play =>
        play.id === playId ? { ...play, ...progress } : play
      )
    );
  };

  // Complete a quiz and update XP
  const completeQuiz = (playId: string, score: number) => {
    const xpGained = Math.round(score * 2.5); // Max 250 XP for perfect score
    setCurrentXP(prev => prev + xpGained);
    
    updatePlayProgress(playId, {
      quizScore: score,
      completedModes: [...(assignedPlays.find(p => p.id === playId)?.completedModes || []), 'quiz'],
      lastStudied: new Date()
    });

    // Check for achievements
    checkAchievements();
  };

  // Check and unlock achievements
  const checkAchievements = () => {
    setAchievements(prevAchievements =>
      prevAchievements.map(achievement => {
        if (achievement.unlocked) return achievement;

        // Check specific achievement conditions
        let shouldUnlock = false;
        
        switch (achievement.id) {
          case 'speed-learner':
            // Check if 3 plays completed today (mock check)
            shouldUnlock = achievement.progress >= achievement.target;
            break;
          case 'position-expert':
            // Check mastery of position plays
            const masteredPlays = assignedPlays.filter(p => p.masteryLevel === 'mastered').length;
            achievement.progress = masteredPlays;
            shouldUnlock = masteredPlays >= achievement.target;
            break;
          // Add other achievement checks
        }

        if (shouldUnlock) {
          setCurrentXP(prev => prev + achievement.xpReward);
          return {
            ...achievement,
            unlocked: true,
            unlockedDate: new Date()
          };
        }

        return achievement;
      })
    );
  };

  // Mark a play as studied
  const studyPlay = (playId: string, mode: 'watch' | 'quiz' | 'practice' | 'review') => {
    const play = assignedPlays.find(p => p.id === playId);
    if (!play) return;

    const newCompletedModes = [...new Set([...play.completedModes, mode])];
    const progressIncrease = 25; // 25% per mode
    const newProgress = Math.min(100, (newCompletedModes.length / 4) * 100);

    updatePlayProgress(playId, {
      completedModes: newCompletedModes,
      progress: newProgress,
      lastStudied: new Date(),
      masteryLevel: newProgress >= 90 ? 'mastered' : newProgress >= 70 ? 'proficient' : 'learning'
    });

    // Award XP for studying
    setCurrentXP(prev => prev + 25);
  };

  return {
    isLoading,
    assignedPlays,
    achievements,
    weeklyGoals,
    leaderboard,
    currentXP,
    nextLevelXP,
    dailyStreak,
    learningProgress,
    masteryLevels,
    updatePlayProgress,
    completeQuiz,
    studyPlay,
    checkAchievements
  };
}