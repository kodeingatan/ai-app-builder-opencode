"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

const categories = ["surat_keputusan","surat_tugas","surat_undangan","surat_keterangan","perjalanan_dinas","berita_acara","nota_dinas","sertifikat","formulir","laporan"]

export default function GeneratedTemplateForm({ mode, id }: { mode:"create"|"edit"; id?:string }){
  const router=useRouter()
  const [form, setForm]=useState({ name:"", code:"", category:"surat_keputusan", description:"", version:1, status:"draft", schema_json:""})
  const [loading,setLoading]=useState(false)

  useEffect(()=>{
    if(mode==="create"){
      setForm({ name:"", code:"", category:"surat_keputusan", description:"", version:1, status:"draft", schema_json: JSON.stringify({
        type:"document",
        children:[
          { type:"header", children:[{ type:"text", props:{ content:"{{office.name}}", align:"center", fontWeight:"bold"}}]},
          { type:"heading", props:{ content:"{{letter.title}}", align:"center"}},
          { type:"paragraph", props:{ content:"Menimbang bahwa ..." }},
          { type:"repeater", props:{ source:"employees", item:"employee"}, children:[{ type:"text", props:{ content:"{{index}}. {{employee.name}} — {{employee.nip}} — {{employee.position}}" }}]},
          { type:"signature", props:{ name:"{{signer.name}}", position:"{{signer.position}}" }}
        ]
      },null,2) })
    }
  },[mode])

  useEffect(()=>{
    if(mode==="edit" && id){
      setLoading(true)
      fetch(`/api/generated/surat-platform/templates/${id}`).then(r=>r.json()).then(row=>{
        setForm({ name: row.name, code: row.code, category: row.category, description: row.description||"", version: row.version, status: row.status, schema_json: row.schema_json })
        setLoading(false)
      }).catch(()=>setLoading(false))
    }
  },[mode,id])

  const handleSubmit=async()=>{
    const payload={ ...form, version: Number(form.version)}
    const url=mode==="edit"?`/api/generated/surat-platform/templates/${id}`:`/api/generated/surat-platform/templates`
    const method=mode==="edit"?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ router.push("/generated/surat-platform/templates"); router.refresh() } else alert("Error: "+(await res.json()).message)
  }

  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat...</div>

  return (
    <div className="space-y-4 bg-white rounded-[12px] border border-[#e6e6e6] p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Label>Nama Template</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Surat Keputusan Pengangkatan" /></div>
        <div><Label>Kode</Label><Input value={form.code} onChange={e=>setForm({...form, code:e.target.value})} placeholder="SK-001" /></div>
        <div><Label>Kategori</Label><Select value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>{categories.map(c=><option key={c} value={c}>{c}</option>)}</Select></div>
        <div><Label>Versi</Label><Input type="number" value={form.version} onChange={e=>setForm({...form, version: Number(e.target.value)})} /></div>
        <div><Label>Status</Label><Select value={form.status} onChange={e=>setForm({...form, status:e.target.value})}><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></Select></div>
        <div className="col-span-2"><Label>Deskripsi</Label><Textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Deskripsi template..." /></div>
        <div className="col-span-2"><Label>Schema JSON Tree <span className="text-[11px] text-[#6b7280]">— Document → Layout → Component → Repeater/Condition</span></Label><Textarea className="font-mono text-xs min-h-[220px]" value={form.schema_json} onChange={e=>setForm({...form, schema_json:e.target.value})} placeholder='{"type":"document","children":[...]}' /></div>
      </div>
      <div className="rounded-[8px] bg-amber-50 border border-amber-200 p-3 text-xs leading-relaxed">
        <div className="font-semibold text-amber-800">Tips Binding & Engine:</div>
        <div className="text-amber-700 mt-1">Gunakan <code className="bg-white px-1 rounded border">{"{{employee.name}}"}</code> <code className="bg-white px-1 rounded border">{"{{letter.number}}"}</code> <code className="bg-white px-1 rounded border">{"{{current_date}}"}</code> — Repeater <code className="bg-white px-1 rounded border">source: "employees"</code> — Condition <code className="bg-white px-1 rounded border">field: "employee.status" operator: "equals"</code></div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={()=>router.push("/generated/surat-platform/templates")}>Batal</Button>
        <Button onClick={handleSubmit}>Simpan</Button>
      </div>
    </div>
  )
}
