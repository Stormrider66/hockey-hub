# Unified Validation System

A comprehensive validation framework for all workout types in the Physical Trainer module, providing real-time feedback, medical compliance checking, scheduling conflict detection, and standardized error handling.

## 🏗️ Architecture Overview

The validation system consists of several layers:

1. **API Layer** - Unified endpoints for different validation types
2. **Utilities Layer** - Helper functions, caching, and debouncing
3. **Hook Layer** - React hooks for easy component integration
4. **Component Layer** - UI components with built-in validation

## 📁 File Structure

```
src/features/physical-trainer/
├── types/
│   └── validation-api.types.ts     # Comprehensive type definitions
├── utils/
│   └── validationUtils.ts          # Utilities and helper functions
├── hooks/
│   └── useValidation.ts            # React hooks for validation
└── components/
    └── examples/
        └── ValidationExample.tsx   # Usage examples
```

## 🔌 API Endpoints

### Core Validation Endpoints

```typescript
// Full workout validation
POST /api/training/validation/workout
{
  workoutType: WorkoutType;
  data: ValidationData;
  context: ValidationContext;
  config?: ValidationRequestConfig;
}

// Content-only validation
POST /api/training/validation/content
{
  workoutType: WorkoutType;
  content: any;
  context: Pick<ValidationContext, 'organizationId' | 'teamId'>;
}

// Player assignment validation
POST /api/training/validation/assignments
{
  playerIds: string[];
  teamId?: string;
  workoutType: WorkoutType;
  context: ValidationContext;
}

// Medical compliance validation
POST /api/training/validation/medical
{
  playerIds: string[];
  workoutType: WorkoutType;
  exercises?: string[];
  intensityLevel?: number;
  duration?: number;
  context: ValidationContext;
}

// Schedule conflict validation
POST /api/training/validation/schedule
{
  startDateTime: string;
  duration: number;
  playerIds?: string[];
  teamId?: string;
  facilityId?: string;
  workoutType: WorkoutType;
  context: ValidationContext;
}
```

### Advanced Endpoints

```typescript
// Real-time field validation
POST /api/training/validation/field
{
  field: string;
  value: any;
  workoutType: string;
  context?: Record<string, any>;
}

// Progressive validation
POST /api/training/validation/progressive
{
  workoutType: string;
  currentStep: string;
  data: Record<string, any>;
  context?: Record<string, any>;
}

// Validation with auto-suggestions
POST /api/training/validation/with-suggestions
{
  ...ValidationRequest;
  includeSuggestions: true;
}

// Batch validation
POST /api/training/validation/batch
{
  requests: ValidationRequest[];
  config?: BatchValidationConfig;
}
```

## 🎯 Response Format

All validation endpoints return a standardized response:

```typescript
interface ValidationResponse {
  isValid: boolean;
  requestId?: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  metadata: ValidationMetadata;
  timestamp: string;
  processingTime: number;
}
```

### Error Structure

```typescript
interface ValidationError {
  code: string;                    // Unique error code
  message: string;                // Human-readable message
  field?: string;                 // Field that caused error
  severity: ValidationSeverity;   // ERROR | WARNING | INFO
  category: ValidationCategory;   // Type of validation rule
  context?: Record<string, any>;  // Additional context
  resolution?: string;            // Suggested fix
  helpUrl?: string;              // Link to documentation
}
```

### Warning Structure

```typescript
interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  category: ValidationCategory;
  recommendation?: string;
  impact?: 'low' | 'medium' | 'high';
  dismissible: boolean;
}
```

### Suggestion Structure

```typescript
interface ValidationSuggestion {
  type: SuggestionType;           // optimization | alternative | best_practice | etc.
  title: string;
  description: string;
  action?: SuggestionAction;      // Automated action to perform
  priority: 'low' | 'medium' | 'high';
  benefit?: string;
}
```

## 🔧 Usage Examples

### Basic Validation Hook

```typescript
import { useWorkoutValidationSuite } from '../hooks/useValidation';
import { WorkoutType } from '../types/validation.types';

const MyComponent = () => {
  const validation = useWorkoutValidationSuite(WorkoutType.STRENGTH);
  
  const handleValidate = async () => {
    try {
      const result = await validation.validate(
        { workout: workoutData },
        {
          userId: 'user-1',
          organizationId: 'org-1',
          teamId: 'team-1',
          playerIds: ['player-1', 'player-2']
        }
      );
      
      console.log('Validation result:', result);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };
  
  return (
    <button onClick={handleValidate} disabled={validation.isValidating}>
      {validation.isValidating ? 'Validating...' : 'Validate Workout'}
    </button>
  );
};
```

