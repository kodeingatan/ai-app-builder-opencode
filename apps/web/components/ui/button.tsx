import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

const variantClasses = {
  default: "bg-[hsl(210_100%_44%)] text-white hover:bg-[hsl(210_100%_40%)] shadow-sm",
  outline: "border border-[#e6e6e6] bg-white hover:bg-[#f6f5f4] text-[#111]",
  ghost: "hover:bg-[#f6f5f4] text-[#111]",
  secondary: "bg-[#f6f5f4] text-[#111] hover:bg-[#e6e6e6]",
  destructive: "bg-red-600 text-white hover:bg-red-700",
}

const sizeClasses = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-full px-3 text-xs",
  lg: "h-10 rounded-full px-8",
  icon: "h-9 w-9",
}

export function Button({ className = "", variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(210_100%_44%)] disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}
