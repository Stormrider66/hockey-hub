"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { MockChatInterface } from '@/features/chat/components/MockChatInterface';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import ChatLayout to avoid SSR issues with WebSocket
const ChatLayout = dynamic(
  () => import('@/features/chat/components/ChatLayout'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    ),
  }
);

export default function ChatPage() {
  const { t } = useTranslation(['common', 'chat']);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
  
  useEffect(() => {
    setIsClient(true);
    // Prevent any unwanted scrolling on page load
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user || !isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-shrink-0">
        <DashboardHeader 
          title={t('common:navigation.messages')}
          subtitle={t('chat:subtitle', 'Connect with your team')}
          role={user.role || 'player'}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full container mx-auto px-4 pb-6">
          <div className="h-full bg-white rounded-lg shadow overflow-hidden">
            {isMockMode ? (
              <MockChatInterface />
            ) : (
              <ChatLayout isPageMode={true} className="h-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}