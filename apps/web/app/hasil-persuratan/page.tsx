"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Trash2, Pencil, X, Eye, ClipboardList, FileStack, FileText } from "lucide-react"
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
  const [detail,setDetail]=useState<any>(null)
  const [adminDetail,setAdminDetail]=useState<any>(null)

  const loadAdmins=async()=>{
    const res=await fetch(`/api/persuratan/administrations?limit=100`)
    const j=await res.json()
    setAdministrations(j.data??[])
    if(!selectedAdmin && j.data?.[0]) setSelectedAdmin(String(j.data[0].id))
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
    const res=await fetch(`/api/persuratan/administrations/${adminId}/datas?page=${p}&limit=10&search=${encodeURIComponent(s)}`)
    if(res.ok){
      const j=await res.json()
      setDatas(j.data??[]); setTotal(j.total??0)
    } else {
      setDatas([]); setTotal(0)
    }
    setLoading(false)
  }

  useEffect(()=>{ loadAdmins() },[])
  useEffect(()=>{ if(selectedAdmin){ loadAdminDetail(selectedAdmin); loadDatas(selectedAdmin,1,"") } },[selectedAdmin])

  const handleDelete=async(id:number)=>{
    if(!confirm("Hapus data persuratan?")) return
    await fetch(`/api/persuratan/administrations/${selectedAdmin}/datas/${id}`,{method:"DELETE"})
    loadDatas(selectedAdmin,page,search)
  }

  return (
    <PageShell title="Hasil Administrasi Persuratan" description="Pilih administrasi untuk melihat hasil, buat persuratan baru dengan melengkapi data dan tahapan, serta hapus jika diperlukan." breadcrumbs={[{label:"Persuratan"},{label:"Hasil"}]} actions={<div className="flex gap-2"><Button variant="outline" onClick={()=> window.open(`/api/persuratan/administrations/${selectedAdmin}/datas?preview=pdf`,"_blank")}><FileText size={14}/> Preview PDF</Button><Link href={selectedAdmin ? `/hasil-persuratan/new?administrationId=${selectedAdmin}` : "/hasil-persuratan/new"}><Button><PlusIcon/> Buat Persuratan</Button></Link></div>}>
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
            {key:"actions", header:"Aksi", render:(r)=><div className="flex gap-1"><button onClick={()=>setDetail(r)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Eye size={14}/></button><Link href={`/hasil-persuratan/${r.id}/edit?administrationId=${selectedAdmin}`} className="p-1.5 hover:bg-[#f6f5f4] rounded inline-flex"><Pencil size={14}/></Link><button onClick={()=>handleDelete(r.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14}/></button></div>}
          ]}
        />
      ) : (
        <Card className="border-dashed"><CardContent className="p-8 text-center text-sm text-[#6b7280]">Pilih administrasi di atas untuk melihat hasil</CardContent></Card>
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

function PlusIcon(){ return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg> }

export default function HasilPersuratanPage(){
  return <Suspense fallback={<div className="p-8 text-center text-sm text-[#6b7280]">Loading...</div>}><HasilPersuratanInner/></Suspense>
}
