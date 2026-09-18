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
import { Plus, Table, Trash2, Pencil, X, Eye, Settings, Search, ListOrdered, Database, Hash, Type, FileText, Calendar, Clock, Image as ImageIcon, List, ListChecks, Link2, Calculator, EyeOff, Eye as EyeIcon, ArrowUpDown, Copy, Check, AlertCircle } from "lucide-react"
import Link from "next/link"

type ColumnType = "text"|"richtext"|"date"|"datetime"|"time"|"image"|"select"|"select_multiple"|"select_table"|"select_table_multiple"|"number"|"hidden_operation_text"|"readonly_operation_text"

type ColumnForm = {
  name: string
  displayName: string
  type: ColumnType
  // type options
  format?: string
  options?: {value:string,label:string}[]
  relationTable?: string
  displayFields?: string[]
  valueField?: string
  isCurrency?: boolean
  expression?: string
  defaultValue?: string
  isRequired?: boolean
  isOrderable?: boolean
  isSearchable?: boolean
  orderIndex?: number
}

const columnTypeOptions: {value: ColumnType, label: string, desc: string, icon: any}[] = [
  { value:"text", label:"text", desc:"Teks biasa", icon: Type },
  { value:"richtext", label:"richtext", desc:"Richtext dengan toolbar", icon: FileText },
  { value:"date", label:"date", desc:"Tanggal", icon: Calendar },
  { value:"datetime", label:"datetime", desc:"Tanggal & jam", icon: Calendar },
  { value:"time", label:"time", desc:"Jam", icon: Clock },
  { value:"image", label:"image", desc:"Upload gambar", icon: ImageIcon },
  { value:"select", label:"select", desc:"Pilihan tunggal", icon: List },
  { value:"select_multiple", label:"select multiple", desc:"Pilihan jamak", icon: ListChecks },
  { value:"select_table", label:"select table relation", desc:"Relasi tabel (single)", icon: Link2 },
  { value:"select_table_multiple", label:"select table relation multiple", desc:"Relasi tabel (multiple)", icon: Link2 },
  { value:"number", label:"number", desc:"Angka + currency IDR", icon: Hash },
  { value:"hidden_operation_text", label:"hidden-operation-text", desc:"Otomatis hidden", icon: EyeOff },
  { value:"readonly_operation_text", label:"readonly-operation-text", desc:"Otomatis readonly", icon: EyeIcon },
]

function toSnake(s: string){ return s.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"") }

