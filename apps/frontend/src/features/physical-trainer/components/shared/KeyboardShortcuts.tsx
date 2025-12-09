import React, { useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ShortcutHandler {
  key: string;
  description: string;
  handler: () => void;
  category?: string;
  enabled?: boolean;
}

interface KeyboardShortcutsProps {
  shortcuts: ShortcutHandler[];
  enabled?: boolean;
  onHelp?: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  shortcuts,
  enabled = true,
  onHelp,
}) => {
  const { t } = useTranslation(['physicalTrainer']);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields unless specifically allowed
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Check for help shortcut
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (onHelp) {
          onHelp();
        } else {
          showShortcutsHelp();
        }
        return;
      }

      // Check all registered shortcuts
      shortcuts.forEach(({ key, handler, enabled: shortcutEnabled = true }) => {
        if (!shortcutEnabled) return;

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
  }, [enabled, shortcuts, onHelp]);

  const showShortcutsHelp = useCallback(() => {
    const categories = shortcuts.reduce((acc, shortcut) => {
      const category = shortcut.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    }, {} as Record<string, ShortcutHandler[]>);

    const helpContent = Object.entries(categories)
      .map(([category, items]) => {
        const shortcuts = items
          .map(item => `${item.key}: ${item.description}`)
          .join('\n');
        return `${category}:\n${shortcuts}`;
      })
      .join('\n\n');

    toast(helpContent, {
      duration: 5000,
      icon: '⌨️',
    });
  }, [shortcuts]);

  return null; // This component doesn't render anything
};

// Default workout builder shortcuts
export const defaultWorkoutShortcuts: ShortcutHandler[] = [
  // Navigation
  {
    key: 'alt+1',
    description: 'Go to Details tab',
    handler: () => {},
    category: 'Navigation',
  },
  {
    key: 'alt+2',
    description: 'Go to Exercises/Intervals tab',
    handler: () => {},
    category: 'Navigation',
  },
  {
    key: 'alt+3',
    description: 'Go to Players tab',
    handler: () => {},
    category: 'Navigation',
  },
  {
    key: 'alt+4',
    description: 'Go to Preview tab',
    handler: () => {},
    category: 'Navigation',
  },

  // Actions
  {
    key: 'ctrl+s, cmd+s',
    description: 'Save workout',
    handler: () => {},
    category: 'Actions',
  },
  {
    key: 'ctrl+shift+s, cmd+shift+s',
    description: 'Save as template',
    handler: () => {},
    category: 'Actions',
  },
  {
    key: 'ctrl+d, cmd+d',
    description: 'Duplicate workout',
    handler: () => {},
    category: 'Actions',
  },
  {
    key: 'ctrl+n, cmd+n',
    description: 'New workout',
    handler: () => {},
    category: 'Actions',
  },
  {
    key: 'escape',
    description: 'Cancel/Close',
    handler: () => {},
    category: 'Actions',
  },

  // Editing
  {
    key: 'ctrl+z, cmd+z',
    description: 'Undo',
    handler: () => {},
    category: 'Editing',
  },
  {
    key: 'ctrl+shift+z, cmd+shift+z',
    description: 'Redo',
    handler: () => {},
    category: 'Editing',
  },
  {
    key: 'ctrl+a, cmd+a',
    description: 'Select all',
    handler: () => {},
    category: 'Editing',
  },
  {
    key: 'delete, backspace',
    description: 'Delete selected',
    handler: () => {},
    category: 'Editing',
  },

  // Quick Access
  {
    key: 'ctrl+p, cmd+p',
    description: 'Quick player search',
    handler: () => {},
    category: 'Quick Access',
  },
  {
    key: 'ctrl+e, cmd+e',
    description: 'Quick exercise search',
    handler: () => {},
    category: 'Quick Access',
  },
  {
    key: 'ctrl+t, cmd+t',
    description: 'Quick template search',
    handler: () => {},
    category: 'Quick Access',
  },
  {
    key: 'ctrl+/, cmd+/',
    description: 'Focus search',
    handler: () => {},
    category: 'Quick Access',
  },
];

// Hook for using keyboard shortcuts
export const useWorkoutKeyboardShortcuts = (
  customHandlers: Partial<Record<string, () => void>> = {}
) => {
  const shortcuts = defaultWorkoutShortcuts.map(shortcut => ({
    ...shortcut,
    handler: customHandlers[shortcut.key] || shortcut.handler,
  }));

  return shortcuts;
};