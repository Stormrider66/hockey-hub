import { useCallback } from 'react';

export const useScreenReader = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.getElementById('chat-live-region');
    if (!liveRegion) return;

    // Clear existing announcement
    liveRegion.textContent = '';
    
    // Set priority
    liveRegion.setAttribute('aria-live', priority);
    
    // Announce after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  }, []);

  const announceMessage = useCallback((message: {
    sender: string;
    content: string;
    time: string;
    type?: 'sent' | 'received';
  }) => {
    const { sender, content, time, type } = message;
    
    let announcement = '';
    if (type === 'sent') {
      announcement = `Message sent: ${content}`;
    } else {
      announcement = `New message from ${sender}: ${content}. Sent at ${time}`;
    }
    
    announce(announcement, 'polite');
  }, [announce]);

  const announceTyping = useCallback((userName: string) => {
    announce(`${userName} is typing`, 'polite');
  }, [announce]);

  const announceConnectionStatus = useCallback((status: 'connected' | 'disconnected' | 'reconnecting') => {
    const messages = {
      connected: 'Chat connected',
      disconnected: 'Chat disconnected. Messages will be sent when connection is restored.',
      reconnecting: 'Reconnecting to chat...'
    };
    
    announce(messages[status], status === 'disconnected' ? 'assertive' : 'polite');
  }, [announce]);

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive');
  }, [announce]);

  const announceNotification = useCallback((notification: string) => {
    announce(notification, 'polite');
  }, [announce]);

  return {
    announce,
    announceMessage,
    announceTyping,
    announceConnectionStatus,
    announceError,
    announceNotification
  };
};