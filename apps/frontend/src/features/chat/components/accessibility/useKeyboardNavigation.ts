import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useKeyboardNavigation = () => {
  const router = useRouter();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Global keyboard shortcuts
    const isModifierKey = event.ctrlKey || event.metaKey;
    
    switch (event.key) {
      // Navigation shortcuts
      case 'g':
        if (isModifierKey) {
          event.preventDefault();
          // Go to conversations list
          const conversationList = document.querySelector('[role="list"][aria-label="Conversations"]');
          (conversationList?.firstElementChild as HTMLElement)?.focus();
        }
        break;
        
      case 'm':
        if (isModifierKey) {
          event.preventDefault();
          // Focus message input
          const messageInput = document.querySelector('[role="textbox"][aria-label*="message"]');
          (messageInput as HTMLElement)?.focus();
        }
        break;
        
      case '/':
        if (isModifierKey) {
          event.preventDefault();
          // Focus search
          const searchInput = document.querySelector('[role="searchbox"]');
          (searchInput as HTMLElement)?.focus();
        }
        break;
        
      case 'n':
        if (isModifierKey && event.shiftKey) {
          event.preventDefault();
          // New conversation
          const newConvButton = document.querySelector('[aria-label="Start new conversation"]');
          (newConvButton as HTMLElement)?.click();
        }
        break;
        
      // Message navigation
      case 'ArrowUp':
        if (event.target instanceof HTMLElement && event.target.closest('[role="listitem"]')) {
          event.preventDefault();
          const current = event.target.closest('[role="listitem"]');
          const previous = current?.previousElementSibling;
          if (previous) {
            (previous.querySelector('[tabindex="0"]') as HTMLElement)?.focus();
          }
        }
        break;
        
      case 'ArrowDown':
        if (event.target instanceof HTMLElement && event.target.closest('[role="listitem"]')) {
          event.preventDefault();
          const current = event.target.closest('[role="listitem"]');
          const next = current?.nextElementSibling;
          if (next) {
            (next.querySelector('[tabindex="0"]') as HTMLElement)?.focus();
          }
        }
        break;
        
      // Help
      case 'F1':
        event.preventDefault();
        showKeyboardShortcuts();
        break;
        
      // Escape key handling
      case 'Escape':
        // Close modals, dropdowns, etc.
        const openModal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
        if (openModal) {
          const closeButton = openModal.querySelector('[aria-label*="Close"]');
          (closeButton as HTMLElement)?.click();
        }
        break;
    }
  }, []);

  const showKeyboardShortcuts = () => {
    // Announce keyboard shortcuts to screen reader
    const announcement = `
      Keyboard shortcuts:
      Control+G: Go to conversations list.
      Control+M: Focus message input.
      Control+Slash: Focus search.
      Control+Shift+N: Start new conversation.
      Arrow keys: Navigate between messages.
      Enter: Select or activate.
      Escape: Close dialogs.
      Tab: Move to next element.
      Shift+Tab: Move to previous element.
    `;
    
    const liveRegion = document.getElementById('chat-live-region');
    if (liveRegion) {
      liveRegion.textContent = announcement;
    }
    
    // Also show visual modal with shortcuts
    // This would trigger a modal component
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { handleKeyDown };
};