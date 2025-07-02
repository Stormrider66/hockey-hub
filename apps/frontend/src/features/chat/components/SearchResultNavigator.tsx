import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Message } from '@/store/api/chatApi';

interface SearchResultNavigatorProps {
  searchResults: Message[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
  searchQuery: string;
  className?: string;
}

export const SearchResultNavigator: React.FC<SearchResultNavigatorProps> = ({
  searchResults,
  currentIndex,
  onNavigate,
  onClose,
  searchQuery,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(searchResults.length > 0);
  }, [searchResults.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'F3':
        case 'g':
          e.preventDefault();
          if (e.shiftKey) {
            navigatePrevious();
          } else {
            navigateNext();
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case 'ArrowUp':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            navigatePrevious();
          }
          break;
        case 'ArrowDown':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            navigateNext();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentIndex, searchResults.length]);

  const navigateNext = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentIndex + 1) % searchResults.length;
    onNavigate(nextIndex);
  }, [currentIndex, searchResults.length, onNavigate]);

  const navigatePrevious = useCallback(() => {
    if (searchResults.length === 0) return;
    const prevIndex = currentIndex === 0 ? searchResults.length - 1 : currentIndex - 1;
    onNavigate(prevIndex);
  }, [currentIndex, searchResults.length, onNavigate]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200); // Allow animation to complete
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div
      ref={navigatorRef}
      className={cn(
        'fixed top-20 right-4 z-50 bg-background border rounded-lg shadow-lg p-3 min-w-[280px] animate-in slide-in-from-top-2 duration-200',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Search Results</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {currentIndex + 1} of {searchResults.length}
        </Badge>
        
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={navigatePrevious}
            disabled={searchResults.length === 0}
            title="Previous result (Shift+F3)"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={navigateNext}
            disabled={searchResults.length === 0}
            title="Next result (F3)"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {searchQuery && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground truncate">
            Searching for: <span className="font-medium">{searchQuery}</span>
          </p>
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground">
        <p>Keyboard shortcuts:</p>
        <ul className="mt-1 space-y-0.5">
          <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">F3</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+↓</kbd> - Next</li>
          <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Shift+F3</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+↑</kbd> - Previous</li>
          <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> - Close search</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchResultNavigator;