import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Smile, X, Image, Eye, EyeOff, Lock, Unlock, Mic, Video, Clock, MapPin, Calendar, Hash, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleFileButton } from './SimpleFileButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Message } from '@/store/api/chatApi';
import MarkdownRenderer from './MarkdownRenderer';
import MentionAutocomplete from './MentionAutocomplete';
import { VoiceRecorder } from './VoiceRecorder';
import { VideoRecorder } from './VideoRecorder';
import { AudioRecordingData } from '@/services/AudioRecordingService';
import ScheduleMessageModal from './ScheduleMessageModal';
import { LocationShare } from './LocationShare';
import { CreateEventModal } from './CreateEventModal';
import EmojiPicker from './EmojiPicker';

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (content: string, replyToId?: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onFileSelect?: (files: File[]) => void;
  onSendVoiceNote?: (audioData: AudioRecordingData) => void;
  onSendVideoNote?: (videoBlob: Blob, thumbnail: string, duration: number) => void;
  onSendLocation?: (location: any) => void;
  replyToMessage?: Message;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  isEncrypted?: boolean;
  disableAutoFocus?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onFileSelect,
  onSendVoiceNote,
  onSendVideoNote,
  onSendLocation,
  replyToMessage,
  onCancelReply,
  disabled = false,
  placeholder = "Type a message...",
  className,
  isEncrypted = false,
  disableAutoFocus = false,
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [slashCommandQuery, setSlashCommandQuery] = useState('');
  const [slashCommandPosition, setSlashCommandPosition] = useState<{ top: number; left: number } | null>(null);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px height
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setMessage(value);

    // Check for @mention trigger
    const beforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentions(true);
      
      // Calculate position for mention dropdown
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const rect = textarea.getBoundingClientRect();
        
        // Create a temporary element to measure text dimensions
        const tempEl = document.createElement('div');
        tempEl.style.cssText = window.getComputedStyle(textarea).cssText;
        tempEl.style.position = 'absolute';
        tempEl.style.visibility = 'hidden';
        tempEl.style.whiteSpace = 'pre-wrap';
        tempEl.textContent = beforeCursor;
        document.body.appendChild(tempEl);
        
        const textWidth = tempEl.offsetWidth;
        const textHeight = tempEl.offsetHeight;
        document.body.removeChild(tempEl);
        
        setMentionPosition({
          top: rect.top - 200, // Position above input
          left: Math.min(rect.left + textWidth, rect.right - 200),
        });
      }
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }

    // Check for slash command trigger
    const slashMatch = beforeCursor.match(/^\/(\w*)$/);
    
    if (slashMatch) {
      const query = slashMatch[1];
      setSlashCommandQuery(query);
      setShowSlashCommands(true);
      
      // Calculate position for slash command dropdown
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const rect = textarea.getBoundingClientRect();
        
        setSlashCommandPosition({
          top: rect.top - 200, // Position above input
          left: rect.left,
        });
      }
    } else {
      setShowSlashCommands(false);
      setSlashCommandQuery('');
    }

    // Trigger typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }

    // Clear existing timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop?.();
    }, 1000);

    // Stop typing if input becomes empty
    if (!value.trim() && isTyping) {
      setIsTyping(false);
      onTypingStop?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [isTyping, onTypingStart, onTypingStop]);

  // Handle input resize
  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Handle send message
  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage, replyToMessage?.id);
    setMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      onTypingStop?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Focus back to input (only if auto-focus is not disabled)
    if (!disableAutoFocus) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [message, disabled, onSendMessage, replyToMessage?.id, isTyping, onTypingStop]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed, files:', e.target.files);
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFileSelect) {
      console.log('Calling onFileSelect with files:', files);
      onFileSelect(files);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle mention selection
  const handleMentionSelect = useCallback((user: { id: string; name: string; username: string }) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const cursorPosition = textarea.selectionStart;
      const beforeCursor = message.substring(0, cursorPosition);
      const afterCursor = message.substring(cursorPosition);
      
      // Find the @ symbol position
      const mentionStartMatch = beforeCursor.match(/@(\w*)$/);
      if (mentionStartMatch) {
        const mentionStart = beforeCursor.lastIndexOf('@');
        const newMessage = 
          message.substring(0, mentionStart) + 
          `@${user.username || user.name} ` + 
          afterCursor;
        
        setMessage(newMessage);
        setShowMentions(false);
        setMentionQuery('');
        
        // Set cursor position after the mention
        setTimeout(() => {
          const newCursorPos = mentionStart + `@${user.username || user.name} `.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
      }
    }
  }, [message]);

  // Handle voice recording
  const handleVoiceRecordingSend = useCallback((audioData: AudioRecordingData) => {
    if (onSendVoiceNote) {
      onSendVoiceNote(audioData);
      setShowVoiceRecorder(false);
    }
  }, [onSendVoiceNote]);

  const handleVoiceRecordingCancel = useCallback(() => {
    setShowVoiceRecorder(false);
  }, []);

  // Handle video recording
  const handleVideoRecordingSend = useCallback((videoBlob: Blob, thumbnail: string, duration: number) => {
    if (onSendVideoNote) {
      onSendVideoNote(videoBlob, thumbnail, duration);
      setShowVideoRecorder(false);
    }
  }, [onSendVideoNote]);

  const handleVideoRecordingCancel = useCallback(() => {
    setShowVideoRecorder(false);
  }, []);

  // Handle slash command selection
  const handleSlashCommandSelect = useCallback((command: string) => {
    setMessage('');
    setShowSlashCommands(false);
    setSlashCommandQuery('');
    
    switch (command) {
      case 'event':
        setShowCreateEventModal(true);
        break;
      // Add more slash commands here in the future
      case 'task':
        // TODO: Implement task creation
        break;
      case 'poll':
        // TODO: Implement poll creation
        break;
    }
    
    // Focus back to input (only if auto-focus is not disabled)
    if (!disableAutoFocus) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        const newPosition = start + emoji.length;
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
      }, 0);
    } else {
      // Fallback: just append emoji to the end
      setMessage(message + emoji);
    }
  }, [message]);

  const canSend = message.trim().length > 0 && !disabled;

  // Debug log to check recorder states
  useEffect(() => {
    console.log('MessageInput states:', {
      showVoiceRecorder,
      showVideoRecorder,
      disabled,
      message
    });
  }, [showVoiceRecorder, showVideoRecorder, disabled, message]);

  // Add global click listener for debugging
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.tagName === 'BUTTON') {
        console.log('Global click on button detected:', {
          tagName: target.tagName,
          className: target.className,
          id: target.id,
          innerText: target.innerText?.substring(0, 20)
        });
      }
    };
    
    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, []);

  return (
    <div className={cn("border-t bg-background", className)}>
      {/* Reply preview */}
      {replyToMessage && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1 h-8 bg-primary rounded" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs text-muted-foreground">
                  Replying to {replyToMessage.sender.name}
                </div>
                <div className="truncate text-sm">
                  {replyToMessage.content || "Message"}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Voice recorder */}
      {showVoiceRecorder ? (
        <VoiceRecorder
          onSend={handleVoiceRecordingSend}
          onCancel={handleVoiceRecordingCancel}
          maxDuration={300} // 5 minutes max
        />
      ) : showVideoRecorder ? (
        <VideoRecorder
          onVideoRecorded={handleVideoRecordingSend}
          onCancel={handleVideoRecordingCancel}
          maxDuration={60} // 1 minute max
          maxFileSize={25} // 25MB max
          quality="medium"
        />
      ) : (
        /* Input area */
        <div className="flex flex-col gap-2 p-3">
        <div className="flex items-end gap-2">
        {/* File attachment button */}
        <div className="shrink-0">
          <SimpleFileButton 
            onFileSelect={(files) => {
              console.log('SimpleFileButton onFileSelect called with:', files);
              if (onFileSelect) {
                onFileSelect(files);
              } else {
                console.log('No onFileSelect handler provided');
              }
            }}
            disabled={disabled}
          />
        </div>

        {/* Message input with preview */}
        <div className="flex-1 relative">
          {showPreview && message.trim() ? (
            <div className={cn(
              "w-full rounded-lg border px-3 py-2 text-sm",
              "min-h-[36px] max-h-[120px] overflow-y-auto",
              "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
              "bg-muted/30"
            )}>
              <MarkdownRenderer content={message} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none rounded-lg border px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{ minHeight: '36px', maxHeight: '120px' }}
            />
          )}

          {/* Character count (optional) */}
          {message.length > 1000 && (
            <div className="absolute -top-6 right-0 text-xs text-muted-foreground">
              {message.length}/2000
            </div>
          )}
        </div>

        {/* Preview toggle button */}
        {message.trim() && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPreview(!showPreview)}
            disabled={disabled}
            className="h-8 w-8 p-0 shrink-0"
            title={showPreview ? "Edit message" : "Preview markdown"}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}

        {/* Emoji button */}
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          trigger={
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled}
              className="h-8 w-8 p-0 shrink-0"
              title="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          }
        />

        {/* Voice recording button */}
        {onSendVoiceNote && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowVoiceRecorder(true)}
            disabled={disabled}
            className="h-8 w-8 p-0 shrink-0"
            title="Record voice message"
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}

        {/* Video recording button */}
        {onSendVideoNote && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowVideoRecorder(true)}
            disabled={disabled}
            className="h-8 w-8 p-0 shrink-0"
            title="Record video message"
          >
            <Video className="h-4 w-4" />
          </Button>
        )}

        {/* Location sharing button */}
        {onSendLocation && (
          <LocationShare
            onLocationShare={(location) => onSendLocation(location)}
            className="h-8 w-8 p-0 shrink-0"
          />
        )}

        {/* Encryption indicator */}
        <div 
          className="flex items-center justify-center h-8 w-8 shrink-0"
          title={isEncrypted ? "Messages are encrypted" : "Messages are not encrypted"}
        >
          {isEncrypted ? (
            <Lock className="h-4 w-4 text-green-500" />
          ) : (
            <Unlock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Send button with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              disabled={!canSend}
              className={cn(
                "h-8 px-2 shrink-0 transition-colors gap-1",
                canSend 
                  ? "bg-primary hover:bg-primary/90" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="h-4 w-4" />
              <div className="w-px h-4 bg-white/20" />
              <span className="text-xs">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSendMessage}>
              <Send className="h-4 w-4 mr-2" />
              Send now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowScheduleModal(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Schedule for later
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        </div>
      </div>
      )}


      {/* Typing indicator status (for debugging) */}
      {process.env.NODE_ENV === 'development' && isTyping && (
        <div className="px-4 pb-1">
          <Badge variant="outline" className="text-xs">
            Typing...
          </Badge>
        </div>
      )}

      {/* Mention autocomplete */}
      {showMentions && mentionPosition && (
        <MentionAutocomplete
          query={mentionQuery}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentions(false)}
          anchorPosition={mentionPosition}
        />
      )}

      {/* Schedule message modal */}
      <ScheduleMessageModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        conversationId={conversationId}
        replyToMessage={replyToMessage}
        initialContent={message}
      />

      {/* Create event modal */}
      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        conversationId={conversationId}
        suggestedTitle={message.trim()}
        suggestedParticipants={[]} // TODO: Parse participants from conversation
      />

      {/* Slash commands dropdown */}
      {showSlashCommands && slashCommandPosition && (
        <div
          className="absolute z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-[200px]"
          style={{
            top: `${slashCommandPosition.top}px`,
            left: `${slashCommandPosition.left}px`,
          }}
        >
          <div className="text-xs text-muted-foreground mb-2 px-2">
            Slash Commands
          </div>
          {[
            { command: 'event', icon: Calendar, label: 'Create Event', description: 'Schedule a new event' },
            { command: 'task', icon: FileText, label: 'Create Task', description: 'Add a new task (Coming soon)', disabled: true },
            { command: 'poll', icon: Users, label: 'Create Poll', description: 'Start a poll (Coming soon)', disabled: true },
          ]
            .filter(cmd => !slashCommandQuery || cmd.command.toLowerCase().includes(slashCommandQuery.toLowerCase()))
            .map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => !cmd.disabled && handleSlashCommandSelect(cmd.command)}
                disabled={cmd.disabled}
                className={cn(
                  "w-full text-left px-2 py-2 rounded hover:bg-accent flex items-start gap-2 transition-colors",
                  cmd.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <cmd.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{cmd.label}</div>
                  <div className="text-xs text-muted-foreground">{cmd.description}</div>
                </div>
              </button>
            ))}
          {slashCommandQuery && ![
            'event', 'task', 'poll'
          ].some(cmd => cmd.includes(slashCommandQuery.toLowerCase())) && (
            <div className="text-xs text-muted-foreground px-2 py-2">
              No commands found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageInput;