import React from 'react';

// Conditionally import the appropriate provider
const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';

// Import both providers
import { ChatSocketProvider as RealChatSocketProvider, useChatSocket as useRealChatSocket } from './ChatSocketContext';
import { ChatSocketProvider as MockChatSocketProvider, useChatSocket as useMockChatSocket } from './MockChatSocketContext';

// Export the appropriate provider based on mock mode
export const ChatSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isMockMode) {
    return <MockChatSocketProvider>{children}</MockChatSocketProvider>;
  }
  return <RealChatSocketProvider>{children}</RealChatSocketProvider>;
};

// Export the appropriate hook based on mock mode
export const useChatSocket = () => {
  if (isMockMode) {
    return useMockChatSocket();
  }
  return useRealChatSocket();
};