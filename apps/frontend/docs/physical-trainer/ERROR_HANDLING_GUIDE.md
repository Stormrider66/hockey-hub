# Physical Trainer Error Handling System

A comprehensive, standardized error handling system for all workout builders in the Physical Trainer dashboard.

## Overview

This system provides:
- **Consistent error messages** across all workout types
- **User-friendly error displays** with actionable guidance
- **Developer-friendly error tracking** with support codes
- **Internationalization support** with translation keys
- **Field-specific validation** for forms
- **API error handling** with automatic parsing

## Architecture

### Core Components

1. **Error Messages (`constants/errorMessages.ts`)**
   - Defines all error codes and their properties
   - Categorizes errors (validation, network, medical, etc.)
   - Provides user messages, technical details, and suggested actions

2. **Error Formatting (`utils/errorFormatting.ts`)**
   - Formats errors for display
   - Handles translations and interpolation
   - Generates support codes for tracking

3. **Error Handler Hook (`hooks/useErrorHandler.ts`)**
   - React hook for managing error state
   - Provides validation helpers
   - Handles API error responses

4. **Error Display Components (`components/common/ErrorDisplay.tsx`)**
   - React components for displaying errors
   - Supports inline, alert, and list formats
   - Shows help links and actions

## Quick Start

### 1. Basic Error Handling

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

function MyWorkoutBuilder() {
  const errorHandler = useErrorHandler({
    showToast: true, // Show error toasts
    showTechnicalDetails: process.env.NODE_ENV === 'development'
  });

  const handleSave = async () => {
    try {
      // Validate first
      if (!validateWorkout()) {
        errorHandler.addError('VALIDATION_ERROR');
        return;
      }

      await saveWorkout();
    } catch (error) {
      // Automatically parse API errors
      errorHandler.handleApiError(error);
    }
  };

  const validateWorkout = () => {
    return errorHandler.validateFields([
      {
        field: 'name',
        condition: workoutName.length >= 3,
        errorCode: 'WORKOUT_NAME_TOO_SHORT'
      },
      {
        field: 'exercises',
        condition: exercises.length > 0,
        errorCode: 'NO_EXERCISES_SELECTED'
      }
    ]);
  };

  return (
    <div>
      {/* Show errors */}
      {errorHandler.hasErrors && (
        <ErrorList errors={errorHandler.errors} />
      )}
      
      {/* Form field with error */}
      <Input 
        value={workoutName}
        onChange={setWorkoutName}
        className={errorHandler.fieldErrors.name ? 'border-red-500' : ''}
      />
      <FieldError error={errorHandler.fieldErrors.name} field="name" />
    </div>
  );
}
```

### 2. Field-Specific Validation

```typescript
// Using built-in validation patterns
const validateWorkoutName = (name: string) => {
  const validation = commonValidations.workoutName(name);
  return errorHandler.validateFields(validation.validations.map(v => ({
    field: validation.field,
    condition: v.condition,
    errorCode: v.errorCode
  })));
};

// Custom validation
const validateCustomField = (value: any) => {
  if (!validationRules.required(value)) {
    errorHandler.addFieldError('customField', 'CUSTOM_FIELD_REQUIRED');
    return false;
  }
  return true;
};
```

### 3. Error Display Options

```typescript
// Inline error (small, for form fields)
<FieldError error={errorHandler.fieldErrors.name} field="name" />

// Single error alert
<ErrorDisplay error={formattedError} onDismiss={() => clearError()} />

// Multiple errors list
<ErrorList 
  errors={errorHandler.errors}
  maxVisible={3}
  onDismiss={(index) => errorHandler.removeError(index)}
/>
```

## Error Categories

### 1. Validation Errors
- `WORKOUT_NAME_REQUIRED` - Missing workout name
- `WORKOUT_NAME_TOO_SHORT` - Name less than 3 characters
- `NO_EXERCISES_SELECTED` - No exercises in workout
- `NO_INTERVALS_DEFINED` - No intervals in conditioning workout
- `INVALID_SETS_VALUE` - Sets not between 1-10
- `INVALID_REPS_VALUE` - Reps not between 1-100

### 2. Network Errors
- `CONNECTION_FAILED` - Network connection issues
- `TIMEOUT` - Request timeout
- `SERVER_ERROR` - 500 server errors
- `NOT_FOUND` - 404 resource not found

### 3. Permission Errors
- `UNAUTHORIZED` - 401 authentication required
- `FORBIDDEN` - 403 access denied
- `INSUFFICIENT_ROLE` - Role doesn't allow action

### 4. Medical Errors
- `MEDICAL_RESTRICTION` - Exercise restricted for player
- `INJURY_RISK` - High injury risk detected
- `NO_MEDICAL_CLEARANCE` - Medical clearance required

### 5. Conflict Errors
- `SCHEDULE_CONFLICT` - Time slot conflicts
- `PLAYER_UNAVAILABLE` - Player not available
- `DUPLICATE_SESSION` - Session already exists

## Adding New Error Types

### 1. Define the Error

```typescript
// In constants/errorMessages.ts
export const NEW_VALIDATION_ERRORS: Record<string, ErrorMessage> = {
  CUSTOM_ERROR_CODE: {
    code: 'CUSTOM_ERROR_CODE',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'User-friendly message',
    technicalMessage: 'Technical details for developers',
    helpText: 'How to fix this error',
    action: 'What user should do next',
    severity: ErrorSeverity.ERROR
  }
};

