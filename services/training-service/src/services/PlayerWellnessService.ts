import { Repository } from 'typeorm';
import { WorkoutSession } from '../entities/WorkoutSession';
import { WorkoutAssignment } from '../entities/WorkoutAssignment';
import {
  PlayerStatusDto,
  TeamPlayerStatusDto,
  PlayerWellnessDetailDto,
  PlayerTrainingMetricsDto,
  CreateWellnessEntryDto,
  UpdateTrainingMetricsDto
} from '../dto/player-wellness.dto';

export class PlayerWellnessService {
  constructor(
    private workoutSessionRepository: Repository<WorkoutSession>,
    private workoutAssignmentRepository: Repository<WorkoutAssignment>
  ) {}

  /**
   * Get player status for a team
   */
  async getTeamPlayerStatus(teamId: string): Promise<TeamPlayerStatusDto> {
    // For now, return mock data with realistic values
    // In production, this would query the database and calculate real metrics
    
    const mockPlayers: PlayerStatusDto[] = [
      {
        playerId: 'player-1',
        playerName: 'Sidney Crosby',
        avatarUrl: '/avatars/crosby.jpg',
        readinessScore: 85,
        status: 'limited',
        lastSessionDate: '2025-01-20T10:00:00Z',
        nextSessionDate: '2025-01-23T14:00:00Z',
        trainingLoad: {
          currentWeek: 450,
          previousWeek: 520,
          change: -13.5,
          status: 'deload'
        },
        wellness: {
          sleep: 7,
          stress: 4,
          energy: 8,
          soreness: 6,
          mood: 8,
          lastUpdated: '2025-01-22T08:00:00Z'
        },
        medical: {
          hasActiveInjury: true,
          injuryType: 'Lower back strain',
          returnDate: '2025-01-28T00:00:00Z',
          restrictions: ['No heavy lifting', 'Modified skating drills']
        }
      },
      {
        playerId: 'player-2',
        playerName: 'Nathan MacKinnon',
        avatarUrl: '/avatars/mackinnon.jpg',
        readinessScore: 78,
        status: 'limited',
        lastSessionDate: '2025-01-21T09:30:00Z',
        nextSessionDate: '2025-01-23T14:00:00Z',
        trainingLoad: {
          currentWeek: 380,
          previousWeek: 420,
          change: -9.5,
          status: 'normal'
        },
        wellness: {
          sleep: 6,
          stress: 6,
          energy: 7,
          soreness: 7,
          mood: 7,
          lastUpdated: '2025-01-22T07:45:00Z'
        },
        medical: {
          hasActiveInjury: true,
          injuryType: 'Shoulder inflammation',
          returnDate: '2025-01-25T00:00:00Z',
          restrictions: ['No overhead movements', 'Light upper body only']
        }
      },
      {
        playerId: 'player-3',
        playerName: 'Connor McDavid',
        avatarUrl: '/avatars/mcdavid.jpg',
        readinessScore: 95,
        status: 'ready',
        lastSessionDate: '2025-01-21T15:00:00Z',
        nextSessionDate: '2025-01-23T14:00:00Z',
        trainingLoad: {
          currentWeek: 580,
          previousWeek: 540,
          change: 7.4,
          status: 'normal'
        },
        wellness: {
          sleep: 9,
          stress: 2,
          energy: 9,
          soreness: 3,
          mood: 9,
          lastUpdated: '2025-01-22T08:15:00Z'
        }
      },
      {
        playerId: 'player-4',
        playerName: 'Alex Ovechkin',
        avatarUrl: '/avatars/ovechkin.jpg',
        readinessScore: 88,
        status: 'ready',
        lastSessionDate: '2025-01-21T11:00:00Z',
        nextSessionDate: '2025-01-23T14:00:00Z',
        trainingLoad: {
          currentWeek: 520,
          previousWeek: 480,
          change: 8.3,
          status: 'normal'
        },
        wellness: {
          sleep: 8,
          stress: 3,
          energy: 9,
          soreness: 4,
          mood: 8,
          lastUpdated: '2025-01-22T08:30:00Z'
        }
      },
      {
        playerId: 'player-5',
        playerName: 'Leon Draisaitl',
        avatarUrl: '/avatars/draisaitl.jpg',
        readinessScore: 65,
        status: 'resting',
        lastSessionDate: '2025-01-19T16:00:00Z',
        nextSessionDate: '2025-01-24T10:00:00Z',
        trainingLoad: {
          currentWeek: 280,
          previousWeek: 600,
          change: -53.3,
          status: 'deload'
        },
        wellness: {
          sleep: 5,
          stress: 8,
          energy: 5,
          soreness: 8,
          mood: 6,
          lastUpdated: '2025-01-22T07:30:00Z'
        }
      },
      {
        playerId: 'player-6',
        playerName: 'David Pastrnak',
        avatarUrl: '/avatars/pastrnak.jpg',
        readinessScore: 92,
        status: 'ready',
        lastSessionDate: '2025-01-21T13:30:00Z',
        nextSessionDate: '2025-01-23T14:00:00Z',
        trainingLoad: {
          currentWeek: 560,
          previousWeek: 510,
          change: 9.8,
          status: 'normal'
        },
        wellness: {
          sleep: 8,
          stress: 3,
          energy: 9,
          soreness: 2,
          mood: 9,
          lastUpdated: '2025-01-22T08:45:00Z'
        }
      }
    ];

    // Calculate team averages
    const teamAverages = {
      readinessScore: Math.round(mockPlayers.reduce((sum, p) => sum + p.readinessScore, 0) / mockPlayers.length),
      trainingLoad: Math.round(mockPlayers.reduce((sum, p) => sum + p.trainingLoad.currentWeek, 0) / mockPlayers.length),
      wellnessScores: {
        sleep: Number((mockPlayers.reduce((sum, p) => sum + p.wellness.sleep, 0) / mockPlayers.length).toFixed(1)),
        stress: Number((mockPlayers.reduce((sum, p) => sum + p.wellness.stress, 0) / mockPlayers.length).toFixed(1)),
        energy: Number((mockPlayers.reduce((sum, p) => sum + p.wellness.energy, 0) / mockPlayers.length).toFixed(1)),
        soreness: Number((mockPlayers.reduce((sum, p) => sum + p.wellness.soreness, 0) / mockPlayers.length).toFixed(1)),
        mood: Number((mockPlayers.reduce((sum, p) => sum + p.wellness.mood, 0) / mockPlayers.length).toFixed(1))
      }
    };

    // Identify alerts
    const alerts = {
      highRisk: mockPlayers.filter(p => p.readinessScore < 70).map(p => p.playerId),
      injured: mockPlayers.filter(p => p.medical?.hasActiveInjury).map(p => p.playerId),
      overloaded: mockPlayers.filter(p => p.trainingLoad.status === 'overload').map(p => p.playerId),
      wellnessDecline: mockPlayers.filter(p => 
        p.wellness.sleep < 6 || p.wellness.stress > 7 || p.wellness.energy < 6
      ).map(p => p.playerId)
    };

    return {
      teamId,
      teamName: 'Team Alpha',
      players: mockPlayers,
      teamAverages,
      alerts
    };
  }

  /**
   * Get detailed wellness metrics for a specific player
   */
  async getPlayerWellnessDetail(playerId: string): Promise<PlayerWellnessDetailDto> {
    // Mock wellness history data
    const generateWellnessHistory = () => {
      const history = [];
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const sleep = 6 + Math.random() * 3;
        const stress = 2 + Math.random() * 6;
        const energy = 6 + Math.random() * 3;
        const soreness = 2 + Math.random() * 6;
        const mood = 6 + Math.random() * 3;
        
        history.push({
          date: date.toISOString().split('T')[0],
          sleep: Number(sleep.toFixed(1)),
          stress: Number(stress.toFixed(1)),
          energy: Number(energy.toFixed(1)),
          soreness: Number(soreness.toFixed(1)),
          mood: Number(mood.toFixed(1)),
          average: Number(((sleep + (10 - stress) + energy + (10 - soreness) + mood) / 5).toFixed(1))
        });
      }
      return history;
    };

    const mockPlayerData: { [key: string]: PlayerWellnessDetailDto } = {
      'player-1': {
        playerId: 'player-1',
        playerName: 'Sidney Crosby',
        avatarUrl: '/avatars/crosby.jpg',
        currentWellness: {
          sleep: 7,
          stress: 4,
          energy: 8,
          soreness: 6,
          mood: 8,
          notes: 'Back feeling better today, good energy levels',
          submittedAt: '2025-01-22T08:00:00Z'
        },
        wellnessHistory: generateWellnessHistory(),
        trends: {
          sleep: 'stable',
          stress: 'improving',
          energy: 'improving',
          soreness: 'declining',
          mood: 'stable',
          overall: 'stable'
        },
        recommendations: [
          'Continue current recovery protocol',
          'Monitor back strain symptoms',
          'Consider additional sleep optimization',
          'Maintain current stress management techniques'
        ],
        medicalNotes: 'Lower back strain - cleared for light training. Avoid heavy lifting.'
      },
      'player-2': {
        playerId: 'player-2',
        playerName: 'Nathan MacKinnon',
        avatarUrl: '/avatars/mackinnon.jpg',
        currentWellness: {
          sleep: 6,
          stress: 6,
          energy: 7,
          soreness: 7,
          mood: 7,
          notes: 'Shoulder still tender but manageable',
          submittedAt: '2025-01-22T07:45:00Z'
        },
        wellnessHistory: generateWellnessHistory(),
        trends: {
          sleep: 'declining',
          stress: 'stable',
          energy: 'stable',
          soreness: 'stable',
          mood: 'stable',
          overall: 'stable'
        },
        recommendations: [
          'Focus on improving sleep quality',
          'Continue shoulder rehabilitation',
          'Consider stress reduction techniques',
          'Monitor training load carefully'
        ],
        medicalNotes: 'Shoulder inflammation - restricted overhead movements until 01/25.'
      },
      'player-3': {
        playerId: 'player-3',
        playerName: 'Connor McDavid',
        avatarUrl: '/avatars/mcdavid.jpg',
        currentWellness: {
          sleep: 9,
          stress: 2,
          energy: 9,
          soreness: 3,
          mood: 9,
          notes: 'Feeling great, ready for full training',
          submittedAt: '2025-01-22T08:15:00Z'
        },
        wellnessHistory: generateWellnessHistory(),
        trends: {
          sleep: 'improving',
          stress: 'stable',
          energy: 'stable',
          soreness: 'improving',
          mood: 'improving',
          overall: 'improving'
        },
        recommendations: [
          'Maintain current training intensity',
          'Continue excellent recovery habits',
          'Monitor for overreaching as season progresses',
          'Use as team wellness example'
        ]
      }
    };

