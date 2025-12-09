import React, { createContext, useContext } from 'react';

const SelectCtx = createContext<{ onValueChange?: (v: string) => void; value?: string } | null>(null);

export const Select = ({ children, value, onValueChange, ...props }: any) => (
  <SelectCtx.Provider value={{ onValueChange, value }}>
    <div role="combobox" aria-expanded="false" {...props}>{children}</div>
  </SelectCtx.Provider>
);
export const SelectTrigger = ({ children, ...props }: any) => (
  <button type="button" aria-haspopup="listbox" style={{ pointerEvents: 'auto' }} {...props}>{children}</button>
);
export const SelectContent = ({ children, ...props }: any) => <div role="listbox" style={{ pointerEvents: 'auto' }} {...props}>{children}</div>;
export const SelectItem = ({ value, children }: any) => {
  const ctx = useContext(SelectCtx);
  return (
    <button role="option" aria-selected={ctx?.value === value} onClick={() => ctx?.onValueChange?.(value)}>
      {children}
    </button>
  );
};
export const SelectValue = ({ placeholder, ...props }: any) => (
  <button type="button" style={{ pointerEvents: 'auto' }} {...props}>{placeholder}</button>
);
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


