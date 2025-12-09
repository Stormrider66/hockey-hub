/**
 * Bulk Session Validation System
 * 
 * A unified validation system for bulk operations across all workout types.
 * Provides real-time validation, error reporting, and suggestions for improvement.
 */

import type { WorkoutEquipmentType } from '../types/conditioning.types';
import type { 
  BulkSessionConfig, 
  SessionConfiguration, 
  EquipmentAvailability,
  FacilityInfo 
} from '../hooks/useBulkSession';

// ===============================
// Validation Types
// ===============================

export interface ValidationRule<T = any> {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'basic' | 'equipment' | 'players' | 'timing' | 'facility' | 'medical';
  validate: (data: T, context: ValidationContext) => ValidationResult;
  autoFix?: (data: T, context: ValidationContext) => T;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  suggestion?: string;
  metadata?: Record<string, any>;
}

export interface ValidationContext {
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  availableEquipment: EquipmentAvailability[];
  facilities: FacilityInfo[];
  playerData?: Record<string, any>;
  medicalRestrictions?: Record<string, string[]>;
  timeConstraints?: {
    facilityHours: { open: string; close: string };
    blackoutTimes: { start: string; end: string }[];
  };
}

export interface BulkValidationReport {
  overall: {
    valid: boolean;
    score: number; // 0-100
    criticalIssues: number;
    warnings: number;
  };
  stepResults: Record<string, StepValidationResult>;
  suggestions: ValidationSuggestion[];
  autoFixable: boolean;
}

export interface StepValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
}

export interface ValidationIssue {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  sessionId?: string;
  field?: string;
  metadata?: Record<string, any>;
}

export interface ValidationSuggestion {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  autoFixable: boolean;
}

// ===============================
// Core Validation Rules
// ===============================

const basicValidationRules: ValidationRule<BulkSessionConfig>[] = [
  {
    id: 'min-sessions',
    name: 'Minimum Sessions',
    description: 'Bulk operations require at least 2 sessions',
    severity: 'error',
    category: 'basic',
    validate: (config) => ({
      valid: config.numberOfSessions >= 2,
      message: config.numberOfSessions < 2 ? 'Minimum 2 sessions required for bulk operations' : undefined
    }),
    autoFix: (config) => ({ ...config, numberOfSessions: Math.max(2, config.numberOfSessions) })
  },
  {
    id: 'max-sessions',
    name: 'Maximum Sessions',
    description: 'Bulk operations support maximum 8 sessions',
    severity: 'error',
    category: 'basic',
    validate: (config) => ({
      valid: config.numberOfSessions <= 8,
      message: config.numberOfSessions > 8 ? 'Maximum 8 sessions allowed' : undefined
    }),
    autoFix: (config) => ({ ...config, numberOfSessions: Math.min(8, config.numberOfSessions) })
  },
  {
    id: 'session-duration',
    name: 'Session Duration',
    description: 'Session duration must be between 15 and 180 minutes',
    severity: 'error',
    category: 'basic',
    validate: (config) => ({
      valid: config.duration >= 15 && config.duration <= 180,
      message: config.duration < 15 ? 'Minimum duration is 15 minutes' : 
               config.duration > 180 ? 'Maximum duration is 180 minutes' : undefined
    }),
    autoFix: (config) => ({ 
      ...config, 
      duration: Math.min(180, Math.max(15, config.duration))
    })
  },
  {
    id: 'facility-selected',
    name: 'Facility Selection',
    description: 'A facility must be selected for bulk sessions',
    severity: 'error',
    category: 'facility',
    validate: (config) => ({
      valid: !!config.facilityId,
      message: !config.facilityId ? 'Please select a facility' : undefined
    })
  },
  {
    id: 'session-names',
    name: 'Session Names',
    description: 'All sessions must have unique, non-empty names',
    severity: 'error',
    category: 'basic',
    validate: (config) => {
      const names = config.sessions.map(s => s.name.trim()).filter(Boolean);
      const uniqueNames = new Set(names);
      
      const emptyNames = config.sessions.filter(s => !s.name.trim());
      const duplicateNames = names.length !== uniqueNames.size;
      
      return {
        valid: emptyNames.length === 0 && !duplicateNames,
        message: emptyNames.length > 0 ? 'All sessions must have names' :
                 duplicateNames ? 'Session names must be unique' : undefined
      };
    }
  }
];

