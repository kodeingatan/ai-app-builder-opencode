"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
const icons = ["Type","Heading1","Pilcrow","Image","Table","PenTool","Minus","QrCode","Calendar","Repeat","GitBranch","Building2"]
export default function GeneratedComponentForm({ mode, id }: { mode:"create"|"edit"; id?: string }){
  const router=useRouter()
  const [form,setForm]=useState({ type:"text", name:"", category:"basic", icon:"Type", default_props_json:"", schema_json:"", is_system:0 })
  const [loading,setLoading]=useState(false)
  useEffect(()=>{
    if(mode==="create"){
      setForm({ type:"text", name:"", category:"basic", icon:"Type", default_props_json:JSON.stringify({ content:"Text", fontSize:11 },null,2), schema_json:"", is_system:0})
    }
  },[mode])
  useEffect(()=>{
    if(mode==="edit" && id){
      setLoading(true)
      fetch(`/api/generated/surat-platform/components/${id}`).then(r=>r.json()).then(row=>{
        setForm({ type:row.type, name:row.name, category:row.category, icon:row.icon||"Type", default_props_json:row.default_props_json||"", schema_json:row.schema_json||"", is_system:row.is_system})
        setLoading(false)
      }).catch(()=>setLoading(false))
    }
  },[mode,id])
  const handleSubmit=async()=>{
    const payload={...form, is_system: Number(form.is_system)}
    const url=mode==="edit"?`/api/generated/surat-platform/components/${id}`:`/api/generated/surat-platform/components`
    const method=mode==="edit"?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)})
    if(res.ok){ router.push("/generated/surat-platform/components"); router.refresh() } else alert((await res.json()).message)
  }
  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat...</div>
  return (
    <div className="space-y-2.5 bg-white rounded-[8px] border border-[#e6e6e6] p-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div><Label>Tipe</Label><Input value={form.type} onChange={e=>setForm({...form,type:e.target.value})} placeholder="text" /></div>
        <div><Label>Nama</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Text" /></div>
        <div><Label>Kategori</Label><Select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="basic">basic</option><option value="layout">layout</option><option value="data">data</option><option value="dynamic">dynamic</option><option value="branding">branding</option></Select></div>
        <div><Label>Icon</Label><Select value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})}>{icons.map(i=><option key={i} value={i}>{i}</option>)}</Select></div>
        <div className="col-span-2"><Label>Default Props JSON</Label><Textarea className="font-mono text-xs min-h-[80px]" value={form.default_props_json} onChange={e=>setForm({...form,default_props_json:e.target.value})} /></div>
        <div className="col-span-2"><Label>Schema JSON</Label><Textarea className="font-mono text-xs min-h-[80px]" value={form.schema_json} onChange={e=>setForm({...form,schema_json:e.target.value})} placeholder='{"type":"text","props":{"content":""}}' /></div>
      </div>
      <div className="flex justify-end gap-1.5 border-t pt-2.5"><Button variant="outline" onClick={()=>router.push("/generated/surat-platform/components")}>Batal</Button><Button onClick={handleSubmit}>Simpan</Button></div>
    </div>
  )
}
