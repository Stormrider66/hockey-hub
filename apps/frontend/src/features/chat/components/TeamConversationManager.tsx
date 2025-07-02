import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Shield, 
  Eye,
  Crown,
  Plus,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { 
  useCreateConversationMutation,
  useAddParticipantsMutation,
  useRemoveParticipantMutation,
  useUpdateConversationMutation,
  Conversation,
  ConversationParticipant 
} from '@/store/api/chatApi';
import UserPicker, { User } from '@/components/ui/user-picker';

interface Team {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  members: TeamMember[];
  coaches: TeamMember[];
  conversationId?: string;
}

interface TeamMember extends User {
  role: 'player' | 'coach' | 'assistant_coach' | 'manager';
  number?: number;
  position?: string;
  permissions?: {
    canAddMembers: boolean;
    canRemoveMembers: boolean;
    canManageSettings: boolean;
  };
}

interface TeamConversationManagerProps {
  teams: Team[];
  conversations: Conversation[];
  currentUserId: string;
  onConversationCreated?: (team: Team, conversationId: string) => void;
  onConversationUpdated?: (conversationId: string) => void;
  className?: string;
}

type ParticipantRole = 'admin' | 'member' | 'observer';

const TeamConversationManager: React.FC<TeamConversationManagerProps> = ({
  teams,
  conversations,
  currentUserId,
  onConversationCreated,
  onConversationUpdated,
  className,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [managingTeam, setManagingTeam] = useState<Team | null>(null);

  const [createConversation] = useCreateConversationMutation();
  const [addParticipants] = useAddParticipantsMutation();
  const [removeParticipant] = useRemoveParticipantMutation();
  const [updateConversation] = useUpdateConversationMutation();

  // Find existing team conversations
  const getTeamConversation = (team: Team): Conversation | undefined => {
    return conversations.find(conv => 
      conv.type === 'team' && 
      conv.name === `${team.name} Team Chat`
    );
  };

  // Create team conversation
  const createTeamConversation = async (team: Team) => {
    setIsCreating(true);
    try {
      const allMembers = [...team.members, ...team.coaches];
      const participantIds = allMembers.map(member => member.id);

      const conversation = await createConversation({
        type: 'team',
        name: `${team.name} Team Chat`,
        participantIds,
      }).unwrap();

      // Set role-based permissions for participants
      for (const member of allMembers) {
        const role: ParticipantRole = 
          member.role === 'coach' ? 'admin' :
          member.role === 'assistant_coach' ? 'admin' :
          member.role === 'manager' ? 'admin' :
          'member';

        // Note: In a real implementation, you'd update participant roles via API
        // This is a placeholder for role assignment logic
      }

      onConversationCreated?.(team, conversation.id);
    } catch (error) {
      console.error('Failed to create team conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Get user's role in team
  const getUserRoleInTeam = (team: Team, userId: string): TeamMember | null => {
    return [...team.members, ...team.coaches].find(member => member.id === userId) || null;
  };

  // Check if user can manage team
  const canManageTeam = (team: Team, userId: string): boolean => {
    const userRole = getUserRoleInTeam(team, userId);
    return userRole?.role === 'coach' || userRole?.role === 'manager' || userRole?.permissions?.canManageSettings === true;
  };

  // Get participant role for chat permissions
  const getParticipantRole = (teamMember: TeamMember): ParticipantRole => {
    switch (teamMember.role) {
      case 'coach':
      case 'manager':
        return 'admin';
      case 'assistant_coach':
        return 'admin';
      default:
        return 'member';
    }
  };

  const getRoleIcon = (role: ParticipantRole) => {
    switch (role) {
      case 'admin': return <Crown className="h-3 w-3" />;
      case 'member': return <Users className="h-3 w-3" />;
      case 'observer': return <Eye className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: ParticipantRole) => {
    switch (role) {
      case 'admin': return 'text-yellow-600 dark:text-yellow-400';
      case 'member': return 'text-blue-600 dark:text-blue-400';
      case 'observer': return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const TeamMemberCard: React.FC<{
    member: TeamMember;
    conversation?: Conversation;
    onRoleChange?: (memberId: string, newRole: ParticipantRole) => void;
    onRemove?: (memberId: string) => void;
    canManage: boolean;
  }> = ({ member, conversation, onRoleChange, onRemove, canManage }) => {
    const currentRole = getParticipantRole(member);
    const participant = conversation?.participants.find(p => p.userId === member.id);

    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatar} />
          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{member.name}</span>
            {member.number && (
              <Badge variant="outline" className="text-xs">
                #{member.number}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{member.role.replace('_', ' ')}</span>
            {member.position && <span>• {member.position}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1 text-xs", getRoleColor(currentRole))}>
            {getRoleIcon(currentRole)}
            <span className="capitalize">{currentRole}</span>
          </div>

          {canManage && member.id !== currentUserId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup 
                  value={currentRole} 
                  onValueChange={(value) => onRoleChange?.(member.id, value as ParticipantRole)}
                >
                  <DropdownMenuRadioItem value="admin">
                    <Crown className="h-4 w-4 mr-2" />
                    Admin
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="member">
                    <Users className="h-4 w-4 mr-2" />
                    Member
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="observer">
                    <Eye className="h-4 w-4 mr-2" />
                    Observer
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove from chat
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Member</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {member.name} from the team chat?
                        They will no longer be able to see new messages.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onRemove?.(member.id)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Conversations</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTeams.map((team) => {
          const conversation = getTeamConversation(team);
          const hasConversation = !!conversation;
          const canManage = canManageTeam(team, currentUserId);
          const memberCount = team.members.length + team.coaches.length;

          return (
            <div key={team.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: team.color || '#3b82f6' }}
                  >
                    {team.icon || <Users className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasConversation ? (
                    <>
                      <Badge variant="default" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Active Chat
                      </Badge>
                      {canManage && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setManagingTeam(team)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Manage {team.name} Team Chat</DialogTitle>
                              <DialogDescription>
                                Manage members, roles, and permissions for the team conversation
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              {/* Team members */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium">Team Members</h4>
                                  <UserPicker
                                    users={[]} // TODO: Fetch available users from organization
                                    trigger={
                                      <Button variant="outline" size="sm">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Add Member
                                      </Button>
                                    }
                                    title="Add Team Members"
                                    description="Select users to add to the team chat"
                                    onSelectionChange={(users) => {
                                      // TODO: Add selected users to team and conversation
                                    }}
                                  />
                                </div>
                                
                                <ScrollArea className="h-64">
                                  <div className="space-y-2">
                                    {[...team.coaches, ...team.members].map((member) => (
                                      <TeamMemberCard
                                        key={member.id}
                                        member={member}
                                        conversation={conversation}
                                        canManage={canManage && member.id !== currentUserId}
                                        onRoleChange={(memberId, newRole) => {
                                          // TODO: Update participant role in conversation
                                          console.log('Update role:', memberId, newRole);
                                        }}
                                        onRemove={(memberId) => {
                                          if (conversation) {
                                            removeParticipant({
                                              conversationId: conversation.id,
                                              userId: memberId
                                            });
                                          }
                                        }}
                                      />
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => createTeamConversation(team)}
                      disabled={isCreating}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Chat
                    </Button>
                  )}
                </div>
              </div>

              {/* Team preview */}
              <div className="flex -space-x-2">
                {[...team.coaches, ...team.members].slice(0, 6).map((member) => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {memberCount > 6 && (
                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs font-medium">+{memberCount - 6}</span>
                  </div>
                )}
              </div>

              {hasConversation && conversation?.lastMessage && (
                <div className="mt-3 p-2 bg-muted/30 rounded text-sm">
                  <span className="font-medium">{conversation.lastMessage.sender.name}:</span>{' '}
                  <span className="text-muted-foreground">
                    {conversation.lastMessage.content.slice(0, 50)}
                    {conversation.lastMessage.content.length > 50 ? '...' : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {filteredTeams.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No teams found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamConversationManager;