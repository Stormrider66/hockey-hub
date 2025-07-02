'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Users,
  Building2,
  ChevronRight,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Info,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  Smartphone,
  Shield,
  Eye,
  Download,
  Search,
  Calendar,
  BarChart3,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

// Import types from composer
import { UrgencyLevel, MedicalInfoType, MedicalNotificationStatus } from '../types/urgent-notification';

interface UrgentNotification {
  id: string;
  urgencyLevel: UrgencyLevel;
  medicalType: MedicalInfoType;
  status: MedicalNotificationStatus;
  title: string;
  message: string;
  targetType: string;
  totalRecipients: number;
  acknowledgedCount: number;
  createdAt: Date;
  sentAt?: Date;
  expiresAt: Date;
  escalationLevel: number;
  deliveryChannels: string[];
  acknowledgmentProgress?: {
    required: number;
    received: number;
    percentage: number;
    acknowledgedBy: Array<{
      userId: string;
      userName: string;
      userRole: string;
      acknowledgedAt: Date;
      responseTime: number;
    }>;
  };
  escalationHistory?: Array<{
    level: number;
    reason: string;
    status: string;
    triggeredAt: Date;
    completedAt?: Date;
    targetCount: number;
  }>;
}

interface UrgentNotificationCenterProps {
  medicalStaffId: string;
  organizationId: string;
}

