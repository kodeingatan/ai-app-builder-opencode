"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, FileStack } from "lucide-react"

export default function HasilPersuratanForm({ mode, id, administrationId: propAdminId }: { mode:"create"|"edit"; id?: string; administrationId?: string }){
  const router = useRouter()
  const searchParams = useSearchParams()
  const adminIdFromUrl = propAdminId || searchParams.get("administrationId") || ""
  const [administrations, setAdministrations] = useState<any[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<string>(adminIdFromUrl)
  const [adminDetail, setAdminDetail] = useState<any>(null)
  const [form, setForm] = useState({ name:"", values:{} as Record<string,string>, stepsData: [] as any[] })
  const [loading, setLoading] = useState(false)

  const loadAdmins=async()=>{
    const res=await fetch(`/api/persuratan/administrations?limit=100`)
    const j=await res.json()
    setAdministrations(j.data??[])
  }
  const loadAdminDetail=async(id:string)=>{
    if(!id) return
    const res=await fetch(`/api/persuratan/administrations/${id}`)
    const j=await res.json()
    setAdminDetail(j)
  }
  useEffect(()=>{ loadAdmins() },[])
  useEffect(()=>{ if(selectedAdmin) loadAdminDetail(selectedAdmin) },[selectedAdmin])
  useEffect(()=>{ if(adminIdFromUrl) setSelectedAdmin(adminIdFromUrl)},[adminIdFromUrl])

  useEffect(()=>{
    if(mode==="create" && adminDetail){
      // init form for create if not editing and form empty
      // only if form.name empty and no values
      if(!id){
        const values:Record<string,string>={}
        let fields:any[]=[]
        try{ fields=JSON.parse(adminDetail?.fieldsJson||"[]") }catch{}
        for(const f of fields) values[`step1_${f.name}`]=""
        setForm({ name:"", values, stepsData: adminDetail?.steps?.map((s:any)=>({templateId:s.templateId, templateName:s.templateName, data:{}}))||[] })
      }
    }
  },[adminDetail, mode, id])

  useEffect(()=>{
    if(mode==="edit" && id && selectedAdmin){
      // fetch row
      const fetchRow = async()=>{
        setLoading(true)
        try{
          const res=await fetch(`/api/persuratan/administrations/${selectedAdmin}/datas/${id}`)
          if(res.ok){
            const row=await res.json()
            let values:Record<string,string>={}
            try{ values=JSON.parse(row.valuesJson||"{}") }catch{}
            let stepsData:any[]=[]
            try{ stepsData=JSON.parse(row.stepsDataJson||"[]") }catch{}
            setForm({ name: row.name, values, stepsData })
          } else {
            // fallback: try list and find
            const res2=await fetch(`/api/persuratan/administrations/${selectedAdmin}/datas?limit=100`)
            const j=await res2.json()
            const found=(j.data||[]).find((x:any)=>String(x.id)===String(id))
            if(found){
              let values:Record<string,string>={}
              try{ values=JSON.parse(found.valuesJson||"{}") }catch{}
              let stepsData:any[]=[]
              try{ stepsData=JSON.parse(found.stepsDataJson||"[]") }catch{}
              setForm({ name: found.name, values, stepsData })
            }
          }
        }catch{}
        setLoading(false)
      }
      fetchRow()
    }
  },[mode, id, selectedAdmin])

  const handleSubmit=async()=>{
    if(!selectedAdmin) return alert("Pilih administrasi dulu")
    if(!form.name) return alert("Nama persuratan wajib")
    const payload={ name: form.name, valuesJson: form.values, stepsDataJson: form.stepsData }
    const url=mode==="edit"? `/api/persuratan/administrations/${selectedAdmin}/datas/${id}` : `/api/persuratan/administrations/${selectedAdmin}/datas`
    const method=mode==="edit"?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ router.push(`/hasil-persuratan?administrationId=${selectedAdmin}`); router.refresh() } else alert((await res.json()).message||"Gagal")
  }

  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat data...</div>

  return (
    <div className="space-y-3">
      {/* Admin selector if not fixed */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-[13px]">Administrasi</CardTitle></CardHeader>
        <CardContent>
          <Label>Pilih Administrasi</Label>
          <Select value={selectedAdmin} onChange={e=>setSelectedAdmin(e.target.value)}>
            <option value="">-- pilih administrasi --</option>
            {administrations.map(a=> <option key={a.id} value={String(a.id)}>{a.name}</option>)}
          </Select>
          {adminDetail && (
            <div className="mt-2 p-2.5 bg-[#f6f5f4] rounded-[8px] text-xs">
              <div className="font-bold">{adminDetail.name}</div>
              <div className="text-[#6b7280]">{adminDetail.description||"-"}</div>
              <div className="mt-1">Fields: {(() => { try{ return JSON.parse(adminDetail.fieldsJson||"[]").map((f:any)=>f.name).join(", ")}catch{return "-"}})()}</div>
              <div>Steps: {adminDetail.steps?.length||0} templates — {adminDetail.steps?.map((s:any)=>s.templateName).join(", ")}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <div><Label>Nama Persuratan *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Surat Tugas Dinas — Afdal" /></div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-[13px]">Data Administrasi — lengkapi sesuai fields</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            let fields:any[]=[]
            try{ fields=JSON.parse(adminDetail?.fieldsJson||"[]")}catch{}
            if(!selectedAdmin) return <div className="text-xs text-[#6b7280]">Pilih administrasi dulu</div>
            if(fields.length===0) return <div className="text-xs text-[#6b7280]">Tidak ada field di administrasi ini</div>
            return fields.map((f:any,idx:number)=>{
              const key=`step1_${f.name}`
              return (
                <div key={idx}>
                  <Label className="text-xs">{f.name} <Badge variant="secondary" className="text-[10px] ml-1">{f.type}</Badge></Label>
                  {f.type==="richtext" ? (
                    <Textarea value={form.values[key]||""} onChange={e=> setForm({...form, values:{...form.values, [key]: e.target.value}})} placeholder={`Isi ${f.name}...`} className="min-h-[60px] text-[13px] mt-1" />
                  ) : (
                    <Input value={form.values[key]||""} onChange={e=> setForm({...form, values:{...form.values, [key]: e.target.value}})} placeholder={`Isi ${f.name}`} className="h-7 text-[13px] mt-1" />
                  )}
                </div>
              )
            })
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-[13px] flex items-center justify-between"><span className="flex items-center gap-2"><FileStack size={14}/> Steps — Pilih Template</span><Button size="sm" variant="outline" onClick={()=>{
          if(!adminDetail?.steps?.length) return alert("Administrasi ini belum punya steps template — edit administrasi dulu")
          const next=[...form.stepsData, {templateId: adminDetail.steps[0].templateId, templateName: adminDetail.steps[0].templateName, data:{}}]
          setForm({...form, stepsData: next})
        }}><Plus size={12}/> Tambah Step</Button></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {form.stepsData.map((s:any, idx:number)=>(
            <div key={idx} className="border border-[#e6e6e6] rounded-[8px] p-2.5 bg-[#fafafa]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[#0075de] text-white flex items-center justify-center text-xs font-bold">{idx+1}</span><span className="font-bold text-xs">{s.templateName}</span></div>
                <button onClick={()=> setForm({...form, stepsData: form.stepsData.filter((_,i)=>i!==idx)})} className="p-1 hover:bg-white rounded"><X size={12}/></button>
              </div>
              <div className="mt-2">
                <Label className="text-xs">Pilih Template</Label>
                <Select value={String(s.templateId)} onChange={e=>{
                  const next=[...form.stepsData]; const t=adminDetail?.steps?.find((x:any)=> String(x.templateId)===e.target.value); next[idx]={...next[idx], templateId: Number(e.target.value), templateName: t?.templateName}; setForm({...form, stepsData: next})
                }}>
                  {(adminDetail?.steps||[]).map((t:any)=><option key={t.templateId} value={t.templateId}>{t.templateName}</option>)}
                </Select>
              </div>
              <div className="mt-2">
                <Label className="text-xs">Isi Data Template</Label>
                <Textarea value={JSON.stringify(s.data||{}, null, 2)} onChange={e=>{
                  try{
                    const parsed=JSON.parse(e.target.value)
                    const next=[...form.stepsData]; next[idx].data=parsed; setForm({...form, stepsData: next})
                  }catch{}
                }} placeholder='{"field1":"value"}' className="font-mono text-xs min-h-[48px] mt-1" />
                <div className="text-[11px] text-[#6b7280] mt-1">Isi sesuai permintaan component di template (akan muncul form generated)</div>
              </div>
            </div>
          ))}
          {form.stepsData.length===0 && <div className="text-xs text-[#6b7280] p-2.5 text-center border-2 border-dashed rounded-[8px]">Belum ada step — klik Tambah Step. Dapat buat step baru terus sesuai kebutuhan.</div>}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-1.5 pt-2.5 border-t">
        <Button variant="outline" onClick={()=>router.push(`/hasil-persuratan${selectedAdmin?`?administrationId=${selectedAdmin}`:""}`)}>Batal</Button>
        <Button onClick={handleSubmit}>{mode==="edit"?"Update":"Simpan"}</Button>
      </div>
    </div>
  )
}
