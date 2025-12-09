/**
 * Cache Migration v1.0.0
 * 
 * Example migration file showing how to handle data structure changes
 * when upgrading from older cache versions.
 */

import { CacheEntry } from '../cacheMigration';

/**
 * Migration from pre-1.0.0 to 1.0.0
 * 
 * Changes:
 * - Added user preferences structure
 * - Added lastActive timestamp to users
 * - Restructured workout session data
 * - Added version field to all cache entries
 */
export function migrateToV100(entry: CacheEntry): CacheEntry {
  const { data } = entry;
  
  // Migrate user data
  if (data && data.users) {
    data.users = data.users.map((user: any) => ({
      ...user,
      // Add new fields
      preferences: user.preferences || {
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        theme: 'light',
        timezone: 'UTC'
      },
      lastActive: user.lastActive || Date.now(),
      // Ensure role is properly structured
      role: typeof user.role === 'string' ? { name: user.role } : user.role
    }));
  }
  
  // Migrate workout sessions
  if (data && data.workoutSessions) {
    data.workoutSessions = data.workoutSessions.map((session: any) => ({
      ...session,
      // Ensure type field exists
      type: session.type || 'STRENGTH',
      // Add metadata if missing
      metadata: session.metadata || {
        createdAt: session.createdAt || Date.now(),
        updatedAt: session.updatedAt || Date.now(),
        version: '1.0.0'
      },
      // Ensure players array exists
      assignedPlayers: session.assignedPlayers || session.players || [],
      // Remove old players field
      players: undefined
    }));
  }
  
  // Migrate calendar events
  if (data && data.events) {
    data.events = data.events.map((event: any) => ({
      ...event,
      // Add recurring field if missing
      recurring: event.recurring || false,
      // Ensure participants is an array
      participants: Array.isArray(event.participants) 
        ? event.participants 
        : event.participants 
          ? [event.participants] 
          : [],
      // Add metadata
      metadata: {
        createdBy: event.createdBy || 'system',
        createdAt: event.createdAt || Date.now(),
        lastModified: event.lastModified || Date.now()
      }
    }));
  }
  
  // Migrate medical records
  if (data && data.medicalRecords) {
    data.medicalRecords = data.medicalRecords.map((record: any) => ({
      ...record,
      // Ensure severity is standardized
      severity: normalizeSeverity(record.severity),
      // Add compliance fields
      exerciseRestrictions: record.exerciseRestrictions || [],
      loadModifications: record.loadModifications || {},
      // Add timeline if missing
      timeline: record.timeline || {
        injuryDate: record.date || Date.now(),
        expectedRecovery: record.expectedRecovery || null,
        lastAssessment: record.lastAssessment || Date.now()
      }
    }));
  }
  
  // Add version to the entry
  return {
    ...entry,
    data,
    version: '1.0.0',
    timestamp: Date.now()
  };
}

/**
 * Helper function to normalize severity values
 */
function normalizeSeverity(severity: any): 'low' | 'moderate' | 'high' | 'critical' {
  if (typeof severity === 'string') {
    const normalized = severity.toLowerCase();
    switch (normalized) {
      case 'low':
      case 'minor':
      case 'mild':
        return 'low';
      case 'moderate':
      case 'medium':
        return 'moderate';
      case 'high':
      case 'severe':
        return 'high';
      case 'critical':
      case 'emergency':
        return 'critical';
      default:
        return 'moderate';
    }
  }
  
  // If severity is a number (1-4 scale)
  if (typeof severity === 'number') {
    if (severity <= 1) return 'low';
    if (severity <= 2) return 'moderate';
    if (severity <= 3) return 'high';
    return 'critical';
  }
  
  return 'moderate';
}

/**
 * Validation function to ensure migration was successful
 */
export function validateV100Migration(data: any): boolean {
  try {
    // Check users have required new fields
    if (data.users) {
      for (const user of data.users) {
        if (!user.preferences || !user.lastActive) {
          return false;
        }
      }
    }
    
    // Check workout sessions have type field
    if (data.workoutSessions) {
      for (const session of data.workoutSessions) {
        if (!session.type || !session.metadata) {
          return false;
        }
      }
    }
    
    // Check events have metadata
    if (data.events) {
      for (const event of data.events) {
        if (!event.metadata || !Array.isArray(event.participants)) {
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Migration validation failed:', error);
    return false;
  }
}