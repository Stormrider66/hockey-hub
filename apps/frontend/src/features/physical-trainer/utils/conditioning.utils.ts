import type { IntervalSet } from '../types/conditioning.types';

/**
 * Expands intervals that have setConfig into individual intervals
 * @param intervals - Array of intervals, some may have setConfig
 * @returns Expanded array with all individual intervals
 */
export function expandIntervals(intervals: IntervalSet[]): IntervalSet[] {
  const expandedIntervals: IntervalSet[] = [];
  
  intervals.forEach((interval) => {
    if ((interval as any).setConfig) {
      const config = (interval as any).setConfig;
      const { numberOfSets, intervalsPerSet, restBetweenSets, restBetweenIntervals } = config;
      
      // Add all the sets
      for (let setIndex = 0; setIndex < numberOfSets; setIndex++) {
        // Add intervals within each set
        for (let intervalIndex = 0; intervalIndex < intervalsPerSet; intervalIndex++) {
          // Add the work interval
          const workInterval: IntervalSet = {
            ...interval,
            id: `${interval.id}-set${setIndex + 1}-interval${intervalIndex + 1}`,
            name: `${interval.name || 'Interval'} - Set ${setIndex + 1} Rep ${intervalIndex + 1}`,
            sourceIntervalId: interval.id
          };
          // Remove setConfig from the expanded interval
          delete (workInterval as any).setConfig;
          expandedIntervals.push(workInterval);
          
          // Add rest between intervals (not after the last interval in a set)
          if (intervalIndex < intervalsPerSet - 1 && restBetweenIntervals > 0) {
            const restInterval: IntervalSet = {
              id: `${interval.id}-set${setIndex + 1}-rest${intervalIndex + 1}`,
              type: 'rest',
              name: 'Rest',
              duration: restBetweenIntervals,
              equipment: interval.equipment,
              targetMetrics: {},
              color: '#94a3b8',
              sourceIntervalId: interval.id
            };
            expandedIntervals.push(restInterval);
          }
        }
        
        // Add rest between sets (not after the last set)
        if (setIndex < numberOfSets - 1 && restBetweenSets > 0) {
          const setRestInterval: IntervalSet = {
            id: `${interval.id}-set${setIndex + 1}-setrest`,
            type: 'rest',
            name: 'Rest between sets',
            duration: restBetweenSets,
            equipment: interval.equipment,
            targetMetrics: {},
            color: '#64748b',
            sourceIntervalId: interval.id
          };
          expandedIntervals.push(setRestInterval);
        }
      }
    } else {
      // Regular interval without setConfig
      expandedIntervals.push(interval);
    }
  });
  
  return expandedIntervals;
}

/**
 * Calculates the total duration of intervals including rest periods
 * @param intervals - Array of intervals (can include ones with setConfig)
 * @returns Total duration in seconds
 */
export function calculateTotalDuration(intervals: IntervalSet[]): number {
  let totalDuration = 0;
  
  intervals.forEach((interval) => {
    if ((interval as any).setConfig) {
      const config = (interval as any).setConfig;
      const { numberOfSets, intervalsPerSet, restBetweenSets, restBetweenIntervals } = config;
      
      // Calculate work duration
      const workDuration = interval.duration * intervalsPerSet * numberOfSets;
      
      // Calculate rest within sets
      const restWithinSets = restBetweenIntervals * (intervalsPerSet - 1) * numberOfSets;
      
      // Calculate rest between sets
      const restBetweenSetsTotal = restBetweenSets * (numberOfSets - 1);
      
      totalDuration += workDuration + restWithinSets + restBetweenSetsTotal;
    } else {
      totalDuration += interval.duration;
    }
  });
  
  return totalDuration;
}