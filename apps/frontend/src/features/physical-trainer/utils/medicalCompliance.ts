import type { Exercise } from '@/features/physical-trainer/types';

export interface MedicalRestriction {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'injury' | 'condition' | 'recovery' | 'other';
  expiryDate?: Date;
}

export interface ComplianceViolation {
  exerciseId: string;
  exerciseName: string;
  playerId: string;
  restrictionType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  alternatives?: string[];
}

export interface ComplianceResult {
  isCompliant: boolean;
  violations?: ComplianceViolation[];
}

export interface ExerciseAlternative {
  id: string;
  name: string;
  category: string;
  loadMultiplier: number;
  restMultiplier: number;
  recommendationScore: number;
  reason: string;
}

// Restriction keyword mappings
const RESTRICTION_MAPPINGS = {
  'No overhead movements': {
    blockedExercises: ['bench press', 'military press', 'shoulder press', 'overhead press', 'push press', 'snatch', 'jerk'],
    blockedKeywords: ['overhead', 'press above', 'arms up'],
    severity: 'high' as const
  },
  'No heavy squats': {
    blockedExercises: ['barbell squat', 'back squat', 'front squat', 'overhead squat'],
    allowedExercises: ['goblet squat', 'leg press', 'lunges', 'step-ups'],
    blockedKeywords: ['heavy squat', 'barbell squat'],
    severity: 'medium' as const
  },
  'No contact drills': {
    blockedExercises: ['contact drills', 'checking practice', 'body contact'],
    blockedKeywords: ['contact', 'checking', 'collision', 'tackling'],
    severity: 'critical' as const
  },
  'Limited jumping': {
    blockedExercises: ['box jumps', 'burpees', 'jump squats', 'broad jumps'],
    allowedExercises: ['modified burpees', 'step-ups', 'low box steps'],
    blockedKeywords: ['jump', 'plyometric', 'explosive'],
    severity: 'medium' as const
  },
  'No running': {
    blockedExercises: ['sprints', 'jogging', 'running drills'],
    blockedKeywords: ['run', 'sprint', 'jog'],
    severity: 'high' as const
  },
  'Limited upper body': {
    blockedExercises: ['bench press', 'rows', 'pull-ups'],
    blockedKeywords: ['upper body', 'arms', 'chest', 'back'],
    severity: 'medium' as const
  },
  'No twisting movements': {
    blockedExercises: ['russian twists', 'cable woodchops', 'medicine ball throws'],
    blockedKeywords: ['twist', 'rotation', 'rotate'],
    severity: 'medium' as const
  }
};

// Exercise category alternatives mapping
const EXERCISE_ALTERNATIVES: Record<string, string[]> = {
  'barbell squat': ['goblet squat', 'leg press', 'bulgarian split squats', 'wall sits'],
  'bench press': ['push-ups', 'chest fly', 'dumbbell press (flat)', 'cable crossover'],
  'box jumps': ['step-ups', 'low box steps', 'calf raises', 'seated jumps'],
  'military press': ['lateral raises', 'front raises', 'face pulls', 'band pull-aparts'],
  'deadlift': ['romanian deadlift', 'trap bar deadlift', 'cable pull-through', 'hip thrusts'],
  'burpees': ['modified burpees', 'mountain climbers', 'jumping jacks', 'squat thrusts'],
  'running': ['cycling', 'elliptical', 'swimming', 'rowing'],
  'pull-ups': ['lat pulldowns', 'assisted pull-ups', 'band pull-downs', 'inverted rows']
};

export function checkExerciseCompliance(
  exercise: Exercise,
  restrictions: MedicalRestriction[],
  playerId: string
): ComplianceResult {
  const violations: ComplianceViolation[] = [];
  
  restrictions.forEach(restriction => {
    const mapping = RESTRICTION_MAPPINGS[restriction.type as keyof typeof RESTRICTION_MAPPINGS];
    if (!mapping) return;

    const exerciseName = exercise.name.toLowerCase();
    
    // Check if exercise is directly blocked
    const isBlocked = mapping.blockedExercises?.some(blocked => 
      exerciseName.includes(blocked.toLowerCase())
    );
    
    // Check if exercise contains blocked keywords
    const hasBlockedKeyword = mapping.blockedKeywords?.some(keyword =>
      exerciseName.includes(keyword.toLowerCase())
    );
    
    // Check if exercise is in allowed list (if exists)
    const isAllowed = mapping.allowedExercises?.some(allowed =>
      exerciseName.includes(allowed.toLowerCase())
    );

    if ((isBlocked || hasBlockedKeyword) && !isAllowed) {
      violations.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        playerId,
        restrictionType: restriction.type,
        severity: mapping.severity || restriction.severity,
        message: `Exercise "${exercise.name}" conflicts with restriction: ${restriction.type}`,
        alternatives: EXERCISE_ALTERNATIVES[exerciseName] || findAlternativesByCategory(exercise)
      });
    }
  });

  return {
    isCompliant: violations.length === 0,
    violations: violations.length > 0 ? violations : undefined
  };
}

export function getRestrictionSeverity(restrictionType: string): 'low' | 'medium' | 'high' | 'critical' {
  const mapping = RESTRICTION_MAPPINGS[restrictionType as keyof typeof RESTRICTION_MAPPINGS];
  if (mapping?.severity) return mapping.severity;
  
  // Default severity based on keywords
  const lowerType = restrictionType.toLowerCase();
  if (lowerType.includes('no') || lowerType.includes('avoid')) return 'high';
  if (lowerType.includes('limited') || lowerType.includes('reduce')) return 'medium';
  if (lowerType.includes('caution') || lowerType.includes('monitor')) return 'low';
  
  return 'medium';
}

