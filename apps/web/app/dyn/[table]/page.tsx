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
import { useParams } from "next/navigation"
import { Plus, Trash2, Pencil, X, Eye, Search, Settings, Columns, ArrowUpDown, Calculator, Image as ImageIcon, Calendar, Clock, Hash, Type, FileText, Link2, EyeOff, Copy, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { evaluateOperation, getDependentColumns } from "@/lib/renderer/operationEngine"

type Col = {
  id:number, name:string, displayName:string, type:string, optionsJson:string|null, defaultValue:string|null, isRequired:boolean, isOrderable:boolean, isSearchable:boolean, orderIndex:number
}

function formatValue(col: Col, raw: any){
  if(raw==null) return "-"
  try{
    const opts = col.optionsJson ? JSON.parse(col.optionsJson) : {}
    if(col.type==="date"||col.type==="datetime"||col.type==="time"){
      const fmt = opts.format || (col.type==="date"?"m-d-Y":col.type==="datetime"?"m-d-Y H:i:s":"H:i:s")
      // raw is ISO string or YYYY-MM-DD, try to format
      const d = new Date(raw)
      if(!isNaN(d.getTime())){
        // simple format: implement m-d-Y etc
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
      // strip html for table display
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
  const [showModal,setShowModal]=useState(false)
  const [editing,setEditing]=useState<any>(null)
  const [form,setForm]=useState<Record<string,any>>({})
  const [detail,setDetail]=useState<any>(null)
  const [relationData,setRelationData]=useState<Record<string, any[]>>({})
  const [relationSearch,setRelationSearch]=useState<Record<string,string>>({})
  const [showRelationFor,setShowRelationFor]=useState<string | null>(null)

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
      // try direct by name via dyn meta? fallback
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
    // keep columns from meta if not yet
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
  useEffect(()=>{ // preload relation data for select_table columns
    const relCols = columns.filter(c=>c.type==="select_table"||c.type==="select_table_multiple")
    for(const col of relCols){
      const opts = col.optionsJson ? JSON.parse(col.optionsJson) : {}
      const rel = opts.relationTable
      if(rel){
        fetch(`/api/dyn/${rel}?limit=100`).then(r=>r.json()).then(j=> setRelationData(prev=>({...prev, [col.name]: j.data||[]})) )
      }
    }
  },[columns])

  const handlePage=(p:number)=>{ setPage(p); loadData(p,search,sortBy,sortOrder)}
  const handleSearch=(s:string)=>{ setSearch(s); setPage(1); loadData(1,s,sortBy,sortOrder)}
  const handleSort=(colName:string)=>{
    const col=columns.find(c=>c.name===colName)
    if(!col?.isOrderable) return
    const newOrder = sortBy===colName && sortOrder==="asc" ? "desc" : "asc"
    setSortBy(colName); setSortOrder(newOrder); loadData(page,search,colName,newOrder)
  }

  const openCreate=()=>{
    setEditing(null)
    const init:Record<string,any>={}
    for(const c of columns){
      if(c.type==="hidden_operation_text"||c.type==="readonly_operation_text") continue
      if(c.defaultValue) init[c.name]=c.defaultValue
      else if(c.type==="number") init[c.name]=""
      else init[c.name]=""
    }
    setForm(init)
    setShowModal(true)
  }
  const openEdit=async(row:any)=>{
    setEditing(row)
    const copy:any={}
    for(const c of columns){
      let v=row[c.name]
      if(c.type==="select_multiple"||c.type==="select_table_multiple"){
        try{ v= typeof v==="string" ? JSON.parse(v) : v }catch{}
        if(!Array.isArray(v)) v = v ? [v] : []
      }
      copy[c.name]=v??""
    }
    setForm(copy)
    setShowModal(true)
  }
  // compute operation fields realtime
  const computedForm = (()=> {
    let out={...form}
    for(const col of columns){
      if(col.type==="hidden_operation_text"||col.type==="readonly_operation_text"){
        try{
          const opts= col.optionsJson?JSON.parse(col.optionsJson):{}
          const expr=opts.expression||""
          if(expr) out[col.name]=evaluateOperation(expr, out)
        }catch{}
      }
    }
    return out
  })()

  const handleChange=(name:string, value:any)=>{
    setForm(prev=>{
      const next={...prev, [name]: value}
      // recompute dependents realtime
      for(const col of columns){
        if(col.type==="hidden_operation_text"||col.type==="readonly_operation_text"){
          const opts= col.optionsJson?JSON.parse(col.optionsJson):{}
          const expr=opts.expression||""
          const deps=getDependentColumns(expr)
          if(deps.includes(name)){
            next[col.name]=evaluateOperation(expr, next)
          }
        }
      }
      return next
    })
  }

  const handleSubmit=async()=>{
    // validate required
    for(const c of columns){
      if(c.isRequired && c.type!=="hidden_operation_text" && c.type!=="readonly_operation_text"){
        const v=form[c.name]
        if(v===undefined||v===null||String(v).trim()===""){
          alert(`Field ${c.displayName} wajib diisi`)
          return
        }
      }
    }
    const payload:any={}
    for(const c of columns){
      if(c.type==="hidden_operation_text"||c.type==="readonly_operation_text"){
        payload[c.name]=computedForm[c.name]
      } else if(c.type==="select_multiple"||c.type==="select_table_multiple"){
        payload[c.name]= form[c.name] // will be stringified in service
      } else {
        payload[c.name]=form[c.name]
      }
    }
    const url=editing?`/api/dyn/${tableName}/${editing.id}`:`/api/dyn/${tableName}`
    const method=editing?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ setShowModal(false); loadData(page,search,sortBy,sortOrder)} else alert((await res.json()).message)
  }
  const handleDelete=async(id:number)=>{
    if(!confirm("Hapus data?")) return
    await fetch(`/api/dyn/${tableName}/${id}`,{method:"DELETE"})
    loadData(page,search,sortBy,sortOrder)
  }

  if(!meta) return <div className="p-8 text-center text-sm text-[#6b7280]">Loading meta untuk {tableName}...</div>

  const visibleColumns = columns.filter(c=>visibleCols[c.name]!==false)

  return (
    <PageShell title={meta.displayName} description={`Browse table ${tableName} — dyn_${tableName} • searching: ${columns.filter(c=>c.isSearchable).map(c=>c.displayName).join(", ")||"tidak ada"} • ${columns.length} kolom`} breadcrumbs={[{label:"Dyn", href:"/dyn"}, {label: meta.displayName}]} actions={<div className="flex gap-2"><Link href="/global-tables"><Button variant="outline" size="sm"><Settings size={14}/> Kelola Tabel</Button></Link><Button onClick={openCreate}><Plus size={14}/> Tambah Data</Button></div>}>
      {/* Controls: searching + options + orders */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
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
              if(col.type==="image" && raw) return <img src={raw} alt="img" className="w-12 h-12 object-cover rounded border" />
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
            <button onClick={()=>openEdit(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]"><Pencil size={14}/></button>
            <button onClick={()=>handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={14}/></button>
          </div>}
        ]}
      />

      {/* Create/Edit Modal with per-type inputs */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setShowModal(false)} />
          <div className="relative bg-white rounded-[16px] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10 rounded-t-[16px]">
              <div className="font-bold text-sm">{editing?"Edit Data":"Tambah Data"} — {meta.displayName}</div>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-[#f6f5f4] rounded-full"><X size={16}/></button>
            </div>
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {columns.map(col=>{
                const opts = col.optionsJson ? JSON.parse(col.optionsJson):{}
                const val = form[col.name] ?? ""
                const computedVal = computedForm[col.name] ?? ""
                // hidden_operation_text: tidak tampilkan input
                if(col.type==="hidden_operation_text"){
                  return <div key={col.name} className="hidden">
                    <Input value={computedVal} readOnly className="hidden" />
                    <div className="text-[11px] text-[#6b7280]">Hidden operation: {opts.expression} → <span className="font-mono bg-[#f6f5f4] px-1 rounded">{computedVal}</span></div>
                  </div>
                }
                return (
                  <div key={col.name} className="">
                    <Label className="text-xs flex items-center gap-1">
                      {col.displayName}
                      {col.isRequired && <span className="text-red-600">*</span>}
                      <span className="ml-auto text-[11px] font-mono text-[#9ca3af]">{col.type}</span>
                    </Label>

                    {col.type==="text" && <Input value={val} onChange={e=>handleChange(col.name, e.target.value)} placeholder={col.defaultValue||`Masukkan ${col.displayName}`} className="h-9 text-sm mt-1" />}

                    {col.type==="richtext" && (
                      <div className="mt-1 border border-[#e6e6e6] rounded-[8px] overflow-hidden">
                        <div className="bg-[#f9fafb] border-b border-[#e6e6e6] px-2 py-1 flex items-center gap-1">
                          <button className="w-7 h-7 rounded hover:bg-white border border-transparent hover:border-[#e6e6e6] flex items-center justify-center text-xs font-bold" title="Bold" onClick={()=>handleChange(col.name, (val||"")+"<b>bold</b>")}>B</button>
                          <button className="w-7 h-7 rounded hover:bg-white flex items-center justify-center text-xs italic" title="Italic" onClick={()=>handleChange(col.name, (val||"")+"<i>italic</i>")}>I</button>
                          <button className="w-7 h-7 rounded hover:bg-white flex items-center justify-center text-xs underline" title="Underline" onClick={()=>handleChange(col.name, (val||"")+"<u>underline</u>")}>U</button>
                          <span className="text-[11px] text-[#6b7280] ml-2">Inline Styles | Block Styles | Lists | Table | Link | Image</span>
                        </div>
                        <Textarea value={val} onChange={e=>handleChange(col.name, e.target.value)} placeholder="Richtext HTML..." className="min-h-[100px] font-mono text-xs border-0 rounded-none" />
                        <div className="bg-[#f6f5f4] px-2 py-1 text-[11px] text-[#6b7280]">Preview: <span dangerouslySetInnerHTML={{__html: val||"<span class='text-[#9ca3af]'>empty</span>"}} /></div>
                      </div>
                    )}

                    {col.type==="date" && <Input type="date" value={val} onChange={e=>handleChange(col.name, e.target.value)} className="h-9 text-sm mt-1" />}
                    {col.type==="datetime" && <Input type="datetime-local" value={val} onChange={e=>handleChange(col.name, e.target.value)} className="h-9 text-sm mt-1" />}
                    {col.type==="time" && <Input type="time" value={val} onChange={e=>handleChange(col.name, e.target.value)} className="h-9 text-sm mt-1" />}
                    {(col.type==="date"||col.type==="datetime"||col.type==="time") && <div className="text-[11px] text-[#6b7280] mt-1">Format display: {opts.format|| (col.type==="date"?"m-d-Y":col.type==="datetime"?"m-d-Y H:i:s":"H:i:s")}</div>}

                    {col.type==="image" && (
                      <div className="mt-1">
                        <Input value={val} onChange={e=>handleChange(col.name, e.target.value)} placeholder="https:// atau /uploads/image.jpg" className="h-9 text-sm" />
                        <div className="mt-2 flex items-center gap-2">
                          <Input type="file" accept="image/*" onChange={e=>{
                            const f=e.target.files?.[0]
                            if(f){
                              const url=URL.createObjectURL(f)
                              handleChange(col.name, url)
                            }
                          }} className="text-xs" />
                          {val && <img src={val} alt="preview" className="w-16 h-16 object-cover rounded border" />}
                        </div>
                      </div>
                    )}

                    {col.type==="select" && (
                      <Select value={val} onChange={e=>handleChange(col.name, e.target.value)} className="h-9 text-sm mt-1">
                        <option value="">-- pilih --</option>
                        {(opts.options||[]).map((o:any)=><option key={o.value} value={o.value}>{o.label}</option>)}
                      </Select>
                    )}
                    {col.type==="select_multiple" && (
                      <div className="mt-1 border border-[#e6e6e6] rounded-[8px] p-2 bg-[#fafafa] max-h-[120px] overflow-y-auto">
                        {(opts.options||[]).map((o:any)=>{
                          const arr = Array.isArray(val) ? val : []
                          const checked = arr.includes(o.value)
                          return <label key={o.value} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                            <input type="checkbox" checked={checked} onChange={e=>{
                              const cur = Array.isArray(val)?[...val]:[]
                              const next = e.target.checked ? [...cur, o.value] : cur.filter((x:string)=>x!==o.value)
                              handleChange(col.name, next)
                            }} />
                            {o.label} <span className="text-[11px] text-[#6b7280]">({o.value})</span>
                          </label>
                        })}
                      </div>
                    )}

                    {(col.type==="select_table"||col.type==="select_table_multiple") && (
                      <div className="mt-1">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={()=>{
                            setShowRelationFor(showRelationFor===col.name?null:col.name)
                            // load relation data if needed
                            if(!relationData[col.name]){
                              const rel=opts.relationTable
                              if(rel) fetch(`/api/dyn/${rel}?limit=100`).then(r=>r.json()).then(j=> setRelationData(prev=>({...prev, [col.name]: j.data||[]})))
                            }
                          }}><Link2 size={12}/> Pilih dari {opts.relationTable||"tabel"}</Button>
                          <span className="text-xs text-[#6b7280] self-center">{Array.isArray(val)?`${val.length} terpilih`: val?`Terpilih: ${val}`:"Belum pilih"}</span>
                        </div>
                        {showRelationFor===col.name && (
                          <Card className="mt-3">
                            <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center justify-between"><span>Tabel {opts.relationTable}</span><Button size="sm" variant="ghost" onClick={()=>setShowRelationFor(null)}><X size={12}/></Button></CardTitle>
                              <div className="flex gap-2 mt-2">
                                <Input value={relationSearch[col.name]||""} onChange={e=>setRelationSearch({...relationSearch, [col.name]: e.target.value})} placeholder="Searching all..." className="h-7 text-xs flex-1" />
                                <Button size="sm" variant="outline" onClick={()=>{
                                  const rel=opts.relationTable
                                  const s=relationSearch[col.name]||""
                                  fetch(`/api/dyn/${rel}?search=${encodeURIComponent(s)}&limit=100`).then(r=>r.json()).then(j=> setRelationData(prev=>({...prev, [col.name]: j.data||[]})))
                                }}>Cari</Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="max-h-[200px] overflow-auto">
                                <table className="w-full text-xs">
                                  <thead className="sticky top-0 bg-[#f9fafb] border-b">
                                    <tr>
                                      <th className="p-2 text-left w-8"><input type={col.type==="select_table_multiple"?"checkbox":"radio"} disabled readOnly /></th>
                                      {(opts.displayFields||["id","name"]).map((f:string)=><th key={f} className="p-2 text-left font-semibold">{f}<span className="ml-1 text-[#9ca3af]">↕</span></th>)}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(relationData[col.name]||[]).map((row:any)=> {
                                      const value = row[opts.valueField||"id"]
                                      const isChecked = col.type==="select_table_multiple" ? (Array.isArray(val) && val.includes(String(value))) : String(val)===String(value)
                                      return (
                                        <tr key={row.id} className="border-b last:border-0 hover:bg-[#f6f5f4]">
                                          <td className="p-2">
                                            <input type={col.type==="select_table_multiple"?"checkbox":"radio"} checked={!!isChecked} onChange={e=>{
                                              if(col.type==="select_table_multiple"){
                                                const cur=Array.isArray(val)?[...val]:[]
                                                const next=e.target.checked ? [...cur, String(value)] : cur.filter((x:string)=>x!==String(value))
                                                handleChange(col.name, next)
                                              } else {
                                                handleChange(col.name, String(value))
                                                setShowRelationFor(null)
                                              }
                                            }} />
                                          </td>
                                          {(opts.displayFields||["id"]).map((f:string)=><td key={f} className="p-2">{String(row[f]??"-")}</td>)}
                                        </tr>
                                      )
                                    })}
                                    {(!relationData[col.name]||relationData[col.name].length===0) && <tr><td colSpan={10} className="p-4 text-center text-xs text-[#9ca3af]">Tidak ada data</td></tr>}
                                  </tbody>
                                </table>
                              </div>
                              {col.type==="select_table_multiple" && <div className="p-3 border-t flex justify-end"><Button size="sm" onClick={()=>setShowRelationFor(null)}>Selesai ({Array.isArray(val)?val.length:0} terpilih)</Button></div>}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {col.type==="number" && (
                      <div className="mt-1">
                        <Input type="number" value={val} onChange={e=>handleChange(col.name, e.target.value)} placeholder="123" className="h-9 text-sm" />
                        {opts.isCurrency && <div className="mt-2 text-sm">Preview: <span className="font-bold">Rp {Number(String(val).replace(/[^0-9.-]/g,"")||0).toLocaleString("id-ID")}</span> <span className="text-[11px] text-[#6b7280]">realtime</span></div>}
                      </div>
                    )}

                    {col.type==="readonly_operation_text" && (
                      <div className="mt-1">
                        <Input value={computedVal} readOnly className="h-9 text-sm bg-amber-50 border-amber-200 font-mono" />
                        <div className="text-[11px] text-amber-800 mt-1">Otomatis: <code className="bg-white px-1 rounded border font-mono">{opts.expression}</code> → <span className="font-bold">{computedVal}</span> (readonly, tidak bisa diedit)</div>
                      </div>
                    )}

                    {col.isRequired && <div className="text-[11px] text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={10}/> Wajib diisi</div>}
                  </div>
                )
              })}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setShowModal(false)}>Batal</Button>
              <Button onClick={handleSubmit}>{editing?"Update":"Simpan"}</Button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><div className="font-bold text-sm">{meta.displayName} #{detail.id}</div><button onClick={()=>setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6">
              <div className="detail-view">
                {columns.map(c=>(
                  <div key={c.name} className="detail-field"><span className="detail-label">{c.displayName} ({c.type})</span><span className="detail-value">{c.type==="image" && detail[c.name] ? <img src={detail[c.name]} alt="img" className="w-24 h-24 object-cover rounded" /> : String(detail[c.name]??"-").slice(0,200)}</span></div>
                ))}
              </div>
              <div className="mt-4 flex justify-end"><Button variant="outline" onClick={()=>setDetail(null)}>Tutup</Button></div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
