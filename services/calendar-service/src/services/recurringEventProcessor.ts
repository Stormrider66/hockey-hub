import { Event } from '../entities/Event';
import { RecurrenceRule } from '../entities/RecurrenceRule';
import { 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears,
  isBefore,
  isAfter,
  isSameDay,
  startOfDay,
  endOfDay,
  getDay,
  setDate,
  setMonth,
  getDate,
  differenceInMinutes,
  format
} from 'date-fns';
// import { RRule, RRuleSet, rrulestr } from 'rrule'; // TODO: Add rrule support later

export class RecurringEventProcessor {
  /**
   * Generate recurring event instances based on a recurrence rule
   */
  static async generateRecurringEvents(
    baseEvent: Partial<Event>,
    recurrenceRule: RecurrenceRule,
    startRange: Date,
    endRange: Date
  ): Promise<Partial<Event>[]> {
    const events: Partial<Event>[] = [];
    
    // If RRULE string is provided, use rrule library
    if (recurrenceRule.rruleString) {
      return this.generateFromRRule(baseEvent, recurrenceRule.rruleString, startRange, endRange);
    }

    // Otherwise, use custom logic based on frequency
    const startDate = new Date(recurrenceRule.startDate);
    const endDate = recurrenceRule.endDate ? new Date(recurrenceRule.endDate) : endRange;
    const interval = recurrenceRule.interval || 1;
    
    let currentDate = new Date(startDate);
    let occurrenceCount = 0;
    const maxOccurrences = recurrenceRule.count || 1000; // Prevent infinite loops

    while (
      isBefore(currentDate, endDate) && 
      isBefore(currentDate, endRange) &&
      occurrenceCount < maxOccurrences
    ) {
      // Check if current date is within the query range
      if (isAfter(currentDate, startRange) || isSameDay(currentDate, startRange)) {
        // Check if this date is an exception
        if (!this.isExceptionDate(currentDate, recurrenceRule.exceptionDates)) {
          // Check if this date matches the pattern
          if (this.matchesPattern(currentDate, recurrenceRule)) {
            const eventInstance = this.createEventInstance(
              baseEvent,
              currentDate,
              occurrenceCount
            );
            events.push(eventInstance);
            occurrenceCount++;
          }
        }
      }

      // Move to next occurrence based on frequency
      currentDate = this.getNextOccurrence(currentDate, recurrenceRule);
      
      // Break if we've reached the count limit
      if (recurrenceRule.count && occurrenceCount >= recurrenceRule.count) {
        break;
      }
    }

    return events;
  }

  /**
   * Generate events using rrule library (placeholder for future implementation)
   */
  private static generateFromRRule(
    baseEvent: Partial<Event>,
    rruleString: string,
    startRange: Date,
    endRange: Date
  ): Partial<Event>[] {
    // TODO: Implement RRULE parsing when rrule library is added
    console.warn('RRULE parsing not yet implemented, using standard recurrence');
    return [];
  }

  /**
   * Create an event instance from the base event
   */
  private static createEventInstance(
    baseEvent: Partial<Event>,
    instanceDate: Date,
    instanceIndex: number
  ): Partial<Event> {
    const duration = baseEvent.endDate && baseEvent.startDate
      ? differenceInMinutes(new Date(baseEvent.endDate), new Date(baseEvent.startDate))
      : 60; // Default 1 hour

    const instanceStart = new Date(instanceDate);
    const instanceEnd = addMinutes(instanceStart, duration);

    return {
      ...baseEvent,
      id: undefined, // New instance needs new ID
      startDate: instanceStart,
      endDate: instanceEnd,
      isRecurring: true,
      seriesId: baseEvent.seriesId || baseEvent.id,
      parentEventId: baseEvent.id,
      title: `${baseEvent.title} (${format(instanceStart, 'MMM d, yyyy')})`,
      recurrenceInstanceIndex: instanceIndex,
    };
  }

  /**
   * Check if a date is in the exception list
   */
  private static isExceptionDate(date: Date, exceptionDates?: string[]): boolean {
    if (!exceptionDates || exceptionDates.length === 0) return false;
    
    return exceptionDates.some(exceptionDate => 
      isSameDay(date, new Date(exceptionDate))
    );
  }

  /**
   * Check if a date matches the recurrence pattern
   */
  private static matchesPattern(date: Date, rule: RecurrenceRule): boolean {
    switch (rule.frequency) {
      case 'daily':
        return true; // All days match for daily recurrence

      case 'weekly':
        if (rule.weekDays && rule.weekDays.length > 0) {
          const dayOfWeek = getDay(date);
          return rule.weekDays.includes(dayOfWeek);
        }
        return true;

      case 'monthly':
        if (rule.monthDays && rule.monthDays.length > 0) {
          const dayOfMonth = getDate(date);
          return rule.monthDays.includes(dayOfMonth);
        }
        return true;

      case 'yearly':
        if (rule.months && rule.months.length > 0) {
          const month = date.getMonth();
          return rule.months.includes(month);
        }
        return true;

      default:
        return true;
    }
  }

