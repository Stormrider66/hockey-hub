import React, { createContext, useContext, useState, useCallback, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block align-middle">{children}</div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild = false, children }: { asChild?: boolean; children: React.ReactNode }) {
  const ctx = useContext(DropdownContext);
  if (!ctx) return <>{children}</>;

  const toggle = useCallback(() => ctx.setOpen(!ctx.open), [ctx]);

  if (asChild && isValidElement(children)) {
    return cloneElement(children as any, {
      onClick: (e: any) => {
        (children as any).props?.onClick?.(e);
        toggle();
      },
    });
  }

  return (
    <button type="button" onClick={toggle} className="inline-flex items-center">
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className, align = 'start' as 'start' | 'end' }: { children: React.ReactNode; className?: string; align?: 'start' | 'end' }) {
  const ctx = useContext(DropdownContext);
  if (!ctx || !ctx.open) return null;
  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 mt-2 min-w-[10rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md focus:outline-none',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: (e: any) => void }) {
  const ctx = useContext(DropdownContext);
  return (
    <div
      role="menuitem"
      tabIndex={0}
      onClick={(e) => {
        onClick?.(e);
        ctx?.setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onClick?.(e);
          ctx?.setOpen(false);
        }
      }}
      className={cn('relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted focus:bg-muted', className)}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="-mx-1 my-1 h-px bg-muted" role="separator" />;
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-2 py-1.5 text-sm font-semibold', className)}>{children}</div>;
}



