import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { UserX, UserCheck } from 'lucide-react';
import {
  useBlockUserMutation,
  useUnblockUserMutation,
  useIsUserBlockedQuery,
} from '@/store/api/privacyApi';

interface BlockUserActionProps {
  userId: string;
  userName?: string;
  asButton?: boolean;
  onSuccess?: () => void;
}

export function BlockUserAction({ 
  userId, 
  userName = 'this user',
  asButton = false,
  onSuccess 
}: BlockUserActionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');
  const { data: blockStatus, isLoading: isCheckingStatus } = useIsUserBlockedQuery(userId);
  const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
  const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();

  const isBlocked = blockStatus?.isBlocked || false;
  const isProcessing = isBlocking || isUnblocking;

  const handleBlock = async () => {
    try {
      await blockUser({ userId, reason: reason.trim() || undefined }).unwrap();
      toast.success(`${userName} has been blocked`);
      setShowDialog(false);
      setReason('');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const handleUnblock = async () => {
    try {
      await unblockUser(userId).unwrap();
      toast.success(`${userName} has been unblocked`);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  if (isCheckingStatus) {
    return null;
  }

  const action = isBlocked ? (
    asButton ? (
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnblock}
        disabled={isProcessing}
        className="gap-2"
      >
        <UserCheck className="h-4 w-4" />
        {isUnblocking ? 'Unblocking...' : 'Unblock User'}
      </Button>
    ) : (
      <DropdownMenuItem onClick={handleUnblock} disabled={isProcessing}>
        <UserCheck className="mr-2 h-4 w-4" />
        {isUnblocking ? 'Unblocking...' : 'Unblock User'}
      </DropdownMenuItem>
    )
  ) : (
    asButton ? (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={isProcessing}
        className="gap-2 text-destructive hover:text-destructive"
      >
        <UserX className="h-4 w-4" />
        Block User
      </Button>
    ) : (
      <DropdownMenuItem 
        onClick={() => setShowDialog(true)} 
        disabled={isProcessing}
        className="text-destructive focus:text-destructive"
      >
        <UserX className="mr-2 h-4 w-4" />
        Block User
      </DropdownMenuItem>
    )
  );

  return (
    <>
      {action}
      
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {userName}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {userName} will not be able to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Send you messages</li>
                <li>See your online status</li>
                <li>Add you to group conversations</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Add a reason for blocking this user..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              disabled={isBlocking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBlocking ? 'Blocking...' : 'Block User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Separator version for dropdown menus
export function BlockUserMenuItems({ userId, userName }: BlockUserActionProps) {
  return (
    <>
      <DropdownMenuSeparator />
      <BlockUserAction userId={userId} userName={userName} />
    </>
  );
}