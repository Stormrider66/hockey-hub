import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Local fallback enum (tests mock shared-lib inconsistently across environments)
const ConversationTypeEnum = {
  DIRECT: 'direct',
  GROUP: 'group',
  CHANNEL: 'channel',
} as const;
type ConversationTypeValue = typeof ConversationTypeEnum[keyof typeof ConversationTypeEnum];

type UserSearchResult = {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  roles?: string[];
};

type ExistingConversation = {
  id: string;
  type: ConversationTypeValue;
  participants: Array<{ user_id: string }>;
};

export interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (conversation: {
    id: string;
    type: ConversationTypeValue;
    name?: string;
    participant_ids: string[];
    created_at: string;
  }) => void;
  currentUserId: string;
  existingConversations?: ExistingConversation[];
}

export function NewConversationModal({
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
  existingConversations = [],
}: NewConversationModalProps) {
  const mountedRef = useRef(false);
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');

  const existingDirectPartnerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of existingConversations) {
      if (c.type !== ConversationTypeEnum.DIRECT) continue;
      const participantIds = c.participants.map((p) => p.user_id);
      if (!participantIds.includes(currentUserId)) continue;
      for (const pid of participantIds) {
        if (pid !== currentUserId) ids.add(pid);
      }
    }
    return ids;
  }, [existingConversations, currentUserId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoadingUsers(true);
      setError('');
      try {
        const qs = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
        const res = await fetch(`/api/users${qs}`);
        const json = await res.json();
        const data = (json?.data ?? []) as UserSearchResult[];
        if (!cancelled) {
          setUsers(data);
        }
      } catch (e: any) {
        if (!cancelled) {
          setUsers([]);
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }

    // Only fetch when modal is open (keeps tests predictable)
    if (isOpen) {
      void loadUsers();
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, searchQuery]);

  const resetState = () => {
    setMode('direct');
    setGroupName('');
    setSelectedUserIds([]);
    setSearchQuery('');
    setUsers([]);
    setLoadingUsers(false);
    setCreating(false);
    setError('');
    setWarning('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const canCreateDirect = selectedUserIds.length === 1;
  const canCreateGroup = selectedUserIds.length >= 1;

  const createButtonLabel = mode === 'direct' ? 'Start Conversation' : 'Create Group';

  const handleSelectUser = (u: UserSearchResult) => {
    setError('');
    setWarning('');

    if (mode === 'direct') {
      if (existingDirectPartnerIds.has(u.id)) return;
      setSelectedUserIds([u.id]);
      return;
    }

    // Group selection (max 10 participants excluding current user)
    if (selectedUserIds.includes(u.id)) return;
    if (selectedUserIds.length >= 10) {
      setWarning('Maximum 10 participants allowed');
      return;
    }
    setSelectedUserIds((prev) => [...prev, u.id]);
  };

  const handleRemoveSelected = (userId: string) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const handleCreate = async () => {
    setError('');
    setWarning('');

    if (mode === 'group' && !groupName.trim()) {
      setError('Group name is required');
      return;
    }
    if (mode === 'direct' && !canCreateDirect) return;
    if (mode === 'group' && !canCreateGroup) return;

    const participant_ids = [currentUserId, ...selectedUserIds];
    const payload: any = {
      type: mode === 'direct' ? ConversationTypeEnum.DIRECT : ConversationTypeEnum.GROUP,
      name: mode === 'group' ? groupName.trim() : undefined,
      participant_ids,
    };

    setCreating(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error || json?.message || 'Failed to create conversation';
        if (mountedRef.current) setError(msg);
        return;
      }
      if (!mountedRef.current) return;
      onSuccess(json.data);
      handleClose();
    } catch (e: any) {
      if (mountedRef.current) setError('Failed to create conversation');
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'direct' ? 'default' : 'outline'}
              onClick={() => { setMode('direct'); setSelectedUserIds([]); setError(''); setWarning(''); }}
            >
              <User className="h-4 w-4 mr-2" />
              Direct Message
            </Button>
            <Button
              type="button"
              variant={mode === 'group' ? 'default' : 'outline'}
              onClick={() => { setMode('group'); setError(''); setWarning(''); }}
            >
              <Users className="h-4 w-4 mr-2" />
              Group Chat
            </Button>
          </div>

          {mode === 'group' && (
            <Input
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          )}

          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {mode === 'group' && selectedUserIds.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedUserIds.length} participants selected
            </div>
          )}

          {error && <div className="text-sm text-red-600" role="alert">{error}</div>}
          {warning && <div className="text-sm text-amber-700">{warning}</div>}

          <div className="max-h-56 overflow-y-auto border rounded-md p-2 space-y-1">
            {loadingUsers ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-muted-foreground">No users found</div>
            ) : (
              users.map((u) => {
                const alreadyHasDirect = mode === 'direct' && existingDirectPartnerIds.has(u.id);
                const disabled = alreadyHasDirect;
                const rolesText = (u.roles || []).join(', ');

                return (
                  <div key={u.id} data-testid="user-item" className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted">
                    <button
                      type="button"
                      className="text-left flex-1"
                      disabled={disabled}
                      onClick={() => handleSelectUser(u)}
                    >
                      <div className="font-medium">{u.name}</div>
                      {rolesText && <div className="text-xs text-muted-foreground">{rolesText}</div>}
                    </button>
                    {alreadyHasDirect && (
                      <span className="text-xs text-muted-foreground">Already have a conversation</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {selectedUserIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUserIds.map((id) => (
                <Badge key={id} data-testid={`selected-user-${id}`} variant="secondary" className="flex items-center gap-2">
                  {id}
                  <button type="button" aria-label="Remove" onClick={() => handleRemoveSelected(id)} className="inline-flex">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={creating || (mode === 'direct' ? !canCreateDirect : !canCreateGroup)}
          >
            {creating && <span data-testid="loading-spinner" className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {createButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewConversationModal;