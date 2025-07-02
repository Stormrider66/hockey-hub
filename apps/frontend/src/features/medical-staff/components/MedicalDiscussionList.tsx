'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  MessageSquare,
  Users,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  CheckCircle,
  User,
  Filter,
  Search,
  ChevronRight,
  Activity,
  Heart,
  Target,
  FileText,
  Pill,
  UserCog,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  useGetMedicalDiscussionsQuery,
  MedicalDiscussion,
  MedicalDiscussionType,
  MedicalDiscussionStatus,
  MedicalDiscussionPriority,
  MedicalConfidentialityLevel,
} from '@/store/api/medicalDiscussionApi';
import { cn } from '@/lib/utils';

interface MedicalDiscussionListProps {
  onSelectDiscussion: (discussion: MedicalDiscussion) => void;
  onCreateNew: () => void;
  selectedDiscussionId?: string;
  playerId?: string;
  injuryId?: string;
  teamId?: string;
}

export const MedicalDiscussionList: React.FC<MedicalDiscussionListProps> = ({
  onSelectDiscussion,
  onCreateNew,
  selectedDiscussionId,
  playerId,
  injuryId,
  teamId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MedicalDiscussionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<MedicalDiscussionType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<MedicalDiscussionPriority | 'all'>('all');

  const { data, isLoading } = useGetMedicalDiscussionsQuery({
    player_id: playerId,
    injury_id: injuryId,
    team_id: teamId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    discussion_type: typeFilter !== 'all' ? typeFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    limit: 50,
  });

  const getPriorityIcon = (priority: MedicalDiscussionPriority) => {
    switch (priority) {
      case MedicalDiscussionPriority.CRITICAL:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case MedicalDiscussionPriority.HIGH:
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case MedicalDiscussionPriority.MEDIUM:
        return <Info className="h-4 w-4 text-yellow-600" />;
      case MedicalDiscussionPriority.LOW:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeIcon = (type: MedicalDiscussionType) => {
    switch (type) {
      case MedicalDiscussionType.INJURY_TREATMENT:
        return <Activity className="h-4 w-4" />;
      case MedicalDiscussionType.RECOVERY_PLANNING:
        return <Target className="h-4 w-4" />;
      case MedicalDiscussionType.TEAM_HEALTH_UPDATE:
        return <Users className="h-4 w-4" />;
      case MedicalDiscussionType.PLAYER_ASSESSMENT:
        return <FileText className="h-4 w-4" />;
      case MedicalDiscussionType.RETURN_TO_PLAY:
        return <Heart className="h-4 w-4" />;
      case MedicalDiscussionType.PREVENTIVE_CARE:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: MedicalDiscussionStatus) => {
    switch (status) {
      case MedicalDiscussionStatus.ACTIVE:
        return 'default';
      case MedicalDiscussionStatus.RESOLVED:
        return 'secondary';
      case MedicalDiscussionStatus.FOLLOW_UP_REQUIRED:
        return 'warning';
      case MedicalDiscussionStatus.ARCHIVED:
        return 'outline';
      default:
        return 'default';
    }
  };

  const getConfidentialityIcon = (level: MedicalConfidentialityLevel) => {
    switch (level) {
      case MedicalConfidentialityLevel.MEDICAL_ONLY:
        return <Shield className="h-3 w-3 text-red-600" />;
      case MedicalConfidentialityLevel.RESTRICTED:
        return <Shield className="h-3 w-3 text-orange-600" />;
      case MedicalConfidentialityLevel.GENERAL:
        return <Shield className="h-3 w-3 text-gray-400" />;
    }
  };

  const filteredDiscussions = data?.discussions.filter((discussion) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      discussion.title.toLowerCase().includes(searchLower) ||
      discussion.description?.toLowerCase().includes(searchLower) ||
      discussion.player_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Medical Discussions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Medical Discussions</CardTitle>
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="p-4 space-y-3 border-b">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={MedicalDiscussionStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={MedicalDiscussionStatus.RESOLVED}>Resolved</SelectItem>
                <SelectItem value={MedicalDiscussionStatus.FOLLOW_UP_REQUIRED}>Follow-up</SelectItem>
                <SelectItem value={MedicalDiscussionStatus.ARCHIVED}>Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={MedicalDiscussionType.INJURY_TREATMENT}>Injury Treatment</SelectItem>
                <SelectItem value={MedicalDiscussionType.RECOVERY_PLANNING}>Recovery Planning</SelectItem>
                <SelectItem value={MedicalDiscussionType.TEAM_HEALTH_UPDATE}>Team Update</SelectItem>
                <SelectItem value={MedicalDiscussionType.PLAYER_ASSESSMENT}>Assessment</SelectItem>
                <SelectItem value={MedicalDiscussionType.RETURN_TO_PLAY}>Return to Play</SelectItem>
                <SelectItem value={MedicalDiscussionType.PREVENTIVE_CARE}>Preventive Care</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value={MedicalDiscussionPriority.CRITICAL}>Critical</SelectItem>
                <SelectItem value={MedicalDiscussionPriority.HIGH}>High</SelectItem>
                <SelectItem value={MedicalDiscussionPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={MedicalDiscussionPriority.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredDiscussions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No discussions found</p>
              </div>
            ) : (
              filteredDiscussions.map((discussion) => (
                <div
                  key={discussion.id}
                  onClick={() => onSelectDiscussion(discussion)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                    selectedDiscussionId === discussion.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Priority and Type Icons */}
                      <div className="flex flex-col items-center gap-1 mt-1">
                        {getPriorityIcon(discussion.priority)}
                        {getTypeIcon(discussion.discussion_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{discussion.title}</h4>
                          {getConfidentialityIcon(discussion.confidentiality_level)}
                          {discussion.requires_acknowledgment && (
                            <CheckCircle className="h-3 w-3 text-blue-600" />
                          )}
                        </div>

                        {discussion.player_name && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <User className="h-3 w-3" />
                            <span>{discussion.player_name}</span>
                          </div>
                        )}

                        {discussion.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {discussion.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}</span>
                          <span>by {discussion.created_by_name || 'Medical Staff'}</span>
                          {discussion.action_items.length > 0 && (
                            <span className="flex items-center gap-1">
                              <UserCog className="h-3 w-3" />
                              {discussion.action_items.filter(i => i.status === 'pending').length} pending
                            </span>
                          )}
                        </div>

                        {/* Conversation Activity */}
                        {discussion.conversation.last_message && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <p className="text-gray-600 line-clamp-1">
                              <span className="font-medium">{discussion.conversation.last_message.sender_name}:</span>{' '}
                              {discussion.conversation.last_message.content}
                            </p>
                            <p className="text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(discussion.conversation.last_message.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        )}

                        {/* Follow-up Date */}
                        {discussion.follow_up_date && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                            <Calendar className="h-3 w-3" />
                            <span>Follow-up: {format(new Date(discussion.follow_up_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge and Arrow */}
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getStatusBadgeVariant(discussion.status) as any} className="text-xs">
                        {discussion.status.replace(/_/g, ' ')}
                      </Badge>
                      {discussion.conversation.unread_count && discussion.conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {discussion.conversation.unread_count}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};