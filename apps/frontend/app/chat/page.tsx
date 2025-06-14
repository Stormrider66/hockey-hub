"use client";

import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Users, Hash, Settings } from "lucide-react";

export default function ChatPage() {
  // Mock chat data
  const channels = [
    { id: 1, name: "general", type: "public", unread: 3 },
    { id: 2, name: "coaches", type: "private", unread: 0 },
    { id: 3, name: "game-day", type: "public", unread: 1 },
    { id: 4, name: "training", type: "public", unread: 0 }
  ];

  const messages = [
    {
      id: 1,
      user: "Robert Ohlsson",
      role: "Coach",
      message: "Great practice today everyone! Remember to focus on defensive positioning for tomorrow's game.",
      time: "14:30",
      avatar: "RO"
    },
    {
      id: 2,
      user: "Erik Andersson",
      role: "Player",
      message: "Thanks coach! Should we review the power play setup one more time?",
      time: "14:32",
      avatar: "EA"
    },
    {
      id: 3,
      user: "Maria Andersson",
      role: "Player",
      message: "I'll be there 30 minutes early for extra warm-up",
      time: "14:35",
      avatar: "MA"
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader 
        title="Team Chat" 
        subtitle="Communicate with your team in real-time"
        role="coach"
      />
      
      <div className="grid grid-cols-4 gap-6 h-[600px]">
        {/* Channels Sidebar */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {channels.map(channel => (
                <div 
                  key={channel.id} 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{channel.name}</span>
                  </div>
                  {channel.unread > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {channel.unread}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Direct Messages</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">EA</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Erik Andersson</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">MA</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Maria Andersson</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-3 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                <CardTitle>general</CardTitle>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  24 members
                </Badge>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map(message => (
                <div key={message.id} className="flex gap-3">
                  <Avatar>
                    <AvatarFallback>{message.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{message.user}</span>
                      <Badge variant="outline" className="text-xs">
                        {message.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{message.time}</span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          
          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Type a message..." 
                className="flex-1"
              />
              <Button>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Integration Notice */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Real-time chat will be integrated with Communication Service (Port 3002)
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              WebSocket connection and message persistence coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 