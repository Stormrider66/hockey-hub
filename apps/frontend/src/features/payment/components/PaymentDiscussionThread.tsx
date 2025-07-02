import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  DollarSign,
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  Paperclip,
  Download,
  Shield,
  CalendarDays,
  RefreshCw,
  ChevronRight,
  Receipt,
  CreditCard,
  FileWarning,
  HandshakeIcon,
} from 'lucide-react';
import { MessageList } from '@/features/chat/components/MessageList';
import { MessageInput } from '@/features/chat/components/MessageInput';
import { useGetPaymentDiscussionQuery, useTrackQuickActionMutation } from '@/store/api/paymentApi';
import { useGetConversationQuery } from '@/store/api/chatApi';
import { PaymentPlanProposal } from './PaymentPlanProposal';
import { PaymentDocumentUpload } from './PaymentDocumentUpload';
import { PaymentQuickActions } from './PaymentQuickActions';

interface PaymentDiscussionThreadProps {
  discussionId?: string;
  onClose?: () => void;
}

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  refunded: 'bg-purple-100 text-purple-800',
};

const discussionStatusIcons = {
  open: <MessageSquare className="w-4 h-4" />,
  in_progress: <Clock className="w-4 h-4" />,
  awaiting_response: <AlertCircle className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  closed: <CheckCircle className="w-4 h-4" />,
  escalated: <AlertTriangle className="w-4 h-4" />,
};

