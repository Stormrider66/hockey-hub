import React, { useEffect, useRef } from 'react';
import { X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InlineSearchBarProps {
  isOpen: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  currentIndex: number;
  totalResults: number;
  onNavigate: (direction: 'next' | 'prev') => void;
  className?: string;
}

const InlineSearchBar: React.FC<InlineSearchBarProps> = ({
  isOpen,
  searchQuery,
  onSearchChange,
  onClose,
  currentIndex,
  totalResults,
  onNavigate,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "absolute top-0 left-0 right-0 z-20 bg-background border-b shadow-md p-2 animate-in slide-in-from-top-2 duration-200",
      className
    )}>
      <div className="flex items-center gap-2 max-w-2xl mx-auto">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search messages..."
          className="flex-1 h-8"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) {
                onNavigate('prev');
              } else {
                onNavigate('next');
              }
            } else if (e.key === 'Escape') {
              onClose();
            }
          }}
        />
        
        {totalResults > 0 && (
          <>
            <Badge variant="secondary" className="text-xs">
              {currentIndex + 1} / {totalResults}
            </Badge>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onNavigate('prev')}
                disabled={totalResults === 0}
                title="Previous (Shift+Enter)"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onNavigate('next')}
                disabled={totalResults === 0}
                title="Next (Enter)"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground text-center mt-1">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> for next, 
        <kbd className="px-1 py-0.5 bg-muted rounded ml-1">Shift+Enter</kbd> for previous, 
        <kbd className="px-1 py-0.5 bg-muted rounded ml-1">Esc</kbd> to close
      </div>
    </div>
  );
};

export default InlineSearchBar;