"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

export default function GeneratedEmployeeForm({ mode, id }: { mode:"create"|"edit"; id?: string }){
  const router=useRouter()
  const [form,setForm]=useState({ name:"", nip:"", position:"", department:"", status:"active", email:"", phone:""})
  const [loading,setLoading]=useState(false)
  useEffect(()=>{
    if(mode==="edit" && id){
      setLoading(true)
      fetch(`/api/generated/surat-platform/employees/${id}`).then(r=>r.json()).then(row=>{
        setForm({ name:row.name, nip:row.nip, position:row.position, department:row.department||"", status:row.status, email:row.email||"", phone:row.phone||""})
        setLoading(false)
      }).catch(()=>setLoading(false))
    }
  },[mode,id])
  const handleSubmit=async()=>{
    const url=mode==="edit"?`/api/generated/surat-platform/employees/${id}`:`/api/generated/surat-platform/employees`
    const method=mode==="edit"?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(form)})
    if(res.ok){ router.push("/generated/surat-platform/employees"); router.refresh() } else alert((await res.json()).message)
  }
  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat...</div>
  return (
    <div className="space-y-4 bg-white rounded-[12px] border border-[#e6e6e6] p-6">
      <div><Label>Nama</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Afdal" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>NIP</Label><Input value={form.nip} onChange={e=>setForm({...form,nip:e.target.value})} placeholder="199001012015031001" /></div>
        <div><Label>Status</Label><Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">active</option><option value="inactive">inactive</option><option value="leave">leave</option></Select></div>
      </div>
      <div><Label>Jabatan</Label><Input value={form.position} onChange={e=>setForm({...form,position:e.target.value})} placeholder="Programmer" /></div>
      <div><Label>Departemen</Label><Input value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="Bidang TI" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Email</Label><Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="afdal@kantor.go.id" /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0812..." /></div>
      </div>
      <div className="flex justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={()=>router.push("/generated/surat-platform/employees")}>Batal</Button><Button onClick={handleSubmit}>Simpan</Button></div>
    </div>
  )
}
