"use client"
import PageShell from "@/components/layout/PageShell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Boxes, FileStack, ClipboardList, Files, Table, Sparkles, TrendingUp, Layers, FileText } from "lucide-react"

export default function DashboardView() {
  const [stats, setStats] = useState({ components: 0, templates: 0, administrasi: 0, hasil: 0, tables: 0 })
  const [recentTemplates, setRecentTemplates] = useState<any[]>([])
  const [recentHasil, setRecentHasil] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [c, t, a, h, tbl] = await Promise.all([
        fetch("/api/persuratan/components?limit=1").then(r => r.json()).catch(() => ({ total: 0 })),
        fetch("/api/persuratan/templates?limit=1").then(r => r.json()).catch(() => ({ total: 0 })),
        fetch("/api/persuratan/administrations?limit=1").then(r => r.json()).catch(() => ({ total: 0 })),
        fetch("/api/persuratan/administrations?limit=100").then(r => r.json()).then(async j => {
          const admins = j.data ?? []
          if (!admins.length) return { total: 0 }
          // sum hasil across admins (first 3)
          let total = 0
          for (const ad of admins.slice(0, 3)) {
            try {
              const r = await fetch(`/api/persuratan/administrations/${ad.id}/datas?limit=1`).then(x => x.json())
              total += r.total ?? 0
            } catch {}
          }
          return { total }
        }).catch(() => ({ total: 0 })),
        fetch("/api/global-tables?limit=1").then(r => r.json()).catch(() => ({ total: 0 })),
      ])
      setStats({ components: c.total ?? 0, templates: t.total ?? 0, administrasi: a.total ?? 0, hasil: (h as any).total ?? 0, tables: (tbl as any).total ?? 0 })
      const tplList = await fetch("/api/persuratan/templates?limit=3&sortBy=id&sortOrder=desc").then(r => r.json()).catch(() => ({ data: [] }))
      setRecentTemplates(tplList.data ?? [])
      // recent hasil: ambil dari administrasi pertama
      try {
        const admins = await fetch("/api/persuratan/administrations?limit=1").then(r => r.json())
        const first = admins.data?.[0]
        if (first) {
          const hasil = await fetch(`/api/persuratan/administrations/${first.id}/datas?limit=3`).then(r => r.json())
          setRecentHasil(hasil.data ?? [])
        }
      } catch { setRecentHasil([]) }
    }
    load()
  }, [])

  const statCards = [
    { label: "Components", value: stats.components, icon: Boxes, color: "bg-[#0075de]", href: "/components-persuratan", desc: "Branding & Blok" },
    { label: "Templates", value: stats.templates, icon: FileStack, color: "bg-violet-600", href: "/templates-persuratan", desc: "Office Doc Builder" },
    { label: "Administrasi", value: stats.administrasi, icon: ClipboardList, color: "bg-amber-500", href: "/administrasi-persuratan", desc: "Alur & Tahapan" },
    { label: "Hasil Surat", value: stats.hasil, icon: Files, color: "bg-emerald-500", href: "/hasil-persuratan", desc: "Dokumen Jadi" },
    { label: "Global Tabel", value: stats.tables, icon: Table, color: "bg-slate-700", href: "/global-tables", desc: "dyn_* tables" },
  ]

  return (
    <PageShell
      title="Dashboard Persuratan"
      description="Pusat kendali persuratan — alur Component → Template (Office Doc Tiptap + Repeater/Condition) → Administrasi (Fields & Steps) → Hasil Surat + Global Tabel"
      actions={
        <>
          <Link href="/components-persuratan/new"><Button><Boxes size={14} /> Buat Component</Button></Link>
          <Link href="/templates-persuratan/new"><Button variant="outline"><FileStack size={14} /> Buat Template</Button></Link>
        </>
      }
      breadcrumbs={[{ label: "Persuratan" }]}
    >
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-[8px] ${s.color} flex items-center justify-center text-white`}><s.icon size={14} /></div>
                  <TrendingUp size={14} className="text-[#9ca3af] group-hover:text-[#0075de]" />
                </div>
                <div className="text-lg font-bold tracking-tight">{s.value}</div>
                <div className="text-xs font-semibold text-[#111]">{s.label}</div>
                <div className="text-[11px] text-[#6b7280]">{s.desc}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[13px]"><Layers size={14} className="text-[#0075de]" /> Alur Persuratan (4 Langkah)</CardTitle>
          <div className="text-xs text-[#6b7280]">Component → Template → Administrasi → Hasil Surat — semua via Tiptap Office Doc + Repeater/Condition + Global Tabel</div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
            <div className="rounded-[8px] border border-[#e6e6e6] p-3 bg-[#fafafa]">
              <div className="w-7 h-7 rounded-[8px] bg-[#0075de] flex items-center justify-center text-white mb-2"><Boxes size={14} /></div>
              <div className="text-[13px] font-bold">1. Component</div>
              <div className="text-xs text-[#6b7280] mt-1 leading-relaxed">Blok branding (Kop Surat, Tanda Tangan) + Tiptap table resizable. Support looping.</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[11px]">Kop Surat</Badge><Badge variant="secondary" className="text-[11px]">Loop</Badge><Badge variant="secondary" className="text-[11px]">Tanda Tangan</Badge>
              </div>
            </div>
            <div className="rounded-[8px] border border-[#e6e6e6] p-3 bg-[#fafafa]">
              <div className="w-7 h-7 rounded-[8px] bg-violet-600 flex items-center justify-center text-white mb-2"><FileStack size={14} /></div>
              <div className="text-[13px] font-bold">2. Template Builder</div>
              <div className="text-xs text-[#6b7280] mt-1 leading-relaxed">Tiptap Office Doc, Repeater, Condition, Paper A4, Ruler, Zoom. Komponen dari persuratan.</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[11px]">Tiptap</Badge><Badge variant="secondary" className="text-[11px]">Repeater</Badge><Badge variant="secondary" className="text-[11px]">Condition</Badge>
              </div>
            </div>
            <div className="rounded-[8px] border border-[#e6e6e6] p-3 bg-[#fafafa]">
              <div className="w-7 h-7 rounded-[8px] bg-amber-500 flex items-center justify-center text-white mb-2"><ClipboardList size={14} /></div>
              <div className="text-[13px] font-bold">3. Administrasi</div>
              <div className="text-xs text-[#6b7280] mt-1 leading-relaxed">Fields + Steps (template per tahap). Pilih template persuratan untuk setiap step.</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[11px]">Fields</Badge><Badge variant="secondary" className="text-[11px]">Steps</Badge><Badge variant="secondary" className="text-[11px]">Global Tabel</Badge>
              </div>
            </div>
            <div className="rounded-[8px] border border-[#e6e6e6] p-3 bg-[#fafafa]">
              <div className="w-7 h-7 rounded-[8px] bg-emerald-500 flex items-center justify-center text-white mb-2"><Files size={14} /></div>
              <div className="text-[13px] font-bold">4. Hasil Surat</div>
              <div className="text-xs text-[#6b7280] mt-1 leading-relaxed">Isi data → render Repeater/Condition → HTML/PDF siap cetak.</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="success" className="text-[11px]">for item in table</Badge><Badge variant="warning" className="text-[11px]">IF status == active</Badge>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-[8px] bg-[#111] text-white p-3 font-mono text-xs leading-relaxed overflow-x-auto">
            <div className="text-[#9ca3af] mb-2">// Persuratan Template — contentHtml (Tiptap) + componentsJson (CompUsage[])</div>
            <div><span className="text-[#62aef0]">{`{`}</span> <span className="text-[#fbbf24]">"contentHtml"</span>: <span className="text-[#86efac]">"&lt;p&gt;...&lt;div data-component=1&gt;...&lt;/div&gt;&lt;div data-repeater source=employees&gt;...&lt;/div&gt;"</span>,</div>
            <div><span className="text-[#fbbf24]">"componentsJson"</span>: [</div>
            <div className="pl-4">{`{ "componentId": 1, "dataMapping": { "nama": { "source": "tabel", "value": "pegawai.nama" } }, "loopConfig": { "table": "pegawai", "selectedRowIds": [1,2] }, "conditionConfig": { "field": "status", "operator": "equals", "value": "active" } }`}</div>
            <div>{`]`} <span className="text-[#62aef0]">{`}`}</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[13px] flex items-center gap-2"><FileStack size={14} className="text-violet-600" /> Templates Persuratan Terbaru</CardTitle>
            <Link href="/templates-persuratan" className="text-xs text-[#0075de] font-medium hover:underline">Lihat semua →</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTemplates.length === 0 ? <div className="text-xs text-[#6b7280] py-4 text-center">Belum ada template persuratan</div> : recentTemplates.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-[8px] border border-[#e6e6e6] hover:bg-[#f6f5f4] transition-colors">
                <div className="w-7 h-7 rounded-[8px] bg-violet-50 flex items-center justify-center text-violet-600"><FileStack size={14} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{t.name}</div>
                  <div className="text-xs text-[#6b7280] truncate">{t.description || "-"} • {(() => { try { return JSON.parse(t.componentsJson || "[]").length } catch { return 0 } })()} comp</div>
                </div>
                <Badge variant="secondary">Tmpl #{t.id}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[13px] flex items-center gap-2"><Files size={14} className="text-emerald-600" /> Hasil Persuratan Terbaru</CardTitle>
            <Link href="/hasil-persuratan" className="text-xs text-[#0075de] font-medium hover:underline">Lihat semua →</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentHasil.length === 0 ? <div className="text-xs text-[#6b7280] py-4 text-center">Belum ada hasil persuratan</div> : recentHasil.map((d) => (
              <div key={d.id} className="flex items-center gap-2.5 p-2.5 rounded-[8px] border border-[#e6e6e6] hover:bg-[#f6f5f4]">
                <div className="w-7 h-7 rounded-[8px] bg-emerald-50 flex items-center justify-center text-emerald-600"><Files size={14} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{d.name}</div>
                  <div className="text-xs text-[#6b7280]">ID:{d.id} • {Object.keys(JSON.parse(d.valuesJson || "{}")).slice(0, 2).join(", ") || "-"}</div>
                </div>
                <Badge variant="secondary">#{d.id}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-3 items-start">
            <div className="w-8 h-8 rounded-[8px] bg-[#111] flex items-center justify-center text-white shrink-0"><Sparkles size={14} /></div>
            <div className="flex-1">
              <div className="text-[13px] font-bold">Coba langsung — Template Persuratan Tiptap!</div>
              <div className="text-xs text-[#6b7280] mt-1 leading-relaxed max-w-2xl">Buat Component (Kop Surat) di Tiptap, lalu buka Template Builder — pilih Component + tambah Repeater untuk loop pegawai + Condition untuk filter status. Semua via Office Doc + Global Tabel + Hasil Surat.</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/components-persuratan/new"><Button size="sm"><Boxes size={14} /> Buat Component</Button></Link>
                <Link href="/templates-persuratan/new"><Button size="sm" variant="outline"><FileStack size={14} /> Buat Template</Button></Link>
                <Link href="/hasil-persuratan"><Button size="sm" variant="ghost"><Files size={14} /> Lihat Hasil</Button></Link>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-[11px] tracking-widest font-semibold text-[#9ca3af] uppercase">Stack</div>
              <div className="text-xs font-mono mt-1">Next.js 15 • Tiptap<br/>Prisma SQLite • Tailwind v4<br/>Repeater • Condition</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
