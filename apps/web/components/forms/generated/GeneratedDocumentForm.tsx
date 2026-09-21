"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Sparkles } from "lucide-react"

export default function GeneratedDocumentForm({ mode, id }: { mode:"create"|"edit"; id?: string }){
  const router=useRouter()
  const [templates,setTemplates]=useState<any[]>([])
  const [form,setForm]=useState({ template_id:"", document_number:"", title:"", recipient_name:"", data_json:"", status:"draft", issued_at:"", notes:""})
  const [loading,setLoading]=useState(false)

  const loadTemplates=async()=>{
    const res=await fetch(`/api/generated/surat-platform/templates?limit=100`)
    const j=await res.json()
    setTemplates(j.data??[])
  }
  useEffect(()=>{ loadTemplates() },[])

  useEffect(()=>{
    if(mode==="create" && templates.length>0){
      // init if empty
      if(!form.document_number){
        const total=templates.length
        setForm(prev=> ({...prev, template_id: templates[0]?.id ? String(templates[0].id):"", document_number:`800/${String(1).padStart(3,"0")}/SK/${new Date().getFullYear()}`, data_json: JSON.stringify({ letter:{ number:`800/001/SK/${new Date().getFullYear()}`, title:"SURAT KEPUTUSAN", consideration:"perlu menetapkan..."}, employees:[{name:"Afdal", nip:"199001012015031001", position:"Programmer", department:"Bidang TI", status:"active"}], office:{name:"PEMERINTAH PROVINSI ACEH", address:"Jl. T. Nyak Arief No.219 Banda Aceh"}, signer:{name:"Drs. H. Ahmad Yani, M.Si", position:"Kepala Dinas", nip:"196501011990031001"}, current_date: new Date().toLocaleDateString("id-ID",{day:"2-digit", month:"long", year:"numeric"})},null,2), issued_at: new Date().toISOString().slice(0,16) }))
      }
    }
  },[templates, mode])

  useEffect(()=>{
    if(mode==="edit" && id){
      setLoading(true)
      fetch(`/api/generated/surat-platform/documents/${id}`).then(r=>r.json()).then(row=>{
        setForm({ template_id: row.template_id ? String(row.template_id):"", document_number: row.document_number, title: row.title, recipient_name: row.recipient_name||"", data_json: row.data_json, status: row.status, issued_at: row.issued_at ? row.issued_at.slice(0,16):"", notes: row.notes||"" })
        setLoading(false)
      }).catch(()=>setLoading(false))
    }
  },[mode,id])

  const handleSubmit=async()=>{
    const payload:any={ ...form, template_id: form.template_id ? Number(form.template_id):null, issued_at: form.issued_at ? new Date(form.issued_at).toISOString():null }
    const url=mode==="edit"?`/api/generated/surat-platform/documents/${id}`:`/api/generated/surat-platform/documents`
    const method=mode==="edit"?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ router.push("/generated/surat-platform/documents"); router.refresh() } else alert("Error: "+(await res.json()).message)
  }
  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat...</div>
  return (
    <div className="space-y-2.5 bg-white rounded-[8px] border border-[#e6e6e6] p-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div><Label>Template</Label><Select value={form.template_id} onChange={e=>setForm({...form, template_id:e.target.value})}><option value="">-- Tanpa template --</option>{templates.map(t=><option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}</Select></div>
        <div><Label>Nomor Surat</Label><Input value={form.document_number} onChange={e=>setForm({...form, document_number:e.target.value})} /></div>
        <div className="col-span-2"><Label>Judul</Label><Input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="SK Pengangkatan Tim IT 2026" /></div>
        <div><Label>Penerima</Label><Input value={form.recipient_name} onChange={e=>setForm({...form, recipient_name:e.target.value})} placeholder="Tim TI" /></div>
        <div><Label>Status</Label><Select value={form.status} onChange={e=>setForm({...form, status:e.target.value})}><option value="draft">draft</option><option value="rendered">rendered</option><option value="published">published</option><option value="archived">archived</option></Select></div>
        <div className="col-span-2"><Label>Tanggal Terbit</Label><Input type="datetime-local" value={form.issued_at} onChange={e=>setForm({...form, issued_at:e.target.value})} /></div>
        <div className="col-span-2"><Label>Data JSON <span className="text-[11px] text-[#6b7280]">— binding untuk Repeater/Condition. Contoh: {"{employees:[{name, nip, position}]}"}</span></Label><Textarea className="font-mono text-xs min-h-[140px]" value={form.data_json} onChange={e=>setForm({...form, data_json:e.target.value})} /></div>
        <div className="col-span-2"><Label>Catatan</Label><Textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} /></div>
      </div>
      <div className="rounded-[8px] bg-[#f6f5f4] p-3 text-xs leading-relaxed">
        <div className="font-semibold flex items-center gap-1.5"><Sparkles size={12} className="text-[#0075de]" /> Binding tersedia:</div>
        <div className="mt-1 font-mono text-[11px]">{"{{letter.number}} {{letter.title}} {{employee.name}} {{employee.nip}} {{office.name}} {{current_date}} {{signer.name}}"}</div>
        <div className="mt-1 text-[#6b7280]">Repeater: <code className="bg-white px-1 rounded border">source: "employees"</code> Nested: <code className="bg-white px-1 rounded border">source: "employee.trips"</code> Condition: <code className="bg-white px-1 rounded border">field: "employee.status" operator: "equals" value: "active"</code></div>
      </div>
      <div className="flex justify-end gap-1.5 border-t pt-2.5"><Button variant="outline" onClick={()=>router.push("/generated/surat-platform/documents")}>Batal</Button><Button onClick={handleSubmit}>Simpan</Button></div>
    </div>
  )
}
