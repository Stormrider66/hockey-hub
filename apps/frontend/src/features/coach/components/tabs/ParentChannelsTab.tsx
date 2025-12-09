'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Edit } from '@/components/icons';
import { useTranslation } from '@hockey-hub/translations';
import { CoachChannelList } from '@/features/chat/components/CoachChannelList';

interface Channel {
  id: string;
  playerName: string;
  parentName: string;
  unreadCount: number;
  hasPendingMeetingRequest: boolean;
}

interface ParentChannelsTabProps {
  channels: Channel[];
  loading: boolean;
  onChannelSelect: (channelId: string) => void;
}

export function ParentChannelsTab({ channels, loading, onChannelSelect }: ParentChannelsTabProps) {
  const { t } = useTranslation(['coach', 'common']);

  return (
    <div className="space-y-6">
      {/* Private Parent Channels */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('coach:parentChannels.title', 'Private Parent Channels')}
              </CardTitle>
              <CardDescription>
                {t(
                  'coach:parentChannels.description',
                  'Secure, private messaging with player parents'
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {channels.length > 0 ? (
            <CoachChannelList channels={channels} onChannelSelect={onChannelSelect} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('coach:parentChannels.noChannels', 'No parent channels available')}</p>
              <p className="text-sm mt-1">
                {t(
                  'coach:parentChannels.noChannelsDesc',
                  'Channels will be created when players are added to your team'
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats about Parent Communication */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t('coach:parentChannels.stats.activeChats', 'Active Chats')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channels.filter((c) => c.unreadCount > 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('coach:parentChannels.stats.withUnreadMessages', 'With unread messages')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t('coach:parentChannels.stats.totalParents', 'Total Parents')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('coach:parentChannels.stats.connectedParents', 'Connected parents')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t('coach:parentChannels.stats.pendingMeetings', 'Pending Meetings')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channels.filter((c) => c.hasPendingMeetingRequest).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('coach:parentChannels.stats.requestsToReview', 'Requests to review')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Office Hours */}
      <Card>
        <CardHeader>
          <CardTitle>{t('coach:parentChannels.officeHours.title', 'Your Office Hours')}</CardTitle>
          <CardDescription>
            {t(
              'coach:parentChannels.officeHours.description',
              'When parents can schedule meetings with you'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Monday & Wednesday</p>
                <p className="text-sm text-muted-foreground">4:00 PM - 6:00 PM</p>
              </div>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                {t('common:edit')}
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Friday</p>
                <p className="text-sm text-muted-foreground">3:00 PM - 5:00 PM</p>
              </div>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                {t('common:edit')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ParentChannelsTab;



