import React, { createContext, useContext, useState, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {children}
      </span>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ children, asChild = false }: { children: React.ReactNode; asChild?: boolean }) {
  const ctx = useContext(TooltipContext);
  if (!ctx) return <>{children}</>;
  // When asChild is true or when children is a valid element, clone with hover handlers
  if ((asChild || isValidElement(children)) && isValidElement(children)) {
    return cloneElement(children as any, {
      onMouseEnter: (e: any) => {
        (children as any).props?.onMouseEnter?.(e);
        ctx.setOpen(true);
      },
      onMouseLeave: (e: any) => {
        (children as any).props?.onMouseLeave?.(e);
        ctx.setOpen(false);
      },
    });
  }
  return <span>{children}</span>;
}

export function TooltipContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = useContext(TooltipContext);
  if (!ctx || !ctx.open) return null;
  return (
    <div className={cn('absolute z-50 top-full mt-1 rounded bg-popover px-2 py-1 text-xs shadow border', className)} role="tooltip">
      {children}
    </div>
  );
}