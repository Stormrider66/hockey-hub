import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Shield, UserX } from 'lucide-react';
import { 
  useGetModeratedUsersQuery, 
  useRemoveUserModerationMutation,
  UserModeration,
  UserModerationStatus
} from '@/store/api/moderationApi';
import { toast } from 'react-hot-toast';

interface ModeratedUsersProps {
  limit?: number;
}

export const ModeratedUsers: React.FC<ModeratedUsersProps> = ({
  limit = 20
}) => {
  const [page, setPage] = useState(1);
  
  const { data, isLoading, refetch } = useGetModeratedUsersQuery({ page, limit });
  const [removeModeration, { isLoading: isRemoving }] = useRemoveUserModerationMutation();

  const moderatedUsers = data?.data?.users || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleRemoveModeration = async (userId: string) => {
    try {
      await removeModeration(userId).unwrap();
      toast.success('User moderation removed');
      refetch();
    } catch (error) {
      toast.error('Failed to remove moderation');
    }
  };

  const getStatusColor = (status: UserModerationStatus) => {
    switch (status) {
      case UserModerationStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case UserModerationStatus.WARNING:
        return 'bg-yellow-100 text-yellow-800';
      case UserModerationStatus.MUTED:
        return 'bg-orange-100 text-orange-800';
      case UserModerationStatus.SUSPENDED:
        return 'bg-red-100 text-red-800';
      case UserModerationStatus.BANNED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (moderatedUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Moderated Users
        </h3>
        <p className="text-gray-600">
          No users currently have active moderation actions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {moderatedUsers.map((user) => (
        <Card key={user.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserX className="h-5 w-5 text-gray-500" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.userId}</span>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>Reason: {user.reason.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </span>
                    {user.expiresAt && (
                      <span>
                        Expires: {format(new Date(user.expiresAt), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mt-2">
                    {user.description}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveModeration(user.userId)}
                  disabled={isRemoving}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
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