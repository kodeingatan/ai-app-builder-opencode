"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Database, Files, Sparkles, ChevronRight, Menu, X, Table, FileStack, ClipboardList, Boxes } from "lucide-react"
import { useState } from "react"

const navGroups = [
  {
    label: "Platform",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Global Tabel",
    items: [
      { label: "Global Tables", href: "/global-tables", icon: Table },
      { label: "Browse Data", href: "/dyn", icon: Database },
    ],
  },
  {
    label: "Persuratan",
    items: [
      { label: "Components", href: "/components-persuratan", icon: Boxes },
      { label: "Templates", href: "/templates-persuratan", icon: FileStack },
      { label: "Administrasi", href: "/administrasi-persuratan", icon: ClipboardList },
      { label: "Hasil Surat", href: "/hasil-persuratan", icon: Files },
    ],
  },
]

// alias -> canonical (persuratan-centric, legacy hidden)
const aliasToCanonical: Record<string, string> = {
  "/": "/generated/surat-platform",
  "/global-tables": "/global-tables",
  "/dyn": "/dyn",
  "/components-persuratan": "/components-persuratan",
  "/templates-persuratan": "/templates-persuratan",
  "/administrasi-persuratan": "/administrasi-persuratan",
  "/hasil-persuratan": "/hasil-persuratan",
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false
  // href is alias (e.g. "/builder")
  const canonical = aliasToCanonical[href] ?? href
  // direct match alias or canonical
  if (pathname === href || pathname === canonical) return true
  // prefix match (for detail pages e.g. /templates/123)
  if (pathname.startsWith(canonical + "/")) return true
  if (href !== "/" && pathname.startsWith(href + "/")) return true
  // dashboard special: "/" should be active for canonical dashboard too
  if (href === "/" && (pathname === "/generated/surat-platform" || pathname.startsWith("/generated/surat-platform/"))) {
    // only dashboard, not other subpages: check exact or sub but not already matched elsewhere
    // we handle precise: if pathname is dashboard itself
    return pathname === "/" || pathname === "/generated/surat-platform"
  }
  return false
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f6f5f4] flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-[240px] shrink-0 flex-col bg-white border-r border-[#e6e6e6] sticky top-0 h-screen">
        <div className="h-[64px] flex items-center gap-3 px-6 border-b border-[#e6e6e6]">
          <div className="w-8 h-8 rounded-[8px] bg-[#0075de] flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-sm font-bold leading-none">Surat Platform</div>
            <div className="text-[11px] text-[#6b7280] font-medium">Document Builder</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-2 text-[11px] font-semibold tracking-widest text-[#9ca3af] uppercase">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-colors ${
                        active ? "bg-[#0075de] text-white shadow-sm" : "text-[#4b5563] hover:bg-[#f6f5f4] hover:text-[#111]"
                      }`}
                    >
                      <item.icon size={16} className={active ? "text-white" : "text-[#6b7280]"} />
                      <span className="font-medium">{item.label}</span>
                      {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-[#e6e6e6]">
          <div className="rounded-[12px] bg-[#0075de] p-4 text-white">
            <div className="text-xs font-semibold mb-1 flex items-center gap-1.5"><Sparkles size={12} /> Persuratan Flow</div>
            <div className="text-[11px] opacity-90 leading-relaxed">Component → Template → Administrasi → Hasil Surat</div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white flex flex-col shadow-xl">
            <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#e6e6e6]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#0075de] flex items-center justify-center text-white"><Sparkles size={16} /></div>
                <div><div className="text-sm font-bold">Surat Platform</div><div className="text-[11px] text-[#6b7280]">Document Builder</div></div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded hover:bg-[#f6f5f4]"><X size={18} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-3 mb-2 text-[11px] font-semibold tracking-widest text-[#9ca3af] uppercase">{group.label}</div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href)
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm ${active ? "bg-[#0075de] text-white" : "text-[#4b5563]"}`}>
                          <item.icon size={16} />{item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 w-full flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden h-14 bg-white border-b border-[#e6e6e6] flex items-center justify-between px-4 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded hover:bg-[#f6f5f4]"><Menu size={20} /></button>
          <div className="flex items-center gap-2 font-bold text-sm"><div className="w-7 h-7 rounded bg-[#0075de] flex items-center justify-center text-white"><Sparkles size={14} /></div>Surat Platform</div>
          <div className="w-9" />
        </header>
        <main className="flex-1 w-full min-w-0">{children}</main>
      </div>
    </div>
  )
}
