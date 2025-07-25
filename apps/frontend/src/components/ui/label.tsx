import * as React from "react"
import { cn } from "@/lib/utils"

interface LabelProps extends React.ComponentProps<'label'> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
} 