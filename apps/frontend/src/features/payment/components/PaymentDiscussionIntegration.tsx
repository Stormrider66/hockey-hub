import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Plus,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useGetPaymentDiscussionsQuery } from '@/store/api/paymentApi';
import { CreatePaymentDiscussionModal } from './CreatePaymentDiscussionModal';
import { PaymentDiscussionThread } from './PaymentDiscussionThread';

interface PaymentDiscussionIntegrationProps {
  paymentId?: string;
  invoiceId?: string;
  amount?: number;
  parentUserId: string;
  organizationId: string;
  compact?: boolean;
}

export const PaymentDiscussionIntegration: React.FC<PaymentDiscussionIntegrationProps> = ({
  paymentId,
  invoiceId,
  amount,
  parentUserId,
  organizationId,
  compact = false,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);

  const { data: discussions = [], isLoading } = useGetPaymentDiscussionsQuery({
    paymentId,
    invoiceId,
    parentUserId,
    organizationId,
  });

  const activeDiscussions = discussions.filter(d => 
    d.status !== 'closed' && d.status !== 'resolved'
  );

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Payment Discussions</span>
            {activeDiscussions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeDiscussions.length} Active
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {activeDiscussions.length > 0 && (
          <div className="space-y-1">
            {activeDiscussions.slice(0, 2).map((discussion) => (
              <button
                key={discussion.id}
                onClick={() => setSelectedDiscussionId(discussion.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{discussion.title}</p>
                    <p className="text-xs text-gray-500">
                      {discussion.status.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </button>
            ))}
            {activeDiscussions.length > 2 && (
              <button
                onClick={() => setSelectedDiscussionId('all')}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:underline"
              >
                View all {activeDiscussions.length} discussions
              </button>
            )}
          </div>
        )}

        {discussions.length === 0 && !isLoading && (
          <p className="text-sm text-gray-500 px-3">
            No discussions yet. Click + to start one.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Payment Discussions
              </CardTitle>
              <CardDescription>
                Questions or concerns about this payment
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Discussion
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : discussions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No discussions yet</p>
              <p className="text-xs mt-1">
                Start a discussion if you have questions about this payment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  onClick={() => setSelectedDiscussionId(discussion.id)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{discussion.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {discussion.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant={
                          discussion.status === 'resolved' ? 'success' :
                          discussion.status === 'escalated' ? 'destructive' :
                          'default'
                        }>
                          {discussion.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Created {new Date(discussion.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Discussion Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start Payment Discussion</DialogTitle>
            <DialogDescription>
              Ask questions or raise concerns about this payment
            </DialogDescription>
          </DialogHeader>
          <CreatePaymentDiscussionModal
            paymentId={paymentId}
            invoiceId={invoiceId}
            amount={amount}
            parentUserId={parentUserId}
            organizationId={organizationId}
            onSuccess={(discussionId) => {
              setShowCreateModal(false);
              setSelectedDiscussionId(discussionId);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Discussion Thread Dialog */}
      {selectedDiscussionId && selectedDiscussionId !== 'all' && (
        <Dialog open={true} onOpenChange={() => setSelectedDiscussionId(null)}>
          <DialogContent className="max-w-4xl h-[80vh] p-0">
            <PaymentDiscussionThread
              discussionId={selectedDiscussionId}
              onClose={() => setSelectedDiscussionId(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};