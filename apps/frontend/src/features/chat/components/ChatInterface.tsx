"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, Hash, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn?: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'announcement';
  unread?: number;
}

export function ChatInterface() {
  const { t } = useTranslation('chat');
  const [selectedChannel, setSelectedChannel] = useState<string>('1');
  const [message, setMessage] = useState('');
  
  // Mock data
  const channels: Channel[] = [
    { id: '1', name: 'Team Chat', type: 'group' },
    { id: '2', name: 'Coach Johnson', type: 'direct', unread: 2 },
    { id: '3', name: 'Announcements', type: 'announcement' },
  ];
  
  const messages: Message[] = [
    { id: '1', text: 'Welcome to Hockey Hub Chat!', sender: 'System', timestamp: new Date(), isOwn: false },
    { id: '2', text: 'Hey team, great practice today!', sender: 'Coach Johnson', timestamp: new Date(), isOwn: false },
    { id: '3', text: 'Thanks coach!', sender: 'You', timestamp: new Date(), isOwn: true },
  ];

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'direct': return <Users className="h-4 w-4" />;
      case 'announcement': return <Lock className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      // In a real app, this would send to backend
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="flex h-full">
      {/* Channel List */}
      <div className="w-64 border-r bg-gray-50">
        <div className="p-4">
          <h3 className="font-semibold mb-4">Channels</h3>
          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  selectedChannel === channel.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                {getChannelIcon(channel.type)}
                <span className="flex-1 text-left">{channel.name}</span>
                {channel.unread && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {channel.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 m-0 rounded-none border-0">
          <CardHeader className="border-b">
            <CardTitle>
              {channels.find(c => c.id === selectedChannel)?.name || 'Chat'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {!msg.isOwn && (
                        <p className="text-xs font-semibold mb-1">{msg.sender}</p>
                      )}
                      <p>{msg.text}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Message Input */}
            <div className="border-t p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}