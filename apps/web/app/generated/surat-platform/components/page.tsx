"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Plus, Component, Pencil, Trash2, X, Eye } from "lucide-react"
import Link from "next/link"

export default function ComponentsPage() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  const load = async (p=page,s=search)=>{
    setLoading(true)
    const params=new URLSearchParams({ page:String(p), limit:"10", sortBy:"id", sortOrder:"desc" })
    if(s) params.set("search",s)
    const res=await fetch(`/api/generated/surat-platform/components?${params}`)
    const json=await res.json()
    setData(json.data??[])
    setTotal(json.total??0)
    setLoading(false)
  }
  useEffect(()=>{ load(1,"") },[])
  const handlePage=(p:number)=>{ setPage(p); load(p, search)}
  const handleSearch=(s:string)=>{ setSearch(s); setPage(1); load(1,s)}

  const handleDelete=async(id:number)=>{ if(!confirm("Hapus?")) return; await fetch(`/api/generated/surat-platform/components/${id}`,{method:"DELETE"}); load(page, search)}

  return (
    <PageShell title="Components" description="Registry komponen reusable — basic (Text, Heading, Image) hingga dynamic (Repeater, Condition, QR Code). Setiap component punya schema + default props." breadcrumbs={[{ label:"Surat Platform", href:"/"},{ label:"Components"}]} actions={<Link href="/generated/surat-platform/components/new"><Button><Plus size={16}/> Tambah Component</Button></Link>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { cat:"basic", label:"Basic", desc:"Text, Heading, Paragraph", color:"bg-[#0075de]" },
          { cat:"layout", label:"Layout", desc:"Divider, Page Break", color:"bg-[#6b7280]" },
          { cat:"data", label:"Data", desc:"Table, Image", color:"bg-violet-500" },
          { cat:"dynamic", label:"Dynamic", desc:"Repeater, Condition, QR", color:"bg-emerald-500" },
        ].map(c=>(
          <div key={c.cat} className="rounded-[12px] border border-[#e6e6e6] bg-white p-3">
            <div className={`w-7 h-7 rounded-[8px] ${c.color} flex items-center justify-center text-white mb-2`}><Component size={14}/></div>
            <div className="text-xs font-bold">{c.label}</div>
            <div className="text-[11px] text-[#6b7280]">{c.desc}</div>
          </div>
        ))}
      </div>

      <DataTable
        data={data}
        total={total}
        page={page}
        limit={10}
        totalPages={Math.ceil(total/10)}
        onPageChange={handlePage}
        onSearch={handleSearch}
        searchPlaceholder="Cari component..."
        loading={loading}
        columns={[
          { key:"name", header:"Nama", render:(r)=><div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-[#f6f5f4] border flex items-center justify-center text-[#6b7280] text-[11px]">{r.icon?.slice(0,2) || "Co"}</div><div><div className="font-medium text-xs">{r.name}</div><div className="text-[11px] text-[#6b7280]">{r.type}</div></div></div> },
          { key:"category", header:"Kategori", render:(r)=><Badge variant="secondary" className="text-[11px]">{r.category}</Badge> },
          { key:"type", header:"Tipe", render:(r)=><span className="font-mono text-xs bg-[#f6f5f4] px-2 py-1 rounded border">{r.type}</span> },
          { key:"is_system", header:"System", render:(r)=><Badge variant={r.is_system?"success":"outline"}>{r.is_system?"system":"custom"}</Badge> },
          { key:"actions", header:"Aksi", render:(r)=><div className="flex items-center gap-1"><button onClick={()=>setDetail(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]"><Eye size={14}/></button><Link href={`/generated/surat-platform/components/${r.id}/edit`} className="p-1.5 rounded hover:bg-[#f6f5f4] inline-flex"><Pencil size={14}/></Link><button onClick={()=>handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={14}/></button></div> },
        ]}
      />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-xl shadow-xl">
            <div className="border-b p-4 flex items-center justify-between"><div className="font-semibold text-sm">{detail.name} — {detail.type}</div><button onClick={()=>setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6">
              <div className="detail-view">
                <div className="detail-field"><span className="detail-label">Kategori / Icon</span><span className="detail-value">{detail.category} • {detail.icon}</span></div>
                <div className="detail-field"><span className="detail-label">Default Props</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded text-xs font-mono overflow-auto">{detail.default_props_json || "-"}</pre></div>
                <div className="detail-field"><span className="detail-label">Schema</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded text-xs font-mono overflow-auto">{detail.schema_json || "-"}</pre></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
