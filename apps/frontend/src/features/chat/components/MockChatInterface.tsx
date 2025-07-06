"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, Hash, Lock, ChevronLeft, Smile, Paperclip, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EmojiPicker from './EmojiPicker';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn?: boolean;
  avatar?: string;
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'file' | 'image';
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'announcement';
  unread?: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  avatar?: string;
  participants?: number;
}

const scrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #9ca3af #f3f4f6;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 12px;
    height: 12px;
    display: block !important;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #9ca3af;
    border-radius: 6px;
    border: 2px solid #f3f4f6;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
`;

export function MockChatInterface() {
  const { t } = useTranslation('chat');
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<string>('1');
  const [message, setMessage] = useState('');
  const [showChannelList, setShowChannelList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  // Mock data with more realistic content
  const channels: Channel[] = [
    { 
      id: '1', 
      name: 'Team Falcons', 
      type: 'group',
      participants: 15,
      lastMessage: 'Great practice today team! 💪',
      lastMessageTime: new Date(Date.now() - 3600000),
      unread: 3
    },
    { 
      id: '2', 
      name: 'Coach Johnson', 
      type: 'direct',
      lastMessage: 'Remember to bring your gear tomorrow',
      lastMessageTime: new Date(Date.now() - 7200000),
      unread: 1
    },
    { 
      id: '3', 
      name: 'Team Announcements', 
      type: 'announcement',
      participants: 45,
      lastMessage: '📢 Next game is on Saturday at 3 PM!',
      lastMessageTime: new Date(Date.now() - 14400000)
    },
    { 
      id: '4', 
      name: 'Defense Line', 
      type: 'group',
      participants: 6,
      lastMessage: 'Let\'s work on those zone exits',
      lastMessageTime: new Date(Date.now() - 86400000)
    },
  ];
  
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    '1': [
      { 
        id: '1', 
        text: 'Welcome to the team chat! 🏒', 
        sender: 'System', 
        timestamp: new Date(Date.now() - 86400000), 
        isOwn: false 
      },
      { 
        id: '2', 
        text: 'Hey team, great practice today! Everyone showed amazing effort', 
        sender: 'Coach Johnson', 
        timestamp: new Date(Date.now() - 3700000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '3', 
        text: 'Thanks coach! Felt really good out there', 
        sender: 'Alex Smith', 
        timestamp: new Date(Date.now() - 3600000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '4', 
        text: 'Great practice today team! 💪', 
        sender: 'Mike Davis', 
        timestamp: new Date(Date.now() - 3500000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '5', 
        text: 'Remember to bring your A-game tomorrow for the big match!', 
        sender: 'Coach Johnson', 
        timestamp: new Date(Date.now() - 3400000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '6', 
        text: 'I\'ll be there early to help set up', 
        sender: 'You', 
        timestamp: new Date(Date.now() - 3300000), 
        isOwn: true,
        status: 'read'
      },
      { 
        id: '7', 
        text: 'That\'s the spirit! See you bright and early', 
        sender: 'Coach Johnson', 
        timestamp: new Date(Date.now() - 3200000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '8', 
        text: 'Anyone need a ride to the game?', 
        sender: 'Sarah Wilson', 
        timestamp: new Date(Date.now() - 3100000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '9', 
        text: 'I could use one if you\'re passing by the north side', 
        sender: 'Tom Anderson', 
        timestamp: new Date(Date.now() - 3000000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '10', 
        text: 'No problem, I\'ll pick you up at 7:30', 
        sender: 'Sarah Wilson', 
        timestamp: new Date(Date.now() - 2900000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '11', 
        text: 'Don\'t forget to hydrate well tonight!', 
        sender: 'Coach Johnson', 
        timestamp: new Date(Date.now() - 2800000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '12', 
        text: 'And get a good night\'s sleep. We need everyone at 100%', 
        sender: 'Coach Johnson', 
        timestamp: new Date(Date.now() - 2700000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '13', 
        text: 'Looking forward to it! Let\'s show them what we\'re made of!', 
        sender: 'You', 
        timestamp: new Date(Date.now() - 2600000), 
        isOwn: true,
        status: 'read'
      },
      { 
        id: '14', 
        text: 'That\'s what I like to hear! 🔥', 
        sender: 'Coach Johnson', 
        timestamp: new Date(Date.now() - 2500000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '15', 
        text: 'Weather looks perfect for tomorrow\'s game', 
        sender: 'Mike Davis', 
        timestamp: new Date(Date.now() - 2400000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '16', 
        text: 'Great! No excuses then 😄', 
        sender: 'Alex Smith', 
        timestamp: new Date(Date.now() - 2300000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '17', 
        text: 'Team dinner after the game?', 
        sender: 'Sarah Wilson', 
        timestamp: new Date(Date.now() - 2200000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '18', 
        text: 'I\'m in!', 
        sender: 'You', 
        timestamp: new Date(Date.now() - 2100000), 
        isOwn: true,
        status: 'read'
      },
      { 
        id: '19', 
        text: 'Count me in too', 
        sender: 'Tom Anderson', 
        timestamp: new Date(Date.now() - 2000000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '20', 
        text: 'Perfect! Let\'s win this and celebrate! 🏆', 
        sender: 'Coach Johnson', 
        timestamp: new Date(Date.now() - 1900000), 
        isOwn: false,
        status: 'read'
      },
    ],
    '2': [
      { 
        id: '5', 
        text: 'Hi Coach, I wanted to ask about the training plan for next week', 
        sender: user?.name || 'You', 
        timestamp: new Date(Date.now() - 10800000), 
        isOwn: true,
        status: 'read'
      },
      { 
        id: '6', 
        text: 'Sure! We\'ll focus on power play strategies and conditioning', 
        sender: 'Coach Johnson', 
        timestamp: new Date(Date.now() - 10000000), 
        isOwn: false,
        status: 'read'
      },
      { 
        id: '7', 
        text: 'Remember to bring your gear tomorrow', 
        sender: 'Coach Johnson', 
        timestamp: new Date(Date.now() - 7200000), 
        isOwn: false,
        status: 'delivered'
      },
    ],
    '3': [
      { 
        id: '8', 
        text: '📢 Team meeting tomorrow at 6 PM in the locker room', 
        sender: 'Team Admin', 
        timestamp: new Date(Date.now() - 172800000), 
        isOwn: false 
      },
      { 
        id: '9', 
        text: '📢 Next game is on Saturday at 3 PM!', 
        sender: 'Team Admin', 
        timestamp: new Date(Date.now() - 14400000), 
        isOwn: false 
      },
    ],
    '4': [
      { 
        id: '10', 
        text: 'Defense meeting after practice today', 
        sender: 'Captain', 
        timestamp: new Date(Date.now() - 90000000), 
        isOwn: false 
      },
      { 
        id: '11', 
        text: 'Let\'s work on those zone exits', 
        sender: 'Assistant Coach', 
        timestamp: new Date(Date.now() - 86400000), 
        isOwn: false 
      },
    ],
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChannel]);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'direct': return <Users className="h-4 w-4" />;
      case 'announcement': return <Lock className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };


  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message,
        sender: user?.name || 'You',
        timestamp: new Date(),
        isOwn: true,
        status: 'sent'
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedChannel]: [...(prev[selectedChannel] || []), newMessage]
      }));
      
      // Clear unread count for selected channel
      const channel = channels.find(c => c.id === selectedChannel);
      if (channel) {
        channel.unread = 0;
      }
      
      setMessage('');
      
      // Simulate delivery status update
      setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [selectedChannel]: prev[selectedChannel].map(msg =>
            msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
          )
        }));
      }, 1000);
      
      // Simulate read status update
      setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [selectedChannel]: prev[selectedChannel].map(msg =>
            msg.id === newMessage.id ? { ...msg, status: 'read' } : msg
          )
        }));
      }, 2000);
      
      // Simulate a response for direct messages
      if (selectedChannel === '2') {
        setTimeout(() => {
          const responseMessage: Message = {
            id: Date.now().toString(),
            text: 'Thanks for the message! I\'ll get back to you soon.',
            sender: 'Coach Johnson',
            timestamp: new Date(),
            isOwn: false,
            status: 'delivered'
          };
          setMessages(prev => ({
            ...prev,
            [selectedChannel]: [...prev[selectedChannel], responseMessage]
          }));
        }, 3000);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith('image/');
        
        // Create a mock file message
        const fileMessage: Message = {
          id: Date.now().toString() + i,
          text: file.name,
          sender: user?.name || 'You',
          timestamp: new Date(),
          isOwn: true,
          status: 'sent',
          type: isImage ? 'image' : 'file',
          fileName: file.name,
          fileType: file.type,
          fileUrl: URL.createObjectURL(file)
        };
        
        setMessages(prev => ({
          ...prev,
          [selectedChannel]: [...(prev[selectedChannel] || []), fileMessage]
        }));
        
        // Simulate delivery status update
        setTimeout(() => {
          setMessages(prev => ({
            ...prev,
            [selectedChannel]: prev[selectedChannel].map(msg =>
              msg.id === fileMessage.id ? { ...msg, status: 'delivered' } : msg
            )
          }));
        }, 1000);
        
        // Simulate read status update
        setTimeout(() => {
          setMessages(prev => ({
            ...prev,
            [selectedChannel]: prev[selectedChannel].map(msg =>
              msg.id === fileMessage.id ? { ...msg, status: 'read' } : msg
            )
          }));
        }, 2000);
      }
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (messageInputRef.current) {
      const start = messageInputRef.current.selectionStart || 0;
      const end = messageInputRef.current.selectionEnd || 0;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        if (messageInputRef.current) {
          const newPosition = start + emoji.length;
          messageInputRef.current.setSelectionRange(newPosition, newPosition);
          messageInputRef.current.focus();
        }
      }, 0);
    } else {
      // Fallback: just append emoji to the end
      setMessage(message + emoji);
    }
  };

  const selectedChannelData = channels.find(c => c.id === selectedChannel);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="flex h-full overflow-hidden">
      {/* Channel List - Responsive */}
      <div className={`${showChannelList ? 'w-full md:w-80' : 'hidden md:block md:w-80'} border-r bg-gray-50 transition-all duration-200 flex flex-col`}>
        <div className="p-4 border-b bg-white">
          <h3 className="font-semibold mb-2 text-lg">Messages</h3>
          <Input 
            placeholder="Search conversations..." 
            className="bg-gray-50"
          />
        </div>
        <div 
          className="flex-1 min-h-0 overflow-y-auto custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#9ca3af #f3f4f6'
          }}
        >
          <div className="p-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setSelectedChannel(channel.id);
                  setShowChannelList(false);
                }}
                className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all ${
                  selectedChannel === channel.id
                    ? 'bg-blue-50 hover:bg-blue-100'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={channel.avatar} />
                  <AvatarFallback className="bg-gray-200">
                    {channel.type === 'direct' ? getInitials(channel.name) : getChannelIcon(channel.type)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{channel.name}</span>
                    {channel.lastMessageTime && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {channel.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {channel.lastMessage}
                    </p>
                    {channel.unread && channel.unread > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-[1.25rem] px-1.5 text-xs">
                        {channel.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area - Responsive */}
      <div className={`${showChannelList ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0`}>
        <Card className="flex-1 m-0 rounded-none border-0 shadow-none flex flex-col">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="md:hidden"
                  onClick={() => setShowChannelList(true)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedChannelData?.avatar} />
                  <AvatarFallback className="bg-gray-200 text-sm">
                    {selectedChannelData?.type === 'direct' 
                      ? getInitials(selectedChannelData.name) 
                      : getChannelIcon(selectedChannelData?.type || 'group')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">
                    {selectedChannelData?.name || 'Chat'}
                  </CardTitle>
                  {selectedChannelData?.participants && (
                    <p className="text-xs text-gray-500">
                      {selectedChannelData.participants} members
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Info</DropdownMenuItem>
                  <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                  <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden" style={{ minHeight: 0 }}>
            <div 
              className="overflow-y-auto custom-scrollbar"
              style={{
                height: 'calc(100vh - 280px)',
                maxHeight: '600px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#9ca3af #f3f4f6'
              }}
            >
              <div className="space-y-4 p-4">
                {(messages[selectedChannel] || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!msg.isOwn && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={msg.avatar} />
                        <AvatarFallback className="bg-gray-200 text-sm">
                          {getInitials(msg.sender)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                      {!msg.isOwn && (
                        <p className="text-xs font-medium text-gray-700 mb-1">{msg.sender}</p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          msg.isOwn
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        {msg.type === 'image' && msg.fileUrl ? (
                          <div className="space-y-2">
                            <img 
                              src={msg.fileUrl} 
                              alt={msg.fileName} 
                              className="max-w-full rounded" 
                              style={{ maxHeight: '300px' }}
                            />
                            <p className="text-xs opacity-90">{msg.fileName}</p>
                          </div>
                        ) : msg.type === 'file' && msg.fileUrl ? (
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">{msg.fileName}</p>
                              <p className="text-xs opacity-90">File attachment</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                        <p className="text-xs text-gray-500">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {msg.isOwn && msg.status && (
                          <span className="text-xs text-gray-500">
                            {msg.status === 'sent' && '✓'}
                            {msg.status === 'delivered' && '✓✓'}
                            {msg.status === 'read' && <span className="text-blue-500">✓✓</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Message Input */}
            <div className="border-t p-4 bg-white">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Input
                  ref={messageInputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={selectedChannelData?.type === 'announcement' 
                    ? "Only admins can post here..." 
                    : "Type a message..."}
                  className="flex-1"
                  disabled={selectedChannelData?.type === 'announcement'}
                />
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  trigger={
                    <Button type="button" size="icon" variant="ghost" title="Add emoji">
                      <Smile className="h-5 w-5" />
                    </Button>
                  }
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={selectedChannelData?.type === 'announcement'}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}