// Add to ERROR_MESSAGES
export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  ...VALIDATION_ERRORS,
  ...NEW_VALIDATION_ERRORS,
  // ... other categories
};
```

### 2. Add Translation

```json
// In public/locales/en/physicalTrainer.json
{
  "errors": {
    "CUSTOM_ERROR_CODE": {
      "message": "Custom error message with {{variable}}",
      "helpText": "Help text with context",
      "action": "Suggested action"
    }
  }
}
```

### 3. Use in Components

```typescript
// Add field validation
errorHandler.addFieldError('fieldName', 'CUSTOM_ERROR_CODE', {
  variable: 'interpolated value'
});

// Add general error
errorHandler.addError('CUSTOM_ERROR_CODE', { 
  details: { customData: 'value' }
});
```

## Best Practices

### 1. Error Messaging
- **Be specific**: Instead of "Invalid input", use "Workout name must be at least 3 characters"
- **Be actionable**: Tell users exactly what to do next
- **Be reassuring**: For technical errors, reassure users it's not their fault

### 2. Validation Timing
- **Real-time**: Clear field errors when user starts typing
- **On blur**: Validate individual fields when user leaves them
- **On submit**: Final validation before saving

### 3. Error Recovery
- **Auto-retry**: For network errors, provide retry buttons
- **Graceful degradation**: Continue working with partial functionality
- **Data preservation**: Don't lose user's work due to errors

### 4. Error Logging
- **Development**: Show technical details and stack traces
- **Production**: Log errors with support codes for tracking
- **User privacy**: Don't expose sensitive data in error messages

## Testing

### 1. Unit Tests
```typescript
import { getErrorMessage, parseApiError } from '../utils/errorFormatting';

describe('Error Formatting', () => {
  it('should format validation error correctly', () => {
    const error = getErrorMessage('WORKOUT_NAME_REQUIRED');
    expect(error?.message).toBe('Please enter a name for your workout');
    expect(error?.severity).toBe(ErrorSeverity.ERROR);
  });

  it('should parse API error correctly', () => {
    const apiError = { status: 400, data: { error: { code: 'VALIDATION_ERROR' } } };
    const error = parseApiError(apiError);
    expect(error.code).toBe('VALIDATION_ERROR');
  });
});
```

### 2. Integration Tests
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ConditioningWorkoutBuilder } from '../components/ConditioningWorkoutBuilder';

describe('Error Handling Integration', () => {
  it('should show validation error when saving without name', async () => {
    const { getByRole, getByText } = render(<ConditioningWorkoutBuilder />);
    
    fireEvent.click(getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(getByText('Please enter a name for your workout')).toBeInTheDocument();
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **Translations not showing**
   - Check that error code exists in translation file
   - Verify translation key format: `physicalTrainer:errors.ERROR_CODE.message`

2. **Field errors not clearing**
   - Call `errorHandler.clearFieldError(fieldName)` when user starts editing
   - Ensure field name matches exactly

3. **Support codes not generating**
   - Check that error category is properly defined
   - Verify ERROR_CODE_PREFIX mapping

### Debug Mode
```typescript
// Enable technical details in development
const errorHandler = useErrorHandler({
  showTechnicalDetails: true
});

// Show all error context
localStorage.setItem('showTechnicalErrors', 'true');
```

## Migration Guide

### Existing Components
To migrate existing workout builders:

1. **Replace toast.error() calls**
   ```typescript
   // Old way
   toast.error('Failed to save');
   
   // New way
   errorHandler.addError('SERVER_ERROR');
   ```

2. **Replace manual validation**
   ```typescript
   // Old way
   if (!workoutName) {
     setNameError('Name is required');
     return false;
   }
   
   // New way
   return errorHandler.validateFields([{
     field: 'name',
     condition: validationRules.required(workoutName),
     errorCode: 'WORKOUT_NAME_REQUIRED'
   }]);
   ```

3. **Replace manual error displays**
   ```typescript
   // Old way
   {nameError && <div className="text-red-500">{nameError}</div>}
   
   // New way
   <FieldError error={errorHandler.fieldErrors.name} field="name" />
   ```

## Support

For questions or issues with the error handling system:
- Check this documentation first
- Look at `ConditioningWorkoutBuilderWithErrors.tsx` for a complete example
- Review error definitions in `constants/errorMessages.ts`
- Test error flows in development mode with technical details enabled