  /**
   * Get the next occurrence date based on frequency
   */
  private static getNextOccurrence(currentDate: Date, rule: RecurrenceRule): Date {
    const interval = rule.interval || 1;

    switch (rule.frequency) {
      case 'daily':
        return addDays(currentDate, interval);

      case 'weekly':
        // If specific weekdays are set, find the next matching day
        if (rule.weekDays && rule.weekDays.length > 0) {
          let nextDate = addDays(currentDate, 1);
          let daysChecked = 0;
          
          while (daysChecked < 7 * interval) {
            if (rule.weekDays.includes(getDay(nextDate))) {
              return nextDate;
            }
            nextDate = addDays(nextDate, 1);
            daysChecked++;
          }
        }
        return addWeeks(currentDate, interval);

      case 'monthly':
        return addMonths(currentDate, interval);

      case 'yearly':
        return addYears(currentDate, interval);

      default:
        return addDays(currentDate, 1);
    }
  }

  /**
   * Update a single instance of a recurring event
   */
  static async updateRecurringInstance(
    originalEvent: Event,
    instanceDate: Date,
    updates: Partial<Event>
  ): Promise<Partial<Event>> {
    // Create a new exception event
    const exceptionEvent: Partial<Event> = {
      ...originalEvent,
      ...updates,
      id: undefined, // New event
      parentEventId: originalEvent.parentEventId || originalEvent.id,
      seriesId: originalEvent.seriesId || originalEvent.id,
      isRecurring: true,
      recurrenceExceptionDate: instanceDate,
      recurrenceRuleId: null, // Exception doesn't follow the rule
    };

    // Add this date to the parent event's exception dates
    if (originalEvent.recurrenceRule) {
      const exceptionDates = originalEvent.recurrenceRule.exceptionDates || [];
      exceptionDates.push(instanceDate.toISOString());
      // This would need to be saved to the database
    }

    return exceptionEvent;
  }

  /**
   * Update all future instances of a recurring event
   */
  static async updateFutureInstances(
    originalEvent: Event,
    splitDate: Date,
    updates: Partial<Event>,
    newRecurrenceRule?: Partial<RecurrenceRule>
  ): Promise<{
    originalRule: Partial<RecurrenceRule>,
    newEvent: Partial<Event>
  }> {
    // Update the original recurrence rule to end before the split date
    const originalRuleUpdate: Partial<RecurrenceRule> = {
      endDate: addDays(splitDate, -1)
    };

    // Create a new event for future occurrences
    const newEvent: Partial<Event> = {
      ...originalEvent,
      ...updates,
      id: undefined, // New event
      seriesId: originalEvent.seriesId || originalEvent.id,
      isRecurring: true,
      startDate: splitDate,
    };

    // Create new recurrence rule for future events
    if (newRecurrenceRule) {
      newEvent.recurrenceRule = {
        ...originalEvent.recurrenceRule,
        ...newRecurrenceRule,
        startDate: splitDate,
        id: undefined, // New rule
      } as RecurrenceRule;
    }

    return {
      originalRule: originalRuleUpdate,
      newEvent
    };
  }

  /**
   * Delete a single instance of a recurring event
   */
  static async deleteRecurringInstance(
    event: Event,
    instanceDate: Date
  ): Promise<string[]> {
    // Add this date to the exception dates
    const exceptionDates = event.recurrenceRule?.exceptionDates || [];
    exceptionDates.push(instanceDate.toISOString());
    
    return exceptionDates;
  }

  /**
   * Delete all future instances of a recurring event
   */
  static async deleteFutureInstances(
    event: Event,
    deleteFromDate: Date
  ): Promise<Partial<RecurrenceRule>> {
    // Update the recurrence rule to end before the delete date
    return {
      endDate: addDays(deleteFromDate, -1)
    };
  }

  /**
   * Validate a recurrence rule
   */
  static validateRecurrenceRule(rule: Partial<RecurrenceRule>): string[] {
    const errors: string[] = [];

    if (!rule.frequency) {
      errors.push('Frequency is required');
    }

    if (rule.interval && rule.interval < 1) {
      errors.push('Interval must be at least 1');
    }

    if (rule.count && rule.count < 1) {
      errors.push('Count must be at least 1');
    }

    if (rule.endDate && rule.startDate && isAfter(new Date(rule.startDate), new Date(rule.endDate))) {
      errors.push('End date must be after start date');
    }

    if (rule.frequency === 'weekly' && rule.weekDays) {
      const invalidDays = rule.weekDays.filter(day => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        errors.push('Week days must be between 0 (Sunday) and 6 (Saturday)');
      }
    }

    if (rule.frequency === 'monthly' && rule.monthDays) {
      const invalidDays = rule.monthDays.filter(day => day < 1 || day > 31);
      if (invalidDays.length > 0) {
        errors.push('Month days must be between 1 and 31');
      }
    }

    if (rule.frequency === 'yearly' && rule.months) {
      const invalidMonths = rule.months.filter(month => month < 0 || month > 11);
      if (invalidMonths.length > 0) {
        errors.push('Months must be between 0 (January) and 11 (December)');
      }
    }

    return errors;
  }
}

// Helper function to add minutes to a date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}