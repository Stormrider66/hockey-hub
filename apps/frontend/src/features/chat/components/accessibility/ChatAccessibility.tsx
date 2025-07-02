import React, { useEffect } from 'react';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { useScreenReader } from './useScreenReader';
import { useHighContrast } from './useHighContrast';
import { useFocusManagement } from './useFocusManagement';

interface ChatAccessibilityProps {
  children: React.ReactNode;
}

export const ChatAccessibility: React.FC<ChatAccessibilityProps> = ({ children }) => {
  const { handleKeyDown } = useKeyboardNavigation();
  const { announceMessage } = useScreenReader();
  const { isHighContrast } = useHighContrast();
  const { manageFocus } = useFocusManagement();

  useEffect(() => {
    // Set up ARIA live regions
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'chat-live-region';
    document.body.appendChild(liveRegion);

    return () => {
      document.body.removeChild(liveRegion);
    };
  }, []);

  return (
    <div
      className={`chat-accessibility-wrapper ${isHighContrast ? 'high-contrast' : ''}`}
      onKeyDown={handleKeyDown}
      role="application"
      aria-label="Chat application"
    >
      {/* Skip to content link */}
      <a href="#chat-main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded">
        Skip to chat messages
      </a>
      
      {/* Keyboard shortcuts help */}
      <div className="sr-only" aria-live="polite">
        Press F1 for keyboard shortcuts help
      </div>
      
      {children}
    </div>
  );
};