export default function GlobalTablesPage(){
  const [data,setData]=useState<any[]>([])
  const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState("")
  const [loading,setLoading]=useState(false)
  const [showModal,setShowModal]=useState(false)
  const [editing,setEditing]=useState<any>(null)
  const [tableForm,setTableForm]=useState({ name:"", displayName:"", description:"", status:"active" })
  const [columns,setColumns]=useState<ColumnForm[]>([
    { name:"nama", displayName:"Nama", type:"text", isRequired:true, isSearchable:true, isOrderable:true, orderIndex:0 },
    { name:"deskripsi", displayName:"Deskripsi", type:"richtext", orderIndex:1 },
  ])
  const [availableTables,setAvailableTables]=useState<any[]>([])
  const [availableColumns,setAvailableColumns]=useState<Record<string, any[]>>({})
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
  const loadTablesForRelation = async()=>{
    const res=await fetch(`/api/global-tables?limit=100`)
    const json=await res.json()
    setAvailableTables(json.data??[])
    // preload columns for each table for displayFields selector
    const map: Record<string, any[]> = {}
    for(const t of json.data??[]){
      try{
        const r=await fetch(`/api/global-tables/${t.id}`)
        const j=await r.json()
        map[t.name]=j.columns??[]
      }catch{}
    }
    setAvailableColumns(map)
  }
  useEffect(()=>{ load(1,""); loadTablesForRelation() },[])

  const handlePage=(p:number)=>{ setPage(p); load(p,search)}
  const handleSearch=(s:string)=>{ setSearch(s); setPage(1); load(1,s)}

  const openCreate=()=>{
    setEditing(null)
    setTableForm({ name:"", displayName:"", description:"", status:"active" })
    setColumns([{ name:"nama", displayName:"Nama", type:"text", isRequired:true, isSearchable:true, isOrderable:true, orderIndex:0 }])
    setShowModal(true)
  }
  const openEdit=async(row:any)=>{
    const res=await fetch(`/api/global-tables/${row.id}`)
    const full=await res.json()
    setEditing(full)
    setTableForm({ name: full.name, displayName: full.displayName, description: full.description||"", status: full.status })
    setColumns((full.columns||[]).map((c:any,i:number)=>({
      name:c.name, displayName:c.displayName, type:c.type,
      format: c.optionsJson ? JSON.parse(c.optionsJson).format : undefined,
      options: c.optionsJson ? JSON.parse(c.optionsJson).options : undefined,
      relationTable: c.optionsJson ? JSON.parse(c.optionsJson).relationTable : undefined,
      displayFields: c.optionsJson ? JSON.parse(c.optionsJson).displayFields : undefined,
      valueField: c.optionsJson ? JSON.parse(c.optionsJson).valueField : undefined,
      isCurrency: c.optionsJson ? JSON.parse(c.optionsJson).isCurrency : undefined,
      expression: c.optionsJson ? JSON.parse(c.optionsJson).expression : undefined,
      defaultValue: c.defaultValue, isRequired: !!c.isRequired, isOrderable: !!c.isOrderable, isSearchable: !!c.isSearchable, orderIndex: c.orderIndex??i
    })))
    setShowModal(true)
  }
  const addColumn=()=>{
    setColumns([...columns, { name:`kolom_${columns.length+1}`, displayName:`Kolom ${columns.length+1}`, type:"text", orderIndex: columns.length }])
  }
  const updateColumn=(idx:number, patch: Partial<ColumnForm>)=>{
    const next=[...columns]
    next[idx]={...next[idx], ...patch}
    // auto set default format per type
    if(patch.type){
      if(patch.type==="date" && !next[idx].format) next[idx].format="m-d-Y"
      if(patch.type==="datetime" && !next[idx].format) next[idx].format="m-d-Y H:i:s"
      if(patch.type==="time" && !next[idx].format) next[idx].format="H:i:s"
      if((patch.type==="select"||patch.type==="select_multiple") && !next[idx].options) next[idx].options=[{value:"opsi1",label:"Opsi 1"}]
      if((patch.type==="select_table"||patch.type==="select_table_multiple") && !next[idx].relationTable && availableTables[0]) next[idx].relationTable=availableTables[0].name
      if((patch.type==="hidden_operation_text"||patch.type==="readonly_operation_text") && !next[idx].expression) next[idx].expression=`"hasil dari "++${columns[0]?.name||"kolom1"}++" * "++${columns[1]?.name||"kolom2"}++" = "++ ${columns[0]?.name||"kolom1"} * ${columns[1]?.name||"kolom2"}`
    }
    setColumns(next)
  }
  const removeColumn=(idx:number)=>{
    setColumns(columns.filter((_,i)=>i!==idx).map((c,i)=>({...c, orderIndex:i})))
  }
  const moveColumn=(idx:number, dir:number)=>{
    const next=[...columns]
    const ni=idx+dir
    if(ni<0||ni>=next.length) return
    const tmp=next[idx]; next[idx]=next[ni]; next[ni]=tmp
    setColumns(next.map((c,i)=>({...c, orderIndex:i})))
  }

  const handleSubmit=async()=>{
    // validation
    if(!tableForm.name || !tableForm.displayName) { alert("Nama tabel & display wajib"); return }
    if(!/^[a-z_][a-z0-9_]*$/.test(tableForm.name)) { alert("Nama tabel harus snake_case, huruf kecil/underscore"); return }
    if(columns.length===0) { alert("Minimal 1 kolom"); return }
    for(const c of columns){
      if(!c.name || !c.displayName) { alert("Nama kolom & display wajib"); return }
      if(!/^[a-z_][a-z0-9_]*$/.test(c.name)) { alert(`Nama kolom ${c.name} harus snake_case`); return }
      if((c.type==="select"||c.type==="select_multiple") && (!c.options||c.options.length===0)) { alert(`Kolom ${c.name} tipe select butuh options`); return }
      if((c.type==="select_table"||c.type==="select_table_multiple") && !c.relationTable) { alert(`Kolom ${c.name} butuh relationTable`); return }
      if((c.type==="hidden_operation_text"||c.type==="readonly_operation_text") && !c.expression) { alert(`Kolom ${c.name} butuh expression`); return }
    }
    const payload:any={
      name: toSnake(tableForm.name),
      displayName: tableForm.displayName,
      description: tableForm.description,
      status: tableForm.status,
      columns: columns.map(c=>({
        name: toSnake(c.name),
        displayName: c.displayName,
        type: c.type,
        format: c.format,
        options: c.options,
        relationTable: c.relationTable,
        displayFields: c.displayFields,
        valueField: c.valueField,
        isCurrency: c.isCurrency,
        expression: c.expression,
        defaultValue: c.defaultValue,
        isRequired: !!c.isRequired,
        isOrderable: !!c.isOrderable,
        isSearchable: !!c.isSearchable,
        orderIndex: c.orderIndex,
      }))
    }
    const url=editing?`/api/global-tables/${editing.id}`:`/api/global-tables`
    const method=editing?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ setShowModal(false); load(page,search); loadTablesForRelation() } else { alert("Error: "+(await res.json()).message) }
  }
  const handleDelete=async(id:number)=>{
    if(!confirm("Hapus tabel? Ini akan hapus physical table dyn_* dan semua datanya!")) return
    await fetch(`/api/global-tables/${id}`,{method:"DELETE"})
    load(page,search)
  }

  return (
    <PageShell title="Generated Global Tabel" description="Kelola tabel dinamis — atur nama tabel, nama tampilan, dan kolom (13 tipe) dengan antarmuka visual. Tabel yang dibuat otomatis menjadi menu dan halaman browse." breadcrumbs={[{label:"Global Tabel"}]} actions={<Button onClick={openCreate}><Plus size={16}/> Buat Tabel Baru</Button>}>
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
            <button onClick={()=>openEdit(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]" title="Edit"><Pencil size={14}/></button>
            <button onClick={()=>handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Hapus"><Trash2 size={14}/></button>
          </div>},
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setShowModal(false)} />
          <div className="relative bg-white rounded-[16px] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-[#e6e6e6] p-4 flex items-center justify-between rounded-t-[16px] z-10">
              <div><div className="font-bold text-sm flex items-center gap-2"><Table size={16} className="text-[#0075de]"/>{editing?"Edit Tabel":"Buat Tabel Baru"}</div><div className="text-xs text-[#6b7280]">Antarmuka visual, tanpa kode</div></div>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-[#f6f5f4] rounded-full"><X size={18}/></button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Table meta */}
              <Card className="border-dashed"><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Settings size={14}/> Konfigurasi Tabel</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div><Label>Nama Tabel *</Label><Input value={tableForm.name} onChange={e=>setTableForm({...tableForm, name: toSnake(e.target.value)})} placeholder="pegawai" className="font-mono" /><div className="text-[11px] text-[#6b7280] mt-1">snake_case, akan jadi <code className="bg-[#f6f5f4] px-1 rounded border">dyn_{toSnake(tableForm.name)||"nama"}</code></div></div>
                  <div><Label>Nama Tampilan *</Label><Input value={tableForm.displayName} onChange={e=>setTableForm({...tableForm, displayName:e.target.value})} placeholder="Data Pegawai" /></div>
                  <div className="md:col-span-2"><Label>Deskripsi</Label><Textarea value={tableForm.description} onChange={e=>setTableForm({...tableForm, description:e.target.value})} placeholder="Deskripsi tabel..." rows={2}/></div>
                  <div><Label>Status</Label><Select value={tableForm.status} onChange={e=>setTableForm({...tableForm, status:e.target.value})}><option value="active">active</option><option value="archived">archived</option></Select></div>
                </CardContent>
              </Card>

              {/* Columns */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div><div className="font-bold text-sm flex items-center gap-2"><ListOrdered size={16}/> Daftar Kolom — {columns.length} kolom</div><div className="text-xs text-[#6b7280]">Tambah sesuai kebutuhan, 13 tipe tersedia</div></div>
                  <Button size="sm" onClick={addColumn}><Plus size={14}/> Tambah Kolom</Button>
                </div>

                <div className="space-y-4">
                  {columns.map((col, idx)=>(
                    <Card key={idx} className="border-[#e6e6e6] overflow-hidden">
                      <div className="bg-[#f9fafb] border-b border-[#e6e6e6] px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-[#0075de] text-white flex items-center justify-center text-xs font-bold">{idx+1}</span>
                          <span className="font-mono text-xs font-bold">{col.name || `kolom_${idx+1}`}</span>
                          <Badge variant="secondary" className="text-[11px]">{col.type}</Badge>
                          {col.isRequired && <Badge variant="destructive" className="text-[10px]">required</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={()=>moveColumn(idx,-1)} disabled={idx===0} className="p-1.5 rounded hover:bg-white disabled:opacity-30"><ArrowUpDown size={14} className="rotate-90"/></button>
                          <button onClick={()=>moveColumn(idx,1)} disabled={idx===columns.length-1} className="p-1.5 rounded hover:bg-white disabled:opacity-30"><ArrowUpDown size={14} className="-rotate-90"/></button>
                          <button onClick={()=>removeColumn(idx)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div><Label>Nama Kolom *</Label><Input value={col.name} onChange={e=>updateColumn(idx,{name: toSnake(e.target.value)})} placeholder="nama_column" className="font-mono h-8 text-xs" /></div>
                          <div><Label>Nama Tampilan *</Label><Input value={col.displayName} onChange={e=>updateColumn(idx,{displayName:e.target.value})} placeholder="Nama Kolom" className="h-8 text-xs" /></div>
                        </div>

                        <div><Label>Tipe Kolom *</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                            {columnTypeOptions.map(o=>(
                              <button key={o.value} onClick={()=>updateColumn(idx,{type:o.value})} className={`p-2 rounded-[8px] border text-left ${col.type===o.value?"bg-[#0075de] text-white border-[#0075de]":"bg-white hover:border-[#0075de]/30 border-[#e6e6e6]"}`}>
                                <div className="flex items-center gap-1.5"><o.icon size={12}/><span className="text-xs font-bold">{o.label}</span></div>
                                <div className={`text-[11px] ${col.type===o.value?"text-white/80":"text-[#6b7280]"}`}>{o.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Type-specific options */}
                        {(col.type==="date"||col.type==="datetime"||col.type==="time") && (
                          <div className="bg-amber-50 border border-amber-200 rounded-[8px] p-3">
                            <Label className="text-xs">Format Tampilan</Label>
                            <Input value={col.format||""} onChange={e=>updateColumn(idx,{format:e.target.value})} placeholder={col.type==="date"?"m-d-Y":col.type==="datetime"?"m-d-Y H:i:s":"H:i:s"} className="h-8 text-xs font-mono mt-1" />
                            <div className="text-[11px] text-amber-800 mt-1">Default: {col.type==="date"?"m-d-Y":col.type==="datetime"?"m-d-Y H:i:s":"H:i:s"} — akan dipakai saat render tabel</div>
                          </div>
                        )}

                        {(col.type==="select"||col.type==="select_multiple") && (
                          <div className="bg-violet-50 border border-violet-200 rounded-[8px] p-3">
                            <Label className="text-xs">Daftar Pilihan (Nilai & Label)</Label>
                            {(col.options||[]).map((opt,oi)=>(
                              <div key={oi} className="flex gap-2 mt-2">
                                <Input value={opt.value} onChange={e=>{ const no=[...(col.options||[])]; no[oi]={...no[oi], value:e.target.value}; updateColumn(idx,{options:no})}} placeholder="value" className="h-8 text-xs flex-1" />
                                <Input value={opt.label} onChange={e=>{ const no=[...(col.options||[])]; no[oi]={...no[oi], label:e.target.value}; updateColumn(idx,{options:no})}} placeholder="label" className="h-8 text-xs flex-1" />
                                <button onClick={()=>{ const no=(col.options||[]).filter((_,i)=>i!==oi); updateColumn(idx,{options:no})}} className="p-2 hover:bg-white rounded"><Trash2 size={12}/></button>
                              </div>
                            ))}
                            <Button size="sm" variant="outline" className="mt-2" onClick={()=>updateColumn(idx,{options:[...(col.options||[]), {value:`opsi${(col.options?.length||0)+1}`, label:`Opsi ${(col.options?.length||0)+1}`} ]})}><Plus size={12}/> Tambah Option</Button>
                          </div>
                        )}

                        {(col.type==="select_table"||col.type==="select_table_multiple") && (
                          <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-3 space-y-3">
                            <div><Label>Tabel Relasi</Label>
                              <Select value={col.relationTable||""} onChange={e=>updateColumn(idx,{relationTable:e.target.value})}>
                                <option value="">-- pilih tabel --</option>
                                {availableTables.map(t=><option key={t.name} value={t.name}>{t.displayName} ({t.name})</option>)}
                              </Select>
                            </div>
                            {col.relationTable && (
                              <>
                                <div><Label>Kolom yang Ditampilkan</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {(availableColumns[col.relationTable]||[]).map((c:any)=>(
                                      <label key={c.name} className={`px-2 py-1 rounded-full border text-xs flex items-center gap-1 cursor-pointer ${col.displayFields?.includes(c.name)?"bg-[#0075de] text-white border-[#0075de]":"bg-white border-[#e6e6e6]"}`}>
                                        <input type="checkbox" checked={!!col.displayFields?.includes(c.name)} onChange={e=>{
                                          const cur=col.displayFields||[]
                                          const next=e.target.checked?[...cur,c.name]:cur.filter((x:string)=>x!==c.name)
                                          updateColumn(idx,{displayFields:next})
                                        }} className="hidden" />{c.displayName} ({c.name})
                                      </label>
                                    ))}
                                    {(!availableColumns[col.relationTable]||availableColumns[col.relationTable].length===0) && <span className="text-xs text-[#6b7280]">Belum ada kolom di tabel relasi</span>}
                                  </div>
                                </div>
                                <div><Label>Kolom Nilai</Label>
                                  <Select value={col.valueField||""} onChange={e=>updateColumn(idx,{valueField:e.target.value})}>
                                    <option value="">-- pilih field --</option>
                                    {(availableColumns[col.relationTable]||[]).map((c:any)=><option key={c.name} value={c.name}>{c.name} — {c.displayName}</option>)}
                                  </Select>
                                  <div className="text-[11px] text-[#6b7280] mt-1">Value yang disimpan (biasanya id)</div>
                                </div>
                              </>
                            )}
                            <div className="text-[11px] text-blue-800">Tabel relasi akan ditampilkan sebagai tabel dengan searching all, ordering tiap kolom, dan checkbox di awal. {col.type==="select_table_multiple"?"Dapat pilih lebih dari satu.":"Hanya satu."}</div>
                          </div>
                        )}

                        {col.type==="number" && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-[8px] p-3">
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!col.isCurrency} onChange={e=>updateColumn(idx,{isCurrency:e.target.checked})} /> Format Mata Uang IDR</label>
                            <div className="text-[11px] text-emerald-800 mt-1">Jika dicentang, label akan menampilkan format IDR realtime saat input: contoh 1000000 → Rp 1.000.000</div>
                            {col.isCurrency && <div className="mt-2 p-2 bg-white border rounded text-xs">Preview: <span className="font-mono font-bold">Rp {Number(1234567).toLocaleString("id-ID")}</span></div>}
                          </div>
                        )}

                        {(col.type==="hidden_operation_text"||col.type==="readonly_operation_text") && (
                          <div className="bg-gray-900 text-white rounded-[8px] p-3">
                            <Label className="text-xs text-white">Rumus Otomatis</Label>
                            <Textarea value={col.expression||""} onChange={e=>updateColumn(idx,{expression:e.target.value})} placeholder={`"hasil dari "++nama_kolom1++" * "++nama_kolom2++" = "++ nama_kolom1 * nama_kolom2`} className="font-mono text-xs mt-2 bg-white text-black min-h-[80px]" />
                            <div className="text-[11px] text-gray-300 mt-2 leading-relaxed">
                              <div>++ untuk concat string, "" untuk string literal</div>
                              <div><code className="bg-white/10 px-1 rounded">* / + -</code> operasi aritmatika. Contoh: <code className="bg-white/10 px-1 rounded">"hasil dari "++col1++" * "++col2++" = "++ col1 * col2</code> → jika col1=1 col2=2 → "1 * 2 = 2"</div>
                              <div className="mt-1 flex gap-1 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">hidden: tidak tampil di form, auto hitung</Badge>
                                <Badge variant="secondary" className="text-[10px] bg-amber-500 text-white border-0">readonly: tampil disabled, auto hitung</Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                          <div><Label>Nilai Default</Label><Input value={col.defaultValue||""} onChange={e=>updateColumn(idx,{defaultValue:e.target.value})} placeholder="opsional" className="h-8 text-xs" /></div>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!col.isRequired} onChange={e=>updateColumn(idx,{isRequired:e.target.checked})} /> Wajib Diisi</label>
                            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!col.isOrderable} onChange={e=>updateColumn(idx,{isOrderable:e.target.checked})} /> Dapat Diurutkan</label>
                            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!col.isSearchable} onChange={e=>updateColumn(idx,{isSearchable:e.target.checked})} /> Dapat Dicari</label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-[#e6e6e6] p-4 flex justify-between items-center rounded-b-[16px]">
              <div className="text-xs text-[#6b7280]">GUI — tidak perlu JSON manual. Kolom akan jadi physical table <code className="bg-[#f6f5f4] px-1 rounded border">dyn_{toSnake(tableForm.name)||"..."}</code></div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={()=>setShowModal(false)}>Batal</Button>
                <Button onClick={handleSubmit}>{editing?"Update Tabel":"Buat Tabel"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
