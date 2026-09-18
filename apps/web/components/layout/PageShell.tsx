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
    <div className="min-h-screen bg-[#f6f5f4]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4 flex items-center gap-1.5 text-sm text-[#6b7280]">
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111]">{title}</h1>
            {description && <p className="mt-1 text-sm text-[#6b7280] max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  )
}
