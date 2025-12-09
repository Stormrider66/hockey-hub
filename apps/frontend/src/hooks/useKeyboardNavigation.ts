import { useEffect, useRef } from 'react';

/**
 * Custom hook for managing keyboard navigation within a container
 * Handles focus management and arrow key navigation
 */
export function useKeyboardNavigation(
  enabled: boolean = true,
  options?: {
    vertical?: boolean;
    horizontal?: boolean;
    wrap?: boolean;
    selector?: string;
  }
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    vertical = true,
    horizontal = false,
    wrap = true,
    selector = '[tabindex]:not([tabindex="-1"]), button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'
  } = options || {};

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = Array.from(
        container.querySelectorAll(selector)
      ) as HTMLElement[];
      
      const currentIndex = focusableElements.findIndex(
        el => el === document.activeElement
      );
      
      let nextIndex = currentIndex;
      
      switch (e.key) {
        case 'ArrowDown':
          if (vertical) {
            e.preventDefault();
            nextIndex = currentIndex + 1;
          }
          break;
        case 'ArrowUp':
          if (vertical) {
            e.preventDefault();
            nextIndex = currentIndex - 1;
          }
          break;
        case 'ArrowRight':
          if (horizontal) {
            e.preventDefault();
            nextIndex = currentIndex + 1;
          }
          break;
        case 'ArrowLeft':
          if (horizontal) {
            e.preventDefault();
            nextIndex = currentIndex - 1;
          }
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = focusableElements.length - 1;
          break;
        default:
          return;
      }
      
      // Handle wrapping
      if (wrap) {
        if (nextIndex >= focusableElements.length) {
          nextIndex = 0;
        } else if (nextIndex < 0) {
          nextIndex = focusableElements.length - 1;
        }
      } else {
        nextIndex = Math.max(0, Math.min(nextIndex, focusableElements.length - 1));
      }
      
      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus();
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, vertical, horizontal, wrap, selector]);
  
  return containerRef;
}

/**
 * Hook to announce content changes to screen readers
 */
export function useAnnouncement() {
  const announcementRef = useRef<HTMLDivElement>(null);
  
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) return;
    
    announcementRef.current.setAttribute('aria-live', priority);
    announcementRef.current.textContent = message;
    
    // Clear the announcement after a delay
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 1000);
  };
  
  return { announcementRef, announce };
}