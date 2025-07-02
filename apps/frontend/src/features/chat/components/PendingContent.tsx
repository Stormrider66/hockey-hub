import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, MessageSquare, User, Clock, Eye, CheckCircle, XCircle } from 'lucide-react';
import { 
  useGetPendingContentQuery, 
  useMakeDecisionMutation,
  ModeratedContent,
  ModerationStatus,
  ModerationAction,
  ModerationReason
} from '@/store/api/moderationApi';
import { toast } from 'react-hot-toast';

interface PendingContentProps {
  limit?: number;
}

export const PendingContent: React.FC<PendingContentProps> = ({
  limit = 20
}) => {
  const [page, setPage] = useState(1);
  const [selectedContent, setSelectedContent] = useState<ModeratedContent | null>(null);
  const [decision, setDecision] = useState<{
    status: ModerationStatus;
    action: ModerationAction;
    notes: string;
  }>({
    status: ModerationStatus.PENDING,
    action: ModerationAction.NONE,
    notes: ''
  });

  const { data, isLoading, refetch } = useGetPendingContentQuery({ page, limit });
  const [makeDecision, { isLoading: isDecisionLoading }] = useMakeDecisionMutation();

  const pendingContent = data?.data?.content || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleDecision = async () => {
    if (!selectedContent) return;

    try {
      await makeDecision({
        moderatedContentId: selectedContent.id,
        status: decision.status,
        action: decision.action,
        moderatorNotes: decision.notes
      }).unwrap();

      toast.success('Decision recorded successfully');
      setSelectedContent(null);
      setDecision({
        status: ModerationStatus.PENDING,
        action: ModerationAction.NONE,
        notes: ''
      });
      refetch();
    } catch (error) {
      toast.error('Failed to record decision');
    }
  };

  const getReasonColor = (reason: ModerationReason) => {
    switch (reason) {
      case ModerationReason.SPAM:
        return 'bg-yellow-100 text-yellow-800';
      case ModerationReason.HARASSMENT:
        return 'bg-red-100 text-red-800';
      case ModerationReason.HATE_SPEECH:
        return 'bg-red-100 text-red-800';
      case ModerationReason.VIOLENCE:
        return 'bg-red-100 text-red-800';
      case ModerationReason.INAPPROPRIATE_CONTENT:
        return 'bg-orange-100 text-orange-800';
      case ModerationReason.PRIVACY_VIOLATION:
        return 'bg-purple-100 text-purple-800';
      case ModerationReason.COPYRIGHT:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (reason: ModerationReason) => {
    const highSeverity = [
      ModerationReason.HARASSMENT,
      ModerationReason.HATE_SPEECH,
      ModerationReason.VIOLENCE
    ];
    
    return highSeverity.includes(reason) ? (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (pendingContent.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Pending Reports
        </h3>
        <p className="text-gray-600">
          All reported content has been reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingContent.map((content) => (
        <Card key={content.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getSeverityIcon(content.reason)}
                <div>
                  <CardTitle className="text-base">
                    Reported Content
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getReasonColor(content.reason)}>
                      {content.reason.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(content.createdAt), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedContent(content)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Review Reported Content</DialogTitle>
                    <DialogDescription>
                      Make a moderation decision for this reported content
                    </DialogDescription>
                  </DialogHeader>
                  
                  {selectedContent && (
                    <div className="space-y-6">
                      {/* Original Message */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Reported Message
                        </h4>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                          {selectedContent.message?.content || 'Message content not available'}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          Sent on {selectedContent.message?.createdAt ? 
                            format(new Date(selectedContent.message.createdAt), 'PPpp') : 
                            'Unknown date'
                          }
                        </div>
                      </div>

                      {/* Report Details */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Report Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Reason:</span>
                            <Badge className={`ml-2 ${getReasonColor(selectedContent.reason)}`}>
                              {selectedContent.reason.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-gray-500">Reporter:</span>
                            <span className="ml-2">{selectedContent.reporterId}</span>
                          </div>
                        </div>
                        
                        {selectedContent.description && (
                          <div>
                            <span className="text-gray-500 text-sm">Description:</span>
                            <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                              {selectedContent.description}
                            </p>
                          </div>
                        )}

                        {selectedContent.metadata?.automaticFlags && (
                          <div>
                            <span className="text-gray-500 text-sm">Automatic Flags:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {selectedContent.metadata.automaticFlags.map((flag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {flag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Decision Form */}
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium">Make Decision</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select 
                              value={decision.status} 
                              onValueChange={(value) => setDecision(prev => ({ ...prev, status: value as ModerationStatus }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ModerationStatus.APPROVED}>Approve</SelectItem>
                                <SelectItem value={ModerationStatus.REJECTED}>Reject</SelectItem>
                                <SelectItem value={ModerationStatus.FLAGGED}>Flag for Further Review</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Action</label>
                            <Select 
                              value={decision.action} 
                              onValueChange={(value) => setDecision(prev => ({ ...prev, action: value as ModerationAction }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ModerationAction.NONE}>No Action</SelectItem>
                                <SelectItem value={ModerationAction.WARNING}>Warning</SelectItem>
                                <SelectItem value={ModerationAction.DELETE_MESSAGE}>Delete Message</SelectItem>
                                <SelectItem value={ModerationAction.MUTE_USER}>Mute User</SelectItem>
                                <SelectItem value={ModerationAction.SUSPEND_USER}>Suspend User</SelectItem>
                                <SelectItem value={ModerationAction.BAN_USER}>Ban User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Moderator Notes</label>
                          <Textarea
                            value={decision.notes}
                            onChange={(e) => setDecision(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add notes about your decision..."
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedContent(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleDecision}
                            disabled={isDecisionLoading || decision.status === ModerationStatus.PENDING}
                          >
                            {isDecisionLoading ? 'Saving...' : 'Submit Decision'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
              {content.message?.content?.substring(0, 200) || 'Message content not available'}
              {content.message?.content && content.message.content.length > 200 && '...'}
            </div>
            
            {content.description && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Report:</strong> {content.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};