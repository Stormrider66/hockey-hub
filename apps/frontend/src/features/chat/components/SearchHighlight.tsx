import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SearchHighlightProps {
  text: string;
  searchTerms: string[];
  className?: string;
  highlightClassName?: string;
  caseSensitive?: boolean;
}

export const SearchHighlight: React.FC<SearchHighlightProps> = ({
  text,
  searchTerms,
  className,
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-900/50 font-medium',
  caseSensitive = false,
}) => {
  const highlightedContent = useMemo(() => {
    if (!searchTerms.length || !text) {
      return <span className={className}>{text}</span>;
    }

    // Create a regex pattern from search terms
    const escapedTerms = searchTerms
      .filter(term => term.length > 0)
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Escape regex special chars

    if (escapedTerms.length === 0) {
      return <span className={className}>{text}</span>;
    }

    const pattern = escapedTerms.join('|');
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${pattern})`, flags);

    // Split text by matches
    const parts = text.split(regex);

    return (
      <span className={className}>
        {parts.map((part, index) => {
          // Check if this part matches any search term
          const isMatch = escapedTerms.some(term => {
            const termRegex = new RegExp(`^${term}$`, caseSensitive ? '' : 'i');
            return termRegex.test(part);
          });

          if (isMatch) {
            return (
              <mark
                key={index}
                className={cn('rounded-sm px-0.5', highlightClassName)}
              >
                {part}
              </mark>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  }, [text, searchTerms, className, highlightClassName, caseSensitive]);

  return highlightedContent;
};

// Hook for extracting search terms from a query
export const useSearchTerms = (searchQuery: string): string[] => {
  return useMemo(() => {
    if (!searchQuery) return [];

    // Extract quoted phrases first
    const quotedPhrases: string[] = [];
    const quotedRegex = /"([^"]+)"/g;
    let match;

    while ((match = quotedRegex.exec(searchQuery)) !== null) {
      quotedPhrases.push(match[1]);
    }

    // Remove quoted phrases from query
    const remainingQuery = searchQuery.replace(quotedRegex, '').trim();

    // Split remaining query by spaces
    const words = remainingQuery
      .split(/\s+/)
      .filter(word => word.length > 0);

    // Combine quoted phrases and individual words
    return [...quotedPhrases, ...words];
  }, [searchQuery]);
};

export default SearchHighlight;