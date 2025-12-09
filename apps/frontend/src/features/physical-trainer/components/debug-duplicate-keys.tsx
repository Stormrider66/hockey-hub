// Temporary debug helper to find duplicate keys
// Add this to your SessionsTab or parent component temporarily

import { useEffect } from 'react';
import { useGetRecentWorkoutsQuery } from '@/store/api/recentWorkoutsApi';

export function DebugDuplicateKeys() {
  const { data: recentWorkouts = [] } = useGetRecentWorkoutsQuery();
  
  useEffect(() => {
    // Check for duplicate IDs in recent workouts
    const ids = recentWorkouts.map(w => w.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    if (duplicates.length > 0) {
      console.error('Duplicate workout IDs found:', duplicates);
      console.error('Full workouts data:', recentWorkouts);
    }
    
    // Log workouts with 'item-' prefix
    const itemPrefixWorkouts = recentWorkouts.filter(w => w.id.startsWith('item-'));
    if (itemPrefixWorkouts.length > 0) {
      console.warn('Workouts with item- prefix:', itemPrefixWorkouts);
    }
  }, [recentWorkouts]);
  
  return null;
}