### Real-time Field Validation

```typescript
const MyForm = () => {
  const validation = useWorkoutValidationSuite(WorkoutType.CONDITIONING);
  
  const handleFieldChange = (field: string, value: any) => {
    // This will debounce the validation call
    validation.validateField(field, value, {
      workoutType: 'CONDITIONING',
      organizationId: 'org-1'
    });
  };
  
  const titleValidation = validation.getFieldValidation('title');
  
  return (
    <div>
      <input 
        onChange={(e) => handleFieldChange('title', e.target.value)}
        className={titleValidation.isValid ? 'valid' : 'invalid'}
      />
      {titleValidation.errors.map(error => (
        <div key={error} className="error">{error}</div>
      ))}
    </div>
  );
};
```

### Progressive Validation

```typescript
const WorkoutBuilder = () => {
  const progressiveValidation = useProgressiveValidation(
    WorkoutType.HYBRID,
    ['basic_info', 'content', 'players', 'schedule', 'review']
  );
  
  const handleNextStep = async () => {
    const stepData = getCurrentStepData();
    
    const result = await progressiveValidation.validateCurrentStep(
      stepData,
      { workoutType: 'HYBRID', organizationId: 'org-1' }
    );
    
    if (result.canProceed) {
      progressiveValidation.nextStep();
    }
  };
  
  return (
    <div>
      <div>Step {progressiveValidation.progress.current} of {progressiveValidation.progress.total}</div>
      <div>Current: {progressiveValidation.currentStep}</div>
      <button onClick={handleNextStep} disabled={!progressiveValidation.canProceed}>
        Next Step
      </button>
    </div>
  );
};
```

### Medical Compliance Validation

```typescript
const MedicalSafetyCheck = () => {
  const validation = useWorkoutValidationSuite(WorkoutType.STRENGTH);
  
  const checkMedicalCompliance = async (playerIds: string[]) => {
    try {
      const result = await validation.validateMedical(
        playerIds,
        { organizationId: 'org-1' },
        {
          exercises: ['bench-press', 'squats'],
          intensityLevel: 8,
          duration: 90
        }
      );
      
      if (!result.isCompliant) {
        console.log('Medical restrictions found:', result.playerRisks);
        console.log('Exercise restrictions:', result.exerciseRestrictions);
        console.log('Suggested modifications:', result.modifications);
      }
    } catch (error) {
      console.error('Medical validation failed:', error);
    }
  };
  
  return (
    <button onClick={() => checkMedicalCompliance(['player-005'])}>
      Check Medical Compliance
    </button>
  );
};
```

## ⚙️ Configuration

### Real-time Validation Config

```typescript
interface RealTimeValidationConfig {
  enabled: boolean;
  debounceMs: number;                    // Debounce delay for field validation
  fields: string[];                     // Fields to validate in real-time
  triggers: ValidationTrigger[];        // When to trigger validation
  cache?: {
    enabled: boolean;
    ttlMs: number;                      // Cache time-to-live
    maxEntries: number;                 // Maximum cache entries
  };
}
```

### Validation Request Config

```typescript
interface ValidationRequestConfig {
  strictness: 'lenient' | 'normal' | 'strict';
  includeMedical: boolean;              // Include medical compliance checks
  includeScheduling: boolean;           // Include scheduling conflict checks
  includeFacility: boolean;             // Include facility/equipment checks
  includePerformance: boolean;          // Include performance/safety checks
  includeSuggestions: boolean;          // Return suggestions along with errors
  timeout?: number;                     // Maximum response time in ms
}
```

## 🎨 UI Components

### Validation Status Display

```typescript
const ValidationStatus = ({ response }: { response: ValidationResponse }) => {
  const summary = validationUtils.getValidationSummary(response);
  
  return (
    <div className={`validation-status ${summary.status}`}>
      <div>Score: {summary.score}/100</div>
      
      {summary.topIssues.map(issue => (
        <div key={issue} className="issue">{issue}</div>
      ))}
      
      {summary.recommendations.map(rec => (
        <div key={rec} className="recommendation">{rec}</div>
      ))}
    </div>
  );
};
```

### Field Validation Indicator

```typescript
const FieldValidationIndicator = ({ 
  fieldName, 
  validation 
}: { 
  fieldName: string;
  validation: ReturnType<typeof useWorkoutValidationSuite>;
}) => {
  const fieldValidation = validation.getFieldValidation(fieldName);
  
  if (fieldValidation.errors.length > 0) {
    return <XCircle className="text-red-500" />;
  }
  
  if (fieldValidation.warnings.length > 0) {
    return <AlertTriangle className="text-orange-500" />;
  }
  
  if (fieldValidation.isValid) {
    return <CheckCircle className="text-green-500" />;
  }
  
  return null;
};
```

