"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Trash2, Pencil, X, Eye, Search, Settings, Columns, ArrowUpDown, Plus } from "lucide-react"
import Link from "next/link"

type Col = {
  id:number, name:string, displayName:string, type:string, optionsJson:string|null, defaultValue:string|null, isRequired:boolean, isOrderable:boolean, isSearchable:boolean, orderIndex:number
}

function formatValue(col: Col, raw: any){
  if(raw==null) return "-"
  try{
    const opts = col.optionsJson ? JSON.parse(col.optionsJson) : {}
    if(col.type==="date"||col.type==="datetime"||col.type==="time"){
      const fmt = opts.format || (col.type==="date"?"m-d-Y":col.type==="datetime"?"m-d-Y H:i:s":"H:i:s")
      const d = new Date(raw)
      if(!isNaN(d.getTime())){
        const pad=(n:number)=>String(n).padStart(2,"0")
        const m=pad(d.getMonth()+1), dd=pad(d.getDate()), Y=d.getFullYear(), H=pad(d.getHours()), ii=pad(d.getMinutes()), s=pad(d.getSeconds())
        let out=fmt
        out=out.replace("m",m).replace("d",dd).replace("Y",String(Y)).replace("H",H).replace("i",ii).replace("s",s)
        return out
      }
      return raw
    }
    if(col.type==="number" && opts.isCurrency){
      const n=Number(String(raw).replace(/[^0-9.-]/g,""))
      if(!isNaN(n)) return "Rp "+n.toLocaleString("id-ID")
      return raw
    }
    if(col.type==="select_multiple"||col.type==="select_table_multiple"){
      try{
        const arr= typeof raw==="string" ? JSON.parse(raw) : raw
        if(Array.isArray(arr)) return arr.join(", ")
      }catch{}
      return raw
    }
    if(col.type==="image"){
      return raw
    }
    if(col.type==="richtext"){
      return String(raw).replace(/<[^>]+>/g,"").slice(0,60)
    }
    return String(raw)
  }catch{
    return String(raw)
  }
}

