import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
}

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Record<string, KeyboardShortcut[]>;
}

export const KeyboardShortcutsOverlay: React.FC<KeyboardShortcutsOverlayProps> = ({
  isOpen,
  onClose,
  shortcuts,
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  const formatKey = (key: string) => {
    // Split multiple shortcuts (e.g., "ctrl+s, cmd+s")
    const parts = key.split(', ');
    return parts.map(part => {
      // Split individual keys (e.g., "ctrl+s")
      const keys = part.split('+');
      return keys.map(k => {
        // Format special keys
        switch (k) {
          case 'ctrl':
            return 'Ctrl';
          case 'cmd':
            return '⌘';
          case 'alt':
            return 'Alt';
          case 'shift':
            return 'Shift';
          case 'escape':
            return 'Esc';
          case 'delete':
            return 'Del';
          case 'backspace':
            return '⌫';
          default:
            return k.toUpperCase();
        }
      });
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
          />

          {/* Overlay Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-background border rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">
                  {t('physicalTrainer:shortcuts.title')}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryShortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-2 py-1"
                          >
                            <span className="text-sm text-muted-foreground">
                              {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {formatKey(shortcut.key).map((parts, i) => (
                                <React.Fragment key={i}>
                                  {i > 0 && (
                                    <span className="text-xs text-muted-foreground">or</span>
                                  )}
                                  <div className="flex items-center gap-1">
                                    {parts.map((key, j) => (
                                      <React.Fragment key={j}>
                                        {j > 0 && (
                                          <span className="text-xs text-muted-foreground">+</span>
                                        )}
                                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                                          {key}
                                        </kbd>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer tip */}
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  {t('physicalTrainer:shortcuts.tip')}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};