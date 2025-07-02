import { useCallback, useRef } from 'react';

export const useFocusManagement = () => {
  const focusHistory = useRef<HTMLElement[]>([]);
  const focusTrapRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      focusHistory.current.push(activeElement);
    }
  }, []);

  const restoreFocus = useCallback(() => {
    const previousElement = focusHistory.current.pop();
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  }, []);

  const manageFocus = useCallback((container: HTMLElement | null) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstElement.focus();

    // Set up focus trap
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    focusTrapRef.current = container;

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      if (focusTrapRef.current === container) {
        focusTrapRef.current = null;
      }
    };
  }, []);

  const releaseFocusTrap = useCallback(() => {
    focusTrapRef.current = null;
  }, []);

  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const moveFocus = useCallback((direction: 'next' | 'previous', container?: HTMLElement) => {
    const root = container || document;
    const focusableElements = Array.from(
      root.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
    
    if (currentIndex === -1) {
      focusableElements[0]?.focus();
      return;
    }

    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % focusableElements.length;
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = focusableElements.length - 1;
    }

    focusableElements[nextIndex]?.focus();
  }, []);

  return {
    saveFocus,
    restoreFocus,
    manageFocus,
    releaseFocusTrap,
    focusElement,
    moveFocus
  };
};