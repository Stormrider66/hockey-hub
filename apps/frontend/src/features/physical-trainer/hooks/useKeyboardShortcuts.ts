import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface KeyboardShortcut {
  key: string;
  description: string;
  handler: () => void;
  category: string;
}

interface UseKeyboardShortcutsProps {
  onCreateWorkout?: () => void;
  onSave?: () => void;
  onQuickSearch?: () => void;
  onShowHelp?: () => void;
  onCloseModal?: () => void;
  onNavigateTab?: (tabIndex: number) => void;
  onBulkOperations?: () => void;
  onScheduleSession?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onCreateWorkout,
  onSave,
  onQuickSearch,
  onShowHelp,
  onCloseModal,
  onNavigateTab,
  onBulkOperations,
  onScheduleSession,
  enabled = true,
}: UseKeyboardShortcutsProps) => {
  const router = useRouter();
  const [showShortcutsOverlay, setShowShortcutsOverlay] = useState(false);

  // Define all shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: 'alt+1',
      description: 'Go to Overview tab',
      handler: () => onNavigateTab?.(0),
      category: 'Navigation',
    },
    {
      key: 'alt+2',
      description: 'Go to Calendar tab',
      handler: () => onNavigateTab?.(1),
      category: 'Navigation',
    },
    {
      key: 'alt+3',
      description: 'Go to Sessions tab',
      handler: () => onNavigateTab?.(2),
      category: 'Navigation',
    },
    {
      key: 'alt+4',
      description: 'Go to Exercise Library tab',
      handler: () => onNavigateTab?.(3),
      category: 'Navigation',
    },
    {
      key: 'alt+5',
      description: 'Go to Testing tab',
      handler: () => onNavigateTab?.(4),
      category: 'Navigation',
    },
    {
      key: 'alt+6',
      description: 'Go to Players tab',
      handler: () => onNavigateTab?.(5),
      category: 'Navigation',
    },
    {
      key: 'alt+7',
      description: 'Go to Templates tab',
      handler: () => onNavigateTab?.(6),
      category: 'Navigation',
    },

    // Actions
    {
      key: 'ctrl+n, cmd+n',
      description: 'Create new workout',
      handler: () => {
        if (onCreateWorkout) {
          onCreateWorkout();
        } else {
          toast('New workout', { icon: '💪' });
        }
      },
      category: 'Actions',
    },
    {
      key: 'ctrl+s, cmd+s',
      description: 'Save current work',
      handler: () => {
        if (onSave) {
          onSave();
        } else {
          toast.success('Saved!');
        }
      },
      category: 'Actions',
    },
    {
      key: 'ctrl+k, cmd+k',
      description: 'Quick search',
      handler: () => {
        if (onQuickSearch) {
          onQuickSearch();
        } else {
          toast('Quick search', { icon: '🔍' });
        }
      },
      category: 'Actions',
    },
    {
      key: 'ctrl+b, cmd+b',
      description: 'Bulk operations',
      handler: () => {
        if (onBulkOperations) {
          onBulkOperations();
        } else {
          toast('Bulk operations', { icon: '📦' });
        }
      },
      category: 'Actions',
    },
    {
      key: 'ctrl+shift+s, cmd+shift+s',
      description: 'Schedule session',
      handler: () => {
        if (onScheduleSession) {
          onScheduleSession();
        } else {
          toast('Schedule session', { icon: '📅' });
        }
      },
      category: 'Actions',
    },

    // General
    {
      key: 'escape',
      description: 'Close modal/dialog',
      handler: () => {
        if (onCloseModal) {
          onCloseModal();
        }
      },
      category: 'General',
    },
    {
      key: 'ctrl+/, cmd+/',
      description: 'Show help',
      handler: () => {
        if (onShowHelp) {
          onShowHelp();
        } else {
          toast('Help', { icon: '❓' });
        }
      },
      category: 'General',
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      handler: () => {
        setShowShortcutsOverlay(!showShortcutsOverlay);
      },
      category: 'General',
    },
  ];

  // Register all shortcuts
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields unless specifically allowed
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Close overlay on Escape when it's open
      if (showShortcutsOverlay && e.key === 'Escape') {
        e.preventDefault();
        setShowShortcutsOverlay(false);
        return;
      }

      // Check all registered shortcuts
      shortcuts.forEach(({ key, handler }) => {
        const keys = key.split(', ');
        for (const combo of keys) {
          const parts = combo.split('+').map(p => p.trim().toLowerCase());
          let matches = true;

          // Check modifiers
          if (parts.includes('ctrl') && !e.ctrlKey) matches = false;
          if (parts.includes('cmd') && !e.metaKey) matches = false;
          if (parts.includes('alt') && !e.altKey) matches = false;
          if (parts.includes('shift') && !e.shiftKey) matches = false;

          // Check main key
          const mainKey = parts[parts.length - 1];
          if (mainKey === 'escape' && e.key !== 'Escape') matches = false;
          else if (mainKey === 'delete' && e.key !== 'Delete') matches = false;
          else if (mainKey === 'backspace' && e.key !== 'Backspace') matches = false;
          else if (mainKey.length === 1 && e.key.toLowerCase() !== mainKey) matches = false;

          if (matches) {
            e.preventDefault();
            handler();
            return;
          }
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, shortcuts, showShortcutsOverlay]);

  const toggleShortcutsOverlay = useCallback(() => {
    setShowShortcutsOverlay(prev => !prev);
  }, []);

  // Group shortcuts by category
  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return {
    shortcuts,
    shortcutsByCategory,
    showShortcutsOverlay,
    toggleShortcutsOverlay,
  };
};