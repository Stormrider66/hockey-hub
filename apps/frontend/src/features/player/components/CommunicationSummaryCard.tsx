import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Bell, 
  Users, 
  ArrowRight,
  Calendar,
  AlertCircle
} from "lucide-react";

interface CommunicationSummaryProps {
  summary?: {
    conversations: {
      total: number;
      unreadCount: number;
      recentConversations: Array<{
        id: string;
        name: string;
        lastMessage?: {
          content: string;
          senderId: string;
          createdAt: Date;
        };
        unreadCount: number;
      }>;
    };
    messages: {
      totalUnread: number;
      mentions: number;
      recentMessages: Array<{
        id: string;
        content: string;
        senderId: string;
        conversationId: string;
        createdAt: Date;
      }>;
    };
    notifications: {
      total: number;
      unread: number;
      byType: Record<string, number>;
      recent: Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        createdAt: Date;
        read: boolean;
      }>;
    };
  };
}

export default function CommunicationSummaryCard({ summary }: CommunicationSummaryProps) {
  if (!summary) {
    return null;
  }

  const totalUnread = summary.conversations.unreadCount + summary.messages.totalUnread + summary.notifications.unread;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Communications</CardTitle>
            <CardDescription>Stay connected with your team</CardDescription>
          </div>
          {totalUnread > 0 && (
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {totalUnread}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conversations Summary */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Team Conversations</p>
              <p className="text-xs text-muted-foreground">
                {summary.conversations.unreadCount} unread messages
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Notifications Summary */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {summary.notifications.unread} new notifications
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Mentions */}
        {summary.messages.mentions > 0 && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <div>
                <p className="text-sm font-medium">You have {summary.messages.mentions} mentions</p>
                <p className="text-xs text-muted-foreground">
                  Check messages where you're mentioned
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Conversations */}
        {summary.conversations.recentConversations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Recent Conversations</p>
            {summary.conversations.recentConversations.slice(0, 3).map((conv) => (
              <div key={conv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.name}</p>
                  {conv.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full">
            <MessageCircle className="h-4 w-4 mr-1" />
            Messages
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Bell className="h-4 w-4 mr-1" />
            Notifications
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}