export const PaymentDiscussionThread: React.FC<PaymentDiscussionThreadProps> = ({
  discussionId: propDiscussionId,
  onClose,
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const discussionId = propDiscussionId || (params?.discussionId as string);
  
  const [activeTab, setActiveTab] = useState('messages');
  const [showPaymentPlanModal, setShowPaymentPlanModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);

  const { data: discussion, isLoading: discussionLoading } = useGetPaymentDiscussionQuery(
    discussionId,
    { skip: !discussionId }
  );

  const { data: conversation, isLoading: conversationLoading } = useGetConversationQuery(
    discussion?.conversationId || '',
    { skip: !discussion?.conversationId }
  );

  const [trackQuickAction] = useTrackQuickActionMutation();

  const handleQuickAction = async (action: string) => {
    if (!discussionId) return;

    try {
      await trackQuickAction({
        discussionId,
        action,
      }).unwrap();
    } catch (error) {
      console.error('Error tracking quick action:', error);
    }
  };

  const handleDocumentClick = (document: any) => {
    // In production, this would handle secure document download
    window.open(document.fileUrl, '_blank');
  };

  if (discussionLoading || conversationLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!discussion || !conversation) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Payment discussion not found.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-bold">{discussion.title}</h2>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                {discussionStatusIcons[discussion.status]}
                <span className="capitalize">{discussion.status.replace('_', ' ')}</span>
              </div>
              
              {discussion.paymentStatus && (
                <Badge className={paymentStatusColors[discussion.paymentStatus]}>
                  {discussion.paymentStatus}
                </Badge>
              )}
              
              {discussion.amount && (
                <span className="font-medium">
                  {discussion.currency || 'USD'} {discussion.amount.toFixed(2)}
                </span>
              )}
              
              <span>Created {format(new Date(discussion.createdAt), 'MMM d, yyyy')}</span>
            </div>
            
            {discussion.description && (
              <p className="mt-2 text-gray-600">{discussion.description}</p>
            )}
          </div>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>

        {/* Security Notice */}
        {discussion.containsSensitiveInfo && (
          <Alert className="mt-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This discussion contains sensitive financial information and is encrypted for security.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="mt-4">
          <PaymentQuickActions
            discussion={discussion}
            onAction={handleQuickAction}
            onPaymentPlan={() => setShowPaymentPlanModal(true)}
            onUploadDocument={() => setShowDocumentUploadModal(true)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="px-6">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="details">Payment Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-hidden">
            <MessageList conversationId={conversation.id} />
          </div>
          <div className="border-t p-4">
            <MessageInput conversationId={conversation.id} />
          </div>
        </TabsContent>

        <TabsContent value="details" className="p-6">
          <div className="space-y-6">
            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {discussion.paymentId && (
                    <div>
                      <p className="text-sm text-gray-500">Payment ID</p>
                      <p className="font-medium">{discussion.paymentId}</p>
                    </div>
                  )}
                  {discussion.invoiceId && (
                    <div>
                      <p className="text-sm text-gray-500">Invoice ID</p>
                      <p className="font-medium">{discussion.invoiceId}</p>
                    </div>
                  )}
                  {discussion.amount && (
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium">
                        {discussion.currency || 'USD'} {discussion.amount.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {discussion.outstandingAmount && (
                    <div>
                      <p className="text-sm text-gray-500">Outstanding</p>
                      <p className="font-medium text-orange-600">
                        {discussion.currency || 'USD'} {discussion.outstandingAmount.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Plan */}
            {discussion.paymentPlanProposal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HandshakeIcon className="w-5 h-5" />
                    Payment Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentPlanProposal
                    proposal={discussion.paymentPlanProposal}
                    onApprove={() => {}}
                    canApprove={false}
                  />
                </CardContent>
              </Card>
            )}

            {/* Quick Action Status */}
            {discussion.quickActions && Object.keys(discussion.quickActions).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Requested Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {discussion.quickActions.receiptRequested && (
                      <div className="flex items-center gap-2 text-sm">
                        <Receipt className="w-4 h-4 text-blue-600" />
                        <span>Receipt requested on {format(new Date(discussion.quickActions.receiptRequestedAt), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {discussion.quickActions.paymentPlanRequested && (
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4 text-green-600" />
                        <span>Payment plan requested on {format(new Date(discussion.quickActions.paymentPlanRequestedAt), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {discussion.quickActions.disputeRaised && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileWarning className="w-4 h-4 text-orange-600" />
                        <span>Dispute raised on {format(new Date(discussion.quickActions.disputeRaisedAt), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {discussion.quickActions.refundRequested && (
                      <div className="flex items-center gap-2 text-sm">
                        <RefreshCw className="w-4 h-4 text-purple-600" />
                        <span>Refund requested on {format(new Date(discussion.quickActions.refundRequestedAt), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Attached Documents</h3>
              <Button onClick={() => setShowDocumentUploadModal(true)}>
                <Paperclip className="w-4 h-4 mr-2" />
                Attach Document
              </Button>
            </div>

            {discussion.attachedDocuments && discussion.attachedDocuments.length > 0 ? (
              <div className="grid gap-3">
                {discussion.attachedDocuments.map((doc: any) => (
                  <Card 
                    key={doc.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleDocumentClick(doc)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {doc.type} • Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.verified && (
                          <Badge variant="success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mb-2" />
                  <p>No documents attached yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="p-6">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {discussion.auditLog.map((entry: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 mt-2 bg-gray-400 rounded-full" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{entry.action.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(entry.performedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                    {entry.details && (
                      <p className="text-sm text-gray-600 mt-1">
                        {JSON.stringify(entry.details)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <Dialog open={showPaymentPlanModal} onOpenChange={setShowPaymentPlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Propose Payment Plan</DialogTitle>
            <DialogDescription>
              Create a payment plan proposal for this discussion.
            </DialogDescription>
          </DialogHeader>
          <PaymentPlanProposal
            discussionId={discussionId}
            currentAmount={discussion.outstandingAmount || discussion.amount || 0}
            onSubmit={() => setShowPaymentPlanModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDocumentUploadModal} onOpenChange={setShowDocumentUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Attach a document to this payment discussion.
            </DialogDescription>
          </DialogHeader>
          <PaymentDocumentUpload
            discussionId={discussionId}
            conversationId={conversation.id}
            onUpload={() => setShowDocumentUploadModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};