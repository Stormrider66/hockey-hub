import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useGetUsersQuery } from '@/store/api/chatApi';

interface MentionOption {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
}

interface MentionAutocompleteProps {
  query: string;
  onSelect: (user: MentionOption) => void;
  onClose: () => void;
  anchorPosition?: { top: number; left: number };
  className?: string;
}

const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  query,
  onSelect,
  onClose,
  anchorPosition,
  className,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Search for users based on query
  const { data: users = [], isLoading } = useGetUsersQuery({
    search: query,
    limit: 10,
  }, {
    skip: !query || query.length < 1,
  });

  // Filter users based on query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.username?.toLowerCase().includes(query.toLowerCase())
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            onSelect(filteredUsers[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            onSelect(filteredUsers[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!query || filteredUsers.length === 0) {
    return null;
  }

  return (
    <div
      ref={listRef}
      className={cn(
        "absolute z-50 bg-background border rounded-lg shadow-lg overflow-hidden",
        "max-h-60 overflow-y-auto min-w-[200px] max-w-[300px]",
        className
      )}
      style={anchorPosition || undefined}
    >
      {isLoading ? (
        <div className="p-3 text-sm text-muted-foreground text-center">
          Searching...
        </div>
      ) : (
        <div className="py-1">
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              ref={el => itemRefs.current[index] = el}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-muted transition-colors",
                "flex items-center gap-3",
                selectedIndex === index && "bg-muted"
              )}
              onClick={() => onSelect(user)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {user.name}
                </div>
                {user.username && (
                  <div className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </div>
                )}
              </div>
              {user.role && (
                <div className="text-xs text-muted-foreground">
                  {user.role}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionAutocomplete;