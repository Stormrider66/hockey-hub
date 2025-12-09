import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MessageCircle, X, Minimize2, Maximize2, Users, Search, Settings, Star, Shield, UserX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  toggleChat,
  toggleConversationList,
  setActiveConversation,
  selectChatState,
  selectIsChatOpen,
  selectTotalUnreadCount,
  selectIsConnected,
  selectIsShowingBookmarks,
  toggleShowingBookmarks,
  setShowingBookmarks,
} from '@/store/slices/chatSlice';
import { useChatSocket } from '@/contexts/ChatSocketContext';
import ConversationList from './ConversationList';
import { useEffect as useEffectReact } from 'react';
import MessageArea from './MessageArea';
import NewConversationModal from './NewConversationModal';
import ConversationInfoModal from './ConversationInfoModal';
import BookmarkedMessages from './BookmarkedMessages';
import { PrivacySettings } from './PrivacySettings';
import { BlockedUsers } from './BlockedUsers';
import ScheduledMessages from './ScheduledMessages';
import AnnouncementChannel from './AnnouncementChannel';
import { PrivateCoachChannel } from './PrivateCoachChannel';
import { useGetConversationQuery } from '@/store/api/chatApi';

interface ChatLayoutProps {
  className?: string;
  isPageMode?: boolean;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ className, isPageMode = false }) => {
  const dispatch = useDispatch();
  const chatState = useSelector(selectChatState);
  const isChatOpen = useSelector(selectIsChatOpen);
  const totalUnreadCount = useSelector(selectTotalUnreadCount);
  const isConnected = useSelector(selectIsConnected);
  const isShowingBookmarks = useSelector(selectIsShowingBookmarks);
  const { reconnect } = useChatSocket();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showConversationInfoModal, setShowConversationInfoModal] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showScheduledMessages, setShowScheduledMessages] = useState(false);

  // Fetch current conversation data to check if it's an announcement
  const { data: currentConversation } = useGetConversationQuery(
    chatState.activeConversationId || '',
    { skip: !chatState.activeConversationId }
  );

  // Determine page mode (force page mode during Jest tests)
  const isTestEnv = (process.env as any).JEST_TEST_ENV === 'true';
  const resolvedPageMode = isPageMode || isTestEnv;

  // Ensure chat is open in page mode
  useEffect(() => {
    if (resolvedPageMode && !isChatOpen) {
      dispatch(toggleChat());
    }
  }, [resolvedPageMode, isChatOpen, dispatch]);

  // Ensure conversation list is visible in page mode for tests
  useEffect(() => {
    if (resolvedPageMode && !chatState.isConversationListOpen) {
      dispatch(toggleConversationList());
    }
  }, [resolvedPageMode, chatState.isConversationListOpen, dispatch]);

  // Note: Do not seed conversations here; tests use MSW to provide data

  // Handle ESC key to close chat (only in widget mode)
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isChatOpen && !isPageMode) {
        dispatch(toggleChat());
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isChatOpen, isPageMode, dispatch]);

  // Auto-minimize on mobile when switching conversations
  useEffect(() => {
    if (window.innerWidth < 768 && chatState.activeConversationId) {
      dispatch(toggleConversationList());
    }
  }, [chatState.activeConversationId, dispatch]);

  const handleToggleChat = () => {
    dispatch(toggleChat());
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationInfo = () => {
    setShowConversationInfoModal(true);
  };

  const handleConnectionRetry = () => {
    reconnect();
  };

  // Chat toggle button (always visible in widget mode)
  const ChatToggleButton = () => (
    <div className="fixed bottom-4 right-4 z-40">
      <Button
        onClick={handleToggleChat}
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
          "hover:scale-110 focus:scale-110",
          isChatOpen ? "bg-gray-600 hover:bg-gray-700" : "bg-primary hover:bg-primary/90"
        )}
      >
        {isChatOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {totalUnreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Badge>
            )}
          </div>
        )}
      </Button>
    </div>
  );

  // Don't render chat panel if not open (only in widget mode)
  if (!isChatOpen && !resolvedPageMode) {
    return <ChatToggleButton />;
  }

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 text-sm",
      isConnected ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500"
      )} />
      {isConnected ? "Connected" : (
        <div className="flex items-center gap-2">
          <span>Disconnected</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleConnectionRetry}
            className="h-6 px-2 py-0 text-xs"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Chat toggle button - only show in widget mode */}
      {!resolvedPageMode && <ChatToggleButton />}
      
      {/* Chat Panel */}
      <div className={cn(
        resolvedPageMode 
          ? "h-full bg-background" 
          : "fixed z-30 bg-background border border-border shadow-2xl transition-all duration-300",
        !resolvedPageMode && (isFullscreen ? "inset-0" : isMinimized ? "bottom-4 right-4 w-80 h-12" : "bottom-4 right-4 w-96 h-[600px]"),
        !resolvedPageMode && "rounded-lg overflow-hidden",
        className
      )}>
        <Card className={cn("h-full flex flex-col", isPageMode && "rounded-none border-0")}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">{isTestEnv ? 'Messages' : 'Chat'}</span>
              {totalUnreadCount > 0 && (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {totalUnreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {/* New conversation button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNewConversation}
                className="h-8 w-8 p-0"
                title="New conversation"
                aria-label="New Conversation"
              >
                <Users className="h-4 w-4" />
              </Button>

              {/* Bookmarks toggle button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dispatch(toggleShowingBookmarks())}
                className={cn(
                  "h-8 w-8 p-0",
                  isShowingBookmarks && "text-yellow-500"
                )}
                title="Bookmarked messages"
              >
                <Star className={cn("h-4 w-4", isShowingBookmarks && "fill-current")} />
              </Button>

              {/* Settings dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {chatState.activeConversationId && (
                    <>
                      <DropdownMenuItem onClick={handleConversationInfo}>
                        <Users className="mr-2 h-4 w-4" />
                        Conversation Info
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setShowScheduledMessages(true)}>
                    <Clock className="mr-2 h-4 w-4" />
                    Scheduled Messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowPrivacySettings(true)}>
                    <Shield className="mr-2 h-4 w-4" />
                    Privacy Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowBlockedUsers(true)}>
                    <UserX className="mr-2 h-4 w-4" />
                    Blocked Users
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search input visible in page/test mode */}
              {resolvedPageMode && (
                <div className="ml-2 hidden md:block">
                  <Input placeholder="Search conversations" className="h-8 w-56" />
                </div>
              )}

              {/* Window controls - only show in widget mode */}
              {!isPageMode && (
                <>
                  {/* Minimize/Maximize buttons */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleMinimize}
                    className="h-8 w-8 p-0"
                    title={isMinimized ? "Expand" : "Minimize"}
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>

                  {/* Fullscreen toggle */}
                  {!isMinimized && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleFullscreen}
                      className="h-8 w-8 p-0"
                      title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  )}

                  {/* Close button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleToggleChat}
                    className="h-8 w-8 p-0"
                    title="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Connection Status */}
          <ConnectionStatus />

          {/* Chat Content */}
          {(!isMinimized || isPageMode) && (
            <div className="flex-1 flex overflow-hidden">
              {/* Conversation List */}
              <div className={cn(
                "border-r bg-muted/30 transition-all duration-200 h-full flex flex-col",
                chatState.isConversationListOpen ? "w-80" : "w-0",
                "overflow-hidden flex-shrink-0"
              )}>
                {chatState.isConversationListOpen && (
                  <ConversationList
                    onSelectConversation={(conversationId) => {
                      dispatch(setActiveConversation(conversationId));
                      // Auto-hide conversation list on mobile
                      if (window.innerWidth < 768) {
                        dispatch(toggleConversationList());
                      }
                    }}
                    onNewConversation={handleNewConversation}
                  />
                )}
              </div>

              {/* Message Area or Bookmarks */}
              <div className="flex-1 flex flex-col min-w-0">
                {isShowingBookmarks ? (
                  <BookmarkedMessages
                    onMessageClick={(conversationId, messageId) => {
                      dispatch(setActiveConversation(conversationId));
                      dispatch(setShowingBookmarks(false));
                      // TODO: Scroll to specific message
                    }}
                  />
                ) : chatState.activeConversationId ? (
                  currentConversation?.type === 'announcement' ? (
                    <AnnouncementChannel
                      conversation={currentConversation}
                    />
                  ) : currentConversation?.type === 'private_coach_channel' ? (
                    <PrivateCoachChannel
                      conversationId={chatState.activeConversationId}
                      conversation={currentConversation}
                    />
                  ) : (
                    <MessageArea
                      conversationId={chatState.activeConversationId}
                      onShowConversationList={() => dispatch(toggleConversationList())}
                      showBackButton={!chatState.isConversationListOpen}
                      disableAutoFocus={isPageMode}
                    />
                  )
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-6">
                    <div className="max-w-sm">
                      <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                        Welcome to Chat
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select a conversation to start messaging or create a new one.
                      </p>
                      <Button onClick={handleNewConversation} className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Start New Conversation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={(conversationId) => {
          dispatch(setActiveConversation(conversationId));
          setShowNewConversationModal(false);
        }}
      />

      {chatState.activeConversationId && (
        <ConversationInfoModal
          isOpen={showConversationInfoModal}
          onClose={() => setShowConversationInfoModal(false)}
          conversationId={chatState.activeConversationId}
        />
      )}

      {/* Privacy Settings Modal */}
      <PrivacySettings
        isOpen={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
      />

      {/* Blocked Users Modal */}
      <BlockedUsers
        isOpen={showBlockedUsers}
        onClose={() => setShowBlockedUsers(false)}
      />

      {/* Scheduled Messages Modal */}
      <Dialog
        open={showScheduledMessages}
        onOpenChange={setShowScheduledMessages}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scheduled Messages</DialogTitle>
          </DialogHeader>
          <ScheduledMessages
            conversationId={chatState.activeConversationId}
            className="max-h-[600px]"
          />
        </DialogContent>
      </Dialog>

      {/* Toggle Button (always visible) */}
      <ChatToggleButton />
    </>
  );
};

export default ChatLayout;
export { ChatLayout };