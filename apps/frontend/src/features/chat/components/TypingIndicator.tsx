import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
  maxDisplayUsers?: number;
  timeout?: number; // Auto-hide after timeout (ms)
  onTimeout?: () => void;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  className,
  maxDisplayUsers = 3,
  timeout = 10000, // 10 seconds
  onTimeout,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show/hide indicator based on typing users
  useEffect(() => {
    if (typingUsers.length > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [typingUsers]);

  // Auto-hide after timeout
  useEffect(() => {
    if (isVisible && timeout > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onTimeout?.();
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [isVisible, timeout, onTimeout]);

  // Don't render if no users are typing
  if (!isVisible || typingUsers.length === 0) {
    return null;
  }

  const displayUsers = typingUsers.slice(0, maxDisplayUsers);
  const remainingCount = Math.max(0, typingUsers.length - maxDisplayUsers);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].name}, ${typingUsers[1].name}, and ${typingUsers[2].name} are typing`;
    } else {
      return `${typingUsers[0].name}, ${typingUsers[1].name}, and ${typingUsers.length - 2} others are typing`;
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 animate-in slide-in-from-bottom-2 duration-200",
      className
    )}>
      {/* User avatars */}
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        ))}
        {remainingCount > 0 && (
          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>

      {/* Typing text and animation */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {getTypingText()}
        </span>
        
        {/* Animated dots */}
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};

// Alternative compact version for conversation list
export const CompactTypingIndicator: React.FC<{
  typingUsers: TypingUser[];
  className?: string;
}> = ({ typingUsers, className }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs text-muted-foreground">
        {typingUsers.length === 1 
          ? 'typing' 
          : `${typingUsers.length} typing`
        }
      </span>
      <div className="flex gap-0.5">
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
      </div>
    </div>
  );
};

export default TypingIndicator;