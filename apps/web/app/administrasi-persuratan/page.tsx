"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Plus, Trash2, Pencil, X, Eye, ClipboardList, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AdministrasiPersuratanPage(){
  const [data,setData]=useState<any[]>([])
  const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState("")
  const [loading,setLoading]=useState(false)
  const [detail,setDetail]=useState<any>(null)

  const load=async(p=page,s=search)=>{
    setLoading(true)
    const res=await fetch(`/api/persuratan/administrations?page=${p}&limit=10&search=${encodeURIComponent(s)}`)
    const j=await res.json()
    setData(j.data??[]); setTotal(j.total??0); setLoading(false)
  }
  useEffect(()=>{ load(1,"") },[])

  const handleDelete=async(id:number)=>{ if(!confirm("Hapus administrasi?")) return; await fetch(`/api/persuratan/administrations/${id}`,{method:"DELETE"}); load(page,search)}

  return (
    <PageShell title="Administrasi Persuratan" description="Kelola data administrasi — buat, lihat, dan hapus. Form dapat ditambah terus sesuai kebutuhan." breadcrumbs={[{label:"Persuratan"},{label:"Administrasi"}]} actions={<Link href="/administrasi-persuratan/new"><Button><Plus size={16}/> Buat Administrasi</Button></Link>}>
      <DataTable data={data} total={total} page={page} limit={10} totalPages={Math.ceil(total/10)} onPageChange={(p)=>{setPage(p); load(p,search)}} onSearch={(s)=>{setSearch(s); setPage(1); load(1,s)}} searchPlaceholder="Cari administrasi..." loading={loading}
        columns={[
          {key:"name", header:"Nama", render:(r)=><div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-700"><ClipboardList size={14}/></div><div><div className="font-bold text-xs">{r.name}</div><div className="text-[11px] text-[#6b7280]">{r.description||"-"}</div></div></div>},
          {key:"fields", header:"Fields", render:(r)=>{ try{ const f=JSON.parse(r.fieldsJson||"[]"); return <Badge variant="secondary">{f.length} fields</Badge>}catch{return "-"}}},
          {key:"steps", header:"Steps", render:(r)=><Badge variant="outline">{r._steps?.length||0} templates</Badge>},
          {key:"datas", header:"Hasil", render:(r)=><Link href={`/hasil-persuratan?administrationId=${r.id}`} className="text-xs text-[#0075de] hover:underline flex items-center gap-1">{r._dataCount} data <ArrowRight size={10}/></Link>},
          {key:"actions", header:"Aksi", render:(r)=><div className="flex gap-1"><button onClick={()=>setDetail(r)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Eye size={14}/></button><Link href={`/administrasi-persuratan/${r.id}/edit`} className="p-1.5 hover:bg-[#f6f5f4] rounded inline-flex"><Pencil size={14}/></Link><button onClick={()=>handleDelete(r.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14}/></button></div>}
        ]}
      />

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
