"use client"
import Link from "next/link"
import * as React from "react"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageShellProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function PageShell({ title, description, breadcrumbs, actions, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#f6f5f4] w-full">
      <div className="w-full max-w-none px-3 sm:px-3 lg:px-4 py-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2.5 flex items-center gap-1 text-xs text-[#6b7280]">
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-[#d1d5db]">/</span>}
                {bc.href ? (
                  <Link href={bc.href} className="hover:text-[#0075de] transition-colors">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-[#111] font-medium">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-[#111] leading-tight">{title}</h1>
            {description && <p className="mt-0.5 text-[13px] leading-relaxed text-[#6b7280] max-w-2xl line-clamp-2">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-1.5 shrink-0 flex-wrap">{actions}</div>}
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  )
}
