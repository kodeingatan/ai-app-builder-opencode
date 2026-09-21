"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Plus, Boxes, Trash2, Pencil, X, Eye } from "lucide-react"
import Link from "next/link"

export default function ComponentsPersuratanPage(){
  const [data,setData]=useState<any[]>([])
  const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState("")
  const [loading,setLoading]=useState(false)
  const [detail,setDetail]=useState<any>(null)
  const [previewHtml,setPreviewHtml]=useState("")

  const load=async(p=page,s=search)=>{
    setLoading(true)
    const res=await fetch(`/api/persuratan/components?page=${p}&limit=10&search=${encodeURIComponent(s)}`)
    const j=await res.json()
    setData(j.data??[]); setTotal(j.total??0); setLoading(false)
  }
  useEffect(()=>{ load(1,"") },[])

  const handleDelete=async(id:number)=>{ if(!confirm("Hapus component?")) return; await fetch(`/api/persuratan/components/${id}`,{method:"DELETE"}); load(page,search)}

  return (
    <PageShell title="Component Persuratan" description="Kelola komponen — buat, pratinjau, dan hapus. Editor mendukung pengulangan dan penyisipan data." breadcrumbs={[{label:"Persuratan"},{label:"Components"}]} actions={<Link href="/components-persuratan/new"><Button><Plus size={14}/> Buat Component</Button></Link>}>
      <DataTable data={data} total={total} page={page} limit={10} totalPages={Math.ceil(total/10)} onPageChange={(p)=>{setPage(p); load(p,search)}} onSearch={(s)=>{setSearch(s); setPage(1); load(1,s)}} searchPlaceholder="Cari nama component..." loading={loading}
        columns={[
          {key:"name", header:"Nama", render:(r)=><div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-violet-100 flex items-center justify-center text-violet-600"><Boxes size={12}/></div><div><div className="font-bold text-xs">{r.name}</div><div className="text-[11px] text-[#6b7280]">{r.isLooping?"Looping":"Single"}</div></div></div>},
          {key:"bindings", header:"Bindings", render:(r)=>{ try{ const b=JSON.parse(r.bindingsJson||"[]"); return <span className="text-xs">{b.length} data</span>}catch{return "-"}}},
          {key:"preview", header:"Preview", render:(r)=><div className="text-xs max-w-[240px] truncate" dangerouslySetInnerHTML={{__html:(r.contentHtml||"").slice(0,80)}} />},
          {key:"actions", header:"Aksi", render:(r)=><div className="flex gap-1"><button onClick={()=>{setDetail(r); let b=[]; try{b=JSON.parse(r.bindingsJson||"[]")}catch{}; let html=r.contentHtml; for(const bb of b){ html=html.replaceAll(`{{${bb.name}}}`, `[${bb.name}]`)}; setPreviewHtml(html)}} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Eye size={12}/></button><Link href={`/components-persuratan/${r.id}/edit`} className="p-1.5 hover:bg-[#f6f5f4] rounded inline-flex"><Pencil size={12}/></Link><button onClick={()=>handleDelete(r.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={12}/></button></div>}
        ]}
      />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="relative bg-white rounded-[8px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-2.5 flex items-center justify-between"><div className="font-bold text-sm">{detail.name}</div><button onClick={()=>setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={14}/></button></div>
            <div className="p-3">
              <div className="detail-view">
                <div className="detail-field"><span className="detail-label">Looping</span><span className="detail-value">{detail.isLooping?"Ya":"Tidak"}</span></div>
                <div className="detail-field"><span className="detail-label">Content</span><div className="detail-value border rounded p-3 bg-[#fafafa]" dangerouslySetInnerHTML={{__html: detail.contentHtml}} /></div>
                <div className="detail-field"><span className="detail-label">Bindings</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded text-xs font-mono overflow-auto">{detail.bindingsJson||"[]"}</pre></div>
                {previewHtml && <div className="detail-field"><span className="detail-label">Preview</span><div className="detail-value border rounded p-3 bg-white" dangerouslySetInnerHTML={{__html: previewHtml}} /></div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
