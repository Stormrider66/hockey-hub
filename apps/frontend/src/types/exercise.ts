export type ExerciseCategory = 'warmup' | 'main' | 'core' | 'conditioning' | 'wrestling';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  videoUrl?: string;
  description?: string;
} 