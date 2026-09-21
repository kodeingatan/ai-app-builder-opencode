import * as React from "react"

export function Label({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`text-xs font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
}
