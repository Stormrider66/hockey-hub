import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export function Collapsible({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) {
  const [internalOpen, setInternalOpen] = useState(!!open);
  const isOpen = open !== undefined ? open : internalOpen;
  return (
    <div data-state={isOpen ? 'open' : 'closed'} className="w-full">
      {React.Children.map(children, (child: any) => {
        if (!React.isValidElement(child)) return child;
        if (child.type === CollapsibleTrigger) {
          return React.cloneElement(child, {
            onClick: () => {
              const next = !isOpen;
              setInternalOpen(next);
              onOpenChange?.(next);
            },
          });
        }
        if (child.type === CollapsibleContent) {
          return React.cloneElement(child, { 'data-open': isOpen });
        }
        return child;
      })}
    </div>
  );
}

export function CollapsibleTrigger({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button type="button" className={cn('inline-flex items-center', className)} onClick={onClick}>
      {children}
    </button>
  );
}

export function CollapsibleContent({ children, className, 'data-open': dataOpen }: { children: React.ReactNode; className?: string; 'data-open'?: boolean }) {
  if (!dataOpen) return null;
  return <div className={cn('w-full', className)}>{children}</div>;
}

// Keep the simple test shim only; do not re-export Radix in tests
export { Collapsible as default };