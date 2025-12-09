'use client';

import type { BulkSessionConfig, SessionConfiguration } from '../hooks/useBulkSession';
import type { WorkoutEquipmentType } from '../types/conditioning.types';

export type MixedTypeSequence = 'strength-conditioning-flexibility' | 'agility-strength-conditioning' | 'conditioning-hybrid-agility' | 'strength-hybrid-conditioning' | 'recovery-focused' | 'performance-cycle' | 'competition-prep';

export interface MixedTypeTemplate {
  id: string;
  name: string;
  description: string;
  sequence: MixedTypeSequence;
  workoutTypes: ('strength' | 'conditioning' | 'hybrid' | 'agility')[];
  defaultDurations: number[]; // minutes per session
  transitionTimes: number[]; // minutes between sessions
  equipmentRequirements: Record<number, WorkoutEquipmentType[]>; // session index -> equipment
  facilityAreas: Record<number, string[]>; // session index -> preferred areas
  playerGroupSizes: Record<number, number>; // session index -> optimal group size
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  seasonPhase: 'off-season' | 'pre-season' | 'in-season' | 'post-season' | 'any';
  estimatedTotalTime: number; // minutes including transitions
}

export class MixedTypeTemplates {
  private static readonly TEMPLATES: MixedTypeTemplate[] = [
    {
      id: 'strength-cardio-recovery',
      name: 'Strength → Conditioning → Flexibility',
      description: 'Classic progression from strength building to cardiovascular conditioning, ending with flexibility work',
      sequence: 'strength-conditioning-flexibility',
      workoutTypes: ['strength', 'conditioning', 'agility'],
      defaultDurations: [60, 45, 30],
      transitionTimes: [10, 8],
      equipmentRequirements: {
        0: [], // strength uses free weights/machines (facility equipment)
        1: ['bike_erg', 'rowing', 'treadmill'],
        2: [] // flexibility/agility uses mats and body weight
      },
      facilityAreas: {
        0: ['free-weights', 'machines', 'power-racks'],
        1: ['cardio-area', 'open-space'],
        2: ['flexibility-area', 'recovery-space', 'mat-area']
      },
      playerGroupSizes: {
        0: 8, // strength works well with medium groups
        1: 12, // conditioning can handle larger groups
        2: 15 // flexibility can accommodate more players
      },
      tags: ['balanced', 'traditional', 'recovery-focused'],
      difficulty: 'intermediate',
      seasonPhase: 'any',
      estimatedTotalTime: 153 // 60 + 45 + 30 + 10 + 8
    },
    {
      id: 'agility-power-endurance',
      name: 'Agility → Strength → Conditioning',
      description: 'Start with movement preparation, build power, finish with endurance work',
      sequence: 'agility-strength-conditioning',
      workoutTypes: ['agility', 'strength', 'conditioning'],
      defaultDurations: [30, 50, 40],
      transitionTimes: [5, 10],
      equipmentRequirements: {
        0: [], // agility uses cones, ladders (facility equipment)
        1: [], // strength uses free weights/machines
        2: ['airbike', 'skierg', 'rowing']
      },
      facilityAreas: {
        0: ['agility-area', 'court-space', 'turf-area'],
        1: ['free-weights', 'power-racks'],
        2: ['cardio-area', 'functional-area']
      },
      playerGroupSizes: {
        0: 10, // agility works well with moderate groups
        1: 6,  // strength benefits from smaller groups for safety
        2: 12  // conditioning can handle larger groups
      },
      tags: ['athletic-performance', 'hockey-specific', 'power-endurance'],
      difficulty: 'advanced',
      seasonPhase: 'pre-season',
      estimatedTotalTime: 135 // 30 + 50 + 40 + 5 + 10
    },
    {
      id: 'cardio-circuit-mobility',
      name: 'Conditioning → Hybrid → Agility',
      description: 'Cardio base building followed by mixed training and mobility work',
      sequence: 'conditioning-hybrid-agility',
      workoutTypes: ['conditioning', 'hybrid', 'agility'],
      defaultDurations: [40, 35, 25],
      transitionTimes: [8, 6],
      equipmentRequirements: {
        0: ['bike_erg', 'wattbike', 'treadmill'],
        1: ['rope_jump', 'airbike'], // hybrid uses mixed equipment
        2: [] // agility uses body weight and facility equipment
      },
      facilityAreas: {
        0: ['cardio-area'],
        1: ['functional-area', 'crossfit-area', 'open-space'],
        2: ['agility-area', 'flexibility-area']
      },
      playerGroupSizes: {
        0: 15, // conditioning handles large groups well
        1: 10, // hybrid works with medium groups
        2: 12  // agility with moderate groups
      },
      tags: ['endurance-focused', 'circuit-training', 'metabolic'],
      difficulty: 'intermediate',
      seasonPhase: 'off-season',
      estimatedTotalTime: 114 // 40 + 35 + 25 + 8 + 6
    },
    {
      id: 'power-mixed-conditioning',
      name: 'Strength → Hybrid → Conditioning',
      description: 'Power development followed by mixed training and metabolic conditioning',
      sequence: 'strength-hybrid-conditioning',
      workoutTypes: ['strength', 'hybrid', 'conditioning'],
      defaultDurations: [50, 40, 35],
      transitionTimes: [6, 8],
      equipmentRequirements: {
        0: [], // strength uses facility equipment
        1: ['rope_jump', 'airbike', 'rowing'], // hybrid mixes strength and cardio
        2: ['bike_erg', 'wattbike', 'skierg']
      },
      facilityAreas: {
        0: ['free-weights', 'power-racks', 'platforms'],
        1: ['functional-area', 'crossfit-area'],
        2: ['cardio-area']
      },
      playerGroupSizes: {
        0: 6,  // strength works best with smaller groups
        1: 8,  // hybrid with medium groups
        2: 12  // conditioning with larger groups
      },
      tags: ['power-focused', 'strength-endurance', 'crossfit-style'],
      difficulty: 'advanced',
      seasonPhase: 'pre-season',
      estimatedTotalTime: 139 // 50 + 40 + 35 + 6 + 8
    },
    {
      id: 'recovery-maintenance',
      name: 'Recovery & Maintenance Cycle',
      description: 'Low-intensity mixed training focused on recovery and movement quality',
      sequence: 'recovery-focused',
      workoutTypes: ['agility', 'conditioning', 'agility'],
      defaultDurations: [25, 30, 20],
      transitionTimes: [5, 5],
      equipmentRequirements: {
        0: [], // movement prep
        1: ['bike_erg', 'rowing'], // low-intensity cardio
        2: [] // stretching and mobility
      },
      facilityAreas: {
        0: ['flexibility-area', 'mat-area'],
        1: ['cardio-area'],
        2: ['recovery-space', 'flexibility-area']
      },
      playerGroupSizes: {
        0: 15,
        1: 20, // easy cardio can handle large groups
        2: 18
      },
      tags: ['recovery', 'low-intensity', 'active-rest', 'maintenance'],
      difficulty: 'beginner',
      seasonPhase: 'in-season',
      estimatedTotalTime: 85 // 25 + 30 + 20 + 5 + 5
    },
    {
      id: 'competition-prep',
      name: 'Competition Preparation Sequence',
      description: 'High-intensity mixed training preparing for competition demands',
      sequence: 'competition-prep',
      workoutTypes: ['agility', 'hybrid', 'conditioning'],
      defaultDurations: [25, 45, 30],
      transitionTimes: [5, 7],
      equipmentRequirements: {
        0: [], // sport-specific agility
        1: ['airbike', 'rope_jump', 'rowing'], // high-intensity mixed
        2: ['wattbike', 'airbike'] // competition-intensity cardio
      },
      facilityAreas: {
        0: ['sport-specific-area', 'agility-area'],
        1: ['functional-area', 'crossfit-area'],
        2: ['cardio-area', 'performance-lab']
      },
      playerGroupSizes: {
        0: 8,  // sport-specific work with smaller groups
        1: 6,  // high-intensity hybrid with small groups
        2: 10  // competition cardio with medium groups
      },
      tags: ['competition', 'high-intensity', 'sport-specific', 'peak-performance'],
      difficulty: 'advanced',
      seasonPhase: 'pre-season',
      estimatedTotalTime: 112 // 25 + 45 + 30 + 5 + 7
    }
  ];

