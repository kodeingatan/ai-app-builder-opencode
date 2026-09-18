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
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Trash2, Pencil, X, Eye, ClipboardList, FileStack, Sparkles, ArrowRight, Copy, Check, FileText } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

function HasilPersuratanInner(){
  const searchParams = useSearchParams()
  const adminIdFromUrl = searchParams.get("administrationId")
  const [administrations,setAdministrations]=useState<any[]>([])
  const [selectedAdmin,setSelectedAdmin]=useState<string>(adminIdFromUrl||"")
  const [datas,setDatas]=useState<any[]>([])
  const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState("")
  const [loading,setLoading]=useState(false)
  const [showModal,setShowModal]=useState(false)
  const [editing,setEditing]=useState<any>(null)
  const [form,setForm]=useState({ name:"", values:{} as Record<string,string>, stepsData: [] as any[] })
  const [detail,setDetail]=useState<any>(null)
  const [adminDetail,setAdminDetail]=useState<any>(null)

  const loadAdmins=async()=>{
    const res=await fetch(`/api/persuratan/administrations?limit=100`)
    const j=await res.json()
    setAdministrations(j.data??[])
    if(!selectedAdmin && j.data?.[0]) setSelectedAdmin(String(j.data[0].id))
    // if adminId from url, load its detail
  }
  const loadAdminDetail=async(id:string)=>{
    if(!id) return
    const res=await fetch(`/api/persuratan/administrations/${id}`)
    const j=await res.json()
    setAdminDetail(j)
  }
  const loadDatas=async(adminId:string, p=page, s=search)=>{
    if(!adminId) return
    setLoading(true)
    // we need to fetch via custom endpoint: we don't have direct datas api yet, we use administrationsService listDatas via new API we haven't created
    // For now, fetch via generic? We'll create endpoint /api/persuratan/administrations/[id]/datas
    const res=await fetch(`/api/persuratan/administrations/${adminId}/datas?page=${p}&limit=10&search=${encodeURIComponent(s)}`)
    if(res.ok){
      const j=await res.json()
      setDatas(j.data??[]); setTotal(j.total??0)
    } else {
      // fallback: try to fetch via direct table?
      setDatas([]); setTotal(0)
    }
    setLoading(false)
  }

  useEffect(()=>{ loadAdmins() },[])
  useEffect(()=>{ if(selectedAdmin){ loadAdminDetail(selectedAdmin); loadDatas(selectedAdmin,1,"") } },[selectedAdmin])

  const openCreate=()=>{
    setEditing(null)
    const values:Record<string,string>={}
    let fields:any[]=[]
    try{ fields=JSON.parse(adminDetail?.fieldsJson||"[]") }catch{}
    for(const f of fields) values[`step1_${f.name}`]=""
    setForm({ name:"", values, stepsData: adminDetail?.steps?.map((s:any)=>({templateId:s.templateId, templateName:s.templateName, data:{}}))||[] })
    setShowModal(true)
  }
  const openEdit=async(row:any)=>{
    setEditing(row)
    let values:Record<string,string>={}
    try{ values=JSON.parse(row.valuesJson||"{}") }catch{}
    let stepsData:any[]=[]
    try{ stepsData=JSON.parse(row.stepsDataJson||"[]") }catch{}
    setForm({ name: row.name, values, stepsData })
    setShowModal(true)
  }
  const handleSubmit=async()=>{
    if(!selectedAdmin) return alert("Pilih administrasi dulu")
    if(!form.name) return alert("Nama persuratan wajib")
    // For now, we need to create endpoint for datas — we haven't created API for datas, we will mock via direct call to new route we need to create
    const payload={ name: form.name, valuesJson: form.values, stepsDataJson: form.stepsData }
    const url=editing? `/api/persuratan/administrations/${selectedAdmin}/datas/${editing.id}` : `/api/persuratan/administrations/${selectedAdmin}/datas`
    const method=editing?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ setShowModal(false); loadDatas(selectedAdmin,page,search) } else alert((await res.json()).message||"Gagal")
  }
  const handleDelete=async(id:number)=>{
    if(!confirm("Hapus data persuratan?")) return
    await fetch(`/api/persuratan/administrations/${selectedAdmin}/datas/${id}`,{method:"DELETE"})
    loadDatas(selectedAdmin,page,search)
  }

  return (
    <PageShell title="Hasil Administrasi Persuratan" description="Pilih administrasi untuk melihat hasil, buat persuratan baru dengan melengkapi data dan tahapan, serta hapus jika diperlukan." breadcrumbs={[{label:"Persuratan"},{label:"Hasil"}]} actions={<div className="flex gap-2"><Button variant="outline" onClick={()=> window.open(`/api/persuratan/administrations/${selectedAdmin}/datas?preview=pdf`,"_blank")}><FileText size={14}/> Preview PDF</Button><Button onClick={openCreate}><Plus size={16}/> Buat Persuratan</Button></div>}>
      {/* Menu item baru sesuai nama persuratan */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList size={14} className="text-[#0075de]"/> Pilih Administrasi</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {administrations.map(a=>(
              <button key={a.id} onClick={()=>setSelectedAdmin(String(a.id))} className={`px-3 py-2 rounded-full border text-xs font-medium flex items-center gap-2 ${String(a.id)===selectedAdmin?"bg-[#0075de] text-white border-[#0075de]":"bg-white border-[#e6e6e6] hover:bg-[#f6f5f4]"}`}>
                <ClipboardList size={12}/> {a.name} <Badge variant={String(a.id)===selectedAdmin?"secondary":"outline"} className="text-[10px]">{a._dataCount||0} hasil</Badge>
              </button>
            ))}
            {administrations.length===0 && <span className="text-xs text-[#6b7280]">Belum ada administrasi — buat dulu di Administrasi Persuratan</span>}
          </div>
          {adminDetail && (
            <div className="mt-3 p-3 bg-[#f6f5f4] rounded-[8px] text-xs">
              <div className="font-bold">{adminDetail.name}</div>
              <div className="text-[#6b7280]">{adminDetail.description||"-"}</div>
              <div className="mt-1">Fields: {(() => { try{ return JSON.parse(adminDetail.fieldsJson||"[]").map((f:any)=>f.name).join(", ")}catch{return "-"}})()}</div>
              <div>Steps: {adminDetail.steps?.length||0} templates — {adminDetail.steps?.map((s:any)=>s.templateName).join(", ")}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAdmin ? (
        <DataTable data={datas} total={total} page={page} limit={10} totalPages={Math.ceil(total/10)} onPageChange={(p)=>{setPage(p); loadDatas(selectedAdmin,p,search)}} onSearch={(s)=>{setSearch(s); setPage(1); loadDatas(selectedAdmin,1,s)}} searchPlaceholder="Cari nama persuratan..." loading={loading}
          columns={[
            {key:"name", header:"Nama Persuratan", render:(r)=><div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-700"><FileText size={14}/></div><div><div className="font-bold text-xs">{r.name}</div><div className="text-[11px] text-[#6b7280]">ID:{r.id}</div></div></div>},
            {key:"values", header:"Data", render:(r)=>{ try{ const v=JSON.parse(r.valuesJson||"{}"); const keys=Object.keys(v); return <span className="text-xs">{keys.slice(0,2).map(k=>`${k}:${String(v[k]).slice(0,20)}`).join(" • ")}{keys.length>2?" …":""}</span>}catch{return "-"}}},
            {key:"actions", header:"Aksi", render:(r)=><div className="flex gap-1"><button onClick={()=>setDetail(r)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Eye size={14}/></button><button onClick={()=>openEdit(r)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Pencil size={14}/></button><button onClick={()=>handleDelete(r.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14}/></button></div>}
          ]}
        />
      ) : (
        <Card className="border-dashed"><CardContent className="p-8 text-center text-sm text-[#6b7280]">Pilih administrasi di atas untuk melihat hasil</CardContent></Card>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setShowModal(false)} />
          <div className="relative bg-white rounded-[16px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div><div className="font-bold text-sm">{editing?"Edit":"Buat"} Persuratan — {adminDetail?.name}</div><div className="text-xs text-[#6b7280]">Lengkapi data, buat tahapan baru dengan memilih template, dan isi data template</div></div>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-[#f6f5f4] rounded-full"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div><Label>Nama Persuratan *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Surat Tugas Dinas — Afdal" /></div>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Data Administrasi — lengkapi sesuai fields</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    let fields:any[]=[]
                    try{ fields=JSON.parse(adminDetail?.fieldsJson||"[]")}catch{}
                    if(fields.length===0) return <div className="text-xs text-[#6b7280]">Tidak ada field di administrasi ini</div>
                    return fields.map((f:any,idx:number)=>{
                      const key=`step1_${f.name}`
                      return (
                        <div key={idx}>
                          <Label className="text-xs">{f.name} <Badge variant="secondary" className="text-[10px] ml-1">{f.type}</Badge></Label>
                          {f.type==="richtext" ? (
                            <Textarea value={form.values[key]||""} onChange={e=> setForm({...form, values:{...form.values, [key]: e.target.value}})} placeholder={`Isi ${f.name}...`} className="min-h-[80px] text-sm mt-1" />
                          ) : (
                            <Input value={form.values[key]||""} onChange={e=> setForm({...form, values:{...form.values, [key]: e.target.value}})} placeholder={`Isi ${f.name}`} className="h-9 text-sm mt-1" />
                          )}
                        </div>
                      )
                    })
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between"><span className="flex items-center gap-2"><FileStack size={14}/> Steps — Pilih Template</span><Button size="sm" variant="outline" onClick={()=>{
                  if(!adminDetail?.steps?.length) return alert("Administrasi ini belum punya steps template — edit administrasi dulu")
                  const next=[...form.stepsData, {templateId: adminDetail.steps[0].templateId, templateName: adminDetail.steps[0].templateName, data:{}}]
                  setForm({...form, stepsData: next})
                }}><Plus size={12}/> Tambah Step</Button></CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {form.stepsData.map((s:any, idx:number)=>(
                    <div key={idx} className="border border-[#e6e6e6] rounded-[8px] p-3 bg-[#fafafa]">
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
                        }} placeholder='{"field1":"value"}' className="font-mono text-xs min-h-[60px] mt-1" />
                        <div className="text-[11px] text-[#6b7280] mt-1">Isi sesuai permintaan component di template (akan muncul form generated)</div>
                      </div>
                    </div>
                  ))}
                  {form.stepsData.length===0 && <div className="text-xs text-[#6b7280] p-4 text-center border-2 border-dashed rounded-[8px]">Belum ada step — klik Tambah Step. Dapat buat step baru terus sesuai kebutuhan.</div>}
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
                <div className="detail-field"><span className="detail-label">Values</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded text-xs font-mono overflow-auto">{detail.valuesJson||"{}"}</pre></div>
                <div className="detail-field"><span className="detail-label">Steps Data</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded text-xs font-mono overflow-auto">{detail.stepsDataJson||"[]"}</pre></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

export default function HasilPersuratanPage(){
  return <Suspense fallback={<div className="p-8 text-center text-sm text-[#6b7280]">Loading...</div>}><HasilPersuratanInner/></Suspense>
}
