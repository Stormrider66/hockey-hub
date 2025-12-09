import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  DollarSign,
  MessageSquare,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useGetPaymentDiscussionsQuery } from '@/store/api/paymentApi';
import { CreatePaymentDiscussionModal } from './CreatePaymentDiscussionModal';
import { PaymentDiscussionThread } from './PaymentDiscussionThread';

interface PaymentDiscussionListProps {
  parentUserId?: string;
  organizationId?: string;
  showCreateButton?: boolean;
  onDiscussionSelect?: (discussionId: string) => void;
}

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  awaiting_response: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  escalated: 'bg-red-100 text-red-800',
};

const statusIcons = {
  open: <MessageSquare className="w-4 h-4" />,
  in_progress: <Clock className="w-4 h-4" />,
  awaiting_response: <AlertCircle className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  closed: <CheckCircle className="w-4 h-4" />,
  escalated: <AlertTriangle className="w-4 h-4" />,
};

const typeLabels = {
  invoice: 'Invoice',
  payment_plan: 'Payment Plan',
  dispute: 'Dispute',
  receipt_request: 'Receipt Request',
  refund_request: 'Refund Request',
  seasonal_fees: 'Seasonal Fees',
  general_inquiry: 'General Inquiry',
};

export const PaymentDiscussionList: React.FC<PaymentDiscussionListProps> = ({
  parentUserId,
  organizationId,
  showCreateButton = false,
  onDiscussionSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);

  const { data: discussions = [], isLoading } = useGetPaymentDiscussionsQuery({
    parentUserId,
    organizationId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  const filteredDiscussions = discussions.filter((discussion) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      discussion.title.toLowerCase().includes(searchLower) ||
      discussion.description?.toLowerCase().includes(searchLower) ||
      discussion.paymentId?.toLowerCase().includes(searchLower) ||
      discussion.invoiceId?.toLowerCase().includes(searchLower)
    );
  });

  const handleDiscussionClick = (discussionId: string) => {
    if (onDiscussionSelect) {
      onDiscussionSelect(discussionId);
    } else {
      setSelectedDiscussionId(discussionId);
    }
  };

  const getStats = () => {
    const total = discussions.length;
    const open = discussions.filter(d => d.status === 'open').length;
    const awaitingResponse = discussions.filter(d => d.status === 'awaiting_response').length;
    const escalated = discussions.filter(d => d.status === 'escalated').length;
    const totalAmount = discussions.reduce((sum, d) => sum + (d.amount || 0), 0);
    const outstandingAmount = discussions.reduce((sum, d) => sum + (d.outstandingAmount || 0), 0);

    return { total, open, awaitingResponse, escalated, totalAmount, outstandingAmount };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Payment Discussions</h2>
          {showCreateButton && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Discussion
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Discussions</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Awaiting Response</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.awaitingResponse}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Escalated</p>
                  <p className="text-2xl font-bold text-red-600">{stats.escalated}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Outstanding</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${stats.outstandingAmount.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="payment_plan">Payment Plan</SelectItem>
              <SelectItem value="dispute">Dispute</SelectItem>
              <SelectItem value="receipt_request">Receipt Request</SelectItem>
              <SelectItem value="refund_request">Refund Request</SelectItem>
              <SelectItem value="seasonal_fees">Seasonal Fees</SelectItem>
              <SelectItem value="general_inquiry">General Inquiry</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Discussion List */}
      <ScrollArea className="h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredDiscussions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No discussions found</p>
              <p className="text-sm">Try adjusting your filters or create a new discussion</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDiscussions.map((discussion) => (
              <Card
                key={discussion.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleDiscussionClick(discussion.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">{discussion.title}</h3>
                        <Badge variant="outline">
                          {typeLabels[discussion.type]}
                        </Badge>
                        <Badge className={statusColors[discussion.status]}>
                          <span className="flex items-center gap-1">
                            {statusIcons[discussion.status]}
                            {discussion.status.replace('_', ' ')}
                          </span>
                        </Badge>
                      </div>

                      {discussion.description && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {discussion.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {discussion.amount && (
                          <span className="font-medium">
                            {discussion.currency || 'USD'} {discussion.amount.toFixed(2)}
                          </span>
                        )}
                        
                        {discussion.outstandingAmount && discussion.outstandingAmount > 0 && (
                          <span className="text-orange-600 font-medium">
                            Outstanding: {discussion.currency || 'USD'} {discussion.outstandingAmount.toFixed(2)}
                          </span>
                        )}

                        {discussion.paymentId && (
                          <span>Payment: {discussion.paymentId}</span>
                        )}

                        {discussion.invoiceId && (
                          <span>Invoice: {discussion.invoiceId}</span>
                        )}

                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(discussion.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {/* Quick Actions Summary */}
                      {discussion.quickActions && Object.keys(discussion.quickActions).length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {discussion.quickActions.receiptRequested && (
                            <Badge variant="secondary" className="text-xs">
                              Receipt Requested
                            </Badge>
                          )}
                          {discussion.quickActions.paymentPlanRequested && (
                            <Badge variant="secondary" className="text-xs">
                              Payment Plan Requested
                            </Badge>
                          )}
                          {discussion.quickActions.disputeRaised && (
                            <Badge variant="secondary" className="text-xs">
                              Dispute Raised
                            </Badge>
                          )}
                          {discussion.quickActions.refundRequested && (
                            <Badge variant="secondary" className="text-xs">
                              Refund Requested
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Create Discussion Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Payment Discussion</DialogTitle>
            <DialogDescription>
              Start a new discussion about a payment, invoice, or billing inquiry.
            </DialogDescription>
          </DialogHeader>
          <CreatePaymentDiscussionModal
            parentUserId={parentUserId}
            organizationId={organizationId}
            onSuccess={(discussionId) => {
              setShowCreateModal(false);
              handleDiscussionClick(discussionId);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Discussion Thread Dialog */}
      {selectedDiscussionId && !onDiscussionSelect && (
        <Dialog open={true} onOpenChange={() => setSelectedDiscussionId(null)}>
          <DialogContent className="max-w-4xl h-[80vh] p-0">
            <PaymentDiscussionThread
              discussionId={selectedDiscussionId}
              onClose={() => setSelectedDiscussionId(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};