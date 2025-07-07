import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { Organization } from './Organization';

export enum WorkoutType {
  STRENGTH = 'STRENGTH',
  CARDIO = 'CARDIO',
  AGILITY = 'AGILITY',
  FLEXIBILITY = 'FLEXIBILITY',
  POWER = 'POWER',
  ENDURANCE = 'ENDURANCE',
  RECOVERY = 'RECOVERY',
  REHABILITATION = 'REHABILITATION',
  SPORT_SPECIFIC = 'SPORT_SPECIFIC',
  MENTAL = 'MENTAL'
}

export interface MetricsConfig {
  primary: string[];
  secondary: string[];
  calculated: {
    name: string;
    formula: string;
    unit: string;
  }[];
}

export interface EquipmentRequirement {
  required: string[];
  alternatives: {
    [key: string]: string[];
  };
  optional: string[];
}

export interface ProgressionModel {
  beginner: {
    duration: string;
    focus: string[];
    goals: string[];
  };
  intermediate: {
    duration: string;
    focus: string[];
    goals: string[];
  };
  advanced: {
    duration: string;
    focus: string[];
    goals: string[];
  };
  elite: {
    duration: string;
    focus: string[];
    goals: string[];
  };
}

export interface SafetyProtocol {
  warmupRequired: boolean;
  warmupDuration: number;
  cooldownRequired: boolean;
  cooldownDuration: number;
  contraindications: string[];
  injuryPrevention: string[];
  monitoringRequired: string[];
  maxIntensity: number;
  recoveryTime: number;
}

@Entity('workout_type_configs')
@Unique(['organizationId', 'workoutType'])
@Index(['organizationId'])
@Index(['workoutType'])
@Index(['isActive'])
export class WorkoutTypeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: WorkoutType,
    nullable: false
  })
  workoutType: WorkoutType;

  @Column('uuid')
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  metricsConfig: MetricsConfig;

  @Column({ type: 'jsonb' })
  equipmentRequirements: EquipmentRequirement;

  @Column({ type: 'jsonb' })
  progressionModels: ProgressionModel;

  @Column({ type: 'jsonb' })
  safetyProtocols: SafetyProtocol;

  @Column({ type: 'jsonb', nullable: true })
  customSettings: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;
}

