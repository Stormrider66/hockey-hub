import React, { useState } from 'react';
import { format, addMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CalendarDays,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useProposePaymentPlanMutation, useApprovePaymentPlanMutation } from '@/store/api/paymentApi';

interface PaymentPlanProposalProps {
  discussionId?: string;
  proposal?: any;
  currentAmount?: number;
  onSubmit?: () => void;
  onApprove?: () => void;
  canApprove?: boolean;
}

interface Installment {
  amount: number;
  dueDate: Date;
  description?: string;
}

export const PaymentPlanProposal: React.FC<PaymentPlanProposalProps> = ({
  discussionId,
  proposal,
  currentAmount = 0,
  onSubmit,
  onApprove,
  canApprove = false,
}) => {
  const [installments, setInstallments] = useState<Installment[]>(
    proposal?.installments || [
      { amount: currentAmount / 3, dueDate: new Date(), description: 'Initial payment' },
      { amount: currentAmount / 3, dueDate: addMonths(new Date(), 1), description: 'Second installment' },
      { amount: currentAmount / 3, dueDate: addMonths(new Date(), 2), description: 'Final payment' },
    ]
  );
  const [notes, setNotes] = useState(proposal?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [proposePaymentPlan] = useProposePaymentPlanMutation();
  const [approvePaymentPlan] = useApprovePaymentPlanMutation();

  const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
  const isValidPlan = totalAmount > 0 && installments.length > 0;

  const handleAddInstallment = () => {
    const lastDate = installments.length > 0 
      ? installments[installments.length - 1].dueDate 
      : new Date();
    
    setInstallments([
      ...installments,
      {
        amount: 0,
        dueDate: addMonths(lastDate, 1),
        description: '',
      },
    ]);
  };

  const handleRemoveInstallment = (index: number) => {
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const handleInstallmentChange = (index: number, field: keyof Installment, value: any) => {
    const updated = [...installments];
    updated[index] = {
      ...updated[index],
      [field]: field === 'amount' ? parseFloat(value) || 0 : value,
    };
    setInstallments(updated);
  };

  const handleSubmit = async () => {
    if (!discussionId || !isValidPlan) return;

    setIsSubmitting(true);
    try {
      await proposePaymentPlan({
        discussionId,
        installments: installments.map(inst => ({
          ...inst,
          dueDate: inst.dueDate.toISOString(),
        })),
        notes,
      }).unwrap();

      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      console.error('Error proposing payment plan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!discussionId) return;

    setIsSubmitting(true);
    try {
      await approvePaymentPlan(discussionId).unwrap();

      if (onApprove) {
        onApprove();
      }
    } catch (error) {
      console.error('Error approving payment plan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View mode for existing proposal
  if (proposal && !discussionId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={proposal.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {proposal.approved ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approved
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Pending Approval
                </>
              )}
            </Badge>
            <span className="text-sm text-gray-500">
              Proposed on {format(new Date(proposal.proposedAt), 'MMM d, yyyy')}
            </span>
          </div>
          {canApprove && !proposal.approved && (
            <Button onClick={handleApprove} disabled={isSubmitting}>
              Approve Plan
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Installment</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposal.installments.map((inst: any, index: number) => (
              <TableRow key={index}>
                <TableCell>#{index + 1}</TableCell>
                <TableCell>{format(new Date(inst.dueDate), 'MMM d, yyyy')}</TableCell>
                <TableCell className="font-medium">${inst.amount.toFixed(2)}</TableCell>
                <TableCell>{inst.description || '-'}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2} className="font-bold">Total</TableCell>
              <TableCell className="font-bold">
                ${proposal.installments.reduce((sum: number, inst: any) => sum + inst.amount, 0).toFixed(2)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {proposal.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{proposal.notes}</p>
            </CardContent>
          </Card>
        )}

        {proposal.approved && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Payment Plan Approved</p>
                <p className="text-sm">
                  Approved by {proposal.approvedBy} on {format(new Date(proposal.approvedAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Create/Edit mode
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payment Installments</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddInstallment}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Installment
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Installment</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments.map((inst, index) => (
              <TableRow key={index}>
                <TableCell>#{index + 1}</TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={format(inst.dueDate, 'yyyy-MM-dd')}
                    onChange={(e) => handleInstallmentChange(index, 'dueDate', new Date(e.target.value))}
                    className="w-40"
                  />
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      value={inst.amount}
                      onChange={(e) => handleInstallmentChange(index, 'amount', e.target.value)}
                      className="pl-8 w-32"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    value={inst.description || ''}
                    onChange={(e) => handleInstallmentChange(index, 'description', e.target.value)}
                    placeholder="Optional description"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInstallment(index)}
                    disabled={installments.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="font-semibold">Total Amount:</span>
          <span className="text-xl font-bold">${totalAmount.toFixed(2)}</span>
        </div>

        {currentAmount > 0 && Math.abs(totalAmount - currentAmount) > 0.01 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              Total installments (${totalAmount.toFixed(2)}) don't match the outstanding amount (${currentAmount.toFixed(2)})
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional information about this payment plan..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSubmit}
          disabled={!isValidPlan || isSubmitting}
        >
          {isSubmitting ? 'Proposing...' : 'Propose Payment Plan'}
        </Button>
      </div>
    </div>
  );
};