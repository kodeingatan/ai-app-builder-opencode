"use client"
import PageShell from "@/components/layout/PageShell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Eye, Printer, Copy, Sparkles, FileText, Files } from "lucide-react"

export default function PreviewPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedDoc, setSelectedDoc] = useState<string>("")
  const [dataJson, setDataJson] = useState<string>("")
  const [html, setHtml] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [schemaPreview, setSchemaPreview] = useState<string>("")

  useEffect(() => {
    fetch("/api/generated/surat-platform/templates?limit=100").then(r=>r.json()).then(j=>{ setTemplates(j.data??[]); if(j.data?.[0]) { setSelectedTemplate(String(j.data[0].id)); setSchemaPreview(j.data[0].schema_json); }})
    fetch("/api/generated/surat-platform/documents?limit=100").then(r=>r.json()).then(j=>{ setDocuments(j.data??[]); if(j.data?.[0]) { setSelectedDoc(String(j.data[0].id)); setDataJson(j.data[0].data_json); }})
  }, [])

  const loadDocData = (id: string) => {
    setSelectedDoc(id)
    const doc = documents.find(d => String(d.id)===id)
    if (doc) setDataJson(doc.data_json)
  }
  const loadTemplate = (id: string) => {
    setSelectedTemplate(id)
    const tpl = templates.find(t => String(t.id)===id)
    if (tpl) setSchemaPreview(tpl.schema_json)
  }

  const handleRender = async () => {
    setLoading(true)
    try {
      const data = JSON.parse(dataJson || "{}")
      const res = await fetch("/api/generated/surat-platform/render", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ templateId: selectedTemplate ? Number(selectedTemplate) : undefined, schema: selectedTemplate ? undefined : JSON.parse(schemaPreview || "{}"), data }) })
      const json = await res.json()
      if (json.html) setHtml(json.html)
      else setHtml(`<div style="color:red; padding:16px;">${json.message}</div>`)
    } catch (e:any) { setHtml(`<div style="color:red; padding:16px;">Error: ${e.message}</div>`) }
    setLoading(false)
  }

  useEffect(()=>{ if(selectedTemplate && dataJson) handleRender() }, [selectedTemplate, dataJson])

  return (
    <PageShell
      title="Preview & Render"
      description="Engine preview — pilih Template + Data JSON → Render Engine eksekusi Loop/Condition/Nested → hasil HTML yang siap cetak/PDF. Mirip arsitektur di diagram: Template Engine → Data Source → Rules → Render."
      breadcrumbs={[{ label:"Surat Platform", href:"/"},{ label:"Preview"}]}
      actions={<div className="flex items-center gap-2"><Button variant="outline" onClick={handleRender} disabled={loading}><Eye size={16}/> {loading?"Rendering...":"Render"}</Button><Button onClick={()=>{ const w=window.open("","_blank"); if(w){ w.document.write(`<html><head><title>Print</title><style>body{font-family:Inter, sans-serif;}</style></head><body>${html}</body></html>`); w.document.close(); w.print()}}}><Printer size={16}/> Cetak / PDF</Button></div>}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText size={14} className="text-[#0075de]" /> Pilih Template & Data</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Template</Label>
                <Select value={selectedTemplate} onChange={e=>loadTemplate(e.target.value)}>
                  <option value="">-- Custom Schema (tanpa template) --</option>
                  {templates.map(t=> <option key={t.id} value={t.id}>{t.code} — {t.name} ({t.category})</option>)}
                </Select>
                {selectedTemplate && <div className="text-[11px] text-[#6b7280] mt-1">Akan pakai <code className="bg-[#f6f5f4] px-1 rounded border">templates.schema_json</code> + Data JSON di bawah.</div>}
              </div>
              {!selectedTemplate && (
                <div>
                  <Label className="text-xs">Custom Schema JSON</Label>
                  <Textarea className="font-mono text-[11px] min-h-[140px]" value={schemaPreview} onChange={e=>setSchemaPreview(e.target.value)} placeholder='{"type":"document","children":[...]}' />
                </div>
              )}
              {selectedTemplate && (
                <div>
                  <Label className="text-xs">Template Schema (read-only preview)</Label>
                  <pre className="bg-[#f6f5f4] border rounded-[8px] p-3 text-[11px] font-mono overflow-auto max-h-[180px]">{schemaPreview.slice(0,1200)}{schemaPreview.length>1200?"...":""}</pre>
                </div>
              )}

              <div>
                <Label className="text-xs flex items-center justify-between"><span>Data JSON (Binding)</span><Badge variant="secondary" className="text-[11px]">Loop: employees[]</Badge></Label>
                <Textarea className="font-mono text-[11px] min-h-[260px]" value={dataJson} onChange={e=>setDataJson(e.target.value)} placeholder='{"employees":[{"name":"Afdal","nip":"123"}]}' />
                <div className="text-[11px] text-[#6b7280] mt-1 leading-relaxed">
                  Coba edit: tambahkan employee baru, ubah <code className="bg-white px-1 rounded border">status</code> jadi <code className="bg-white px-1 rounded border">inactive</code> untuk lihat Condition filter, atau tambah nested <code className="bg-white px-1 rounded border">trips</code> untuk test Repeater bersarang.
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={()=>{
                  const demo = { letter: { number: "800/001/SK/VI/2026", title: "SURAT KEPUTUSAN", consideration: "perlu dibentuk tim" }, office: { name: "PEMERINTAH PROVINSI ACEH", address: "Jl. T. Nyak Arief No.219" }, signer: { name: "Drs. H. Ahmad Yani, M.Si", position: "Kepala Dinas", nip: "196501011990031001" }, employees: [{ name: "Afdal", nip: "199001012015031001", position: "Programmer", department: "Bidang TI", status: "active", trips: [{ destination: "Banda Aceh", date: "2026-08-20", purpose: "Rapat" }, { destination: "Medan", date: "2026-08-22", purpose: "Workshop" }] }, { name: "Budi", nip: "198512122010011002", position: "Analis", department: "Hukum", status: "active" }], current_date: new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric"}) }
                  setDataJson(JSON.stringify(demo, null, 2))
                }}>Load Demo Nested Loop</Button>
                <Button size="sm" variant="ghost" onClick={()=>{ navigator.clipboard.writeText(dataJson); alert("Data JSON disalin") }}><Copy size={12}/> Copy</Button>
              </div>

              <div>
                <Label className="text-xs">Pilih Dokumen instance (auto-load data)</Label>
                <Select value={selectedDoc} onChange={e=>loadDocData(e.target.value)}>
                  <option value="">-- Pilih dokumen tersimpan --</option>
                  {documents.map(d=> <option key={d.id} value={d.id}>{d.document_number} — {d.title}</option>)}
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="text-xs font-semibold flex items-center gap-2"><Sparkles size={14} className="text-[#0075de]" /> Cara kerja Engine</div>
              <div className="text-[11px] text-[#6b7280] mt-2 leading-relaxed">
                <code className="bg-[#f6f5f4] px-1 rounded border">POST /api/generated/surat-platform/render</code> menerima <code className="bg-[#f6f5f4] px-1 rounded border">{"{ templateId, data }"}</code> → ambil schema JSON → interpolasi <code className="bg-[#f6f5f4] px-1 rounded border">{"{{binding}}"}</code> → iterasi Repeater (support nested <code className="bg-[#f6f5f4] px-1 rounded border">employee.trips</code>) → evaluasi Condition → hasilkan HTML.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-4 self-start">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm flex items-center gap-2"><Eye size={14} /> Hasil Render — HTML Preview</CardTitle>
            <div className="text-[11px] text-[#6b7280]">Output siap cetak. Border & shadow meniru kertas A4.</div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-[#e5e7eb] p-4 md:p-6 min-h-[520px] max-h-[720px] overflow-auto">
              <div className="bg-white shadow-lg rounded-[4px] min-h-[400px] overflow-hidden" dangerouslySetInnerHTML={{ __html: html || `<div style="padding:40px; text-align:center; color:#9ca3af; font-size:13px;">Pilih template & data lalu klik Render untuk melihat hasil Loop + Condition</div>` }} />
            </div>
            <div className="p-4 border-t bg-[#fafafa] flex items-center justify-between">
              <div className="text-[11px] text-[#6b7280]">Tip: gunakan <code className="bg-white px-1 rounded border">{"{{index}}"}</code> di dalam Repeater untuk nomor otomatis.</div>
              <Button size="sm" variant="outline" onClick={()=>navigator.clipboard.writeText(html)}>Copy HTML</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
