import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import SearchHighlight from './SearchHighlight';
import { cn } from '@/lib/utils';

interface MessageContentProps {
  content: string;
  searchTerms?: string[];
  isOwn?: boolean;
  className?: string;
  useMarkdown?: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({
  content,
  searchTerms = [],
  isOwn = false,
  className,
  useMarkdown = true,
}) => {
  // If no search terms or markdown is disabled, use regular rendering
  if (!searchTerms.length || !useMarkdown) {
    if (useMarkdown) {
      return <MarkdownRenderer content={content} isOwn={isOwn} className={className} />;
    }
    return <span className={className}>{content}</span>;
  }

  // For search highlighting with markdown, we need a custom approach
  // This is a simplified version that highlights in plain text
  // A full implementation would parse markdown and apply highlighting to text nodes only
  return (
    <div className={cn("message-content", className)}>
      <SearchHighlight
        text={content}
        searchTerms={searchTerms}
        highlightClassName="bg-yellow-300 dark:bg-yellow-900/70 font-semibold px-0.5 rounded"
      />
    </div>
  );
};

export default MessageContent;