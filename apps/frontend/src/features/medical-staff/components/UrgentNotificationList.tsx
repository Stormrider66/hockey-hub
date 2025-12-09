import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  User,
  Users,
  Building2,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { 
  UrgentMedicalNotification, 
  UrgencyLevel, 
  MedicalNotificationStatus,
  MedicalInfoType 
} from '../types/urgent-notification';
import { formatDistanceToNow, format } from 'date-fns';
import { useAcknowledgeNotificationMutation } from '@/store/api/urgentMedicalApi';
import { useToast } from '@/components/ui/use-toast';

interface UrgentNotificationListProps {
  notifications: UrgentMedicalNotification[];
  isLoading: boolean;
  onSelectNotification: (id: string) => void;
  currentUserId: string;
}

const UrgentNotificationList: React.FC<UrgentNotificationListProps> = ({
  notifications,
  isLoading,
  onSelectNotification,
  currentUserId,
}) => {
  const { toast } = useToast();
  const [acknowledgeNotification] = useAcknowledgeNotificationMutation();

  const getUrgencyIcon = (level: UrgencyLevel) => {
    switch (level) {
      case UrgencyLevel.URGENT:
        return <Info className="h-4 w-4" />;
      case UrgencyLevel.CRITICAL:
        return <AlertCircle className="h-4 w-4" />;
      case UrgencyLevel.EMERGENCY:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (level: UrgencyLevel): string => {
    switch (level) {
      case UrgencyLevel.URGENT:
        return 'default';
      case UrgencyLevel.CRITICAL:
        return 'warning';
      case UrgencyLevel.EMERGENCY:
        return 'destructive';
    }
  };

  const getStatusIcon = (status: MedicalNotificationStatus) => {
    switch (status) {
      case MedicalNotificationStatus.PENDING:
      case MedicalNotificationStatus.DELIVERED:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case MedicalNotificationStatus.ACKNOWLEDGED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case MedicalNotificationStatus.ESCALATED:
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case MedicalNotificationStatus.RESOLVED:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'in_app':
        return <Bell className="h-3 w-3" />;
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'sms':
        return <MessageSquare className="h-3 w-3" />;
      case 'push':
        return <Smartphone className="h-3 w-3" />;
      case 'phone':
        return <Phone className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'player':
        return <User className="h-3 w-3" />;
      case 'team':
        return <Users className="h-3 w-3" />;
      case 'organization':
        return <Building2 className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getMedicalTypeLabel = (type: MedicalInfoType): string => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleQuickAcknowledge = async (notification: UrgentMedicalNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await acknowledgeNotification({
        notificationId: notification.id,
        method: 'in_app',
      }).unwrap();
      
      toast({
        title: 'Acknowledged',
        description: 'Notification has been acknowledged successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge notification',
        variant: 'destructive',
      });
    }
  };

  const isUserAcknowledged = (notification: UrgentMedicalNotification): boolean => {
    // This would need to check if current user has already acknowledged
    // For now, returning false
    return false;
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-6 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">No active notifications</h3>
        <p className="text-gray-500 mt-1">All urgent medical notifications have been resolved</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-6">
      {notifications.map((notification) => (
        <Card 
          key={notification.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            notification.urgencyLevel === UrgencyLevel.EMERGENCY 
              ? 'border-red-400 hover:border-red-500' 
              : notification.urgencyLevel === UrgencyLevel.CRITICAL
              ? 'border-orange-400 hover:border-orange-500'
              : 'hover:border-gray-300'
          }`}
          onClick={() => onSelectNotification(notification.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getUrgencyColor(notification.urgencyLevel) as any}>
                    {getUrgencyIcon(notification.urgencyLevel)}
                    <span className="ml-1">{notification.urgencyLevel.toUpperCase()}</span>
                  </Badge>
                  <Badge variant="outline">
                    {getMedicalTypeLabel(notification.medicalType)}
                  </Badge>
                  {notification.escalationLevel > 0 && (
                    <Badge variant="secondary">
                      Escalation L{notification.escalationLevel}
                    </Badge>
                  )}
                  {getStatusIcon(notification.status)}
                </div>
                <h3 className="font-semibold text-lg">{notification.title}</h3>
              </div>
              <div className="text-right ml-4">
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </div>
                {notification.expiresAt && (
                  <div className="text-xs text-gray-400 mt-1">
                    Expires {format(new Date(notification.expiresAt), 'MMM d, h:mm a')}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-gray-600 line-clamp-2 mb-4">{notification.message}</p>
            
            {/* Progress Bar */}
            {notification.requiresAcknowledgment && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Acknowledgments</span>
                  <span className="font-medium">
                    {notification.acknowledgedCount} / {notification.minAcknowledgmentsRequired}
                  </span>
                </div>
                <Progress 
                  value={(notification.acknowledgedCount / notification.minAcknowledgmentsRequired) * 100} 
                  className="h-2"
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Delivery Channels */}
                <div className="flex items-center gap-1">
                  {notification.deliveryChannels.map((channel) => (
                    <div key={channel} className="p-1.5 bg-gray-100 rounded">
                      {getChannelIcon(channel)}
                    </div>
                  ))}
                </div>
                
                {/* Target Info */}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  {getTargetIcon(notification.targetType)}
                  <span>{notification.totalRecipients} recipients</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                {notification.requiresAcknowledgment && 
                 notification.status !== MedicalNotificationStatus.ACKNOWLEDGED &&
                 notification.status !== MedicalNotificationStatus.RESOLVED &&
                 !isUserAcknowledged(notification) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleQuickAcknowledge(notification, e)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Acknowledge
                  </Button>
                )}
                <Button size="sm" variant="ghost">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UrgentNotificationList;