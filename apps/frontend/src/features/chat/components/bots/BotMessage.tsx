import React from 'react';
import { format } from 'date-fns';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface BotAction {
  id: string;
  type: 'button' | 'link' | 'quick_reply';
  label: string;
  value: string;
  style?: 'primary' | 'secondary' | 'danger';
  url?: string;
}

export interface BotMessageProps {
  id: string;
  content: string;
  timestamp: Date;
  botName: string;
  botAvatar: string;
  botType: string;
  actions?: BotAction[];
  isEphemeral?: boolean;
  onActionClick?: (actionId: string, value: string) => void;
}

export const BotMessage: React.FC<BotMessageProps> = ({
  id,
  content,
  timestamp,
  botName,
  botAvatar,
  botType,
  actions,
  isEphemeral,
  onActionClick,
}) => {
  const handleActionClick = (action: BotAction) => {
    if (action.type === 'link' && action.url) {
      window.open(action.url, '_blank');
    } else if (onActionClick) {
      onActionClick(action.id, action.value);
    }
  };

  const getBotAvatarContent = () => {
    // If avatar is an emoji (2 characters or less), use it directly
    if (botAvatar && botAvatar.length <= 2) {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-lg">
          {botAvatar}
        </div>
      );
    }

    // Otherwise, use it as an image URL or fallback to bot icon
    return (
      <Avatar className="w-10 h-10">
        {botAvatar && botAvatar.startsWith('http') ? (
          <AvatarImage src={botAvatar} alt={botName} />
        ) : null}
        <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
          <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </AvatarFallback>
      </Avatar>
    );
  };

  const getActionButtonStyle = (style?: string) => {
    switch (style) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'secondary':
      default:
        return 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
    }
  };

  // Parse content for special formatting
  const formatContent = (text: string) => {
    // Replace **text** with bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace [text](action:id:value) with clickable links
    text = text.replace(
      /\[([^\]]+)\]\(action:([^:]+):([^)]+)\)/g,
      '<a href="#" data-action-id="$2" data-action-value="$3" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>'
    );

    return text;
  };

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
        isEphemeral && 'opacity-75 italic'
      )}
    >
      <div className="flex-shrink-0">{getBotAvatarContent()}</div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {botName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            BOT
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(timestamp, 'h:mm a')}
          </span>
        </div>

        <div
          className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: formatContent(content) }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'A' && target.dataset.actionId) {
              e.preventDefault();
              if (onActionClick) {
                onActionClick(
                  target.dataset.actionId,
                  target.dataset.actionValue || ''
                );
              }
            }
          }}
        />

        {actions && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant="outline"
                className={cn(
                  'text-xs',
                  getActionButtonStyle(action.style)
                )}
                onClick={() => handleActionClick(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {isEphemeral && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
            Only visible to you
          </div>
        )}
      </div>
    </div>
  );
};