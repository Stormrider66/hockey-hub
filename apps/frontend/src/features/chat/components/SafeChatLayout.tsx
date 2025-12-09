import React, { useContext } from 'react';
import ChatLayout from './ChatLayout';
import ChatSocketContext from '@/contexts/ChatSocketContext';
import { MockChatSocketProvider } from '@/contexts/MockChatSocketContext';

interface SafeChatLayoutProps {
  className?: string;
}

const SafeChatLayout: React.FC<SafeChatLayoutProps> = ({ className }) => {
  // Try to use existing context, but don't error if it doesn't exist
  const existingContext = useContext(ChatSocketContext);
  
  // If we're in mock mode or context doesn't exist, wrap with mock provider
  if (!existingContext || process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true') {
    return (
      <MockChatSocketProvider>
        <ChatLayout className={className} />
      </MockChatSocketProvider>
    );
  }
  
  // Otherwise, use the regular ChatLayout which will use the existing context
  return <ChatLayout className={className} />;
};

export default SafeChatLayout;