import React from 'react';
import { ExerciseAlternativesList } from './ExerciseAlternativesList';

// Mock data for demonstration
const mockOriginalExercise = {
  id: 'ex-001',
  name: 'Barbell Back Squat',
  category: 'Lower Body - Compound',
  targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core', 'Lower Back'],
};

const mockAlternatives = [
  {
    id: 'alt-001',
    name: 'Goblet Squat',
    category: 'Lower Body - Compound',
    targetMuscles: ['Quadriceps', 'Glutes', 'Core'],
    loadMultiplier: 0.7,
    restMultiplier: 1.0,
    modification: 'Hold a dumbbell or kettlebell at chest level. Keep torso more upright and reduce depth if needed. Focus on controlled movement.',
    safetyNotes: 'Front-loaded position reduces spinal compression. Easier to maintain proper form with lighter loads. Natural depth limitation prevents excessive knee stress.',
    compatibilityScore: 85,
  },
  {
    id: 'alt-002',
    name: 'Leg Press',
    category: 'Lower Body - Machine',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    loadMultiplier: 0.8,
    restMultiplier: 1.2,
    modification: 'Use leg press machine with back support. Start with feet shoulder-width apart. Control the negative portion and avoid locking knees.',
    safetyNotes: 'Back is fully supported, eliminating spinal load. Machine provides stability and controlled range of motion. Easy to adjust resistance.',
    compatibilityScore: 90,
  },
  {
    id: 'alt-003',
    name: 'Bulgarian Split Squat',
    category: 'Lower Body - Unilateral',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    loadMultiplier: 0.6,
    restMultiplier: 1.5,
    modification: 'Rear foot elevated on bench. Use bodyweight or light dumbbells. Focus on vertical torso and controlled descent. Perform equal reps each leg.',
    safetyNotes: 'Unilateral work reduces total load while maintaining training effect. Improved balance and stability. Less stress on lower back.',
    compatibilityScore: 75,
  },
];

// Example usage component
export const ExerciseAlternativesListDemo: React.FC = () => {
  const handleSelectAlternative = (alternative: any) => {
    console.log('Selected alternative:', alternative);
    alert(`Selected: ${alternative.name}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Exercise Alternatives Demo</h2>
      
      <ExerciseAlternativesList
        originalExercise={mockOriginalExercise}
        alternatives={mockAlternatives}
        playerId="player-123"
        playerName="John Smith"
        onSelectAlternative={handleSelectAlternative}
        restriction="No heavy squats - Recent knee injury"
      />
    </div>
  );
};

// Additional mock data examples for different restrictions
export const mockAlternativesByRestriction = {
  'No overhead movements': [
    {
      id: 'alt-004',
      name: 'Dumbbell Front Raise',
      category: 'Shoulders - Isolation',
      targetMuscles: ['Anterior Deltoids'],
      loadMultiplier: 0.6,
      restMultiplier: 1.0,
      modification: 'Raise dumbbells to shoulder height only. Use lighter weight with controlled tempo.',
      safetyNotes: 'Avoids overhead position. Reduced shoulder impingement risk. Maintains deltoid activation.',
      compatibilityScore: 70,
    },
  ],
  'No heavy pulling': [
    {
      id: 'alt-005',
      name: 'Cable Row (Light)',
      category: 'Back - Machine',
      targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Middle Trapezius'],
      loadMultiplier: 0.5,
      restMultiplier: 1.2,
      modification: 'Use cable machine with chest support. Focus on squeezing shoulder blades. Higher reps with lighter weight.',
      safetyNotes: 'Cable provides constant tension without heavy loading. Chest support protects lower back. Easy to control resistance.',
      compatibilityScore: 80,
    },
  ],
  'No impact exercises': [
    {
      id: 'alt-006',
      name: 'Stationary Bike',
      category: 'Cardio - Low Impact',
      targetMuscles: ['Quadriceps', 'Hamstrings', 'Calves'],
      loadMultiplier: 0.7,
      restMultiplier: 0.8,
      modification: 'Adjust seat height for comfortable knee angle. Start with moderate resistance. Maintain steady pace.',
      safetyNotes: 'Zero impact on joints. Controlled environment. Easy to adjust intensity. Suitable for recovery.',
      compatibilityScore: 95,
    },
  ],
};