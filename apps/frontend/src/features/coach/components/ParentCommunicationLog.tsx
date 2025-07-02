import React, { useState, useMemo } from 'react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Phone,
  Video,
  Mail,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Eye,
  Paperclip,
  Bell,
  Tag,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useListCommunicationsQuery,
  useGetCommunicationQuery,
  useUpdateActionItemMutation,
  CommunicationType,
  CommunicationCategory,
  CommunicationPriority,
  ParentCommunication,
} from '@/store/api/parentCommunicationApi';
import { ParentCommunicationModal } from './ParentCommunicationModal';
import { ParentCommunicationReport } from './ParentCommunicationReport';
import { cn } from '@/lib/utils';

interface ParentCommunicationLogProps {
  playerId?: string;
  teamId?: string;
  coachId?: string;
  organizationId: string;
}

const typeIcons: Record<CommunicationType, React.ElementType> = {
  [CommunicationType.IN_PERSON_MEETING]: Users,
  [CommunicationType.PHONE_CALL]: Phone,
  [CommunicationType.VIDEO_CALL]: Video,
  [CommunicationType.EMAIL]: Mail,
  [CommunicationType.CHAT_MESSAGE]: MessageSquare,
  [CommunicationType.TEXT_MESSAGE]: MessageSquare,
  [CommunicationType.OTHER]: FileText,
};

const categoryColors: Record<CommunicationCategory, string> = {
  [CommunicationCategory.ACADEMIC]: 'bg-purple-100 text-purple-800',
  [CommunicationCategory.BEHAVIORAL]: 'bg-orange-100 text-orange-800',
  [CommunicationCategory.MEDICAL]: 'bg-red-100 text-red-800',
  [CommunicationCategory.PERFORMANCE]: 'bg-green-100 text-green-800',
  [CommunicationCategory.ADMINISTRATIVE]: 'bg-gray-100 text-gray-800',
  [CommunicationCategory.SOCIAL]: 'bg-blue-100 text-blue-800',
  [CommunicationCategory.OTHER]: 'bg-slate-100 text-slate-800',
};

const priorityColors: Record<CommunicationPriority, string> = {
  [CommunicationPriority.LOW]: 'bg-gray-100 text-gray-600',
  [CommunicationPriority.MEDIUM]: 'bg-yellow-100 text-yellow-700',
  [CommunicationPriority.HIGH]: 'bg-orange-100 text-orange-700',
  [CommunicationPriority.URGENT]: 'bg-red-100 text-red-700',
};