export const UrgentNotificationCenter: React.FC<UrgentNotificationCenterProps> = ({
  medicalStaffId,
  organizationId,
}) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<UrgentNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<UrgentNotification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockNotifications: UrgentNotification[] = [
      {
        id: '1',
        urgencyLevel: UrgencyLevel.EMERGENCY,
        medicalType: MedicalInfoType.INJURY_ALERT,
        status: MedicalNotificationStatus.ESCALATED,
        title: 'Severe Head Injury - Player #23',
        message: 'Player has sustained a severe head injury during practice. Immediate medical attention required.',
        targetType: 'team',
        totalRecipients: 25,
        acknowledgedCount: 18,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        sentAt: new Date(Date.now() - 14 * 60 * 1000),
        expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000),
        escalationLevel: 1,
        deliveryChannels: ['in_app', 'email', 'sms', 'phone'],
        acknowledgmentProgress: {
          required: 20,
          received: 18,
          percentage: 90,
          acknowledgedBy: [
            {
              userId: 'coach1',
              userName: 'Coach Smith',
              userRole: 'coach',
              acknowledgedAt: new Date(Date.now() - 12 * 60 * 1000),
              responseTime: 120,
            },
            {
              userId: 'parent1',
              userName: 'John Doe',
              userRole: 'parent',
              acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000),
              responseTime: 240,
            },
          ],
        },
        escalationHistory: [
          {
            level: 1,
            reason: 'timeout',
            status: 'completed',
            triggeredAt: new Date(Date.now() - 5 * 60 * 1000),
            completedAt: new Date(Date.now() - 3 * 60 * 1000),
            targetCount: 5,
          },
        ],
      },
      {
        id: '2',
        urgencyLevel: UrgencyLevel.CRITICAL,
        medicalType: MedicalInfoType.MEDICATION_REMINDER,
        status: MedicalNotificationStatus.DELIVERED,
        title: 'Critical Medication Required - Multiple Players',
        message: 'Players require their prescribed medications before the game. Check medical records for details.',
        targetType: 'custom_group',
        totalRecipients: 8,
        acknowledgedCount: 6,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
        escalationLevel: 0,
        deliveryChannels: ['in_app', 'email', 'sms'],
      },
      {
        id: '3',
        urgencyLevel: UrgencyLevel.URGENT,
        medicalType: MedicalInfoType.HEALTH_UPDATE,
        status: MedicalNotificationStatus.ACKNOWLEDGED,
        title: 'Health Protocol Update - COVID-19 Guidelines',
        message: 'New health screening requirements effective immediately. All staff and players must comply.',
        targetType: 'organization',
        totalRecipients: 150,
        acknowledgedCount: 150,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        escalationLevel: 0,
        deliveryChannels: ['in_app', 'email'],
      },
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getUrgencyIcon = (level: UrgencyLevel) => {
    switch (level) {
      case UrgencyLevel.EMERGENCY:
        return <AlertTriangle className="h-4 w-4" />;
      case UrgencyLevel.CRITICAL:
        return <AlertCircle className="h-4 w-4" />;
      case UrgencyLevel.URGENT:
        return <Info className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (level: UrgencyLevel) => {
    switch (level) {
      case UrgencyLevel.EMERGENCY:
        return 'destructive';
      case UrgencyLevel.CRITICAL:
        return 'warning';
      case UrgencyLevel.URGENT:
        return 'default';
    }
  };

  const getStatusIcon = (status: MedicalNotificationStatus) => {
    switch (status) {
      case MedicalNotificationStatus.ACKNOWLEDGED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case MedicalNotificationStatus.ESCALATED:
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case MedicalNotificationStatus.DELIVERED:
        return <Clock className="h-4 w-4 text-blue-600" />;
      case MedicalNotificationStatus.RESOLVED:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
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

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUrgency = filterUrgency === 'all' || notification.urgencyLevel === filterUrgency;
    const matchesType = filterType === 'all' || notification.medicalType === filterType;
    
    const matchesTab = activeTab === 'active' 
      ? ![MedicalNotificationStatus.RESOLVED, MedicalNotificationStatus.EXPIRED].includes(notification.status)
      : [MedicalNotificationStatus.RESOLVED, MedicalNotificationStatus.EXPIRED].includes(notification.status);
    
    return matchesSearch && matchesUrgency && matchesType && matchesTab;
  });

  const handleAcknowledge = async (notificationId: string) => {
    try {
      // API call would go here
      toast({
        title: 'Acknowledged',
        description: 'Notification has been acknowledged',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge notification',
        variant: 'destructive',
      });
    }
  };

  const handleEscalate = async (notificationId: string) => {
    try {
      // API call would go here
      toast({
        title: 'Escalated',
        description: 'Notification has been escalated to the next level',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to escalate notification',
        variant: 'destructive',
      });
    }
  };

  const NotificationCard = ({ notification }: { notification: UrgentNotification }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        notification.urgencyLevel === UrgencyLevel.EMERGENCY ? 'border-red-300' : ''
      }`}
      onClick={() => {
        setSelectedNotification(notification);
        setShowDetailsDialog(true);
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={getUrgencyColor(notification.urgencyLevel)}>
                {getUrgencyIcon(notification.urgencyLevel)}
                <span className="ml-1">{notification.urgencyLevel.toUpperCase()}</span>
              </Badge>
              <Badge variant="outline">
                {notification.medicalType.replace(/_/g, ' ')}
              </Badge>
              {getStatusIcon(notification.status)}
            </div>
            <CardTitle className="text-base">{notification.title}</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
            </div>
            {notification.escalationLevel > 0 && (
              <Badge variant="secondary" className="mt-1">
                Escalation L{notification.escalationLevel}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {notification.message}
        </p>
        
        <div className="space-y-2">
          {/* Acknowledgment Progress */}
          {notification.acknowledgmentProgress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Acknowledgments</span>
                <span className="font-medium">
                  {notification.acknowledgedCount}/{notification.acknowledgmentProgress.required}
                </span>
              </div>
              <Progress value={notification.acknowledgmentProgress.percentage} className="h-2" />
            </div>
          )}
          
          {/* Delivery Channels */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {notification.deliveryChannels.map((channel) => (
                <TooltipProvider key={channel}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="p-1 rounded bg-gray-100">
                        {getChannelIcon(channel)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="capitalize">{channel.replace('_', ' ')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            
            {/* Target Info */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {notification.targetType === 'player' && <User className="h-3 w-3" />}
              {notification.targetType === 'team' && <Users className="h-3 w-3" />}
              {notification.targetType === 'organization' && <Building2 className="h-3 w-3" />}
              <span>{notification.totalRecipients} recipients</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Urgent Notification Center</h2>
          <p className="text-muted-foreground">Monitor and manage critical medical alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => 
                ![MedicalNotificationStatus.RESOLVED, MedicalNotificationStatus.EXPIRED].includes(n.status)
              ).length}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="destructive" className="text-xs">
                {notifications.filter(n => n.urgencyLevel === UrgencyLevel.EMERGENCY).length} Emergency
              </Badge>
              <Badge variant="warning" className="text-xs">
                {notifications.filter(n => n.urgencyLevel === UrgencyLevel.CRITICAL).length} Critical
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Acknowledgment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average across all notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Escalations Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              2 resolved, 1 pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.5 min</div>
            <p className="text-xs text-muted-foreground mt-1">
              15% faster than last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Notifications</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value={UrgencyLevel.EMERGENCY}>Emergency</SelectItem>
                  <SelectItem value={UrgencyLevel.CRITICAL}>Critical</SelectItem>
                  <SelectItem value={UrgencyLevel.URGENT}>Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(MedicalInfoType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                      <p className="text-muted-foreground mt-2">Loading notifications...</p>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-muted-foreground mt-2">No active notifications</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="resolved" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-muted-foreground mt-2">No resolved notifications</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notification Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <Badge variant={getUrgencyColor(selectedNotification.urgencyLevel)}>
                        {getUrgencyIcon(selectedNotification.urgencyLevel)}
                        <span className="ml-1">{selectedNotification.urgencyLevel.toUpperCase()}</span>
                      </Badge>
                      {selectedNotification.title}
                    </DialogTitle>
                    <DialogDescription className="mt-2">
                      Created {format(selectedNotification.createdAt, 'PPpp')}
                    </DialogDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDetailsDialog(false)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Message */}
                <div>
                  <h4 className="font-medium mb-2">Message</h4>
                  <Alert>
                    <AlertDescription>{selectedNotification.message}</AlertDescription>
                  </Alert>
                </div>

                {/* Delivery Status */}
                <div>
                  <h4 className="font-medium mb-2">Delivery Channels</h4>
                  <div className="flex gap-2">
                    {selectedNotification.deliveryChannels.map((channel) => (
                      <Badge key={channel} variant="secondary">
                        {getChannelIcon(channel)}
                        <span className="ml-1 capitalize">{channel.replace('_', ' ')}</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Acknowledgments */}
                {selectedNotification.acknowledgmentProgress && (
                  <div>
                    <h4 className="font-medium mb-2">Acknowledgments</h4>
                    <div className="space-y-2">
                      <Progress 
                        value={selectedNotification.acknowledgmentProgress.percentage} 
                        className="h-3"
                      />
                      <p className="text-sm text-muted-foreground">
                        {selectedNotification.acknowledgedCount} of {selectedNotification.acknowledgmentProgress.required} required acknowledgments received
                      </p>
                      
                      {selectedNotification.acknowledgmentProgress.acknowledgedBy.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-2">Acknowledged By:</h5>
                          <div className="space-y-2">
                            {selectedNotification.acknowledgmentProgress.acknowledgedBy.map((ack) => (
                              <div key={ack.userId} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  <span>{ack.userName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {ack.userRole}
                                  </Badge>
                                </div>
                                <div className="text-muted-foreground">
                                  {formatDistanceToNow(ack.acknowledgedAt, { addSuffix: true })}
                                  {' '}({ack.responseTime}s)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Escalation History */}
                {selectedNotification.escalationHistory && selectedNotification.escalationHistory.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Escalation History</h4>
                    <div className="space-y-2">
                      {selectedNotification.escalationHistory.map((escalation, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-orange-600" />
                            <span className="text-sm">
                              Level {escalation.level} - {escalation.reason}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {escalation.targetCount} targets
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(escalation.triggeredAt, { addSuffix: true })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <Separator />
                <div className="flex justify-end gap-2">
                  {selectedNotification.status !== MedicalNotificationStatus.ACKNOWLEDGED && (
                    <Button
                      variant="outline"
                      onClick={() => handleAcknowledge(selectedNotification.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Acknowledge
                    </Button>
                  )}
                  {selectedNotification.status === MedicalNotificationStatus.DELIVERED && (
                    <Button
                      variant="outline"
                      onClick={() => handleEscalate(selectedNotification.id)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Escalate Now
                    </Button>
                  )}
                  <Button>
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Details
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};