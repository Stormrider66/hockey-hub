import * as React from 'react';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';

type FieldContext = { name: string; inputId: string; labelId: string; errorId: string };
const FormFieldContext = React.createContext<FieldContext | undefined>(undefined);

export function Form(props: any) {
  const { children, ...form } = props;
  return <FormProvider {...form}>{children}</FormProvider>;
}

export function FormField({ control, name, render }: { control: any; name: string; render: (args: any) => React.ReactNode }) {
  const ctx: FieldContext = {
    name,
    inputId: `${name}-input`,
    labelId: `${name}-label`,
    errorId: `${name}-error`,
  };
  return (
    <FormFieldContext.Provider value={ctx}>
      <Controller control={control} name={name} render={render as any} />
    </FormFieldContext.Provider>
  );
}

export function FormItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function FormLabel({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(FormFieldContext);
  return <label id={ctx?.labelId} htmlFor={ctx?.inputId}>{children}</label>;
}

export function FormControl({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) return <div>{children}</div>;
  const child = React.Children.only(children) as React.ReactElement<any>;
  const propsToInject: any = { id: ctx.inputId, name: ctx.name };
  // Ensure accessible name via label for non-native controls (e.g., Radix)
  if (child && typeof child.type !== 'string') {
    propsToInject['aria-labelledby'] = ctx.labelId;
    propsToInject['aria-describedby'] = ctx.errorId;
  }
  return <div>{React.cloneElement(child, propsToInject)}</div>;
}

export function FormDescription({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function FormMessage() {
  const ctx = React.useContext(FormFieldContext);
  const { formState } = useFormContext();
  const name = ctx?.name as string | undefined;
  const message = name ? (formState.errors as any)?.[name]?.message : undefined;
  if (!message) return null;
  return (
    <p id={ctx!.errorId} role="alert" aria-live="polite">
      {String(message)}
    </p>
  );
}

export default { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage };


