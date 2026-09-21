import * as React from "react"

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-[8px] border border-[#e6e6e6] bg-white shadow-sm ${className}`} {...props} />
}
export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1 p-3 ${className}`} {...props} />
}
export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-[13px] font-semibold leading-tight tracking-tight ${className}`} {...props} />
}
export function CardDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-xs text-[#6b7280] leading-relaxed ${className}`} {...props} />
}
export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-3 pt-0 ${className}`} {...props} />
}
export function CardFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-center p-3 pt-0 ${className}`} {...props} />
}