// Default configurations for each workout type
export const defaultWorkoutTypeConfigs: Record<WorkoutType, Partial<WorkoutTypeConfig>> = {
  [WorkoutType.STRENGTH]: {
    name: 'Strength Training',
    description: 'Focus on building muscle strength and power through resistance exercises',
    metricsConfig: {
      primary: ['weight', 'reps', 'sets'],
      secondary: ['restTime', 'tempo', 'rangeOfMotion'],
      calculated: [
        { name: 'totalVolume', formula: 'weight * reps * sets', unit: 'kg' },
        { name: 'intensityIndex', formula: '(weight / bodyWeight) * 100', unit: '%' }
      ]
    },
    equipmentRequirements: {
      required: ['barbell', 'dumbbells', 'bench'],
      alternatives: {
        'barbell': ['dumbbells', 'resistance bands'],
        'dumbbells': ['kettlebells', 'resistance bands'],
        'bench': ['stability ball', 'floor']
      },
      optional: ['power rack', 'cable machine', 'pull-up bar']
    },
    progressionModels: {
      beginner: {
        duration: '0-6 months',
        focus: ['form', 'bodyweight exercises', 'light weights'],
        goals: ['master basic movements', '2-3 sets of 12-15 reps']
      },
      intermediate: {
        duration: '6-24 months',
        focus: ['progressive overload', 'compound movements'],
        goals: ['3-4 sets of 8-12 reps', 'increase weight weekly']
      },
      advanced: {
        duration: '2-5 years',
        focus: ['periodization', 'advanced techniques'],
        goals: ['4-5 sets of 6-10 reps', 'specialized programs']
      },
      elite: {
        duration: '5+ years',
        focus: ['sport-specific strength', 'power development'],
        goals: ['customized programs', 'competition preparation']
      }
    },
    safetyProtocols: {
      warmupRequired: true,
      warmupDuration: 10,
      cooldownRequired: true,
      cooldownDuration: 5,
      contraindications: ['acute injury', 'cardiovascular issues'],
      injuryPrevention: ['proper form', 'progressive loading', 'adequate rest'],
      monitoringRequired: ['heart rate', 'form breakdown', 'fatigue level'],
      maxIntensity: 95,
      recoveryTime: 48
    }
  },
  [WorkoutType.CARDIO]: {
    name: 'Cardiovascular Training',
    description: 'Improve cardiovascular endurance and aerobic capacity',
    metricsConfig: {
      primary: ['duration', 'distance', 'heartRate'],
      secondary: ['pace', 'calories', 'elevation'],
      calculated: [
        { name: 'avgPace', formula: 'duration / distance', unit: 'min/km' },
        { name: 'heartRateZone', formula: '(heartRate / maxHeartRate) * 100', unit: '%' }
      ]
    },
    equipmentRequirements: {
      required: [],
      alternatives: {},
      optional: ['treadmill', 'bike', 'rower', 'heart rate monitor']
    },
    progressionModels: {
      beginner: {
        duration: '0-3 months',
        focus: ['base building', 'low intensity'],
        goals: ['20-30 min continuous', '3-4 days/week']
      },
      intermediate: {
        duration: '3-12 months',
        focus: ['interval training', 'tempo runs'],
        goals: ['30-45 min sessions', 'heart rate zones']
      },
      advanced: {
        duration: '1-3 years',
        focus: ['lactate threshold', 'VO2 max'],
        goals: ['45-60 min sessions', 'structured programs']
      },
      elite: {
        duration: '3+ years',
        focus: ['race preparation', 'periodized training'],
        goals: ['sport-specific endurance', 'competition ready']
      }
    },
    safetyProtocols: {
      warmupRequired: true,
      warmupDuration: 5,
      cooldownRequired: true,
      cooldownDuration: 10,
      contraindications: ['heart conditions', 'severe asthma'],
      injuryPrevention: ['gradual progression', 'proper footwear', 'hydration'],
      monitoringRequired: ['heart rate', 'breathing', 'RPE'],
      maxIntensity: 90,
      recoveryTime: 24
    }
  },
  [WorkoutType.AGILITY]: {
    name: 'Agility Training',
    description: 'Enhance speed, coordination, and change of direction abilities',
    metricsConfig: {
      primary: ['time', 'reps', 'errors'],
      secondary: ['restTime', 'complexity', 'speed'],
      calculated: [
        { name: 'avgTime', formula: 'totalTime / reps', unit: 'seconds' },
        { name: 'successRate', formula: '((reps - errors) / reps) * 100', unit: '%' }
      ]
    },
    equipmentRequirements: {
      required: ['cones', 'markers'],
      alternatives: {
        'cones': ['water bottles', 'discs'],
        'markers': ['tape', 'chalk']
      },
      optional: ['agility ladder', 'hurdles', 'reaction balls']
    },
    progressionModels: {
      beginner: {
        duration: '0-3 months',
        focus: ['basic footwork', 'coordination'],
        goals: ['master basic patterns', 'reduce errors']
      },
      intermediate: {
        duration: '3-12 months',
        focus: ['complex patterns', 'speed development'],
        goals: ['increase speed', 'multi-directional movement']
      },
      advanced: {
        duration: '1-2 years',
        focus: ['sport-specific drills', 'reactive agility'],
        goals: ['game-like scenarios', 'decision making']
      },
      elite: {
        duration: '2+ years',
        focus: ['competitive edge', 'fine-tuning'],
        goals: ['peak performance', 'consistency']
      }
    },
    safetyProtocols: {
      warmupRequired: true,
      warmupDuration: 15,
      cooldownRequired: true,
      cooldownDuration: 5,
      contraindications: ['ankle instability', 'knee injuries'],
      injuryPrevention: ['surface check', 'proper footwear', 'progressive speed'],
      monitoringRequired: ['form breakdown', 'fatigue', 'landing mechanics'],
      maxIntensity: 100,
      recoveryTime: 24
    }
  },
  [WorkoutType.FLEXIBILITY]: {
    name: 'Flexibility Training',
    description: 'Improve range of motion and muscle elasticity',
    metricsConfig: {
      primary: ['duration', 'range', 'holdTime'],
      secondary: ['intensity', 'breathCount', 'temperature'],
      calculated: [
        { name: 'totalStretchTime', formula: 'holdTime * reps', unit: 'seconds' },
        { name: 'flexibilityGain', formula: '(currentRange - baselineRange)', unit: 'degrees' }
      ]
    },
    equipmentRequirements: {
      required: ['mat'],
      alternatives: {
        'mat': ['towel', 'carpet']
      },
      optional: ['foam roller', 'resistance bands', 'blocks']
    },
    progressionModels: {
      beginner: {
        duration: '0-2 months',
        focus: ['basic stretches', 'breathing'],
        goals: ['daily practice', '15-20 min sessions']
      },
      intermediate: {
        duration: '2-6 months',
        focus: ['deeper stretches', 'PNF techniques'],
        goals: ['increased range', '20-30 min sessions']
      },
      advanced: {
        duration: '6-12 months',
        focus: ['advanced poses', 'dynamic flexibility'],
        goals: ['sport-specific flexibility', 'injury prevention']
      },
      elite: {
        duration: '1+ years',
        focus: ['maintenance', 'specialized techniques'],
        goals: ['optimal flexibility', 'performance enhancement']
      }
    },
    safetyProtocols: {
      warmupRequired: true,
      warmupDuration: 5,
      cooldownRequired: false,
      cooldownDuration: 0,
      contraindications: ['acute muscle strain', 'joint hypermobility'],
      injuryPrevention: ['no bouncing', 'gradual progression', 'warm muscles'],
      monitoringRequired: ['pain level', 'breathing', 'alignment'],
      maxIntensity: 70,
      recoveryTime: 0
    }
  },
  [WorkoutType.POWER]: {
    name: 'Power Training',
    description: 'Develop explosive strength and speed',
    metricsConfig: {
      primary: ['weight', 'reps', 'velocity'],
      secondary: ['restTime', 'height', 'distance'],
      calculated: [
        { name: 'powerOutput', formula: '(weight * distance) / time', unit: 'watts' },
        { name: 'rateOfForceDevelopment', formula: 'peakForce / timeToReachPeak', unit: 'N/s' }
      ]
    },
    equipmentRequirements: {
      required: ['barbell', 'platform'],
      alternatives: {
        'barbell': ['medicine ball', 'kettlebells'],
        'platform': ['rubber flooring', 'grass']
      },
      optional: ['velocity tracker', 'jump mat', 'prowler sled']
    },
    progressionModels: {
      beginner: {
        duration: '0-6 months',
        focus: ['technique', 'bodyweight plyometrics'],
        goals: ['master landing', 'basic jumps']
      },
      intermediate: {
        duration: '6-18 months',
        focus: ['loaded jumps', 'Olympic lift variations'],
        goals: ['30-50% 1RM loads', 'complex movements']
      },
      advanced: {
        duration: '18-36 months',
        focus: ['max velocity', 'contrast training'],
        goals: ['50-70% 1RM loads', 'sport transfer']
      },
      elite: {
        duration: '3+ years',
        focus: ['peaking', 'specialized methods'],
        goals: ['competition prep', 'personal records']
      }
    },
    safetyProtocols: {
      warmupRequired: true,
      warmupDuration: 20,
      cooldownRequired: true,
      cooldownDuration: 10,
      contraindications: ['joint pain', 'muscle strains', 'fatigue'],
      injuryPrevention: ['proper technique', 'adequate rest', 'progressive loading'],
      monitoringRequired: ['bar velocity', 'form quality', 'landing mechanics'],
      maxIntensity: 90,
      recoveryTime: 72
    }
  },
  [WorkoutType.ENDURANCE]: {
    name: 'Endurance Training',
    description: 'Build stamina and sustained performance capacity',
    metricsConfig: {
      primary: ['duration', 'distance', 'heartRate'],
      secondary: ['pace', 'power', 'cadence'],
      calculated: [
        { name: 'aerobicEfficiency', formula: 'distance / avgHeartRate', unit: 'm/bpm' },
        { name: 'trainingLoad', formula: 'duration * intensity', unit: 'AU' }
      ]
    },
    equipmentRequirements: {
      required: [],
      alternatives: {},
      optional: ['GPS watch', 'power meter', 'heart rate monitor']
    },
    progressionModels: {
      beginner: {
        duration: '0-6 months',
        focus: ['base building', 'consistency'],
        goals: ['3-4 sessions/week', '30-45 min duration']
      },
      intermediate: {
        duration: '6-24 months',
        focus: ['volume increase', 'zone training'],
        goals: ['4-5 sessions/week', '45-90 min duration']
      },
      advanced: {
        duration: '2-5 years',
        focus: ['periodization', 'race specific'],
        goals: ['5-7 sessions/week', 'structured plans']
      },
      elite: {
        duration: '5+ years',
        focus: ['optimization', 'peak performance'],
        goals: ['professional level', 'podium finishes']
      }
    },
    safetyProtocols: {
      warmupRequired: true,
      warmupDuration: 10,
      cooldownRequired: true,
      cooldownDuration: 15,
      contraindications: ['overtraining symptoms', 'illness'],
      injuryPrevention: ['gradual progression', 'recovery days', 'nutrition'],
      monitoringRequired: ['heart rate variability', 'fatigue', 'sleep quality'],
      maxIntensity: 85,
      recoveryTime: 24
    }
  },
  [WorkoutType.RECOVERY]: {
    name: 'Recovery Training',
    description: 'Active recovery and regeneration sessions',
    metricsConfig: {
      primary: ['duration', 'intensity', 'heartRate'],
      secondary: ['mobility', 'relaxation', 'breathing'],
      calculated: [
        { name: 'recoveryScore', formula: '(HRV / restingHR) * 100', unit: 'score' },
        { name: 'stressReduction', formula: 'preStress - postStress', unit: 'points' }
      ]
    },
    equipmentRequirements: {
      required: [],
      alternatives: {},
      optional: ['foam roller', 'massage gun', 'compression gear']
    },
    progressionModels: {
      beginner: {
        duration: 'ongoing',
        focus: ['basic recovery', 'sleep hygiene'],
        goals: ['daily practice', 'stress management']
      },
      intermediate: {
        duration: 'ongoing',
        focus: ['active recovery', 'mobility work'],
        goals: ['structured recovery', 'HRV tracking']
      },
      advanced: {
        duration: 'ongoing',
        focus: ['periodized recovery', 'advanced techniques'],
        goals: ['optimal recovery', 'performance ready']
      },
      elite: {
        duration: 'ongoing',
        focus: ['individualized protocols', 'cutting edge methods'],
        goals: ['peak readiness', 'injury prevention']
      }
    },
    safetyProtocols: {
      warmupRequired: false,
      warmupDuration: 0,
      cooldownRequired: false,
      cooldownDuration: 0,
      contraindications: ['acute injury requiring rest'],
      injuryPrevention: ['listen to body', 'avoid overexertion'],
      monitoringRequired: ['comfort level', 'pain', 'relaxation'],
      maxIntensity: 50,
      recoveryTime: 0
    }
  },
  [WorkoutType.REHABILITATION]: {
    name: 'Rehabilitation Training',
    description: 'Injury recovery and corrective exercise programs',
    metricsConfig: {
      primary: ['painLevel', 'rangeOfMotion', 'reps'],
      secondary: ['stability', 'strength', 'function'],
      calculated: [
        { name: 'functionalScore', formula: '(currentFunction / normalFunction) * 100', unit: '%' },
        { name: 'progressRate', formula: '(currentROM - initialROM) / days', unit: 'degrees/day' }
      ]
    },
    equipmentRequirements: {
      required: ['resistance bands'],
      alternatives: {
        'resistance bands': ['cable machine', 'bodyweight']
      },
      optional: ['balance pad', 'stability ball', 'light weights']
    },
    progressionModels: {
      beginner: {
        duration: 'injury dependent',
        focus: ['pain reduction', 'basic movement'],
        goals: ['restore function', 'prevent compensation']
      },
      intermediate: {
        duration: 'injury dependent',
        focus: ['strength building', 'coordination'],
        goals: ['50% function', 'daily activities']
      },
      advanced: {
        duration: 'injury dependent',
        focus: ['sport specific', 'prevention'],
        goals: ['80% function', 'return to play']
      },
      elite: {
        duration: 'injury dependent',
        focus: ['performance', 'resilience'],
        goals: ['100% function', 'injury prevention']
      }
    },
    safetyProtocols: {
      warmupRequired: true,
      warmupDuration: 10,
      cooldownRequired: true,
      cooldownDuration: 10,
      contraindications: ['medical restrictions', 'acute inflammation'],
      injuryPrevention: ['follow medical guidance', 'pain-free movement', 'gradual progression'],
      monitoringRequired: ['pain', 'swelling', 'movement quality'],
      maxIntensity: 60,
      recoveryTime: 24
    }
  },
  [WorkoutType.SPORT_SPECIFIC]: {
    name: 'Sport-Specific Training',
    description: 'Hockey-specific skills and conditioning',
    metricsConfig: {
      primary: ['shotSpeed', 'accuracy', 'time'],
      secondary: ['power', 'agility', 'decision'],
      calculated: [
        { name: 'skillEfficiency', formula: '(successfulReps / totalReps) * 100', unit: '%' },
        { name: 'performanceIndex', formula: '(speed * accuracy) / 100', unit: 'index' }
      ]
    },
    equipmentRequirements: {
      required: ['stick', 'pucks', 'ice/surface'],
      alternatives: {
        'ice/surface': ['synthetic ice', 'roller surface'],
        'pucks': ['balls', 'weighted pucks']
      },
      optional: ['cones', 'targets', 'radar gun']
    },
    progressionModels: {
      beginner: {
        duration: '0-12 months',
        focus: ['basic skills', 'fundamentals'],
        goals: ['proper technique', 'consistency']
      },
      intermediate: {
        duration: '1-3 years',
        focus: ['skill combinations', 'game situations'],
        goals: ['speed with control', 'decision making']
      },
      advanced: {
        duration: '3-5 years',
        focus: ['elite skills', 'pressure situations'],
        goals: ['game transfer', 'consistency under pressure']
      },
      elite: {
        duration: '5+ years',
        focus: ['innovation', 'mastery'],
        goals: ['professional level', 'game changing ability']
      }
    },
    safetyProtocols: {
      warmupRequired: true,
      warmupDuration: 15,
      cooldownRequired: true,
      cooldownDuration: 10,
      contraindications: ['equipment issues', 'surface conditions'],
      injuryPrevention: ['proper equipment', 'surface check', 'fatigue management'],
      monitoringRequired: ['technique', 'fatigue', 'decision quality'],
      maxIntensity: 95,
      recoveryTime: 24
    }
  },
  [WorkoutType.MENTAL]: {
    name: 'Mental Training',
    description: 'Cognitive and psychological performance enhancement',
    metricsConfig: {
      primary: ['duration', 'focusScore', 'stressLevel'],
      secondary: ['mood', 'confidence', 'visualization'],
      calculated: [
        { name: 'mentalReadiness', formula: '(focus + confidence + mood) / 3', unit: 'score' },
        { name: 'stressResilience', formula: 'postStress - preStress', unit: 'points' }
      ]
    },
    equipmentRequirements: {
      required: [],
      alternatives: {},
      optional: ['meditation app', 'biofeedback device', 'journal']
    },
    progressionModels: {
      beginner: {
        duration: '0-3 months',
        focus: ['awareness', 'basic techniques'],
        goals: ['daily practice', 'stress management']
      },
      intermediate: {
        duration: '3-12 months',
        focus: ['visualization', 'self-talk'],
        goals: ['competition prep', 'consistency']
      },
      advanced: {
        duration: '1-2 years',
        focus: ['flow states', 'pressure management'],
        goals: ['peak performance', 'resilience']
      },
      elite: {
        duration: '2+ years',
        focus: ['mastery', 'mental edge'],
        goals: ['unshakeable confidence', 'clutch performance']
      }
    },
    safetyProtocols: {
      warmupRequired: false,
      warmupDuration: 0,
      cooldownRequired: false,
      cooldownDuration: 0,
      contraindications: ['severe mental health issues'],
      injuryPrevention: ['professional guidance if needed', 'gradual progression'],
      monitoringRequired: ['emotional state', 'stress levels', 'sleep quality'],
      maxIntensity: 80,
      recoveryTime: 0
    }
  }
};