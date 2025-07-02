import React, { useState, useMemo } from 'react';
import { Search, Users, User as UserIcon, Check, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  team?: string;
  status?: 'online' | 'away' | 'offline';
  isBlocked?: boolean;
}

export interface UserPickerProps {
  users: User[];
  selectedUsers?: User[];
  onSelectionChange?: (users: User[]) => void;
  onUserSelect?: (user: User) => void;
  maxSelection?: number;
  allowMultiple?: boolean;
  showTeamFilter?: boolean;
  showRoleFilter?: boolean;
  showStatusFilter?: boolean;
  excludeUsers?: string[]; // User IDs to exclude
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  placeholder?: string;
  className?: string;
  mode?: 'dialog' | 'inline';
}

const UserPicker: React.FC<UserPickerProps> = ({
  users,
  selectedUsers = [],
  onSelectionChange,
  onUserSelect,
  maxSelection,
  allowMultiple = true,
  showTeamFilter = true,
  showRoleFilter = true,
  showStatusFilter = false,
  excludeUsers = [],
  trigger,
  title = "Select Users",
  description = "Choose users to add to the conversation",
  placeholder = "Search users...",
  className,
  mode = 'dialog',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);

  // Filter available users
  const availableUsers = useMemo(() => {
    return users.filter(user => 
      !excludeUsers.includes(user.id) && 
      !user.isBlocked
    );
  }, [users, excludeUsers]);

  // Get unique teams and roles for filters
  const teams = useMemo(() => {
    const uniqueTeams = Array.from(new Set(availableUsers.map(u => u.team).filter(Boolean)));
    return uniqueTeams.sort();
  }, [availableUsers]);

  const roles = useMemo(() => {
    const uniqueRoles = Array.from(new Set(availableUsers.map(u => u.role).filter(Boolean)));
    return uniqueRoles.sort();
  }, [availableUsers]);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return availableUsers.filter(user => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Team filter
      const matchesTeam = selectedTeam === 'all' || user.team === selectedTeam;

      // Role filter
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;

      // Status filter
      const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;

      return matchesSearch && matchesTeam && matchesRole && matchesStatus;
    });
  }, [availableUsers, searchQuery, selectedTeam, selectedRole, selectedStatus]);

  // Group users by team for better organization
  const usersByTeam = useMemo(() => {
    const grouped = filteredUsers.reduce((acc, user) => {
      const team = user.team || 'No Team';
      if (!acc[team]) acc[team] = [];
      acc[team].push(user);
      return acc;
    }, {} as Record<string, User[]>);

    // Sort teams and users within teams
    const sorted: Record<string, User[]> = {};
    Object.keys(grouped).sort().forEach(team => {
      sorted[team] = grouped[team].sort((a, b) => a.name.localeCompare(b.name));
    });

    return sorted;
  }, [filteredUsers]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const isSelected = (user: User) => {
    return selectedUsers.some(selected => selected.id === user.id);
  };

  const canSelect = (user: User) => {
    if (isSelected(user)) return true;
    if (!allowMultiple && selectedUsers.length > 0) return false;
    if (maxSelection && selectedUsers.length >= maxSelection) return false;
    return true;
  };

  const handleUserToggle = (user: User) => {
    if (!allowMultiple) {
      // Single selection mode
      if (onUserSelect) {
        onUserSelect(user);
        if (mode === 'dialog') setIsOpen(false);
      } else if (onSelectionChange) {
        onSelectionChange([user]);
        if (mode === 'dialog') setIsOpen(false);
      }
      return;
    }

    // Multiple selection mode
    const isCurrentlySelected = isSelected(user);
    let newSelection: User[];

    if (isCurrentlySelected) {
      newSelection = selectedUsers.filter(selected => selected.id !== user.id);
    } else {
      if (canSelect(user)) {
        newSelection = [...selectedUsers, user];
      } else {
        return; // Can't select more
      }
    }

    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };

  const clearSelection = () => {
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const UserListContent = () => (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter tabs */}
        {(showTeamFilter || showRoleFilter || showStatusFilter) && (
          <Tabs defaultValue="team" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {showTeamFilter && (
                <TabsTrigger value="team">
                  <Users className="h-4 w-4 mr-1" />
                  Team
                </TabsTrigger>
              )}
              {showRoleFilter && (
                <TabsTrigger value="role">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Role
                </TabsTrigger>
              )}
              {showStatusFilter && (
                <TabsTrigger value="status">Status</TabsTrigger>
              )}
            </TabsList>

            {showTeamFilter && (
              <TabsContent value="team">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedTeam === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTeam('all')}
                  >
                    All Teams
                  </Button>
                  {teams.map(team => (
                    <Button
                      key={team}
                      variant={selectedTeam === team ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTeam(team)}
                    >
                      {team}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            )}

            {showRoleFilter && (
              <TabsContent value="role">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedRole === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole('all')}
                  >
                    All Roles
                  </Button>
                  {roles.map(role => (
                    <Button
                      key={role}
                      variant={selectedRole === role ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedRole(role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            )}

            {showStatusFilter && (
              <TabsContent value="status">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedStatus === 'online' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus('online')}
                  >
                    Online
                  </Button>
                  <Button
                    variant={selectedStatus === 'away' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus('away')}
                  >
                    Away
                  </Button>
                  <Button
                    variant={selectedStatus === 'offline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus('offline')}
                  >
                    Offline
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Selection summary */}
        {allowMultiple && selectedUsers.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-sm">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              {maxSelection && ` (${maxSelection - selectedUsers.length} remaining)`}
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* User list */}
      <ScrollArea className="h-96">
        <div className="space-y-4">
          {Object.entries(usersByTeam).map(([team, teamUsers]) => (
            <div key={team}>
              {showTeamFilter && Object.keys(usersByTeam).length > 1 && (
                <h4 className="font-medium text-sm text-muted-foreground mb-2 px-1">
                  {team}
                </h4>
              )}
              <div className="space-y-1">
                {teamUsers.map((user) => {
                  const selected = isSelected(user);
                  const selectable = canSelect(user);

                  return (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        selected 
                          ? "bg-primary/10 border-primary" 
                          : selectable 
                            ? "hover:bg-muted border-transparent" 
                            : "opacity-50 cursor-not-allowed border-transparent"
                      )}
                      onClick={() => selectable && handleUserToggle(user)}
                    >
                      {allowMultiple && (
                        <Checkbox
                          checked={selected}
                          disabled={!selectable}
                          onChange={() => {}} // Handled by parent click
                          className="pointer-events-none"
                        />
                      )}

                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        {showStatusFilter && user.status && (
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                            getStatusColor(user.status)
                          )} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{user.email}</span>
                          {user.role && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {user.role}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {selected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found matching your criteria</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (mode === 'inline') {
    return (
      <div className={className}>
        <UserListContent />
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <UserListContent />
      </DialogContent>
    </Dialog>
  );
};

export default UserPicker;