    return mockPlayerData[playerId] || {
      playerId,
      playerName: 'Unknown Player',
      currentWellness: {
        sleep: 7,
        stress: 5,
        energy: 7,
        soreness: 5,
        mood: 7,
        submittedAt: new Date().toISOString()
      },
      wellnessHistory: generateWellnessHistory(),
      trends: {
        sleep: 'stable',
        stress: 'stable',
        energy: 'stable',
        soreness: 'stable',
        mood: 'stable',
        overall: 'stable'
      },
      recommendations: ['No specific recommendations available']
    };
  }

  /**
   * Get training metrics for a specific player
   */
  async getPlayerTrainingMetrics(playerId: string): Promise<PlayerTrainingMetricsDto> {
    // Generate mock historical data
    const generateHistory = (baseValue: number, variance: number, days: number = 30) => {
      const history = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const value = baseValue + (Math.random() - 0.5) * variance;
        history.push({
          date: date.toISOString().split('T')[0],
          value: Number(value.toFixed(1))
        });
      }
      return history;
    };

    const generatePowerHistory = () => {
      const history = [];
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const peak = 1200 + (Math.random() - 0.5) * 200;
        const average = 850 + (Math.random() - 0.5) * 150;
        history.push({
          date: date.toISOString().split('T')[0],
          peak: Math.round(peak),
          average: Math.round(average)
        });
      }
      return history;
    };

    const mockMetricsData: { [key: string]: PlayerTrainingMetricsDto } = {
      'player-1': {
        playerId: 'player-1',
        playerName: 'Sidney Crosby',
        avatarUrl: '/avatars/crosby.jpg',
        hrVariability: {
          current: 35,
          baseline: 42,
          trend: 'declining',
          readiness: 'caution',
          history: generateHistory(38, 10)
        },
        powerOutput: {
          peak: 1180,
          average: 820,
          threshold: 780,
          trend: 'stable',
          history: generatePowerHistory()
        },
        recovery: {
          score: 72,
          sleepHours: 7.2,
          restingHR: 52,
          trend: 'stable',
          recommendations: [
            'Increase sleep duration to 8+ hours',
            'Continue current recovery protocols',
            'Monitor back strain impact on recovery'
          ],
          history: generateHistory(75, 15)
        },
        trainingLoad: {
          acute: 450,
          chronic: 520,
          ratio: 0.87,
          status: 'deload',
          recommendations: [
            'Continue reduced training load',
            'Focus on recovery and regeneration',
            'Gradually increase load as back improves'
          ],
          history: generateHistory(480, 100)
        },
        performance: {
          vo2Max: 58.2,
          lactateThreshold: 4.1,
          maxHR: 185,
          restingHR: 52,
          bodyComposition: {
            weight: 89.5,
            bodyFat: 8.2,
            muscleMass: 42.1
          },
          testResults: [
            { test: 'VO2 Max', value: 58.2, date: '2025-01-15', percentile: 85 },
            { test: '40yd Sprint', value: 4.8, date: '2025-01-10', percentile: 78 },
            { test: 'Bench Press', value: 125, date: '2025-01-08', percentile: 82 }
          ]
        }
      },
      'player-2': {
        playerId: 'player-2',
        playerName: 'Nathan MacKinnon',
        avatarUrl: '/avatars/mackinnon.jpg',
        hrVariability: {
          current: 28,
          baseline: 38,
          trend: 'declining',
          readiness: 'caution',
          history: generateHistory(32, 8)
        },
        powerOutput: {
          peak: 1350,
          average: 920,
          threshold: 880,
          trend: 'stable',
          history: generatePowerHistory()
        },
        recovery: {
          score: 68,
          sleepHours: 6.8,
          restingHR: 48,
          trend: 'declining',
          recommendations: [
            'Prioritize sleep hygiene improvements',
            'Reduce training intensity temporarily',
            'Focus on shoulder rehabilitation'
          ],
          history: generateHistory(72, 12)
        },
        trainingLoad: {
          acute: 380,
          chronic: 420,
          ratio: 0.90,
          status: 'normal',
          recommendations: [
            'Maintain current training load',
            'Monitor shoulder inflammation',
            'Adjust upper body exercises as needed'
          ],
          history: generateHistory(400, 80)
        },
        performance: {
          vo2Max: 62.8,
          lactateThreshold: 4.3,
          maxHR: 192,
          restingHR: 48,
          bodyComposition: {
            weight: 91.2,
            bodyFat: 7.8,
            muscleMass: 44.3
          },
          testResults: [
            { test: 'VO2 Max', value: 62.8, date: '2025-01-15', percentile: 92 },
            { test: '40yd Sprint', value: 4.6, date: '2025-01-10', percentile: 88 },
            { test: 'Vertical Jump', value: 32, date: '2025-01-08', percentile: 85 }
          ]
        }
      },
      'player-3': {
        playerId: 'player-3',
        playerName: 'Connor McDavid',
        avatarUrl: '/avatars/mcdavid.jpg',
        hrVariability: {
          current: 45,
          baseline: 44,
          trend: 'improving',
          readiness: 'ready',
          history: generateHistory(44, 6)
        },
        powerOutput: {
          peak: 1420,
          average: 980,
          threshold: 940,
          trend: 'improving',
          history: generatePowerHistory()
        },
        recovery: {
          score: 92,
          sleepHours: 8.5,
          restingHR: 44,
          trend: 'improving',
          recommendations: [
            'Continue excellent recovery habits',
            'Maintain current sleep schedule',
            'Consider periodization for peak performance'
          ],
          history: generateHistory(90, 8)
        },
        trainingLoad: {
          acute: 580,
          chronic: 540,
          ratio: 1.07,
          status: 'optimal',
          recommendations: [
            'Continue current training intensity',
            'Monitor for overreaching signs',
            'Optimal acute:chronic ratio maintained'
          ],
          history: generateHistory(560, 60)
        },
        performance: {
          vo2Max: 68.5,
          lactateThreshold: 4.8,
          maxHR: 195,
          restingHR: 44,
          bodyComposition: {
            weight: 86.8,
            bodyFat: 6.9,
            muscleMass: 41.2
          },
          testResults: [
            { test: 'VO2 Max', value: 68.5, date: '2025-01-15', percentile: 98 },
            { test: '40yd Sprint', value: 4.3, date: '2025-01-10', percentile: 96 },
            { test: 'Agility Test', value: 8.2, date: '2025-01-08', percentile: 94 }
          ]
        }
      }
    };

    return mockMetricsData[playerId] || {
      playerId,
      playerName: 'Unknown Player',
      hrVariability: {
        current: 35,
        baseline: 38,
        trend: 'stable',
        readiness: 'ready',
        history: generateHistory(36, 8)
      },
      powerOutput: {
        peak: 1200,
        average: 850,
        threshold: 800,
        trend: 'stable',
        history: generatePowerHistory()
      },
      recovery: {
        score: 80,
        sleepHours: 7.5,
        restingHR: 50,
        trend: 'stable',
        recommendations: ['No specific recommendations available'],
        history: generateHistory(80, 10)
      },
      trainingLoad: {
        acute: 500,
        chronic: 480,
        ratio: 1.04,
        status: 'normal',
        recommendations: ['Continue current training program'],
        history: generateHistory(490, 80)
      },
      performance: {
        vo2Max: 55.0,
        lactateThreshold: 4.0,
        maxHR: 188,
        restingHR: 50,
        bodyComposition: {
          weight: 88.0,
          bodyFat: 8.5,
          muscleMass: 40.0
        },
        testResults: [
          { test: 'VO2 Max', value: 55.0, date: '2025-01-15', percentile: 75 }
        ]
      }
    };
  }

  /**
   * Create a new wellness entry for a player
   */
  async createWellnessEntry(data: CreateWellnessEntryDto): Promise<{ success: boolean; message: string }> {
    // In production, this would save to database
    // For now, just validate and return success
    
    const { sleep, stress, energy, soreness, mood } = data;
    
    // Validate scores are within range
    const scores = [sleep, stress, energy, soreness, mood];
    if (scores.some(score => score < 1 || score > 10)) {
      throw new Error('All wellness scores must be between 1 and 10');
    }

    return {
      success: true,
      message: 'Wellness entry created successfully'
    };
  }

  /**
   * Update training metrics for a player
   */
  async updateTrainingMetrics(data: UpdateTrainingMetricsDto): Promise<{ success: boolean; message: string }> {
    // In production, this would update database records
    // For now, just validate and return success
    
    return {
      success: true,
      message: 'Training metrics updated successfully'
    };
  }
}