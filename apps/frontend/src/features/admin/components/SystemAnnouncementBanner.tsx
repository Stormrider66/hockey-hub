import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Check, Info, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useGetUserSystemAnnouncementsQuery,
  useMarkSystemAnnouncementAsReadMutation,
  useAcknowledgeSystemAnnouncementMutation,
  useDismissSystemAnnouncementMutation,
  SystemAnnouncement,
} from '@/store/api/systemAnnouncementApi';
import { toast } from 'react-hot-toast';

const PRIORITY_CONFIG = {
  info: { 
    icon: Info, 
    bgColor: 'bg-blue-50 border-blue-200', 
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
  warning: { 
    icon: AlertTriangle, 
    bgColor: 'bg-yellow-50 border-yellow-200', 
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
  },
  critical: { 
    icon: Shield, 
    bgColor: 'bg-red-50 border-red-200', 
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
};

export const SystemAnnouncementBanner: React.FC = () => {
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const [acknowledgmentNotes, setAcknowledgmentNotes] = useState<Record<string, string>>({});

  const { data, refetch } = useGetUserSystemAnnouncementsQuery();
  const [markAsRead] = useMarkSystemAnnouncementAsReadMutation();
  const [acknowledge] = useAcknowledgeSystemAnnouncementMutation();
  const [dismiss] = useDismissSystemAnnouncementMutation();

  // Get announcements that should show as banners
  const bannerAnnouncements = data?.announcements?.filter(({ announcement, recipientStatus }) => 
    announcement.metadata?.show_banner &&
    announcement.status === 'sent' &&
    !announcement.expires_at || new Date(announcement.expires_at) > new Date() &&
    recipientStatus !== 'dismissed' &&
    !dismissedBanners.has(announcement.id)
  ) || [];

  // Sort by priority (critical first)
  const sortedBanners = bannerAnnouncements.sort((a, b) => {
    const priorityOrder = { critical: 0, warning: 1, info: 2 };
    return priorityOrder[a.announcement.priority] - priorityOrder[b.announcement.priority];
  });

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      await markAsRead(announcementId).unwrap();
      refetch();
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const handleAcknowledge = async (announcementId: string, title: string) => {
    try {
      const note = acknowledgmentNotes[announcementId];
      await acknowledge({ id: announcementId, note }).unwrap();
      toast.success(`Acknowledged: ${title}`);
      setAcknowledgmentNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[announcementId];
        return newNotes;
      });
      refetch();
    } catch (error: any) {
      console.error('Error acknowledging announcement:', error);
      toast.error(error.data?.error || 'Failed to acknowledge announcement');
    }
  };

  const handleDismiss = async (announcementId: string, title: string) => {
    try {
      await dismiss({ id: announcementId, reason: 'User dismissed' }).unwrap();
      setDismissedBanners(prev => new Set([...prev, announcementId]));
      toast.success(`Dismissed: ${title}`);
      refetch();
    } catch (error: any) {
      console.error('Error dismissing announcement:', error);
      toast.error(error.data?.error || 'Failed to dismiss announcement');
    }
  };

  const handleTemporaryDismiss = (announcementId: string) => {
    setDismissedBanners(prev => new Set([...prev, announcementId]));
  };

  if (sortedBanners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {sortedBanners.map(({ announcement, recipientStatus }) => {
        const config = PRIORITY_CONFIG[announcement.priority];
        const Icon = config.icon;
        const requiresAcknowledgment = announcement.metadata?.require_acknowledgment;
        const isUnread = recipientStatus === 'pending' || recipientStatus === 'delivered';

        // Auto-mark as read when banner is shown
        if (isUnread) {
          handleMarkAsRead(announcement.id);
        }

        return (
          <Card
            key={announcement.id}
            className={cn(
              "border-l-4 p-4",
              config.bgColor,
              config.textColor
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{announcement.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {announcement.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed mb-3">
                      {announcement.content}
                    </p>

                    {requiresAcknowledgment && recipientStatus !== 'acknowledged' && (
                      <div className="space-y-2 mb-3">
                        <textarea
                          placeholder="Add acknowledgment note (optional)"
                          value={acknowledgmentNotes[announcement.id] || ''}
                          onChange={(e) => setAcknowledgmentNotes(prev => ({
                            ...prev,
                            [announcement.id]: e.target.value
                          }))}
                          className="w-full p-2 text-sm border rounded resize-none bg-white/50"
                          rows={2}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {requiresAcknowledgment && recipientStatus !== 'acknowledged' ? (
                        <Button
                          size="sm"
                          onClick={() => handleAcknowledge(announcement.id, announcement.title)}
                          className={cn("text-white", config.buttonColor)}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Acknowledge
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {recipientStatus === 'acknowledged' ? 'Acknowledged' : 'Read'}
                        </Badge>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(announcement.id, announcement.title)}
                        className="text-xs"
                      >
                        Dismiss Forever
                      </Button>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTemporaryDismiss(announcement.id)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};