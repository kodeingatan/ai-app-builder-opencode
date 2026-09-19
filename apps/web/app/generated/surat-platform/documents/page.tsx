"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Plus, Files, Eye, Pencil, Trash2, X } from "lucide-react"
import Link from "next/link"

export default function DocumentsPage() {
  const [data, setData] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

  const load = async (p = page, s = search) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: "10", sortBy: "id", sortOrder: "desc" })
    if (s) params.set("search", s)
    const res = await fetch(`/api/generated/surat-platform/documents?${params}`)
    const json = await res.json()
    setData(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }
  const loadTemplates = async () => {
    const res = await fetch(`/api/generated/surat-platform/templates?limit=100`)
    const json = await res.json()
    setTemplates(json.data ?? [])
  }
  useEffect(() => { load(1, ""); loadTemplates() }, [])

  const handlePage = (p: number) => { setPage(p); load(p, search) }
  const handleSearch = (s: string) => { setSearch(s); setPage(1); load(1, s) }

  const handleDelete = async (id: number) => { if (!confirm("Hapus dokumen?")) return; await fetch(`/api/generated/surat-platform/documents/${id}`, { method: "DELETE" }); load(page, search) }

  const preview = async (row: any) => {
    setDetail(row)
    setPreviewHtml("Memuat...")
    try {
      const data = JSON.parse(row.data_json)
      const res = await fetch("/api/generated/surat-platform/render", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: row.template_id, data }) })
      const json = await res.json()
      if (json.html) setPreviewHtml(json.html)
      else setPreviewHtml(json.message || "Gagal render")
    } catch (e: any) { setPreviewHtml("Error: " + e.message) }
  }

  return (
    <PageShell
      title="Documents"
      description="Instance surat — gabungkan Template + Data JSON → Render Engine menghasilkan HTML/PDF. Data JSON mendukung nested loop & condition."
      breadcrumbs={[{ label: "Surat Platform", href: "/" }, { label: "Documents" }]}
      actions={<Link href="/generated/surat-platform/documents/new"><Button><Plus size={16} /> Buat Dokumen</Button></Link>}
    >
      <DataTable
        data={data}
        total={total}
        page={page}
        limit={10}
        totalPages={Math.ceil(total / 10)}
        onPageChange={handlePage}
        onSearch={handleSearch}
        searchPlaceholder="Cari nomor / judul..."
        loading={loading}
        columns={[
          { key: "document_number", header: "Nomor", render: (r) => <span className="font-mono text-xs bg-[#f6f5f4] px-2 py-1 rounded border">{r.document_number}</span> },
          { key: "title", header: "Judul", render: (r) => <div><div className="font-medium text-xs">{r.title}</div><div className="text-[11px] text-[#6b7280]">{r.recipient_name || "-"}</div></div> },
          { key: "template_id", header: "Template", render: (r) => { const tpl = templates.find(t => t.id === r.template_id); return <span className="text-xs">{tpl ? tpl.code : "-"}</span> } },
          { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "published" ? "success" : r.status === "rendered" ? "warning" : "secondary"}>{r.status}</Badge> },
          { key: "issued_at", header: "Tanggal", render: (r) => <span className="text-xs text-[#6b7280]">{r.issued_at ? new Date(r.issued_at).toLocaleDateString("id-ID") : "-"}</span> },
          { key: "actions", header: "Aksi", render: (r) => (
            <div className="flex items-center gap-1">
              <button onClick={() => preview(r)} className="p-1.5 rounded bg-[#0075de] text-white hover:bg-[#0066c2]" title="Preview Render"><Eye size={14} /></button>
              <button onClick={() => { setDetail(r); preview(r) }} className="p-1.5 rounded hover:bg-[#f6f5f4]"><Files size={14} /></button>
              <Link href={`/generated/surat-platform/documents/${r.id}/edit`} className="p-1.5 rounded hover:bg-[#f6f5f4] inline-flex"><Pencil size={14} /></Link>
              <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
            </div>
          ) },
        ]}
      />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="border-b p-4 flex items-center justify-between shrink-0"><div className="font-semibold text-sm">Preview: {detail.title} — {detail.document_number}</div><button onClick={() => setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16} /></button></div>
            <div className="flex-1 overflow-auto grid md:grid-cols-2">
              <div className="p-6 border-r bg-[#fafafa] overflow-auto">
                <div className="text-xs font-semibold tracking-widest uppercase text-[#6b7280] mb-2">Data JSON</div>
                <pre className="bg-white border rounded-[8px] p-3 text-xs font-mono overflow-auto max-h-[400px]">{detail.data_json}</pre>
                <div className="mt-4 text-xs">
                  <div className="detail-field"><span className="detail-label">Template</span><span className="detail-value">{templates.find(t => t.id === detail.template_id)?.name || "-"} </span></div>
                  <div className="detail-field"><span className="detail-label">Status</span><span className="detail-value">{detail.status}</span></div>
                </div>
              </div>
              <div className="p-6 bg-white overflow-auto">
                <div className="text-xs font-semibold tracking-widest uppercase text-[#6b7280] mb-2 flex items-center gap-1.5"><Eye size={12} /> Rendered HTML</div>
                {previewHtml ? <div className="border rounded-[8px] p-4 bg-white shadow-sm" dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <div className="text-xs text-[#6b7280]">Memuat...</div>}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { if (previewHtml) { const w = window.open("", "_blank"); w?.document.write(previewHtml); w?.document.close(); w?.print() } }}>Cetak / PDF</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>Tutup</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
