import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isOwn?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className,
  isOwn = false 
}) => {
  // Basic markdown parsing
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let key = 0;
    
    // Split by line for block-level elements
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <pre
              key={key++}
              className={cn(
                "my-2 p-2 rounded bg-muted/50 overflow-x-auto text-xs",
                isOwn && "bg-primary-foreground/10"
              )}
            >
              <code className={`language-${codeBlockLang || 'plaintext'}`}>
                {codeBlockContent.join('\n')}
              </code>
            </pre>
          );
          codeBlockContent = [];
          codeBlockLang = '';
        }
        continue;
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }
      
      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="font-semibold text-base my-2">
            {parseInlineMarkdown(line.slice(4))}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="font-bold text-lg my-2">
            {parseInlineMarkdown(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={key++} className="font-bold text-xl my-2">
            {parseInlineMarkdown(line.slice(2))}
          </h1>
        );
      }
      // Lists
      else if (line.match(/^[-*+] /)) {
        elements.push(
          <li key={key++} className="ml-4 list-disc">
            {parseInlineMarkdown(line.slice(2))}
          </li>
        );
      }
      else if (line.match(/^\d+\. /)) {
        elements.push(
          <li key={key++} className="ml-4 list-decimal">
            {parseInlineMarkdown(line.replace(/^\d+\. /, ''))}
          </li>
        );
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={key++}
            className={cn(
              "border-l-4 pl-4 py-1 my-2 italic",
              isOwn ? "border-primary-foreground/50" : "border-muted-foreground/50"
            )}
          >
            {parseInlineMarkdown(line.slice(2))}
          </blockquote>
        );
      }
      // Horizontal rule
      else if (line.match(/^[-*_]{3,}$/)) {
        elements.push(
          <hr key={key++} className="my-2 border-t border-muted-foreground/20" />
        );
      }
      // Regular paragraph
      else if (line.trim()) {
        elements.push(
          <span key={key++}>
            {parseInlineMarkdown(line)}
            {i < lines.length - 1 && <br />}
          </span>
        );
      }
      // Empty line
      else if (i < lines.length - 1) {
        elements.push(<br key={key++} />);
      }
    }
    
    return elements;
  };
  
  // Parse inline markdown (bold, italic, code, links, mentions, etc.)
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    
    // Combined regex for all inline patterns
    // Mentions: allow first and last names with a space
    const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_|`(.+?)`|\[(.+?)\]\((.+?)\)|@([A-Za-z]+(?:\s+[A-Za-z]+)?))/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Bold + Italic (***text*** or ___text___)
      if (match[2]) {
        parts.push(
          <strong key={key++} className="font-bold italic">
            {match[2]}
          </strong>
        );
      }
      // Bold (**text** or __text__)
      else if (match[3] || match[5]) {
        parts.push(
          <strong key={key++} className="font-bold">
            {match[3] || match[5]}
          </strong>
        );
      }
      // Italic (*text* or _text_)
      else if (match[4] || match[6]) {
        parts.push(
          <em key={key++} className="italic">
            {match[4] || match[6]}
          </em>
        );
      }
      // Code (`text`)
      else if (match[7]) {
        parts.push(
          <code
            key={key++}
            className={cn(
              "px-1 py-0.5 rounded text-xs font-mono",
              isOwn ? "bg-primary-foreground/10" : "bg-muted"
            )}
          >
            {match[7]}
          </code>
        );
      }
      // Links [text](url)
      else if (match[8] && match[9]) {
        parts.push(
          <a
            key={key++}
            href={match[9]}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline hover:opacity-80",
              isOwn ? "text-primary-foreground" : "text-primary"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {match[8]}
          </a>
        );
      }
      // @mentions
      else if (match[10]) {
        parts.push(
          <span
            key={key++}
            className={cn(
              "font-medium",
              "text-primary"
            )}
          >
            @{match[10]}
          </span>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };
  
  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {parseMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;