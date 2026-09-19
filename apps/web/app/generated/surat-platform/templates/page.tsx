"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Plus, FileText, Eye, Pencil, Trash2, Sparkles, Copy, X } from "lucide-react"
import Link from "next/link"

const categories = ["surat_keputusan","surat_tugas","surat_undangan","surat_keterangan","perjalanan_dinas","berita_acara","nota_dinas","sertifikat","formulir","laporan"]

export default function TemplatesPage() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  const load = async (p = page, s = search) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: "10", sortBy: "id", sortOrder: "desc" })
    if (s) params.set("search", s)
    const res = await fetch(`/api/generated/surat-platform/templates?${params}`)
    const json = await res.json()
    setData(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }

  useEffect(() => { load(1, "") }, [])
  
  const handlePage = (p: number) => { setPage(p); load(p, search) }
  const handleSearch = (s: string) => { setSearch(s); setPage(1); load(1, s) }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus template?")) return
    await fetch(`/api/generated/surat-platform/templates/${id}`, { method: "DELETE" })
    load(page, search)
  }

  const copySchema = (row: any) => {
    navigator.clipboard.writeText(row.schema_json)
    alert("Schema JSON disalin!")
  }

  return (
    <PageShell
      title="Templates"
      description="Kelola Document Template — setiap template menyimpan JSON Tree (Layout → Component) yang generik, bukan file per surat."
      breadcrumbs={[{ label: "Surat Platform", href: "/" }, { label: "Templates" }]}
      actions={<Link href="/generated/surat-platform/templates/new"><Button><Plus size={16} /> Tambah Template</Button></Link>}
    >
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="bg-[#0075de] text-white border-none"><CardContent className="p-4"><div className="text-xs opacity-80">Total Template</div><div className="text-2xl font-bold">{total}</div><div className="text-[11px] opacity-70">Draft + Published</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-[#6b7280]">Konsep</div><div className="text-sm font-bold">Template → Layout → Component</div><div className="text-[11px] text-[#6b7280]">JSON Tree, reusable, tanpa generate file per surat</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-[#6b7280]">Engine</div><div className="text-sm font-bold flex items-center gap-1.5"><Sparkles size={14} className="text-[#0075de]" /> Repeater + Condition</div><div className="text-[11px] text-[#6b7280]">Loop & IF di dalam tree</div></CardContent></Card>
      </div>

      <DataTable
        data={data}
        total={total}
        page={page}
        limit={10}
        totalPages={Math.ceil(total / 10)}
        onPageChange={handlePage}
        onSearch={handleSearch}
        searchPlaceholder="Cari nama / kode..."
        loading={loading}
        columns={[
          { key: "name", header: "Nama", render: (r) => <div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-[#0075de]/10 flex items-center justify-center text-[#0075de]"><FileText size={12} /></div><div><div className="font-medium text-xs">{r.name}</div><div className="text-[11px] text-[#6b7280]">{r.code}</div></div></div> },
          { key: "category", header: "Kategori", render: (r) => <Badge variant="secondary" className="text-[11px]">{r.category}</Badge> },
          { key: "version", header: "Versi", render: (r) => <span className="text-xs">v{r.version}</span> },
          { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "published" ? "success" : r.status === "archived" ? "destructive" : "secondary"}>{r.status}</Badge> },
          { key: "actions", header: "Aksi", render: (r) => (
            <div className="flex items-center gap-1">
              <button onClick={() => setDetail(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]" title="Detail"><Eye size={14} /></button>
              <button onClick={() => copySchema(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]" title="Copy schema"><Copy size={14} /></button>
              <Link href={`/generated/surat-platform/templates/${r.id}/edit`} className="p-1.5 rounded hover:bg-[#f6f5f4] inline-flex" title="Edit"><Pencil size={14} /></Link>
              <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Hapus"><Trash2 size={14} /></button>
            </div>
          ) },
        ]}
      />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetail(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><div className="font-semibold text-sm">Detail: {detail.name}</div><button onClick={() => setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16} /></button></div>
            <div className="p-6">
              <div className="detail-view">
                <div className="detail-field"><span className="detail-label">Kode / Kategori</span><span className="detail-value">{detail.code} • {detail.category} • v{detail.version} • {detail.status}</span></div>
                <div className="detail-field"><span className="detail-label">Deskripsi</span><span className="detail-value">{detail.description || "-"}</span></div>
                <div className="detail-field"><span className="detail-label">Schema JSON Tree</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded-[8px] overflow-auto text-xs font-mono max-h-[300px]">{detail.schema_json}</pre></div>
              </div>
              <div className="mt-4 flex justify-end"><Button variant="outline" onClick={() => setDetail(null)}>Tutup</Button></div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