## 🛠️ Utilities

### Validation Cache

```typescript
import { ValidationCache } from '../utils/validationUtils';

const cache = new ValidationCache(100, 5 * 60 * 1000); // 100 entries, 5min TTL

// Cache validation result
cache.set(cacheKey, request, response);

// Retrieve from cache
const cachedResponse = cache.get(cacheKey);

// Get cache statistics
const stats = cache.getStats();
```

### Debouncer

```typescript
import { ValidationDebouncer } from '../utils/validationUtils';

const debouncer = new ValidationDebouncer(300); // 300ms delay

// Debounced validation
const debouncedValidate = debouncer.debounce(
  'field-title',
  (value) => validateField('title', value),
  500 // Custom delay for this field
);
```

### Progressive Validation Manager

```typescript
import { ProgressiveValidationManager } from '../utils/validationUtils';

const manager = new ProgressiveValidationManager([
  'basic_info', 'content', 'players', 'schedule', 'review'
]);

// Set data for current step
manager.setStepData('basic_info', { title: 'My Workout' });

// Move to next step
if (manager.canProceedToNext()) {
  manager.nextStep();
}

// Get overall validation status
const summary = manager.getOverallValidation();
```

## 🔒 Error Handling

### Error Types

```typescript
// Validation timeout
interface ValidationTimeoutError extends ValidationApiError {
  code: 'VALIDATION_TIMEOUT';
  timeout: number;
  partialResults?: Partial<ValidationResponse>;
}

// Network error
interface ValidationNetworkError extends ValidationApiError {
  code: 'VALIDATION_NETWORK_ERROR';
  retryable: boolean;
  retryAfter?: number;
}
```

### Error Utilities

```typescript
import { validationUtils } from '../utils/validationUtils';

// Format any error into standard structure
const formattedError = validationUtils.formatValidationError(error);

// Check error types
if (validationUtils.isTimeoutError(error)) {
  // Handle timeout
}

if (validationUtils.isNetworkError(error)) {
  // Handle network issue
}

if (validationUtils.shouldRetryValidation(error)) {
  // Implement retry logic
}
```

## 🧪 Testing

### Mock Validation Responses

The system includes comprehensive mock data for testing:

```typescript
// Mock handlers are automatically enabled when NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
const mockResponse = {
  isValid: true,
  errors: [],
  warnings: [
    {
      code: 'RECOMMENDED_REST',
      message: 'Consider adding more rest between high-intensity intervals',
      category: 'PERFORMANCE_LIMIT'
    }
  ],
  suggestions: [
    {
      type: 'optimization',
      title: 'Optimize Rest Periods',
      description: 'Adding 30 seconds rest can improve performance',
      priority: 'medium'
    }
  ],
  metadata: {
    score: 85,
    confidence: 'high',
    processingTime: 245
  }
};
```

## 🚀 Performance Optimizations

1. **Debouncing** - Field validation is debounced to prevent excessive API calls
2. **Caching** - Validation results are cached with configurable TTL
3. **Progressive Loading** - Step-by-step validation reduces initial load
4. **Batch Operations** - Multiple validations can be batched together
5. **Client-side Pre-validation** - Basic checks happen immediately

## 📊 Monitoring & Analytics

The validation system includes built-in performance monitoring:

```typescript
interface ValidationMetadata {
  rulesApplied: string[];
  performance: {
    totalTime: number;
    breakdown: Record<string, number>;  // Time by validation type
    cacheHitRatio?: number;
  };
  score: number;                        // Overall validation score (0-100)
  confidence: 'low' | 'medium' | 'high';
  externalServices?: string[];          // Services consulted
  engineVersion: string;
}
```

## 🔄 Future Enhancements

1. **AI-powered Suggestions** - Machine learning recommendations
2. **Custom Rule Engine** - User-defined validation rules
3. **Workflow Integration** - Integration with approval workflows
4. **Advanced Analytics** - Validation patterns and insights
5. **Multi-language Support** - Localized error messages
6. **Offline Support** - Client-side validation when offline

## 📚 Related Documentation

- [Physical Trainer Overview](../../docs/FEATURES-OVERVIEW.md#physical-trainer)
- [Medical Integration Guide](./MEDICAL-INTEGRATION.md)
- [API Documentation](../../docs/API.md)
- [Testing Guide](../../docs/reports/test-coverage.md)

---

This validation system provides a robust, scalable foundation for ensuring workout quality, safety, and compliance across all workout types in the Hockey Hub platform.