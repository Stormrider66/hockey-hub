import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import { UserX, AlertCircle } from 'lucide-react';
import {
  useGetBlockedUsersQuery,
  useUnblockUserMutation,
} from '@/store/api/privacyApi';
import { formatDistanceToNow } from 'date-fns';

interface BlockedUsersProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

// Mock function to get user info - replace with actual API call
const getUserInfo = (userId: string): UserInfo => {
  return {
    id: userId,
    firstName: 'User',
    lastName: userId.substring(0, 6),
    avatar: undefined,
  };
};

export function BlockedUsers({ isOpen, onClose }: BlockedUsersProps) {
  const { data: blockedUsers = [], isLoading } = useGetBlockedUsersQuery();
  const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  const handleUnblock = async (userId: string) => {
    try {
      setUnblockingUserId(userId);
      await unblockUser(userId).unwrap();
      toast.success('User unblocked successfully');
    } catch (error) {
      toast.error('Failed to unblock user');
    } finally {
      setUnblockingUserId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Blocked Users
          </DialogTitle>
          <DialogDescription>
            Manage users you've blocked from messaging you
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No blocked users</p>
              <p className="text-sm text-muted-foreground mt-1">
                Users you block won't be able to send you messages
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((blockedUser) => {
                const userInfo = getUserInfo(blockedUser.blockedUserId);
                const isUnblocking = unblockingUserId === blockedUser.blockedUserId;

                return (
                  <div
                    key={blockedUser.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userInfo.avatar} />
                        <AvatarFallback>
                          {userInfo.firstName[0]}{userInfo.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {userInfo.firstName} {userInfo.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Blocked {formatDistanceToNow(new Date(blockedUser.createdAt), { addSuffix: true })}
                          </span>
                          {blockedUser.reason && (
                            <>
                              <span>•</span>
                              <span>{blockedUser.reason}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblock(blockedUser.blockedUserId)}
                      disabled={isUnblocking}
                    >
                      {isUnblocking ? 'Unblocking...' : 'Unblock'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {blockedUsers.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>Blocked users cannot:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Send you messages</li>
                    <li>See your online status</li>
                    <li>Add you to group conversations</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}