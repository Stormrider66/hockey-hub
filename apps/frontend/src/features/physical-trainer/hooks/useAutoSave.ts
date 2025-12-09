import { useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { debounce } from 'lodash';

interface UseAutoSaveOptions {
  key: string;
  data: any;
  enabled?: boolean;
  delay?: number;
  onSave?: () => void;
  onRestore?: (data: any) => void;
}

export function useAutoSave({
  key,
  data,
  enabled = true,
  delay = 2000,
  onSave,
  onRestore
}: UseAutoSaveOptions) {
  const lastSaveRef = useRef<string>('');
  const isRestoringRef = useRef(false);

  // Debounced save function
  const saveToLocalStorage = useCallback(
    debounce((dataToSave: any) => {
      if (!enabled || isRestoringRef.current) return;

      try {
        const serialized = JSON.stringify({
          data: dataToSave,
          timestamp: new Date().toISOString(),
          version: '1.0'
        });

        // Only save if data has changed
        if (serialized !== lastSaveRef.current) {
          localStorage.setItem(key, serialized);
          lastSaveRef.current = serialized;
          
          if (onSave) {
            onSave();
          }
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast({
          title: "Auto-save failed",
          description: "Your work may not be saved automatically",
          variant: "destructive"
        });
      }
    }, delay),
    [key, enabled, delay, onSave]
  );

  // Save data when it changes
  useEffect(() => {
    if (data && enabled && !isRestoringRef.current) {
      saveToLocalStorage(data);
    }
  }, [data, enabled, saveToLocalStorage]);

  // Listen for restore events
  useEffect(() => {
    const handleRestore = (event: CustomEvent) => {
      if (event.detail?.sessionId && event.detail.sessionId === key) {
        isRestoringRef.current = true;
        if (onRestore) {
          onRestore(event.detail.data);
        }
        // Clear the restored flag after a delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener('restoreAutoSave', handleRestore as EventListener);
    return () => {
      window.removeEventListener('restoreAutoSave', handleRestore as EventListener);
    };
  }, [key, onRestore]);

  // Get saved data
  const getSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data;
      }
    } catch (error) {
      console.error('Failed to retrieve auto-save:', error);
    }
    return null;
  }, [key]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(key);
      lastSaveRef.current = '';
    } catch (error) {
      console.error('Failed to clear auto-save:', error);
    }
  }, [key]);

  // Check if auto-save exists
  const hasAutoSave = useCallback(() => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }, [key]);

  return {
    getSavedData,
    clearSavedData,
    hasAutoSave,
    saveNow: () => saveToLocalStorage(data)
  };
}