const equipmentValidationRules: ValidationRule<BulkSessionConfig>[] = [
  {
    id: 'equipment-selection',
    name: 'Equipment Selection',
    description: 'Conditioning and hybrid workouts require equipment selection',
    severity: 'error',
    category: 'equipment',
    validate: (config, context) => {
      if (context.workoutType !== 'conditioning' && context.workoutType !== 'hybrid') {
        return { valid: true };
      }
      
      const sessionsWithoutEquipment = config.sessions.filter(
        session => !session.equipment || session.equipment.length === 0
      );
      
      return {
        valid: sessionsWithoutEquipment.length === 0,
        message: sessionsWithoutEquipment.length > 0 ? 
          `${sessionsWithoutEquipment.length} sessions missing equipment selection` : undefined,
        metadata: { affectedSessions: sessionsWithoutEquipment.map(s => s.id) }
      };
    }
  },
  {
    id: 'equipment-conflicts',
    name: 'Equipment Availability',
    description: 'Check equipment availability for simultaneous sessions',
    severity: 'error',
    category: 'equipment',
    validate: (config, context) => {
      if (config.allowEquipmentConflicts || context.availableEquipment.length === 0) {
        return { valid: true };
      }
      
      const usage = new Map<WorkoutEquipmentType, number>();
      const conflicts: { equipment: WorkoutEquipmentType; needed: number; available: number }[] = [];
      
      config.sessions.forEach(session => {
        session.equipment?.forEach(equipment => {
          usage.set(equipment, (usage.get(equipment) || 0) + 1);
        });
      });
      
      usage.forEach((needed, equipment) => {
        const available = context.availableEquipment.find(eq => eq.type === equipment)?.available || 0;
        if (needed > available) {
          conflicts.push({ equipment, needed, available });
        }
      });
      
      return {
        valid: conflicts.length === 0,
        message: conflicts.length > 0 ? 
          `Equipment conflicts: ${conflicts.map(c => `${c.equipment} (need ${c.needed}, have ${c.available})`).join(', ')}` : undefined,
        suggestion: conflicts.length > 0 ? 'Consider enabling equipment conflicts or staggering start times' : undefined,
        metadata: { conflicts }
      };
    }
  }
];

const playerValidationRules: ValidationRule<BulkSessionConfig>[] = [
  {
    id: 'player-assignment',
    name: 'Player Assignment',
    description: 'All sessions must have assigned players or teams',
    severity: 'error',
    category: 'players',
    validate: (config) => {
      const sessionsWithoutPlayers = config.sessions.filter(
        session => session.playerIds.length === 0 && session.teamIds.length === 0
      );
      
      return {
        valid: sessionsWithoutPlayers.length === 0,
        message: sessionsWithoutPlayers.length > 0 ? 
          `${sessionsWithoutPlayers.length} sessions have no assigned participants` : undefined,
        metadata: { affectedSessions: sessionsWithoutPlayers.map(s => s.id) }
      };
    }
  },
  {
    id: 'player-balance',
    name: 'Player Distribution',
    description: 'Check for balanced player distribution across sessions',
    severity: 'warning',
    category: 'players',
    validate: (config) => {
      const playerCounts = config.sessions.map(s => s.playerIds.length);
      const min = Math.min(...playerCounts);
      const max = Math.max(...playerCounts);
      const variance = max - min;
      
      return {
        valid: variance <= 2,
        message: variance > 2 ? 
          `Unbalanced player distribution (${min}-${max} players per session)` : undefined,
        suggestion: variance > 2 ? 'Consider using auto-distribute to balance player assignments' : undefined,
        metadata: { min, max, variance }
      };
    }
  }
];

