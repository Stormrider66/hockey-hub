import * as React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.ComponentProps<'textarea'> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2 border rounded-md bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:border-ring',
        className
      )}
      {...props}
    />
  );
} 