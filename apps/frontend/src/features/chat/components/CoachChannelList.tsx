import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Lock,
  MessageSquare,
  Users,
  ChevronRight,
  UserCheck,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppSelector } from '@/store/hooks';

interface CoachChannel {
  id: string;
  name: string;
  metadata: {
    playerId: string;
    playerName?: string;
    parentId: string;
    coachIds: string[];
    teamId: string;
    teamName?: string;
  };
  lastMessage?: {
    content: string;
    created_at: string;
  };
  unreadCount?: number;
  participants: any[];
  hasPendingMeetingRequest?: boolean;
  nextMeeting?: {
    date: string;
    type: string;
  };
}

interface CoachChannelListProps {
  channels: CoachChannel[];
  onChannelSelect: (channelId: string) => void;
  selectedChannelId?: string;
}

export const CoachChannelList: React.FC<CoachChannelListProps> = ({
  channels,
  onChannelSelect,
  selectedChannelId,
}) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isParent = currentUser?.role === 'parent';

  if (!channels.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No private coach channels yet</p>
            <p className="text-sm mt-1">
              {isParent
                ? "Channels will be created when your children join teams"
                : "You'll see parent channels for your team players here"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Private Coach Channels
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4">
            {channels.map((channel) => {
              const isSelected = channel.id === selectedChannelId;
              const coachCount = channel.metadata.coachIds.length;

              return (
                <Button
                  key={channel.id}
                  variant={isSelected ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-auto p-3"
                  onClick={() => onChannelSelect(channel.id)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10">
                          <Lock className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <Badge
                        className="absolute -bottom-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                        variant="secondary"
                      >
                        <UserCheck className="h-3 w-3" />
                      </Badge>
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">
                          {channel.metadata.playerName || 'Private Channel'}
                        </h4>
                        <div className="flex items-center gap-1">
                          {channel.hasPendingMeetingRequest && (
                            <Badge variant="destructive" className="h-5 px-1">
                              <AlertCircle className="h-3 w-3" />
                            </Badge>
                          )}
                          {channel.unreadCount && channel.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-5">
                              {channel.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Users className="h-3 w-3" />
                        <span>{coachCount} coach{coachCount !== 1 ? 'es' : ''}</span>
                        {channel.metadata.teamName && (
                          <>
                            <span>•</span>
                            <span>{channel.metadata.teamName}</span>
                          </>
                        )}
                      </div>

                      {channel.lastMessage && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {channel.lastMessage.content}
                        </p>
                      )}

                      {channel.nextMeeting && (
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3 text-primary" />
                          <span className="text-xs text-primary">
                            Meeting {format(new Date(channel.nextMeeting.date), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};