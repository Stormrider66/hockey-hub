import React, { useState, useMemo } from 'react';
import { Search, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: string[];
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  className?: string;
  recentEmojis?: string[];
  onRecentEmojiUpdate?: (emojis: string[]) => void;
}

// Emoji data - in a real app, this would come from a proper emoji library
const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'recent',
    name: 'Recent',
    icon: '🕒',
    emojis: [], // Will be populated from props
  },
  {
    id: 'smileys',
    name: 'Smileys & People',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    ],
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: '🍎',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
      '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
      '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🍳', '🥞', '🧇', '🥓',
    ],
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
      '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️‍♂️', '🤼‍♀️', '🤼‍♂️',
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Places',
    icon: '🚗',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
      '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️',
      '🚢', '⛵', '🛥️', '🚤', '⛴️', '🚂', '🚃', '🚄', '🚅', '🚆',
    ],
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: '💡',
    emojis: [
      '💡', '🔦', '🕯️', '🪔', '🔥', '🧯', '🛢️', '💸', '💰', '💴',
      '💵', '💶', '💷', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️',
      '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨',
      '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺',
    ],
  },
  {
    id: 'symbols',
    name: 'Symbols',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '⭐', '🌟', '✨', '⚡', '☄️', '💫', '🔥', '🌈', '☀️', '🌤️',
    ],
  },
  {
    id: 'flags',
    name: 'Flags',
    icon: '🏁',
    emojis: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇫', '🇦🇽',
      '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲',
      '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪',
    ],
  },
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  trigger,
  className,
  recentEmojis = [],
  onRecentEmojiUpdate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('recent');
  const [isOpen, setIsOpen] = useState(false);

  // Update recent category with actual recent emojis
  const categoriesWithRecent = useMemo(() => {
    const categories = [...EMOJI_CATEGORIES];
    categories[0] = {
      ...categories[0],
      emojis: recentEmojis,
    };
    return categories;
  }, [recentEmojis]);

  // Filter emojis based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categoriesWithRecent;
    }

    return categoriesWithRecent.map(category => ({
      ...category,
      emojis: category.emojis.filter(emoji => {
        // In a real app, you'd have emoji metadata with names/keywords
        return true; // For now, show all emojis when searching
      }),
    })).filter(category => category.emojis.length > 0);
  }, [categoriesWithRecent, searchQuery]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    // Update recent emojis
    if (onRecentEmojiUpdate) {
      const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
      onRecentEmojiUpdate(newRecent);
    }
    
    setIsOpen(false);
  };

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🎉'];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            😀
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className={cn("w-80 p-0", className)} 
        align="end"
        sideOffset={5}
      >
        <div className="flex flex-col h-96">
          {/* Header with search */}
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emojis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8"
              />
            </div>
            
            {/* Quick reactions */}
            <div className="flex gap-1">
              {quickReactions.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 p-2 border-b overflow-x-auto">
            {filteredCategories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={() => setActiveCategory(category.id)}
                disabled={category.emojis.length === 0}
              >
                {category.icon}
              </Button>
            ))}
          </div>

          {/* Emoji grid */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredCategories
                .filter(cat => !searchQuery || cat.emojis.length > 0)
                .map((category) => (
                  <div key={category.id} className="mb-4">
                    {(!searchQuery || activeCategory === category.id) && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {category.name}
                          </span>
                          {category.id === 'recent' && category.emojis.length === 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              No recent emojis
                            </Badge>
                          )}
                        </div>
                        
                        {category.emojis.length > 0 ? (
                          <div className="grid grid-cols-8 gap-1">
                            {category.emojis.map((emoji, index) => (
                              <Button
                                key={`${emoji}-${index}`}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-muted rounded"
                                onClick={() => handleEmojiClick(emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        ) : category.id === 'recent' ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            Your recently used emojis will appear here
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;