export const ParentCommunicationLog: React.FC<ParentCommunicationLogProps> = ({
  playerId,
  teamId,
  coachId,
  organizationId,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CommunicationCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CommunicationType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  });

  const { data: communicationsData, isLoading } = useListCommunicationsQuery({
    organizationId,
    playerId,
    teamId,
    coachId,
    searchTerm: searchTerm || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    dateFrom: dateRange.from || undefined,
    dateTo: dateRange.to || undefined,
    page: 1,
    limit: 50,
  });

  const [updateActionItem] = useUpdateActionItemMutation();

  const communications = communicationsData?.data || [];

  // Filter communications by tab
  const filteredCommunications = useMemo(() => {
    switch (activeTab) {
      case 'follow-up':
        return communications.filter(c => c.requiresFollowUp && !c.isFollowUpComplete);
      case 'confidential':
        return communications.filter(c => c.isConfidential);
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return communications.filter(c => 
          isAfter(parseISO(c.communicationDate), sevenDaysAgo)
        );
      default:
        return communications;
    }
  }, [communications, activeTab]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleActionItemToggle = async (
    communicationId: string,
    actionItemId: string,
    completed: boolean
  ) => {
    try {
      await updateActionItem({
        communicationId,
        actionItemId,
        completed,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update action item:', error);
    }
  };

  const renderCommunicationItem = (communication: ParentCommunication) => {
    const Icon = typeIcons[communication.type];
    const isExpanded = expandedItems.has(communication.id);

    return (
      <Card key={communication.id} className="mb-4">
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleExpanded(communication.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Icon className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base font-semibold">
                    {communication.subject}
                  </CardTitle>
                  {communication.isConfidential && (
                    <Badge variant="secondary" className="text-xs">
                      Confidential
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {format(parseISO(communication.communicationDate), 'PPP')} at{' '}
                  {format(parseISO(communication.communicationDate), 'p')}
                  {communication.durationMinutes && (
                    <span className="ml-2">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {communication.durationMinutes} min
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn(categoryColors[communication.category], 'text-xs')}>
                {communication.category}
              </Badge>
              <Badge className={cn(priorityColors[communication.priority], 'text-xs')}>
                {communication.priority}
              </Badge>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-1">Summary</h4>
                <p className="text-sm text-gray-600">{communication.summary}</p>
              </div>

              {communication.detailedNotes && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Detailed Notes</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {communication.detailedNotes}
                  </p>
                </div>
              )}

              {communication.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {communication.location}
                </div>
              )}

              {communication.tags && communication.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div className="flex gap-1 flex-wrap">
                    {communication.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {communication.additionalParticipants && 
               communication.additionalParticipants.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Additional Participants</h4>
                  <div className="flex gap-2 flex-wrap">
                    {communication.additionalParticipants.map((participant, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {participant.name} ({participant.role})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {communication.actionItems && communication.actionItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Action Items</h4>
                  <div className="space-y-2">
                    {communication.actionItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionItemToggle(
                              communication.id,
                              item.id,
                              !item.completed
                            );
                          }}
                        >
                          <CheckCircle
                            className={cn(
                              'h-4 w-4',
                              item.completed
                                ? 'text-green-600 fill-green-600'
                                : 'text-gray-400'
                            )}
                          />
                        </Button>
                        <div className="flex-1">
                          <p className={cn(item.completed && 'line-through text-gray-400')}>
                            {item.description}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500 mt-1">
                            <span>Assigned to: {item.assignedTo}</span>
                            {item.dueDate && (
                              <span>Due: {format(parseISO(item.dueDate), 'PP')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {communication.attachments && communication.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Attachments</h4>
                  <div className="space-y-1">
                    {communication.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Paperclip className="h-4 w-4" />
                        {attachment.fileName}
                        <Download className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {communication.requiresFollowUp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      Follow-up Required
                    </span>
                    {communication.followUpDate && (
                      <span className="text-yellow-700">
                        by {format(parseISO(communication.followUpDate), 'PP')}
                      </span>
                    )}
                  </div>
                  {communication.followUpNotes && (
                    <p className="text-sm text-yellow-700 mt-1">
                      {communication.followUpNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Parent Communication Log</h2>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Communication
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search communications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => setCategoryFilter(value as any)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {Object.values(CommunicationCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as any)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.values(CommunicationType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                         type.replace(/_/g, ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date-range">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              All ({communications.length})
            </TabsTrigger>
            <TabsTrigger value="follow-up">
              Follow-up Required (
              {communications.filter(c => c.requiresFollowUp && !c.isFollowUpComplete).length})
            </TabsTrigger>
            <TabsTrigger value="confidential">
              Confidential ({communications.filter(c => c.isConfidential).length})
            </TabsTrigger>
            <TabsTrigger value="recent">
              Last 7 Days
            </TabsTrigger>
            <TabsTrigger value="reports">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-3 w-[200px]" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : filteredCommunications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No communications found</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                {filteredCommunications.map(renderCommunicationItem)}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <ParentCommunicationReport
              organizationId={organizationId}
              teamId={teamId}
              coachId={coachId}
            />
          </TabsContent>
        </Tabs>
      </div>

      {showCreateModal && (
        <ParentCommunicationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          playerId={playerId}
          teamId={teamId}
          organizationId={organizationId}
        />
      )}
    </>
  );
};