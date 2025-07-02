import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPicker } from '@/components/ui/user-picker';
import {
  DollarSign,
  FileText,
  Users,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useCreatePaymentDiscussionMutation } from '@/store/api/paymentApi';
import { useGetOrganizationUsersQuery } from '@/store/api/userApi';

interface CreatePaymentDiscussionModalProps {
  parentUserId?: string;
  organizationId?: string;
  paymentId?: string;
  invoiceId?: string;
  amount?: number;
  onSuccess: (discussionId: string) => void;
}

const discussionTypes = [
  { value: 'invoice', label: 'Invoice Inquiry' },
  { value: 'payment_plan', label: 'Payment Plan Request' },
  { value: 'dispute', label: 'Payment Dispute' },
  { value: 'receipt_request', label: 'Receipt Request' },
  { value: 'refund_request', label: 'Refund Request' },
  { value: 'seasonal_fees', label: 'Seasonal Fees' },
  { value: 'general_inquiry', label: 'General Inquiry' },
];

export const CreatePaymentDiscussionModal: React.FC<CreatePaymentDiscussionModalProps> = ({
  parentUserId,
  organizationId,
  paymentId,
  invoiceId,
  amount,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    paymentId: paymentId || '',
    invoiceId: invoiceId || '',
    amount: amount || '',
    currency: 'USD',
    parentUserId: parentUserId || '',
    billingStaffIds: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createDiscussion] = useCreatePaymentDiscussionMutation();
  
  // Get billing staff users
  const { data: organizationUsers } = useGetOrganizationUsersQuery(
    { organizationId: organizationId || '', role: 'billing_staff' },
    { skip: !organizationId }
  );

  const billingStaff = organizationUsers?.filter(user => 
    user.roles?.includes('billing_staff') || user.roles?.includes('admin')
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.type || !formData.title || !formData.parentUserId || formData.billingStaffIds.length === 0) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!organizationId) {
      setError('Organization ID is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createDiscussion({
        ...formData,
        organizationId,
        amount: formData.amount ? parseFloat(formData.amount.toString()) : undefined,
      }).unwrap();

      onSuccess(result.id);
    } catch (error: any) {
      console.error('Error creating payment discussion:', error);
      setError(error.message || 'Failed to create discussion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setFormData({ ...formData, type });
    
    // Auto-generate title based on type
    const typeLabel = discussionTypes.find(t => t.value === type)?.label || '';
    if (!formData.title || formData.title === discussionTypes.find(t => t.value === formData.type)?.label) {
      setFormData(prev => ({ ...prev, title: typeLabel }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Discussion Type */}
      <div>
        <Label htmlFor="type">Discussion Type *</Label>
        <Select value={formData.type} onValueChange={handleTypeChange}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Select discussion type" />
          </SelectTrigger>
          <SelectContent>
            {discussionTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of your inquiry"
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Provide more details about your inquiry..."
          rows={4}
        />
      </div>

      {/* Payment/Invoice Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paymentId">Payment ID</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="paymentId"
              value={formData.paymentId}
              onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
              placeholder="Payment reference"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="invoiceId">Invoice ID</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="invoiceId"
              value={formData.invoiceId}
              onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
              placeholder="Invoice number"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {formData.currency}
            </span>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="pl-12"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Parent User */}
      {!parentUserId && (
        <div>
          <Label htmlFor="parentUser">Parent/Guardian *</Label>
          <UserPicker
            value={formData.parentUserId}
            onChange={(userId) => setFormData({ ...formData, parentUserId: userId })}
            placeholder="Select parent or guardian"
            organizationId={organizationId}
            roles={['parent']}
          />
        </div>
      )}

      {/* Billing Staff */}
      <div>
        <Label htmlFor="billingStaff">Billing Staff *</Label>
        <div className="flex items-center gap-2 mt-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            Select staff members to handle this discussion
          </span>
        </div>
        <div className="mt-2 space-y-2">
          {billingStaff.map((staff) => (
            <label key={staff.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.billingStaffIds.includes(staff.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      billingStaffIds: [...formData.billingStaffIds, staff.id],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      billingStaffIds: formData.billingStaffIds.filter(id => id !== staff.id),
                    });
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">
                {staff.firstName} {staff.lastName}
                {staff.email && <span className="text-gray-500 ml-1">({staff.email})</span>}
              </span>
            </label>
          ))}
        </div>
        {billingStaff.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            No billing staff found. Please assign billing staff roles first.
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || formData.billingStaffIds.length === 0}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Discussion'
          )}
        </Button>
      </div>
    </form>
  );
};