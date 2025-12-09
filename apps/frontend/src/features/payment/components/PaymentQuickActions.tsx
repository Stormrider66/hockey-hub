import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Receipt,
  CreditCard,
  FileWarning,
  RefreshCw,
  FileText,
  CalendarDays,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PaymentQuickActionsProps {
  discussion: any;
  onAction: (action: string) => void;
  onPaymentPlan?: () => void;
  onUploadDocument?: () => void;
}

export const PaymentQuickActions: React.FC<PaymentQuickActionsProps> = ({
  discussion,
  onAction,
  onPaymentPlan,
  onUploadDocument,
}) => {
  const quickActions = [
    {
      id: 'receipt',
      label: 'Request Receipt',
      icon: Receipt,
      color: 'text-blue-600',
      disabled: discussion.quickActions?.receiptRequested,
      tooltip: discussion.quickActions?.receiptRequested 
        ? 'Receipt already requested' 
        : 'Request a receipt for this payment',
    },
    {
      id: 'paymentPlan',
      label: 'Payment Plan',
      icon: CreditCard,
      color: 'text-green-600',
      disabled: discussion.quickActions?.paymentPlanRequested || discussion.paymentPlanProposal,
      tooltip: discussion.paymentPlanProposal
        ? 'Payment plan already exists'
        : discussion.quickActions?.paymentPlanRequested 
        ? 'Payment plan already requested' 
        : 'Request a payment plan',
      onClick: onPaymentPlan,
    },
    {
      id: 'dispute',
      label: 'Raise Dispute',
      icon: FileWarning,
      color: 'text-orange-600',
      disabled: discussion.quickActions?.disputeRaised,
      tooltip: discussion.quickActions?.disputeRaised 
        ? 'Dispute already raised' 
        : 'Raise a dispute about this payment',
    },
    {
      id: 'refund',
      label: 'Request Refund',
      icon: RefreshCw,
      color: 'text-purple-600',
      disabled: discussion.quickActions?.refundRequested,
      tooltip: discussion.quickActions?.refundRequested 
        ? 'Refund already requested' 
        : 'Request a refund for this payment',
    },
  ];

  if (onUploadDocument) {
    quickActions.push({
      id: 'document',
      label: 'Attach Document',
      icon: FileText,
      color: 'text-gray-600',
      disabled: false,
      tooltip: 'Attach a document to this discussion',
      onClick: onUploadDocument,
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (action.onClick) {
                      action.onClick();
                    } else {
                      onAction(action.id);
                    }
                  }}
                  disabled={action.disabled}
                  className="flex items-center gap-2"
                >
                  <Icon className={`w-4 h-4 ${action.color}`} />
                  {action.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
};