import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store/store';
import {
  selectRecentWorkouts,
  selectFavoriteWorkoutIds,
  selectFavoriteTemplateIds,
  addToRecentWorkouts,
  toggleWorkoutFavorite,
  toggleTemplateFavorite,
} from '@/store/slices/workoutBuilderSlice';

const STORAGE_KEY = 'physicalTrainer_recentWorkouts';
const FAVORITES_KEY = 'physicalTrainer_favorites';

interface StoredData {
  recentWorkouts: any[];
  favoriteWorkoutIds: string[];
  favoriteTemplateIds: string[];
}

export const useRecentWorkoutsPersistence = () => {
  const dispatch = useDispatch<AppDispatch>();
  const recentWorkouts = useSelector(selectRecentWorkouts);
  const favoriteWorkoutIds = useSelector(selectFavoriteWorkoutIds);
  const favoriteTemplateIds = useSelector(selectFavoriteTemplateIds);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredData = JSON.parse(stored);
        
        // Restore recent workouts
        data.recentWorkouts?.forEach(workout => {
          dispatch(addToRecentWorkouts(workout));
        });
        
        // Restore favorites
        data.favoriteWorkoutIds?.forEach(id => {
          if (!favoriteWorkoutIds.includes(id)) {
            dispatch(toggleWorkoutFavorite(id));
          }
        });
        
        data.favoriteTemplateIds?.forEach(id => {
          if (!favoriteTemplateIds.includes(id)) {
            dispatch(toggleTemplateFavorite(id));
          }
        });
      }
    } catch (error) {
      console.error('Failed to load recent workouts from storage:', error);
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      const dataToStore: StoredData = {
        recentWorkouts,
        favoriteWorkoutIds,
        favoriteTemplateIds,
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save recent workouts to storage:', error);
    }
  }, [recentWorkouts, favoriteWorkoutIds, favoriteTemplateIds]);

  // Cleanup old data (older than 30 days)
  useEffect(() => {
    const cleanupOldData = () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filteredWorkouts = recentWorkouts.filter(workout => {
        const workoutDate = new Date(workout.lastUsed || workout.createdAt);
        return workoutDate > thirtyDaysAgo;
      });

      if (filteredWorkouts.length < recentWorkouts.length) {
        // Clear and re-add filtered workouts
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          recentWorkouts: filteredWorkouts,
          favoriteWorkoutIds,
          favoriteTemplateIds,
        }));
      }
    };

    // Run cleanup once per session
    const hasCleanedUp = sessionStorage.getItem('recentWorkouts_cleaned');
    if (!hasCleanedUp) {
      cleanupOldData();
      sessionStorage.setItem('recentWorkouts_cleaned', 'true');
    }
  }, [recentWorkouts, favoriteWorkoutIds, favoriteTemplateIds]);
};