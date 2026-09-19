"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Plus, Table, Trash2, Pencil, X, Eye, Database } from "lucide-react"
import Link from "next/link"

export default function GlobalTablesPage(){
  const [data,setData]=useState<any[]>([])
  const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState("")
  const [loading,setLoading]=useState(false)
  const [detail,setDetail]=useState<any>(null)

  const load = async(p=page,s=search)=>{
    setLoading(true)
    const params=new URLSearchParams({ page:String(p), limit:"10", sortBy:"id", sortOrder:"desc" })
    if(s) params.set("search",s)
    const res=await fetch(`/api/global-tables?${params}`)
    const json=await res.json()
    setData(json.data??[])
    setTotal(json.total??0)
    setLoading(false)
  }
  useEffect(()=>{ load(1,"") },[])

  const handlePage=(p:number)=>{ setPage(p); load(p,search)}
  const handleSearch=(s:string)=>{ setSearch(s); setPage(1); load(1,s)}

  const handleDelete=async(id:number)=>{
    if(!confirm("Hapus tabel? Ini akan hapus physical table dyn_* dan semua datanya!")) return
    await fetch(`/api/global-tables/${id}`,{method:"DELETE"})
    load(page,search)
  }

  return (
    <PageShell title="Generated Global Tabel" description="Kelola tabel dinamis — atur nama tabel, nama tampilan, dan kolom (13 tipe) dengan antarmuka visual. Tabel yang dibuat otomatis menjadi menu dan halaman browse." breadcrumbs={[{label:"Global Tabel"}]} actions={<Link href="/global-tables/new"><Button><Plus size={16}/> Buat Tabel Baru</Button></Link>}>
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="bg-[#0075de] text-white border-none"><CardContent className="p-4"><div className="text-xs opacity-80">Total Tabel</div><div className="text-2xl font-bold">{total}</div><div className="text-[11px] opacity-70">dyn_* physical tables</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-[#6b7280]">Tipe Kolom</div><div className="text-sm font-bold">13 tipe</div><div className="text-[11px] text-[#6b7280]">text → readonly-operation</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-[#6b7280]">Fitur Browse</div><div className="text-sm font-bold">search • options • order</div><div className="text-[11px] text-[#6b7280]">Hanya kolom yang di-check</div></CardContent></Card>
      </div>

      <DataTable data={data} total={total} page={page} limit={10} totalPages={Math.ceil(total/10)} onPageChange={handlePage} onSearch={handleSearch} searchPlaceholder="Cari nama tabel..." loading={loading}
        columns={[
          {key:"name", header:"Tabel", render:(r)=><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-[8px] bg-[#0075de]/10 flex items-center justify-center text-[#0075de]"><Table size={14}/></div><div><div className="font-mono text-xs font-bold">{r.name}</div><div className="text-xs">{r.displayName}</div><div className="text-[11px] text-[#6b7280]">{r.description||"-"}</div></div></div>},
          {key:"columns", header:"Kolom", render:(r)=><Badge variant="secondary">{r._columnCount} cols</Badge>},
          {key:"rows", header:"Rows", render:(r)=><span className="text-xs font-mono">{r._rowCount}</span>},
          {key:"status", header:"Status", render:(r)=><Badge variant={r.status==="active"?"success":"secondary"}>{r.status}</Badge>},
          {key:"actions", header:"Aksi", render:(r)=><div className="flex items-center gap-1">
            <Link href={`/dyn/${r.name}`} className="p-1.5 rounded bg-[#0075de] text-white hover:bg-[#005bb5]" title="Browse Data"><Database size={14}/></Link>
            <button onClick={()=>setDetail(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]" title="Detail"><Eye size={14}/></button>
            <Link href={`/global-tables/${r.id}/edit`} className="p-1.5 rounded hover:bg-[#f6f5f4] inline-flex" title="Edit"><Pencil size={14}/></Link>
            <button onClick={()=>handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Hapus"><Trash2 size={14}/></button>
          </div>},
        ]}
      />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><div className="font-bold text-sm">{detail.displayName} ({detail.name})</div><button onClick={()=>setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6">
              <div className="detail-view">
                <div className="detail-field"><span className="detail-label">Status</span><span className="detail-value">{detail.status}</span></div>
                <div className="detail-field"><span className="detail-label">Deskripsi</span><span className="detail-value">{detail.description||"-"}</span></div>
                <div className="detail-field"><span className="detail-label">Physical Table</span><span className="detail-value font-mono">dyn_{detail.name}</span></div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Link href={`/dyn/${detail.name}`}><Button size="sm">Browse Data</Button></Link>
                <Button size="sm" variant="outline" onClick={()=>setDetail(null)}>Tutup</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
