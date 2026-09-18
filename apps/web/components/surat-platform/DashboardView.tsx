"use client"
import PageShell from "@/components/layout/PageShell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Files, Database, Component, Users, Palette, Eye, Sparkles, TrendingUp, Layers, GitBranch, Repeat } from "lucide-react"

export default function DashboardView() {
  const [stats, setStats] = useState({ templates: 0, documents: 0, dataSources: 0, components: 0, employees: 0 })
  const [recentTemplates, setRecentTemplates] = useState<any[]>([])
  const [recentDocs, setRecentDocs] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [t, d, ds, c, e] = await Promise.all([
        fetch("/api/generated/surat-platform/templates?limit=1").then(r => r.json()).catch(() => ({ total: 0 })),
        fetch("/api/generated/surat-platform/documents?limit=1").then(r => r.json()).catch(() => ({ total: 0 })),
        fetch("/api/generated/surat-platform/data-sources?limit=1").then(r => r.json()).catch(() => ({ total: 0 })),
        fetch("/api/generated/surat-platform/components?limit=1").then(r => r.json()).catch(() => ({ total: 0 })),
        fetch("/api/generated/surat-platform/employees?limit=1").then(r => r.json()).catch(() => ({ total: 0 })),
      ])
      setStats({ templates: t.total ?? 0, documents: d.total ?? 0, dataSources: ds.total ?? 0, components: c.total ?? 0, employees: e.total ?? 0 })
      const tplList = await fetch("/api/generated/surat-platform/templates?limit=3&sortBy=id&sortOrder=desc").then(r => r.json()).catch(() => ({ data: [] }))
      setRecentTemplates(tplList.data ?? [])
      const docList = await fetch("/api/generated/surat-platform/documents?limit=3&sortBy=id&sortOrder=desc").then(r => r.json()).catch(() => ({ data: [] }))
      setRecentDocs(docList.data ?? [])
    }
    load()
  }, [])

  const statCards = [
    { label: "Templates", value: stats.templates, icon: FileText, color: "bg-[#0075de]", href: "/templates", desc: "Document Template" },
    { label: "Documents", value: stats.documents, icon: Files, color: "bg-emerald-500", href: "/documents", desc: "Instance Surat" },
    { label: "Data Sources", value: stats.dataSources, icon: Database, color: "bg-violet-500", href: "/data-sources", desc: "Entitas & API" },
    { label: "Components", value: stats.components, icon: Component, color: "bg-amber-500", href: "/components", desc: "Registry" },
  ]

  return (
    <PageShell
      title="Document Builder Platform"
      description="Platform generik untuk menghasilkan berbagai jenis surat tanpa coding — Template → Layout → Component → Data Source → Repeater → Condition → Render"
      actions={
        <>
          <Link href="/builder"><Button><Palette size={16} /> Buka Builder</Button></Link>
          <Link href="/preview"><Button variant="outline"><Eye size={16} /> Preview</Button></Link>
        </>
      }
      breadcrumbs={[{ label: "Surat Platform" }]}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-[8px] ${s.color} flex items-center justify-center text-white`}><s.icon size={18} /></div>
                  <TrendingUp size={14} className="text-[#9ca3af] group-hover:text-[#0075de]" />
                </div>
                <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                <div className="text-xs font-semibold text-[#111]">{s.label}</div>
                <div className="text-[11px] text-[#6b7280]">{s.desc}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Layers size={16} className="text-[#0075de]" /> Arsitektur Engine</CardTitle>
          <div className="text-xs text-[#6b7280]">Alur generik: Admin membuat Template → Layout → Component → Binding Data → Render</div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-[12px] border border-[#e6e6e6] p-4 bg-[#fafafa]">
              <div className="w-8 h-8 rounded-[8px] bg-[#0075de] flex items-center justify-center text-white mb-3"><FileText size={16} /></div>
              <div className="text-sm font-bold">Template Builder</div>
              <div className="text-xs text-[#6b7280] mt-1 leading-relaxed">Drag & drop Layout + Component menjadi JSON Tree. Tidak generate file per surat — cukup publish.</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[11px]">Kop Surat</Badge><Badge variant="secondary" className="text-[11px]">Repeater</Badge><Badge variant="secondary" className="text-[11px]">Condition</Badge>
              </div>
            </div>
            <div className="rounded-[12px] border border-[#e6e6e6] p-4 bg-[#fafafa]">
              <div className="w-8 h-8 rounded-[8px] bg-violet-500 flex items-center justify-center text-white mb-3"><Database size={16} /></div>
              <div className="text-sm font-bold">Data Source & Binding</div>
              <div className="text-xs text-[#6b7280] mt-1 leading-relaxed">Layer abstraksi: <code className="bg-white px-1 py-0.5 rounded border text-[11px]">{`{{employee.name}}`}</code> <code className="bg-white px-1 py-0.5 rounded border text-[11px]">{`{{letter.number}}`}</code></div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[11px]">Employee</Badge><Badge variant="secondary" className="text-[11px]">Office</Badge><Badge variant="secondary" className="text-[11px]">Custom Query</Badge>
              </div>
            </div>
            <div className="rounded-[12px] border border-[#e6e6e6] p-4 bg-[#fafafa]">
              <div className="w-8 h-8 rounded-[8px] bg-emerald-500 flex items-center justify-center text-white mb-3"><GitBranch size={16} /></div>
              <div className="text-sm font-bold">Render Engine</div>
              <div className="text-xs text-[#6b7280] mt-1 leading-relaxed"><span className="inline-flex items-center gap-1"><Repeat size={12} /> Repeater</span> + <span className="inline-flex items-center gap-1"><GitBranch size={12} /> Condition</span> + Nested Loop → HTML/PDF</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="success" className="text-[11px]">for employee in employees</Badge><Badge variant="warning" className="text-[11px]">IF status == active</Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[12px] bg-[#111] text-white p-4 font-mono text-xs leading-relaxed overflow-x-auto">
            <div className="text-[#9ca3af] mb-2">// JSON Tree — disimpan di templates.schema_json</div>
            <div><span className="text-[#62aef0]">{`{`}</span> <span className="text-[#fbbf24]">"type"</span>: <span className="text-[#86efac]">"document"</span>, <span className="text-[#fbbf24]">"children"</span>: [</div>
            <div className="pl-4">{`{ "type": "header", "children": [{ "type": "image", "props": { "src": "{{office.logo}}" } }] },`}</div>
            <div className="pl-4">{`{ "type": "repeater", "props": { "source": "employees", "item": "employee" }, "children": [`}</div>
            <div className="pl-8">{`{ "type": "text", "props": { "content": "{{employee.name}} — {{employee.nip}}" } },`}</div>
            <div className="pl-8">{`{ "type": "condition", "props": { "field": "employee.status", "operator": "equals", "value": "active" } }`}</div>
            <div className="pl-4">{`]`}</div>
            <div>{`}]`} <span className="text-[#62aef0]">{`}`}</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Template Terbaru</CardTitle>
            <Link href="/templates" className="text-xs text-[#0075de] font-medium hover:underline">Lihat semua →</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTemplates.length === 0 ? <div className="text-xs text-[#6b7280] py-6 text-center">Belum ada template</div> : recentTemplates.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-[8px] border border-[#e6e6e6] hover:bg-[#f6f5f4] transition-colors">
                <div className="w-9 h-9 rounded-[8px] bg-[#0075de]/10 flex items-center justify-center text-[#0075de]"><FileText size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.name}</div>
                  <div className="text-xs text-[#6b7280]">{t.code} • {t.category} • v{t.version}</div>
                </div>
                <Badge variant={t.status === "published" ? "success" : "secondary"}>{t.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Dokumen Terbaru</CardTitle>
            <Link href="/documents" className="text-xs text-[#0075de] font-medium hover:underline">Lihat semua →</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDocs.length === 0 ? <div className="text-xs text-[#6b7280] py-6 text-center">Belum ada dokumen</div> : recentDocs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-[8px] border border-[#e6e6e6] hover:bg-[#f6f5f4]">
                <div className="w-9 h-9 rounded-[8px] bg-emerald-50 flex items-center justify-center text-emerald-600"><Files size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{d.title}</div>
                  <div className="text-xs text-[#6b7280]">{d.document_number} • {d.recipient_name || "-"}</div>
                </div>
                <Badge variant={d.status === "published" ? "success" : d.status === "rendered" ? "warning" : "secondary"}>{d.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#111] flex items-center justify-center text-white shrink-0"><Sparkles size={18} /></div>
            <div className="flex-1">
              <div className="text-sm font-bold">Coba langsung — tanpa coding!</div>
              <div className="text-xs text-[#6b7280] mt-1 leading-relaxed max-w-2xl">Buat template Surat Keputusan dengan 3 employee, lalu lihat Repeater menghasilkan daftar bernomor + Condition hanya tampilkan pegawai aktif. Semua via JSON Tree + Render Engine generik.</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/builder"><Button size="sm"><Palette size={14} /> Buka Builder</Button></Link>
                <Link href="/templates"><Button size="sm" variant="outline"><FileText size={14} /> Lihat Template</Button></Link>
                <Link href="/employees"><Button size="sm" variant="ghost"><Users size={14} /> Data Pegawai ({stats.employees})</Button></Link>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-[11px] tracking-widest font-semibold text-[#9ca3af] uppercase">Stack</div>
              <div className="text-xs font-mono mt-1">Next.js 15 + Prisma<br/>SQLite • Tailwind v4<br/>Zod • lucide-react</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
