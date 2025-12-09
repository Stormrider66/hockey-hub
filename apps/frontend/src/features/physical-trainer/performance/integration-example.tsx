import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import { useTabPerformance, useWorkoutBuilderPerformance, useChartPerformance } from './withPerformanceTracking';

/**
 * Example integration for PhysicalTrainerDashboard
 * 
 * This shows how to integrate performance monitoring into the Physical Trainer Dashboard
 */

// Example 1: Track main dashboard performance
export function PhysicalTrainerDashboardExample() {
  const perf = usePerformanceMonitor({
    componentName: 'PhysicalTrainerDashboard',
    enableAutoTracking: true,
    trackRenders: true
  });

  const tabPerf = useTabPerformance('physical-trainer-main');
  const [activeTab, setActiveTab] = useState('workouts');

  // Track initial data load
  useEffect(() => {
    const loadDashboard = async () => {
      // Track overall dashboard load
      perf.startMeasure('initial-load');
      
      try {
        // Track individual API calls
        const [sessions, players, templates] = await Promise.all([
          perf.trackApiCall('fetch-sessions', async () => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 300));
            return { sessions: [] };
          }),
          perf.trackApiCall('fetch-players', async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return { players: [] };
          }),
          perf.trackApiCall('fetch-templates', async () => {
            await new Promise(resolve => setTimeout(resolve, 150));
            return { templates: [] };
          })
        ]);

        perf.endMeasure('initial-load', {
          totalItems: 0,
          dataLoaded: true
        });
      } catch (error) {
        perf.endMeasure('initial-load', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    loadDashboard();
  }, [perf]);

  // Track tab switches
  const handleTabChange = (newTab: string) => {
    tabPerf.trackSwitch(activeTab, newTab);
    perf.trackInteraction('tab-change', {
      from: activeTab,
      to: newTab
    });
    setActiveTab(newTab);
  };

  return (
    <div>
      {/* Dashboard implementation */}
    </div>
  );
}

// Example 2: Track workout builder performance
export function WorkoutBuilderExample() {
  const builderPerf = useWorkoutBuilderPerformance('strength');
  const perf = usePerformanceMonitor({
    componentName: 'StrengthWorkoutBuilder',
    enableAutoTracking: true
  });

  const [exercises, setExercises] = useState([]);

  // Track exercise operations
  const addExercise = (exercise: any) => {
    perf.startMeasure('add-exercise');
    
    builderPerf.trackExerciseAdd(exercise);
    setExercises([...exercises, exercise]);
    
    perf.endMeasure('add-exercise', {
      exerciseCount: exercises.length + 1,
      exerciseType: exercise.type
    });
  };

  // Track save operation
  const saveWorkout = async () => {
    try {
      const result = await builderPerf.trackSave(async () => {
        // Track validation separately
        const stopValidation = builderPerf.trackValidation();
        // ... validation logic
        stopValidation();

        // API call
        const response = await fetch('/api/workouts', {
          method: 'POST',
          body: JSON.stringify({ exercises })
        });
        return response.json();
      });

      perf.trackInteraction('save-success', {
        workoutId: result.id,
        exerciseCount: exercises.length
      });
    } catch (error) {
      perf.trackInteraction('save-error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <div>
      {/* Workout builder implementation */}
    </div>
  );
}

// Example 3: Track chart rendering
export function PlayerStatsChartExample() {
  const chartPerf = useChartPerformance('player-performance-trends');
  const [data, setData] = useState([]);

  useEffect(() => {
    if (data.length === 0) return;

    chartPerf.startRender();
    
    // Simulate chart rendering
    requestAnimationFrame(() => {
      chartPerf.endRender({
        dataPoints: data.length,
        chartType: 'line',
        animated: true
      });
    });
  }, [data, chartPerf]);

  // Track data loading
  const loadChartData = async () => {
    chartPerf.trackDataLoad(0); // Track start
    
    try {
      const response = await fetch('/api/player-stats');
      const statsData = await response.json();
      
      chartPerf.trackDataLoad(statsData.length);
      setData(statsData);
    } catch (error) {
      chartPerf.trackInteraction('data-load-error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <div>
      {/* Chart implementation */}
    </div>
  );
}

// Example 4: Track calendar operations
export function CalendarIntegrationExample() {
  const perf = usePerformanceMonitor({
    componentName: 'TrainerCalendarView',
    enableAutoTracking: true
  });

  // Track calendar view changes
  const handleViewChange = (view: 'month' | 'week' | 'day') => {
    perf.mark(`calendar-view-start-${view}`);
    
    // ... update calendar view
    
    requestAnimationFrame(() => {
      perf.mark(`calendar-view-end-${view}`);
      perf.measureBetweenMarks(
        `calendar-view-change-${view}`,
        `calendar-view-start-${view}`,
        `calendar-view-end-${view}`,
        { view }
      );
    });
  };

  // Track event operations
  const handleEventClick = (event: any) => {
    perf.trackInteraction('calendar-event-click', {
      eventId: event.id,
      eventType: event.type
    });
  };

  const handleEventDrag = async (event: any, newDate: Date) => {
    try {
      await perf.trackApiCall('update-event-date', async () => {
        // API call to update event
        return { success: true };
      }, {
        eventId: event.id,
        oldDate: event.date,
        newDate
      });
    } catch (error) {
      // Error tracked automatically by trackApiCall
    }
  };

  return (
    <div>
      {/* Calendar implementation */}
    </div>
  );
}

// Example 5: Integration with existing PhysicalTrainerDashboard
export function integratePerformanceMonitoring(existingComponent: React.ComponentType) {
  // This shows how to add performance monitoring to the existing dashboard
  
  return function EnhancedDashboard(props: any) {
    const perf = usePerformanceMonitor({
      componentName: 'PhysicalTrainerDashboard',
      enableAutoTracking: true
    });

    // Add performance tracking to critical operations
    const enhancedProps = {
      ...props,
      onTabChange: (tab: string) => {
        perf.trackInteraction('tab-change', { tab });
        props.onTabChange?.(tab);
      },
      onWorkoutSave: async (workout: any) => {
        const result = await perf.trackApiCall('save-workout', 
          () => props.onWorkoutSave(workout),
          { workoutType: workout.type }
        );
        return result;
      },
      onDataLoad: async () => {
        const result = await perf.trackApiCall('load-dashboard-data',
          () => props.onDataLoad?.() || Promise.resolve(),
          { timestamp: new Date().toISOString() }
        );
        return result;
      }
    };

    return React.createElement(existingComponent, enhancedProps);
  };
}