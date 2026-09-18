import * as React from "react"

const variants: Record<string, string> = {
  default: "bg-[hsl(210_100%_44%)] text-white",
  secondary: "bg-[#f6f5f4] text-[#111] border border-[#e6e6e6]",
  outline: "border border-[#e6e6e6] text-[#6b7280]",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  destructive: "bg-red-50 text-red-700 border border-red-200",
}

export function Badge({ variant = "default", className = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof variants }) {
  return <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`} {...props} />
}