const timingValidationRules: ValidationRule<BulkSessionConfig>[] = [
  {
    id: 'stagger-timing',
    name: 'Stagger Timing',
    description: 'Validate staggered start times are reasonable',
    severity: 'warning',
    category: 'timing',
    validate: (config) => {
      if (!config.staggerStartTimes) return { valid: true };
      
      const shortInterval = config.staggerInterval < 10;
      
      return {
        valid: !shortInterval,
        message: shortInterval ? 
          'Short stagger intervals may not provide sufficient setup time' : undefined,
        suggestion: shortInterval ? 'Consider intervals of at least 10 minutes' : undefined
      };
    }
  },
  {
    id: 'facility-hours',
    name: 'Facility Operating Hours',
    description: 'Ensure all sessions fit within facility operating hours',
    severity: 'error',
    category: 'timing',
    validate: (config, context) => {
      if (!context.timeConstraints?.facilityHours) return { valid: true };
      
      const { open, close } = context.timeConstraints.facilityHours;
      const [openHour, openMin] = open.split(':').map(Number);
      const [closeHour, closeMin] = close.split(':').map(Number);
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      
      const violations: string[] = [];
      
      config.sessions.forEach((session, index) => {
        const startTime = session.startTime || config.sessionTime;
        const [startHour, startMin] = startTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = startMinutes + config.duration;
        
        if (startMinutes < openMinutes || endMinutes > closeMinutes) {
          violations.push(`Session ${index + 1}`);
        }
      });
      
      return {
        valid: violations.length === 0,
        message: violations.length > 0 ? 
          `Sessions outside facility hours: ${violations.join(', ')}` : undefined,
        suggestion: violations.length > 0 ? 
          'Adjust start times or reduce duration to fit within facility hours' : undefined
      };
    }
  }
];

// ===============================
// Validation Engine
// ===============================

export class BulkSessionValidator {
  private rules: Map<string, ValidationRule[]> = new Map();

  constructor() {
    this.registerRules('basic', basicValidationRules);
    this.registerRules('equipment', equipmentValidationRules);
    this.registerRules('players', playerValidationRules);
    this.registerRules('timing', timingValidationRules);
  }

  registerRules(category: string, rules: ValidationRule[]) {
    this.rules.set(category, rules);
  }

  registerRule(category: string, rule: ValidationRule) {
    const existing = this.rules.get(category) || [];
    this.rules.set(category, [...existing, rule]);
  }

  validateConfiguration(
    config: BulkSessionConfig,
    context: ValidationContext,
    steps: string[] = ['basic', 'equipment', 'players', 'timing']
  ): BulkValidationReport {
    const stepResults: Record<string, StepValidationResult> = {};
    const allIssues: ValidationIssue[] = [];
    let criticalIssues = 0;
    let warnings = 0;

    // Run validation for each step
    steps.forEach(step => {
      const rules = this.rules.get(step) || [];
      const issues = this.runRulesForStep(rules, config, context, step);
      
      stepResults[step] = {
        valid: issues.filter(i => i.severity === 'error').length === 0,
        errors: issues.filter(i => i.severity === 'error'),
        warnings: issues.filter(i => i.severity === 'warning'),
        infos: issues.filter(i => i.severity === 'info')
      };

      allIssues.push(...issues);
      criticalIssues += stepResults[step].errors.length;
      warnings += stepResults[step].warnings.length;
    });

    // Generate suggestions
    const suggestions = this.generateSuggestions(allIssues, config, context);

    // Calculate score
    const totalChecks = steps.reduce((sum, step) => sum + (this.rules.get(step)?.length || 0), 0);
    const passedChecks = totalChecks - criticalIssues - (warnings * 0.5);
    const score = Math.max(0, Math.round((passedChecks / totalChecks) * 100));

    return {
      overall: {
        valid: criticalIssues === 0,
        score,
        criticalIssues,
        warnings
      },
      stepResults,
      suggestions,
      autoFixable: allIssues.some(issue => this.isAutoFixable(issue.ruleId))
    };
  }

