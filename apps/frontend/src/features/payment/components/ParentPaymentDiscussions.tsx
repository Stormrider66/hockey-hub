import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { PaymentDiscussionList } from './PaymentDiscussionList';
import { useAuth } from '@/hooks/useAuth';

export const ParentPaymentDiscussions: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Payment Discussions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PaymentDiscussionList
          parentUserId={user.id}
          organizationId={user.organizationId}
          showCreateButton={true}
        />
      </CardContent>
    </Card>
  );
};