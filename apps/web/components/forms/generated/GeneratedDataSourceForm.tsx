"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

export default function GeneratedDataSourceForm({ mode, id }: { mode:"create"|"edit"; id?: string }){
  const router=useRouter()
  const [form,setForm]=useState({ name:"", type:"entity", entity:"", config_json:"", description:""})
  const [loading,setLoading]=useState(false)
  useEffect(()=>{
    if(mode==="create"){
      setForm({
        name:"Employees by Department (Custom Query)",
        type:"custom_query",
        entity:"surat_platform_employees",
        config_json: JSON.stringify({ query:"SELECT * FROM \"surat_platform_employees\" WHERE department = {{department}}", defaults:{ department:"Bidang TI"}},null,2),
        description:"Custom Query additive — filter departemen tanpa rebuild. Contoh: WHERE department = {{department}}"
      })
    }
  },[mode])
  useEffect(()=>{
    if(mode==="edit" && id){
      setLoading(true)
      fetch(`/api/generated/surat-platform/data-sources/${id}`).then(r=>r.json()).then(row=>{
        setForm({ name:row.name, type:row.type, entity:row.entity||"", config_json:row.config_json||"", description:row.description||""})
        setLoading(false)
      }).catch(()=>setLoading(false))
    }
  },[mode,id])
  const handleSubmit=async()=>{
    const url=mode==="edit"?`/api/generated/surat-platform/data-sources/${id}`:`/api/generated/surat-platform/data-sources`
    const method=mode==="edit"?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(form)})
    if(res.ok){ router.push("/generated/surat-platform/data-sources"); router.refresh() } else alert((await res.json()).message)
  }
  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat...</div>
  return (
    <div className="space-y-4 bg-white rounded-[12px] border border-[#e6e6e6] p-6">
      <div><Label>Nama</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Employee" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Tipe</Label><Select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="entity">entity</option><option value="api">api</option><option value="custom_query">custom_query</option><option value="static">static</option></Select></div>
        <div><Label>Entity</Label><Input value={form.entity} onChange={e=>setForm({...form,entity:e.target.value})} placeholder="employees" /></div>
      </div>
      <div><Label>Config JSON</Label><Textarea className="font-mono text-xs min-h-[140px]" value={form.config_json} onChange={e=>setForm({...form,config_json:e.target.value})} placeholder='{"query":"SELECT * FROM \"surat_platform_employees\" WHERE department = {{department}}"}' />
        {form.type==="custom_query" && <div className="text-[11px] text-[#6b7280] mt-1">Gunakan <code className="bg-[#f6f5f4] px-1 rounded border">{"{{department}}"}</code> sebagai placeholder — akan di-resolve via <code className="bg-[#f6f5f4] px-1 rounded border">/resolve?department=...</code>.</div>}
        {form.type==="entity" && <div className="text-[11px] text-[#6b7280] mt-1">Entity akan di-resolve otomatis dengan filter department/status via <code className="bg-[#f6f5f4] px-1 rounded border">?department=Bidang TI</code></div>}
      </div>
      <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
      <div className="flex justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={()=>router.push("/generated/surat-platform/data-sources")}>Batal</Button><Button onClick={handleSubmit}>Simpan</Button></div>
    </div>
  )
}