  private runRulesForStep(
    rules: ValidationRule[],
    config: BulkSessionConfig,
    context: ValidationContext,
    step: string
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    rules.forEach(rule => {
      try {
        const result = rule.validate(config, context);
        
        if (!result.valid && result.message) {
          issues.push({
            ruleId: rule.id,
            severity: rule.severity,
            message: result.message,
            suggestion: result.suggestion,
            metadata: result.metadata
          });
        }
      } catch (error) {
        console.error(`Validation rule ${rule.id} failed:`, error);
        issues.push({
          ruleId: rule.id,
          severity: 'error',
          message: `Validation rule failed: ${rule.name}`,
          metadata: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    });

    return issues;
  }

  private generateSuggestions(
    issues: ValidationIssue[],
    config: BulkSessionConfig,
    context: ValidationContext
  ): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];

    // Equipment conflict suggestions
    const equipmentIssues = issues.filter(i => i.ruleId === 'equipment-conflicts');
    if (equipmentIssues.length > 0) {
      suggestions.push({
        id: 'enable-equipment-conflicts',
        category: 'equipment',
        priority: 'medium',
        title: 'Allow Equipment Conflicts',
        description: 'Enable sharing equipment between sessions if manual coordination is possible',
        action: 'Toggle "Allow Equipment Conflicts" setting',
        autoFixable: true
      });

      suggestions.push({
        id: 'stagger-for-equipment',
        category: 'timing',
        priority: 'high',
        title: 'Stagger Start Times',
        description: 'Offset session start times to reduce equipment conflicts',
        action: 'Enable "Stagger Start Times" with appropriate intervals',
        autoFixable: true
      });
    }

    // Player distribution suggestions
    const playerIssues = issues.filter(i => i.ruleId === 'player-balance');
    if (playerIssues.length > 0) {
      suggestions.push({
        id: 'auto-distribute-players',
        category: 'players',
        priority: 'medium',
        title: 'Auto-Distribute Players',
        description: 'Automatically balance player assignments across sessions',
        action: 'Use the "Auto-Distribute Players" feature',
        autoFixable: true
      });
    }

    // Timing suggestions
    const timingIssues = issues.filter(i => i.ruleId === 'facility-hours');
    if (timingIssues.length > 0) {
      suggestions.push({
        id: 'adjust-timing',
        category: 'timing',
        priority: 'high',
        title: 'Adjust Session Times',
        description: 'Modify start times or duration to fit within facility operating hours',
        action: 'Update session start times or reduce duration',
        autoFixable: false
      });
    }

    return suggestions;
  }

  private isAutoFixable(ruleId: string): boolean {
    const allRules = Array.from(this.rules.values()).flat();
    const rule = allRules.find(r => r.id === ruleId);
    return !!rule?.autoFix;
  }

  applyAutoFix(
    config: BulkSessionConfig,
    context: ValidationContext,
    ruleId: string
  ): BulkSessionConfig | null {
    const allRules = Array.from(this.rules.values()).flat();
    const rule = allRules.find(r => r.id === ruleId);
    
    if (!rule?.autoFix) return null;

    try {
      return rule.autoFix(config, context);
    } catch (error) {
      console.error(`Auto-fix failed for rule ${ruleId}:`, error);
      return null;
    }
  }

  applyAllAutoFixes(
    config: BulkSessionConfig,
    context: ValidationContext,
    report: BulkValidationReport
  ): BulkSessionConfig {
    let fixedConfig = { ...config };
    
    // Apply all available auto-fixes
    Object.values(report.stepResults).forEach(stepResult => {
      stepResult.errors.forEach(error => {
        const fixed = this.applyAutoFix(fixedConfig, context, error.ruleId);
        if (fixed) {
          fixedConfig = fixed;
        }
      });
    });

    return fixedConfig;
  }
}

// ===============================
// Export Singleton Instance
// ===============================

export const bulkValidator = new BulkSessionValidator();

export default bulkValidator;