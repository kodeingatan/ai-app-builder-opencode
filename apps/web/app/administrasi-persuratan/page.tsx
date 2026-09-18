"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Plus, Trash2, Pencil, X, Eye, ClipboardList, FileStack, Type, FileText, Sparkles, ArrowRight, Settings } from "lucide-react"
import Link from "next/link"

type FieldDef = { name: string, type: "text"|"richtext" }

export default function AdministrasiPersuratanPage(){
  const [data,setData]=useState<any[]>([])
  const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState("")
  const [loading,setLoading]=useState(false)
  const [showModal,setShowModal]=useState(false)
  const [editing,setEditing]=useState<any>(null)
  const [form,setForm]=useState({ name:"", description:"", fields: [] as FieldDef[] })
  const [templates,setTemplates]=useState<any[]>([])
  const [steps,setSteps]=useState<{templateId:number, templateName?:string}[]>([])
  const [detail,setDetail]=useState<any>(null)

  const load=async(p=page,s=search)=>{
    setLoading(true)
    const res=await fetch(`/api/persuratan/administrations?page=${p}&limit=10&search=${encodeURIComponent(s)}`)
    const j=await res.json()
    setData(j.data??[]); setTotal(j.total??0); setLoading(false)
  }
  const loadTemplates=async()=>{
    const res=await fetch(`/api/persuratan/templates?limit=100`)
    const j=await res.json()
    setTemplates(j.data??[])
  }
  useEffect(()=>{ load(1,""); loadTemplates() },[])

  const openCreate=()=>{
    setEditing(null)
    setForm({ name:"", description:"", fields: [{name:"judul", type:"text"}] })
    setSteps([])
    setShowModal(true)
  }
  const openEdit=async(row:any)=>{
    const res=await fetch(`/api/persuratan/administrations/${row.id}`)
    const full=await res.json()
    setEditing(full)
    let fields:FieldDef[]=[]
    try{ fields=JSON.parse(full.fieldsJson||"[]") }catch{ fields=[]}
    setForm({ name: full.name, description: full.description||"", fields })
    setSteps((full.steps||[]).map((s:any)=>({templateId:s.templateId, templateName:s.templateName})))
    setShowModal(true)
  }
  const addField=()=> setForm({...form, fields:[...form.fields, {name:`field_${form.fields.length+1}`, type:"text"}]})
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
    const url=editing?`/api/persuratan/administrations/${editing.id}`:`/api/persuratan/administrations`
    const method=editing?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ setShowModal(false); load(page,search)} else alert((await res.json()).message)
  }
  const handleDelete=async(id:number)=>{ if(!confirm("Hapus administrasi?")) return; await fetch(`/api/persuratan/administrations/${id}`,{method:"DELETE"}); load(page,search)}

  return (
    <PageShell title="Administrasi Persuratan" description="Kelola data administrasi — buat, lihat, dan hapus. Form dapat ditambah terus sesuai kebutuhan." breadcrumbs={[{label:"Persuratan"},{label:"Administrasi"}]} actions={<Button onClick={openCreate}><Plus size={16}/> Buat Administrasi</Button>}>
      <DataTable data={data} total={total} page={page} limit={10} totalPages={Math.ceil(total/10)} onPageChange={(p)=>{setPage(p); load(p,search)}} onSearch={(s)=>{setSearch(s); setPage(1); load(1,s)}} searchPlaceholder="Cari administrasi..." loading={loading}
        columns={[
          {key:"name", header:"Nama", render:(r)=><div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-700"><ClipboardList size={14}/></div><div><div className="font-bold text-xs">{r.name}</div><div className="text-[11px] text-[#6b7280]">{r.description||"-"}</div></div></div>},
          {key:"fields", header:"Fields", render:(r)=>{ try{ const f=JSON.parse(r.fieldsJson||"[]"); return <Badge variant="secondary">{f.length} fields</Badge>}catch{return "-"}}},
          {key:"steps", header:"Steps", render:(r)=><Badge variant="outline">{r._steps?.length||0} templates</Badge>},
          {key:"datas", header:"Hasil", render:(r)=><Link href={`/hasil-persuratan?administrationId=${r.id}`} className="text-xs text-[#0075de] hover:underline flex items-center gap-1">{r._dataCount} data <ArrowRight size={10}/></Link>},
          {key:"actions", header:"Aksi", render:(r)=><div className="flex gap-1"><button onClick={()=>setDetail(r)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Eye size={14}/></button><button onClick={()=>openEdit(r)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Pencil size={14}/></button><button onClick={()=>handleDelete(r.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14}/></button></div>}
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setShowModal(false)} />
          <div className="relative bg-white rounded-[16px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div><div className="font-bold text-sm">{editing?"Edit":"Buat"} Administrasi Persuratan</div><div className="text-xs text-[#6b7280]">Isi nama, deskripsi, daftar field, dan tahapan template</div></div>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-[#f6f5f4] rounded-full"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setShowModal(false)}>Batal</Button>
                <Button onClick={handleSubmit}>{editing?"Update":"Simpan"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><div className="font-bold text-sm">{detail.name}</div><button onClick={()=>setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6">
              <div className="detail-view">
                <div className="detail-field"><span className="detail-label">Deskripsi</span><span className="detail-value">{detail.description||"-"}</span></div>
                <div className="detail-field"><span className="detail-label">Fields</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded text-xs font-mono overflow-auto">{detail.fieldsJson||"[]"}</pre></div>
                <div className="detail-field"><span className="detail-label">Steps</span><span className="detail-value">{detail._steps?.length||0} steps</span></div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/hasil-persuratan?administrationId=${detail.id}`}><Button size="sm">Lihat Hasil</Button></Link>
                <Button size="sm" variant="outline" onClick={()=>setDetail(null)}>Tutup</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
