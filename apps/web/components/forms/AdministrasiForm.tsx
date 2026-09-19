"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Type, FileStack } from "lucide-react"

type FieldDef = { name: string, type: "text"|"richtext" }

export default function AdministrasiForm({ mode, id }: { mode:"create"|"edit"; id?: string }){
  const router = useRouter()
  const [form, setForm] = useState({ name:"", description:"", fields: [{name:"judul", type:"text"}] as FieldDef[] })
  const [templates, setTemplates] = useState<any[]>([])
  const [steps, setSteps] = useState<{templateId:number, templateName?:string}[]>([])
  const [loading, setLoading]=useState(false)

  const loadTemplates=async()=>{
    const res=await fetch(`/api/persuratan/templates?limit=100`)
    const j=await res.json()
    setTemplates(j.data??[])
  }
  useEffect(()=>{ loadTemplates() },[])
  useEffect(()=>{
    if(mode==="edit" && id){
      setLoading(true)
      fetch(`/api/persuratan/administrations/${id}`).then(r=>r.json()).then(full=>{
        let fields:FieldDef[]=[]
        try{ fields=JSON.parse(full.fieldsJson||"[]") }catch{ fields=[]}
        setForm({ name: full.name, description: full.description||"", fields: fields.length?fields:[{name:"judul", type:"text"}] })
        setSteps((full.steps||[]).map((s:any)=>({templateId:s.templateId, templateName:s.templateName})))
        setLoading(false)
      }).catch(()=>setLoading(false))
    }
  },[mode,id])

  const addField=()=> setForm({...form, fields:[...form.fields, {name:`field_${form.fields.length+1}`, type:"text"} as FieldDef]})
  const updateField=(idx:number, patch:Partial<FieldDef>)=>{
    const next=[...form.fields]; next[idx]={...next[idx], ...patch}; setForm({...form, fields:next})
  }
  const removeField=(idx:number)=> setForm({...form, fields: form.fields.filter((_,i)=>i!==idx)})

  const handleSubmit=async()=>{
    if(!form.name) return alert("Nama wajib")
    const payload={
      name: form.name,
      description: form.description,
      fieldsJson: JSON.stringify(form.fields),
      steps: steps.map(s=>({templateId:s.templateId}))
    }
    const url=mode==="edit"?`/api/persuratan/administrations/${id}`:`/api/persuratan/administrations`
    const method=mode==="edit"?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ router.push("/administrasi-persuratan"); router.refresh() } else alert((await res.json()).message)
  }

  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat data...</div>

  return (
    <div className="space-y-6 bg-white rounded-[12px] border border-[#e6e6e6] p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>Nama Administrasi *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Surat Perjalanan Dinas" /></div>
        <div><Label>Deskripsi</Label><Input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Deskripsi" /></div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between"><span className="flex items-center gap-2"><Type size={14}/> Data Surat</span><Button size="sm" variant="outline" onClick={addField}><Plus size={12}/> Tambah Field</Button></CardTitle><div className="text-xs text-[#6b7280]">Tambahkan field sesuai kebutuhan — nama akan otomatis diberi awalan langkah</div></CardHeader>
        <CardContent className="space-y-3">
          {form.fields.map((f,idx)=>(
            <div key={idx} className="flex gap-2 items-end border border-[#e6e6e6] rounded-[8px] p-3 bg-[#fafafa]">
              <div className="flex-1"><Label className="text-[11px]">Nama Data</Label><Input value={f.name} onChange={e=>updateField(idx,{name:e.target.value})} placeholder="judul" className="h-8 text-xs font-mono" /><div className="text-[11px] text-[#6b7280] mt-1">Akan jadi <code className="bg-white px-1 rounded border">step1_{f.name||"nama"}</code></div></div>
              <div className="w-[160px]"><Label className="text-[11px]">Jenis Data</Label><Select value={f.type} onChange={e=>updateField(idx,{type:e.target.value as any})}><option value="text">text</option><option value="richtext">richtext</option></Select><div className="text-[11px] text-[#6b7280] mt-1">{f.type==="text"?"Teks biasa":"Teks kaya (richtext)"}</div></div>
              <button onClick={()=>removeField(idx)} className="p-2 hover:bg-white rounded border border-[#e6e6e6]"><Trash2 size={14}/></button>
            </div>
          ))}
          {form.fields.length===0 && <div className="text-xs text-[#6b7280] p-4 text-center border-2 border-dashed rounded-[8px]">Belum ada field — klik Tambah Field</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileStack size={14}/> Steps — Template Administrasi</CardTitle><div className="text-xs text-[#6b7280]">Pilih template untuk setiap step, dapat tambah step baru terus</div></CardHeader>
        <CardContent className="space-y-3">
          {steps.map((s,idx)=>(
            <div key={idx} className="flex gap-2 items-center border rounded-[8px] p-3 bg-white">
              <span className="w-7 h-7 rounded-full bg-[#0075de] text-white flex items-center justify-center text-xs font-bold">{idx+1}</span>
              <div className="flex-1">
                <Select value={String(s.templateId)} onChange={e=>{
                  const next=[...steps]; next[idx].templateId=Number(e.target.value); const t=templates.find(x=>x.id===Number(e.target.value)); next[idx].templateName=t?.name; setSteps(next)
                }}>
                  <option value="">-- pilih template --</option>
                  {templates.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <button onClick={()=> setSteps(steps.filter((_,i)=>i!==idx))} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14}/></button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={()=>{
            if(templates.length===0) return alert("Belum ada template — buat di Templates Persuratan dulu")
            setSteps([...steps, {templateId: templates[0].id, templateName: templates[0].name}])
          }}><Plus size={12}/> Tambah Step</Button>
          <div className="text-[11px] text-[#6b7280]">Setiap step akan meminta data sesuai template yang dipilih. Steps disimpan di <code className="bg-[#f6f5f4] px-1 rounded border">persuratan_steps</code></div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={()=>router.push("/administrasi-persuratan")}>Batal</Button>
        <Button onClick={handleSubmit}>{mode==="edit"?"Update":"Simpan"}</Button>
      </div>
    </div>
  )
}