  /**
   * Get all available mixed-type templates
   */
  static getAllTemplates(): MixedTypeTemplate[] {
    return [...this.TEMPLATES];
  }

  /**
   * Get templates filtered by criteria
   */
  static getTemplatesByFilter(criteria: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    seasonPhase?: 'off-season' | 'pre-season' | 'in-season' | 'post-season' | 'any';
    maxDuration?: number;
    tags?: string[];
  }): MixedTypeTemplate[] {
    return this.TEMPLATES.filter(template => {
      if (criteria.difficulty && template.difficulty !== criteria.difficulty) {
        return false;
      }
      
      if (criteria.seasonPhase && criteria.seasonPhase !== 'any' && 
          template.seasonPhase !== criteria.seasonPhase && template.seasonPhase !== 'any') {
        return false;
      }
      
      if (criteria.maxDuration && template.estimatedTotalTime > criteria.maxDuration) {
        return false;
      }
      
      if (criteria.tags && criteria.tags.length > 0) {
        const hasMatchingTag = criteria.tags.some(tag => template.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): MixedTypeTemplate | undefined {
    return this.TEMPLATES.find(template => template.id === id);
  }

  /**
   * Apply template to bulk session configuration
   */
  static applyTemplate<TWorkout = any>(
    template: MixedTypeTemplate,
    baseConfig: Partial<BulkSessionConfig<TWorkout>> = {}
  ): Partial<BulkSessionConfig<TWorkout>> {
    const sessions: SessionConfiguration<TWorkout>[] = template.workoutTypes.map((workoutType, index) => ({
      id: `${template.id}-session-${index + 1}-${Date.now()}`,
      name: `${template.name} - ${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Phase`,
      workoutType,
      equipment: template.equipmentRequirements[index] || [],
      playerIds: [],
      teamIds: [],
      startTime: index === 0 ? baseConfig.sessionTime || '10:00' : undefined, // First session uses base time, others calculated
      notes: `Part ${index + 1} of ${template.name} sequence`,
      workoutData: undefined
    }));

    // Calculate staggered start times with template transition times
    let currentTime = baseConfig.sessionTime || '10:00';
    sessions.forEach((session, index) => {
      if (index > 0) {
        // Add previous session duration and transition time
        const previousDuration = template.defaultDurations[index - 1];
        const transitionTime = template.transitionTimes[index - 1] || 10;
        currentTime = this.addMinutes(currentTime, previousDuration + transitionTime);
      }
      session.startTime = currentTime;
    });

    return {
      ...baseConfig,
      workoutType: 'mixed',
      numberOfSessions: template.workoutTypes.length,
      sessions,
      duration: template.defaultDurations[0], // Use first session duration as default
      staggerStartTimes: true,
      staggerInterval: Math.max(...template.transitionTimes), // Use max transition time as default interval
      allowEquipmentConflicts: false // Templates are designed to avoid conflicts
    };
  }

  /**
   * Get smart default recommendations based on context
   */
  static getRecommendedTemplates(context: {
    availableTime?: number; // minutes
    playerCount?: number;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    seasonPhase?: 'off-season' | 'pre-season' | 'in-season' | 'post-season';
    trainingFocus?: 'strength' | 'conditioning' | 'agility' | 'recovery' | 'competition';
  }): MixedTypeTemplate[] {
    // Start with all templates
    let candidates = [...this.TEMPLATES];

    // Filter by available time (with 15-minute buffer)
    if (context.availableTime) {
      candidates = candidates.filter(t => t.estimatedTotalTime <= context.availableTime + 15);
    }

    // Filter by experience level
    if (context.experienceLevel) {
      candidates = candidates.filter(t => {
        if (context.experienceLevel === 'beginner') {
          return t.difficulty === 'beginner' || t.difficulty === 'intermediate';
        }
        if (context.experienceLevel === 'intermediate') {
          return t.difficulty === 'intermediate' || t.difficulty === 'advanced';
        }
        return true; // advanced can do anything
      });
    }

    // Filter by season phase
    if (context.seasonPhase) {
      candidates = candidates.filter(t => 
        t.seasonPhase === context.seasonPhase || t.seasonPhase === 'any'
      );
    }

    // Filter by training focus
    if (context.trainingFocus) {
      candidates = candidates.filter(t => {
        switch (context.trainingFocus) {
          case 'recovery':
            return t.tags.includes('recovery') || t.tags.includes('low-intensity');
          case 'competition':
            return t.tags.includes('competition') || t.tags.includes('high-intensity');
          case 'strength':
            return t.workoutTypes.includes('strength') || t.tags.includes('power-focused');
          case 'conditioning':
            return t.workoutTypes.includes('conditioning') || t.tags.includes('endurance-focused');
          case 'agility':
            return t.workoutTypes.includes('agility') || t.tags.includes('hockey-specific');
          default:
            return true;
        }
      });
    }

    // Score templates based on how well they match player count
    if (context.playerCount) {
      candidates = candidates.map(template => {
        const optimalSizes = Object.values(template.playerGroupSizes);
        const avgOptimalSize = optimalSizes.reduce((sum, size) => sum + size, 0) / optimalSizes.length;
        const sizeDiff = Math.abs(avgOptimalSize - context.playerCount);
        
        return {
          ...template,
          matchScore: 100 - sizeDiff * 2 // Reduce score by 2 points per player difference
        };
      }).sort((a, b) => (b as any).matchScore - (a as any).matchScore);
    }

    return candidates.slice(0, 3); // Return top 3 recommendations
  }

  /**
   * Generate custom mixed-type template based on preferences
   */
  static generateCustomTemplate(preferences: {
    name: string;
    workoutTypes: ('strength' | 'conditioning' | 'hybrid' | 'agility')[];
    durations: number[];
    transitionTimes?: number[];
    focus: 'balanced' | 'endurance' | 'strength' | 'agility' | 'recovery';
  }): MixedTypeTemplate {
    const id = `custom-${Date.now()}`;
    const totalTime = preferences.durations.reduce((sum, duration) => sum + duration, 0) +
                     (preferences.transitionTimes || []).reduce((sum, transition) => sum + transition, 0);

    // Auto-assign equipment based on workout types
    const equipmentRequirements: Record<number, WorkoutEquipmentType[]> = {};
    preferences.workoutTypes.forEach((type, index) => {
      if (type === 'conditioning') {
        equipmentRequirements[index] = ['bike_erg', 'rowing'];
      } else if (type === 'hybrid') {
        equipmentRequirements[index] = ['airbike', 'rope_jump'];
      } else {
        equipmentRequirements[index] = [];
      }
    });

    // Auto-assign facility areas
    const facilityAreas: Record<number, string[]> = {};
    preferences.workoutTypes.forEach((type, index) => {
      switch (type) {
        case 'strength':
          facilityAreas[index] = ['free-weights', 'power-racks'];
          break;
        case 'conditioning':
          facilityAreas[index] = ['cardio-area'];
          break;
        case 'hybrid':
          facilityAreas[index] = ['functional-area', 'crossfit-area'];
          break;
        case 'agility':
          facilityAreas[index] = ['agility-area', 'court-space'];
          break;
      }
    });

    // Auto-assign group sizes based on workout type
    const playerGroupSizes: Record<number, number> = {};
    preferences.workoutTypes.forEach((type, index) => {
      switch (type) {
        case 'strength':
          playerGroupSizes[index] = 8;
          break;
        case 'conditioning':
          playerGroupSizes[index] = 15;
          break;
        case 'hybrid':
          playerGroupSizes[index] = 10;
          break;
        case 'agility':
          playerGroupSizes[index] = 12;
          break;
      }
    });

    return {
      id,
      name: preferences.name,
      description: `Custom ${preferences.focus}-focused mixed training sequence`,
      sequence: 'performance-cycle',
      workoutTypes: preferences.workoutTypes,
      defaultDurations: preferences.durations,
      transitionTimes: preferences.transitionTimes || preferences.workoutTypes.slice(1).map(() => 10),
      equipmentRequirements,
      facilityAreas,
      playerGroupSizes,
      tags: ['custom', preferences.focus],
      difficulty: 'intermediate',
      seasonPhase: 'any',
      estimatedTotalTime: totalTime
    };
  }

  // Utility method to add minutes to time string
  private static addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }
}

export default MixedTypeTemplates;