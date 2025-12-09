import { useCallback, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Form optimization utilities for Physical Trainer forms
 * Reduces re-renders and improves performance
 */

interface FormFieldConfig<T> {
  name: keyof T;
  debounceMs?: number;
  validate?: (value: any) => string | undefined;
  transform?: (value: any) => any;
}

interface UseOptimizedFormConfig<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

interface OptimizedFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isDirty: boolean;
  handleChange: (name: keyof T, value: any) => void;
  handleBlur: (name: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  reset: () => void;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  getFieldProps: (name: keyof T) => {
    value: any;
    onChange: (e: React.ChangeEvent<any>) => void;
    onBlur: () => void;
    error?: string;
    touched?: boolean;
  };
}

/**
 * Optimized form hook with built-in performance optimizations
 */
export function useOptimizedForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300
}: UseOptimizedFormConfig<T>): OptimizedFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track dirty state
  const isDirty = useMemo(() => {
    return Object.keys(values).some(
      key => values[key as keyof T] !== initialValues[key as keyof T]
    );
  }, [values, initialValues]);
  
  // Debounced values for validation
  const debouncedValues = useDebounce(values, debounceMs);
  
  // Validation cache to prevent redundant validations
  const validationCache = useRef<Map<string, { value: any; error?: string }>>(new Map());
  
  // Memoized handlers
  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validateOnChange) {
      // Clear error immediately on change for better UX
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [validateOnChange]);
  
  const handleBlur = useCallback((name: keyof T) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    if (validateOnBlur) {
      // Validate field on blur
      const fieldValue = values[name];
      const cacheKey = `${String(name)}-${JSON.stringify(fieldValue)}`;
      
      if (!validationCache.current.has(cacheKey)) {
        // Perform validation if not cached
        // This is where you'd add field-specific validation
        validationCache.current.set(cacheKey, { value: fieldValue });
      }
    }
  }, [validateOnBlur, values]);
  
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    setIsSubmitting(true);
    
    try {
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => ({
        ...acc,
        [key]: true
      }), {} as Partial<Record<keyof T, boolean>>);
      setTouched(allTouched);
      
      // Validate all fields
      const hasErrors = Object.keys(errors).some(key => errors[key as keyof T]);
      
      if (!hasErrors) {
        await onSubmit(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, errors, onSubmit]);
  
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    validationCache.current.clear();
  }, [initialValues]);
  
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    handleChange(name, value);
  }, [handleChange]);
  
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);
  
  const getFieldProps = useCallback((name: keyof T) => ({
    value: values[name],
    onChange: (e: React.ChangeEvent<any>) => {
      const value = e.target.type === 'checkbox' 
        ? e.target.checked 
        : e.target.value;
      handleChange(name, value);
    },
    onBlur: () => handleBlur(name),
    error: errors[name],
    touched: touched[name]
  }), [values, errors, touched, handleChange, handleBlur]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    getFieldProps
  };
}

/**
 * Optimized select component handler
 * Prevents unnecessary re-renders for select dropdowns
 */
export function useOptimizedSelect<T>(
  value: T,
  onChange: (value: T) => void,
  options?: { debounceMs?: number }
) {
  const debouncedOnChange = useDebounce(onChange, options?.debounceMs || 0);
  
  const handleSelectChange = useCallback((newValue: T) => {
    if (options?.debounceMs) {
      debouncedOnChange(newValue);
    } else {
      onChange(newValue);
    }
  }, [onChange, debouncedOnChange, options?.debounceMs]);
  
  return {
    value,
    onChange: handleSelectChange
  };
}

/**
 * Optimized multi-select handler for arrays
 * Efficiently handles adding/removing items from arrays
 */
export function useOptimizedMultiSelect<T>(
  values: T[],
  onChange: (values: T[]) => void
) {
  const handleAdd = useCallback((item: T) => {
    if (!values.includes(item)) {
      onChange([...values, item]);
    }
  }, [values, onChange]);
  
  const handleRemove = useCallback((item: T) => {
    onChange(values.filter(v => v !== item));
  }, [values, onChange]);
  
  const handleToggle = useCallback((item: T) => {
    if (values.includes(item)) {
      handleRemove(item);
    } else {
      handleAdd(item);
    }
  }, [values, handleAdd, handleRemove]);
  
  return {
    values,
    add: handleAdd,
    remove: handleRemove,
    toggle: handleToggle,
    includes: (item: T) => values.includes(item)
  };
}

/**
 * Optimized number input handler
 * Handles number parsing and validation
 */
export function useOptimizedNumberInput(
  value: number | undefined,
  onChange: (value: number | undefined) => void,
  options?: {
    min?: number;
    max?: number;
    step?: number;
    debounceMs?: number;
  }
) {
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const debouncedOnChange = useDebounce(onChange, options?.debounceMs || 300);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);
    
    if (inputValue === '') {
      debouncedOnChange(undefined);
      return;
    }
    
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      let finalValue = numValue;
      
      if (options?.min !== undefined && numValue < options.min) {
        finalValue = options.min;
      }
      if (options?.max !== undefined && numValue > options.max) {
        finalValue = options.max;
      }
      
      debouncedOnChange(finalValue);
    }
  }, [debouncedOnChange, options]);
  
  return {
    value: localValue,
    onChange: handleChange,
    type: 'number',
    min: options?.min,
    max: options?.max,
    step: options?.step
  };
}

/**
 * Prevent form re-renders by memoizing static props
 */
export function useFormFieldProps<T extends Record<string, any>>(
  name: keyof T,
  form: OptimizedFormReturn<T>
) {
  return useMemo(() => ({
    ...form.getFieldProps(name),
    id: String(name),
    name: String(name)
  }), [name, form]);
}

/**
 * Batch form updates to reduce re-renders
 */
export function useBatchFormUpdates<T extends Record<string, any>>(
  form: OptimizedFormReturn<T>
) {
  const updateQueue = useRef<Array<{ name: keyof T; value: any }>>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const batchUpdate = useCallback((updates: Array<{ name: keyof T; value: any }>) => {
    updateQueue.current = [...updateQueue.current, ...updates];
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const batch = updateQueue.current;
      updateQueue.current = [];
      
      // Apply all updates at once
      batch.forEach(({ name, value }) => {
        form.setFieldValue(name, value);
      });
    }, 0);
  }, [form]);
  
  return batchUpdate;
}