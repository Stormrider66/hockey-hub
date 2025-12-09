import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Share2, 
  X, 
  Check, 
  Eye, 
  User,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { TemplateShareNotification, TemplatePermission } from '../../types/template.types';

interface TemplateNotificationsProps {
  onAcceptShare: (notification: TemplateShareNotification) => void;
  onDeclineShare: (notification: TemplateShareNotification) => void;
}

const PERMISSION_COLORS = {
  owner: 'bg-red-100 text-red-800',
  collaborator: 'bg-blue-100 text-blue-800',
  viewer: 'bg-green-100 text-green-800',
  link_access: 'bg-purple-100 text-purple-800'
};

export const TemplateNotifications: React.FC<TemplateNotificationsProps> = ({
  onAcceptShare,
  onDeclineShare
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [notifications, setNotifications] = useState<TemplateShareNotification[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  // Mock notifications - in real app these would come from API
  useEffect(() => {
    const mockNotifications: TemplateShareNotification[] = [
      {
        id: 'notif_1',
        recipientId: 'current_user',
        templateId: 'template_123',
        templateName: 'Advanced Strength Circuit',
        sharedBy: 'coach_wilson',
        sharedByName: 'Coach Wilson',
        permission: 'collaborator',
        message: 'Hey! I thought you might find this workout useful for our senior players. Feel free to modify it as needed.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        readAt: undefined,
        actionTaken: undefined
      },
      {
        id: 'notif_2',
        recipientId: 'current_user',
        templateId: 'template_456',
        templateName: 'Pre-Game Activation Routine',
        sharedBy: 'trainer_garcia',
        sharedByName: 'Trainer Garcia',
        permission: 'viewer',
        message: 'This has been working great with our team. Check it out!',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        readAt: undefined,
        actionTaken: undefined
      },
      {
        id: 'notif_3',
        recipientId: 'current_user',
        templateId: 'template_789',
        templateName: 'Recovery & Mobility Session',
        sharedBy: 'physio_martinez',
        sharedByName: 'Dr. Martinez',
        permission: 'viewer',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        readAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        actionTaken: 'accepted'
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.readAt && !n.actionTaken);
  const hasUnread = unreadNotifications.length > 0;

  const handleAccept = async (notification: TemplateShareNotification) => {
    setLoading(true);
    try {
      // Mark as read and accepted
      setNotifications(prev => prev.map(n => 
        n.id === notification.id 
          ? { ...n, readAt: new Date(), actionTaken: 'accepted' as const }
          : n
      ));
      
      onAcceptShare(notification);
    } catch (error) {
      console.error('Failed to accept share:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (notification: TemplateShareNotification) => {
    setLoading(true);
    try {
      // Mark as read and declined
      setNotifications(prev => prev.map(n => 
        n.id === notification.id 
          ? { ...n, readAt: new Date(), actionTaken: 'declined' as const }
          : n
      ));
      
      onDeclineShare(notification);
    } catch (error) {
      console.error('Failed to decline share:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId && !n.readAt
        ? { ...n, readAt: new Date() }
        : n
    ));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('templates.share.notifications.justNow');
    if (diffInHours < 24) return t('templates.share.notifications.hoursAgo', { hours: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return t('templates.share.notifications.yesterday');
    if (diffInDays < 7) return t('templates.share.notifications.daysAgo', { days: diffInDays });
    
    return date.toLocaleDateString();
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className={`mb-6 ${hasUnread ? 'border-blue-200 bg-blue-50/30' : ''}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className={`h-5 w-5 ${hasUnread ? 'text-blue-600' : 'text-muted-foreground'}`} />
            <h3 className="font-semibold">
              {t('templates.share.notifications.title')}
            </h3>
            {hasUnread && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {unreadNotifications.length} {t('templates.share.notifications.new')}
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-3">
            {notifications.slice(0, 5).map(notification => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  !notification.readAt && !notification.actionTaken
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">
                        {notification.sharedByName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t('templates.share.notifications.sharedTemplate')}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${PERMISSION_COLORS[notification.permission]}`}
                      >
                        {t(`templates.share.permissions.${notification.permission}.title`)}
                      </Badge>
                    </div>
                    
                    <div className="mb-2">
                      <span className="font-medium">{notification.templateName}</span>
                    </div>
                    
                    {notification.message && (
                      <p className="text-sm text-muted-foreground mb-2 italic">
                        "{notification.message}"
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.readAt && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {t('templates.share.notifications.read')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {notification.actionTaken === 'accepted' && (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        {t('templates.share.notifications.accepted')}
                      </Badge>
                    )}
                    
                    {notification.actionTaken === 'declined' && (
                      <Badge className="bg-red-100 text-red-800">
                        <X className="h-3 w-3 mr-1" />
                        {t('templates.share.notifications.declined')}
                      </Badge>
                    )}

                    {!notification.actionTaken && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAccept(notification)}
                          disabled={loading}
                          className="text-green-600 hover:bg-green-50"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {t('templates.share.notifications.accept')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(notification)}
                          disabled={loading}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {t('templates.share.notifications.decline')}
                        </Button>
                      </div>
                    )}

                    {!notification.readAt && notification.actionTaken && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs"
                      >
                        {t('templates.share.notifications.markRead')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {notifications.length > 5 && (
              <div className="text-center">
                <Button variant="ghost" size="sm">
                  {t('templates.share.notifications.viewAll', { 
                    total: notifications.length 
                  })}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};