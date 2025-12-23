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

export function DropdownMenuContent({ children, className, align = 'start', forceMount }: { children: React.ReactNode; className?: string; align?: 'start' | 'end'; forceMount?: boolean }) {
  const ctx = useContext(DropdownContext);
  // If forceMount is true, always render (hidden when closed)
  // Otherwise, don't render when closed
  if (!ctx || (!ctx.open && !forceMount)) return null;
  if (!ctx.open && forceMount) {
    return <div className="hidden" aria-hidden="true">{children}</div>;
  }
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

// Radio group context for radio items
interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export function DropdownMenuRadioGroup({
  children,
  value,
  onValueChange
}: {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="group">{children}</div>
    </RadioGroupContext.Provider>
  );
}

export function DropdownMenuRadioItem({
  children,
  value,
  className
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) {
  const ctx = useContext(DropdownContext);
  const radioCtx = useContext(RadioGroupContext);
  const isSelected = radioCtx?.value === value;

  return (
    <div
      role="menuitemradio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={() => {
        radioCtx?.onValueChange(value);
        ctx?.setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          radioCtx?.onValueChange(value);
          ctx?.setOpen(false);
        }
      }}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-muted focus:bg-muted',
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && (
          <svg className="h-2 w-2 fill-current" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" />
          </svg>
        )}
      </span>
      {children}
    </div>
  );
}

