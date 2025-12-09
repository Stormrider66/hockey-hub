import React, { useState, useEffect } from 'react';
import { ChevronLeft, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSwipeable } from 'react-swipeable';
import { ConversationList } from '../ConversationList';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';

interface MobileChatLayoutProps {
  conversations: any[];
  messages: any[];
  currentConversation: any;
  onSelectConversation: (id: string) => void;
  onSendMessage: (message: string) => void;
}

export const MobileChatLayout: React.FC<MobileChatLayoutProps> = ({
  conversations,
  messages,
  currentConversation,
  onSelectConversation,
  onSendMessage
}) => {
  const [showConversations, setShowConversations] = useState(!currentConversation);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => {
      if (currentConversation) {
        setShowConversations(true);
      }
    },
    onSwipedLeft: () => {
      if (showConversations && conversations.length > 0) {
        setShowConversations(false);
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50
  });

  // Handle back button
  useEffect(() => {
    const handlePopState = () => {
      if (!showConversations && currentConversation) {
        setShowConversations(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showConversations, currentConversation]);

  const handleConversationSelect = (id: string) => {
    onSelectConversation(id);
    setShowConversations(false);
    // Add to browser history for back button support
    window.history.pushState({ conversationId: id }, '');
  };

  const handleBack = () => {
    setShowConversations(true);
    window.history.back();
  };

  return (
    <div className="mobile-chat-layout h-screen flex flex-col" {...swipeHandlers}>
      {/* Mobile Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
        {!showConversations && currentConversation ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="Back to conversations"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="font-semibold truncate">{currentConversation.name}</h1>
              <p className="text-xs text-muted-foreground">
                {currentConversation.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Messages</h1>
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                {/* Mobile menu content */}
                <nav className="flex flex-col gap-4 mt-6">
                  <Button variant="ghost" className="justify-start">Settings</Button>
                  <Button variant="ghost" className="justify-start">Profile</Button>
                  <Button variant="ghost" className="justify-start">Help</Button>
                </nav>
              </SheetContent>
            </Sheet>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Conversations List */}
          <div
            className={`${
              showConversations ? 'translate-x-0' : '-translate-x-full'
            } absolute inset-0 bg-background transition-transform duration-300 ease-in-out z-10`}
          >
            <ConversationList
              conversations={conversations}
              onSelectConversation={handleConversationSelect}
              selectedId={currentConversation?.id}
            />
          </div>

          {/* Messages View */}
          <div
            className={`${
              showConversations ? 'translate-x-full' : 'translate-x-0'
            } absolute inset-0 bg-background transition-transform duration-300 ease-in-out`}
          >
            {currentConversation ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <MessageList messages={messages} />
                </div>
                <div className="border-t p-4">
                  <MessageInput
                    onSendMessage={onSendMessage}
                    placeholder="Type a message..."
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Swipe indicator */}
      {currentConversation && !showConversations && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 p-1 bg-primary/10 rounded-r-full">
          <ChevronLeft className="h-4 w-4 text-primary animate-pulse" />
        </div>
      )}
    </div>
  );
};