export default function DynTablePage(){
  const params = useParams() as { table: string }
  const tableName = params.table
  const [meta,setMeta]=useState<any>(null)
  const [columns,setColumns]=useState<Col[]>([])
  const [data,setData]=useState<any[]>([])
  const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState("")
  const [sortBy,setSortBy]=useState("id")
  const [sortOrder,setSortOrder]=useState<"asc"|"desc">("desc")
  const [visibleCols,setVisibleCols]=useState<Record<string,boolean>>({})
  const [loading,setLoading]=useState(false)
  const [detail,setDetail]=useState<any>(null)

  const loadMeta=async()=>{
    const res=await fetch(`/api/global-tables?search=${tableName}&limit=10`)
    const j=await res.json()
    const found=(j.data||[]).find((t:any)=>t.name===tableName)
    if(found){
      const r2=await fetch(`/api/global-tables/${found.id}`)
      const full=await r2.json()
      setMeta(full)
      setColumns(full.columns||[])
      const vis:Record<string,boolean>={}
      for(const c of full.columns||[]) vis[c.name]=true
      setVisibleCols(vis)
      if(full.columns?.length && full.columns[0].isOrderable) setSortBy(full.columns[0].name)
    } else {
      try{
        const r=await fetch(`/api/global-tables?limit=100`)
        const jj=await r.json()
        const f=(jj.data||[]).find((t:any)=>t.name===tableName)
        if(f){
          const r2=await fetch(`/api/global-tables/${f.id}`)
          const full=await r2.json()
          setMeta(full); setColumns(full.columns||[])
        }
      }catch{}
    }
  }
  const loadData=async(p=page,s=search, sb=sortBy, so=sortOrder)=>{
    setLoading(true)
    const qp=new URLSearchParams({ page:String(p), limit:"10", sortBy: sb, sortOrder: so })
    if(s) qp.set("search", s)
    const res=await fetch(`/api/dyn/${tableName}?${qp}`)
    const j=await res.json()
    setData(j.data??[])
    setTotal(j.total??0)
    if(j.columns && columns.length===0){
      setColumns(j.columns)
      const vis:Record<string,boolean>={}
      for(const c of j.columns) vis[c.name]=true
      setVisibleCols(vis)
    }
    setLoading(false)
  }
  useEffect(()=>{ loadMeta() },[tableName])
  useEffect(()=>{ if(meta) loadData(1,"",sortBy,sortOrder) },[meta])

  const handlePage=(p:number)=>{ setPage(p); loadData(p,search,sortBy,sortOrder)}
  const handleSearch=(s:string)=>{ setSearch(s); setPage(1); loadData(1,s,sortBy,sortOrder)}
  const handleDelete=async(id:number)=>{
    if(!confirm("Hapus data?")) return
    await fetch(`/api/dyn/${tableName}/${id}`,{method:"DELETE"})
    loadData(page,search,sortBy,sortOrder)
  }

  if(!meta) return <div className="p-4 text-center text-[13px] text-[#6b7280]">Loading meta untuk {tableName}...</div>

  const visibleColumns = columns.filter(c=>visibleCols[c.name]!==false)

  return (
    <PageShell title={meta.displayName} description={`Browse table ${tableName} — dyn_${tableName} • searching: ${columns.filter(c=>c.isSearchable).map(c=>c.displayName).join(", ")||"tidak ada"} • ${columns.length} kolom`} breadcrumbs={[{label:"Dyn", href:"/dyn"}, {label: meta.displayName}]} actions={<div className="flex gap-2"><Link href="/global-tables"><Button variant="outline" size="sm"><Settings size={14}/> Kelola Tabel</Button></Link><Link href={`/dyn/${tableName}/new`}><Button><Plus size={14}/> Tambah Data</Button></Link></div>}>
      <Card>
        <CardContent className="p-3 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <Label className="text-xs flex items-center gap-1"><Search size={12}/> Searching (hanya kolom yang di-check searching)</Label>
            <div className="flex gap-2 mt-1">
              <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Cari di ${columns.filter(c=>c.isSearchable).map(c=>c.name).join(", ")||"..."}`} className="h-8 text-xs flex-1" onKeyDown={e=> e.key==="Enter" && handleSearch(search)} />
              <Button size="sm" variant="outline" onClick={()=>handleSearch(search)}>Cari</Button>
              <Button size="sm" variant="ghost" onClick={()=>{ setSearch(""); handleSearch("")}}>Reset</Button>
            </div>
            <div className="text-[11px] text-[#6b7280] mt-1">Kolom searchable: {columns.filter(c=>c.isSearchable).map(c=>c.displayName).join(", ")||"— (tidak ada, searching tidak aktif)"}</div>
          </div>

          <div className="min-w-[200px]">
            <Label className="text-xs flex items-center gap-1"><Columns size={12}/> Options — kolom tampil</Label>
            <div className="flex flex-wrap gap-1.5 mt-1 max-w-[320px]">
              {columns.map(c=>(
                <label key={c.name} className={`px-2 py-1 rounded-full border text-xs flex items-center gap-1 cursor-pointer ${visibleCols[c.name]!==false?"bg-[#0075de] text-white border-[#0075de]":"bg-white border-[#e6e6e6] text-[#6b7280]"}`}>
                  <input type="checkbox" checked={visibleCols[c.name]!==false} onChange={e=>setVisibleCols({...visibleCols, [c.name]: e.target.checked})} className="hidden" />
                  {c.displayName}
                </label>
              ))}
            </div>
          </div>

          <div className="text-xs text-[#6b7280]">
            <div className="flex items-center gap-1 font-semibold text-[#111]"><ArrowUpDown size={12}/> Orders</div>
            <div className="mt-1">Klik header kolom untuk urutkan — hanya kolom yang di-check orderable.</div>
            <div className="font-mono text-[11px] mt-1">Sort: {sortBy} {sortOrder}</div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={data}
        total={total}
        page={page}
        limit={10}
        totalPages={Math.ceil(total/10)}
        onPageChange={handlePage}
        onSearch={handleSearch}
        searchPlaceholder="Cari..."
        loading={loading}
        columns={[
          ...visibleColumns.map(col=>({
            key: col.name,
            header: col.displayName + (col.isOrderable ? " ↕" : ""),
            render: (r:any)=>{
              const raw=r[col.name]
              if(col.type==="image" && raw) return <img src={raw} alt="img" className="w-8 h-8 object-cover rounded border" />
              if(col.type==="richtext") return <span className="text-xs line-clamp-2" dangerouslySetInnerHTML={{__html: String(raw||"").slice(0,120)}} />
              if(col.type==="number"){
                const opts= col.optionsJson?JSON.parse(col.optionsJson):{}
                if(opts.isCurrency){
                  const n=Number(String(raw).replace(/[^0-9.-]/g,""))
                  return <span className="text-xs font-mono">Rp {isNaN(n)?raw:n.toLocaleString("id-ID")}</span>
                }
              }
              if(col.type==="hidden_operation_text") return <Badge variant="secondary" className="text-[11px] font-mono">{String(raw||"").slice(0,30)}</Badge>
              if(col.type==="readonly_operation_text") return <span className="text-xs bg-amber-50 border border-amber-200 px-2 py-1 rounded font-mono">{String(raw||"")}</span>
              return <span className="text-xs">{formatValue(col, raw)}</span>
            }
          })),
          {key:"actions", header:"Aksi", render:(r:any)=><div className="flex gap-1">
            <button onClick={()=>setDetail(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]"><Eye size={14}/></button>
            <Link href={`/dyn/${tableName}/${r.id}/edit`} className="p-1.5 rounded hover:bg-[#f6f5f4] inline-flex"><Pencil size={14}/></Link>
            <button onClick={()=>handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={14}/></button>
          </div>}
        ]}
      />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="relative bg-white rounded-[8px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-3 flex items-center justify-between"><div className="font-bold text-[13px]">{meta.displayName} #{detail.id}</div><button onClick={()=>setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={14}/></button></div>
            <div className="p-3">
              <div className="detail-view">
                {columns.map(c=>(
                  <div key={c.name} className="detail-field"><span className="detail-label">{c.displayName} ({c.type})</span><span className="detail-value">{c.type==="image" && detail[c.name] ? <img src={detail[c.name]} alt="img" className="w-16 h-16 object-cover rounded" /> : String(detail[c.name]??"-").slice(0,200)}</span></div>
                ))}
              </div>
              <div className="mt-3 flex justify-end"><Button variant="outline" onClick={()=>setDetail(null)}>Tutup</Button></div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
