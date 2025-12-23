import React, { createContext, useContext, useMemo, useState } from 'react';

type SelectCtxValue = {
  onValueChange?: (v: string) => void;
  value?: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  selectedLabel?: string;
  setSelectedLabel: (v?: string) => void;
};

const SelectCtx = createContext<SelectCtxValue | null>(null);

export const Select = ({ children, value, onValueChange, ...props }: any) => {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>(undefined);

  const ctxValue = useMemo(
    () => ({
      onValueChange,
      value,
      open,
      setOpen,
      selectedLabel,
      setSelectedLabel,
    }),
    [onValueChange, value, open, selectedLabel]
  );

  return (
    <SelectCtx.Provider value={ctxValue}>
      <div {...props}>{children}</div>
    </SelectCtx.Provider>
  );
};

// A slightly smarter mock that behaves closer to Radix Select:
// - Trigger is a combobox button that toggles open/closed.
// - Content only renders when open.
export const SelectTrigger = ({ children, ...props }: any) => {
  const ctx = useContext(SelectCtx);
  const isOpen = !!ctx?.open;

  return (
    <button
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={!!isOpen}
      onClick={(e) => {
        props?.onClick?.(e);
        ctx?.setOpen?.(!isOpen);
      }}
      style={{ pointerEvents: 'auto' }}
      {...props}
    >
      {children}
    </button>
  );
};

export const SelectContent = ({ children, ...props }: any) => {
  const ctx = useContext(SelectCtx);
  if (!ctx?.open) return null;
  return (
    <div role="listbox" style={{ pointerEvents: 'auto' }} {...props}>
      {children}
    </div>
  );
};
export const SelectItem = ({ value, children }: any) => {
  const ctx = useContext(SelectCtx);
  return (
    <button
      role="option"
      aria-selected={ctx?.value === value}
      onClick={() => {
        ctx?.onValueChange?.(value);
        ctx?.setSelectedLabel?.(textFromChildren(children) || undefined);
        // Close after selection if we can.
        ctx?.setOpen?.(false);
      }}
    >
      {children}
    </button>
  );
};
export const SelectValue = ({ placeholder, ...props }: any) => (
  <SelectValueInner placeholder={placeholder} {...props} />
);

const SelectValueInner = ({ placeholder, ...props }: any) => {
  const ctx = useContext(SelectCtx);
  return (
    <span style={{ pointerEvents: 'auto' }} {...props}>
      {ctx?.selectedLabel || ctx?.value || placeholder || ''}
    </span>
  );
};

function textFromChildren(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textFromChildren).join('');
  if (typeof node === 'object' && node.props && node.props.children != null) {
    return textFromChildren(node.props.children);
  }
  return '';
}
export const SelectGroup = ({ children }: any) => <>{children}</>;
export const SelectLabel = ({ children }: any) => <label>{children}</label>;
export const SelectSeparator = () => null;
export const SelectScrollUpButton = () => null;
export const SelectScrollDownButton = () => null;
export default {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};


