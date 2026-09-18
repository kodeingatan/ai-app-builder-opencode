"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Plus, Files, Eye, Pencil, Trash2, X, Sparkles } from "lucide-react"

export default function DocumentsPage() {
  const [data, setData] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ template_id: "", document_number: "", title: "", recipient_name: "", data_json: "", status: "draft", issued_at: "", notes: "" })
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
    const res = await fetch("/api/generated/surat-platform/templates?limit=100")
    const json = await res.json()
    setTemplates(json.data ?? [])
  }
  useEffect(() => { load(1, ""); loadTemplates() }, [])

  const handlePage = (p: number) => { setPage(p); load(p, search) }
  const handleSearch = (s: string) => { setSearch(s); setPage(1); load(1, s) }

  const openCreate = () => {
    setEditing(null)
    setForm({ template_id: templates[0]?.id ? String(templates[0].id) : "", document_number: `800/${String(total+1).padStart(3,"0")}/SK/${new Date().getFullYear()}`, title: "", recipient_name: "", data_json: JSON.stringify({ letter: { number: `800/${String(total+1).padStart(3,"0")}/SK/${new Date().getFullYear()}`, title: "SURAT KEPUTUSAN", consideration: "perlu menetapkan..." }, employees: [{ name: "Afdal", nip: "199001012015031001", position: "Programmer", department: "Bidang TI", status: "active" }, { name: "Budi", nip: "198xxx", position: "Analis", department: "Hukum", status: "active" }], office: { name: "PEMERINTAH PROVINSI ACEH", address: "Jl. T. Nyak Arief No.219 Banda Aceh" }, signer: { name: "Drs. H. Ahmad Yani, M.Si", position: "Kepala Dinas", nip: "196501011990031001" }, current_date: new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric"}) }, null, 2), status: "draft", issued_at: new Date().toISOString().slice(0,16), notes: "" })
    setShowModal(true)
  }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ template_id: row.template_id ? String(row.template_id) : "", document_number: row.document_number, title: row.title, recipient_name: row.recipient_name || "", data_json: row.data_json, status: row.status, issued_at: row.issued_at ? row.issued_at.slice(0,16) : "", notes: row.notes || "" })
    setShowModal(true)
  }
  const handleSubmit = async () => {
    const payload: any = { ...form, template_id: form.template_id ? Number(form.template_id) : null, issued_at: form.issued_at ? new Date(form.issued_at).toISOString() : null }
    const url = editing ? `/api/generated/surat-platform/documents/${editing.id}` : `/api/generated/surat-platform/documents`
    const method = editing ? "PUT" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (res.ok) { setShowModal(false); load(page, search) } else alert("Error: " + (await res.json()).message)
  }
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
      actions={<Button onClick={openCreate}><Plus size={16} /> Buat Dokumen</Button>}
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
              <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]"><Pencil size={14} /></button>
              <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
            </div>
          ) },
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><div className="font-semibold text-sm">{editing ? "Edit Dokumen" : "Buat Dokumen"}</div><button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16} /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Template</Label><Select value={form.template_id} onChange={e => setForm({ ...form, template_id: e.target.value })}><option value="">-- Tanpa template --</option>{templates.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}</Select></div>
                <div><Label>Nomor Surat</Label><Input value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} /></div>
                <div className="col-span-2"><Label>Judul</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="SK Pengangkatan Tim IT 2026" /></div>
                <div><Label>Penerima</Label><Input value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} placeholder="Tim TI" /></div>
                <div><Label>Status</Label><Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">draft</option><option value="rendered">rendered</option><option value="published">published</option><option value="archived">archived</option></Select></div>
                <div className="col-span-2"><Label>Tanggal Terbit</Label><Input type="datetime-local" value={form.issued_at} onChange={e => setForm({ ...form, issued_at: e.target.value })} /></div>
                <div className="col-span-2"><Label>Data JSON <span className="text-[11px] text-[#6b7280]">— binding untuk Repeater/Condition. Contoh: {"{employees:[{name, nip, position}]}"}</span></Label><Textarea className="font-mono text-xs min-h-[180px]" value={form.data_json} onChange={e => setForm({ ...form, data_json: e.target.value })} /></div>
                <div className="col-span-2"><Label>Catatan</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="rounded-[8px] bg-[#f6f5f4] p-3 text-xs leading-relaxed">
                <div className="font-semibold flex items-center gap-1.5"><Sparkles size={12} className="text-[#0075de]" /> Binding tersedia:</div>
                <div className="mt-1 font-mono text-[11px]">{"{{letter.number}} {{letter.title}} {{employee.name}} {{employee.nip}} {{office.name}} {{current_date}} {{signer.name}}"}</div>
                <div className="mt-1 text-[#6b7280]">Repeater: <code className="bg-white px-1 rounded border">source: "employees"</code> Nested: <code className="bg-white px-1 rounded border">source: "employee.trips"</code> Condition: <code className="bg-white px-1 rounded border">field: "employee.status" operator: "equals" value: "active"</code></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button><Button onClick={handleSubmit}>Simpan</Button></div>
            </div>
          </div>
        </div>
      )}

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