export function calculateLoadAdjustment(
  exercise: Exercise,
  restrictions: MedicalRestriction[]
): number {
  let multiplier = 1.0;
  
  restrictions.forEach(restriction => {
    // Apply load reduction based on severity
    switch (restriction.severity) {
      case 'critical':
        multiplier *= 0.0; // No load allowed
        break;
      case 'high':
        multiplier *= 0.5; // 50% reduction
        break;
      case 'medium':
        multiplier *= 0.75; // 25% reduction
        break;
      case 'low':
        multiplier *= 0.9; // 10% reduction
        break;
    }
    
    // Additional adjustments based on restriction type
    if (restriction.type.toLowerCase().includes('limited')) {
      multiplier *= 0.8;
    }
    if (restriction.type.toLowerCase().includes('recovery')) {
      multiplier *= 0.7;
    }
  });
  
  return Math.max(0, Math.min(1, multiplier)); // Clamp between 0 and 1
}

export function mapExerciseToRestrictions(exercise: Exercise): string[] {
  const restrictions: string[] = [];
  const exerciseName = exercise.name.toLowerCase();
  
  // Map exercise to potential restrictions
  Object.entries(RESTRICTION_MAPPINGS).forEach(([restrictionType, mapping]) => {
    const isAffected = mapping.blockedExercises?.some(blocked =>
      exerciseName.includes(blocked.toLowerCase())
    ) || mapping.blockedKeywords?.some(keyword =>
      exerciseName.includes(keyword.toLowerCase())
    );
    
    if (isAffected) {
      restrictions.push(restrictionType);
    }
  });
  
  return restrictions;
}

export function findSafeAlternatives(
  exercise: Exercise,
  restrictions: MedicalRestriction[]
): ExerciseAlternative[] {
  const alternatives: ExerciseAlternative[] = [];
  const exerciseName = exercise.name.toLowerCase();
  
  // Get direct alternatives
  const directAlternatives = EXERCISE_ALTERNATIVES[exerciseName] || [];
  
  // Get category-based alternatives
  const categoryAlternatives = findAlternativesByCategory(exercise);
  
  // Combine and deduplicate
  const allAlternatives = [...new Set([...directAlternatives, ...categoryAlternatives])];
  
  // Check each alternative for compliance
  allAlternatives.forEach((altName, index) => {
    const mockAltExercise: Exercise = {
      id: `alt-${index}`,
      name: altName,
      category: exercise.category,
      type: exercise.type,
      description: '',
      videoUrl: '',
      imageUrl: '',
      equipment: [],
      muscleGroups: exercise.muscleGroups || [],
      difficulty: 'intermediate',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const altCompliance = checkExerciseCompliance(mockAltExercise, restrictions, 'check');
    
    if (altCompliance.isCompliant) {
      alternatives.push({
        id: `alt-${index}`,
        name: altName,
        category: exercise.category,
        loadMultiplier: 0.8, // Safe alternatives typically use 80% load
        restMultiplier: 1.2, // 20% more rest for safety
        recommendationScore: calculateRecommendationScore(altName, exercise, restrictions),
        reason: `Safe alternative for ${exercise.name} given current restrictions`
      });
    }
  });
  
  return alternatives.sort((a, b) => b.recommendationScore - a.recommendationScore);
}

function findAlternativesByCategory(exercise: Exercise): string[] {
  const category = exercise.category?.toLowerCase() || '';
  const type = exercise.type?.toLowerCase() || '';
  
  const alternatives: string[] = [];
  
  // Category-based alternatives
  if (category.includes('legs') || category.includes('lower')) {
    alternatives.push('leg press', 'lunges', 'step-ups', 'calf raises', 'leg curls');
  }
  if (category.includes('chest') || category.includes('push')) {
    alternatives.push('push-ups', 'chest fly', 'cable crossover', 'dips');
  }
  if (category.includes('back') || category.includes('pull')) {
    alternatives.push('lat pulldowns', 'cable rows', 'face pulls', 'band pull-aparts');
  }
  if (category.includes('shoulder')) {
    alternatives.push('lateral raises', 'front raises', 'rear delt fly', 'band work');
  }
  if (category.includes('core')) {
    alternatives.push('planks', 'dead bugs', 'bird dogs', 'pallof press');
  }
  
  // Type-based alternatives
  if (type.includes('strength')) {
    alternatives.push('resistance bands', 'isometric holds', 'tempo work');
  }
  if (type.includes('cardio')) {
    alternatives.push('cycling', 'swimming', 'elliptical', 'rowing');
  }
  if (type.includes('flexibility')) {
    alternatives.push('stretching', 'yoga', 'foam rolling', 'mobility work');
  }
  
  return [...new Set(alternatives)];
}

function calculateRecommendationScore(
  alternativeName: string,
  originalExercise: Exercise,
  restrictions: MedicalRestriction[]
): number {
  let score = 50; // Base score
  
  // Bonus for similar muscle groups
  if (originalExercise.muscleGroups) {
    score += 20;
  }
  
  // Bonus for same category
  if (originalExercise.category) {
    score += 15;
  }
  
  // Penalty for each restriction severity
  restrictions.forEach(restriction => {
    switch (restriction.severity) {
      case 'critical':
        score -= 30;
        break;
      case 'high':
        score -= 20;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
  });
  
  // Bonus for known safe alternatives
  const safeLowImpact = ['swimming', 'cycling', 'elliptical', 'walking', 'stretching'];
  if (safeLowImpact.some(safe => alternativeName.toLowerCase().includes(safe))) {
    score += 25;
  }
  
  return Math.max(0, Math.min(100, score));
}