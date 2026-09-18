import * as React from "react"

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`flex h-9 w-full rounded-[4px] border border-[#e6e6e6] bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(210_100%_44%)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}
