"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Table, Trash2, X, ArrowUpDown, Settings, ListOrdered, Type, FileText, Calendar, Clock, Hash, Link2, ListChecks, List, EyeOff, Eye as EyeIcon, Image as ImageIcon } from "lucide-react"
import { toSnake } from "@/lib/utils/slug"

type ColumnType = "text"|"richtext"|"date"|"datetime"|"time"|"image"|"select"|"select_multiple"|"select_table"|"select_table_multiple"|"number"|"hidden_operation_text"|"readonly_operation_text"

type ColumnForm = {
  name: string
  displayName: string
  type: ColumnType
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

export default function GlobalTableForm({ mode, id }: { mode: "create"|"edit"; id?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tableForm, setTableForm] = useState({ name:"", displayName:"", description:"", status:"active" })
  const [columns, setColumns] = useState<ColumnForm[]>([
    { name:"nama", displayName:"Nama", type:"text", isRequired:true, isSearchable:true, isOrderable:true, orderIndex:0 },
    { name:"deskripsi", displayName:"Deskripsi", type:"richtext", orderIndex:1 },
  ])
  const [availableTables, setAvailableTables] = useState<any[]>([])
  const [availableColumns, setAvailableColumns] = useState<Record<string, any[]>>({})

  const loadTablesForRelation = async()=>{
    const res=await fetch(`/api/global-tables?limit=100`)
    const json=await res.json()
    setAvailableTables(json.data??[])
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

  useEffect(()=>{ loadTablesForRelation() },[])

  useEffect(()=>{
    if(mode==="edit" && id){
      (async()=>{
        setLoading(true)
        try{
          const res=await fetch(`/api/global-tables/${id}`)
          if(res.ok){
            const full=await res.json()
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
          }
        }catch{}
        setLoading(false)
      })()
    }
  },[mode, id])

  const addColumn=()=>{
    setColumns([...columns, { name:`kolom_${columns.length+1}`, displayName:`Kolom ${columns.length+1}`, type:"text", orderIndex: columns.length }])
  }
  const updateColumn=(idx:number, patch: Partial<ColumnForm>)=>{
    const next=[...columns]
    next[idx]={...next[idx], ...patch}
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
    const url=mode==="edit" ? `/api/global-tables/${id}` : `/api/global-tables`
    const method=mode==="edit" ? "PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){
      router.push("/global-tables")
      router.refresh()
    } else { alert("Error: "+(await res.json()).message) }
  }

  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat data...</div>

  return (
    <div className="space-y-3">
      <Card className="border-dashed"><CardHeader className="pb-3"><CardTitle className="text-[13px] flex items-center gap-1.5"><Settings size={14}/> Konfigurasi Tabel</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-2.5">
          <div><Label>Nama Tabel *</Label><Input value={tableForm.name} onChange={e=>setTableForm({...tableForm, name: toSnake(e.target.value)})} placeholder="pegawai" className="font-mono" disabled={mode==="edit"} /><div className="text-[11px] text-[#6b7280] mt-1">snake_case, akan jadi <code className="bg-[#f6f5f4] px-1 rounded border">dyn_{toSnake(tableForm.name)||"nama"}</code>{mode==="edit" && <span className="text-amber-600"> — tidak bisa diubah saat edit</span>}</div></div>
          <div><Label>Nama Tampilan *</Label><Input value={tableForm.displayName} onChange={e=>setTableForm({...tableForm, displayName:e.target.value})} placeholder="Data Pegawai" /></div>
          <div className="md:col-span-2"><Label>Deskripsi</Label><Textarea value={tableForm.description} onChange={e=>setTableForm({...tableForm, description:e.target.value})} placeholder="Deskripsi tabel..." rows={2}/></div>
          <div><Label>Status</Label><Select value={tableForm.status} onChange={e=>setTableForm({...tableForm, status:e.target.value})}><option value="active">active</option><option value="archived">archived</option></Select></div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div><div className="font-bold text-[13px] flex items-center gap-1.5"><ListOrdered size={16}/> Daftar Kolom — {columns.length} kolom</div><div className="text-xs text-[#6b7280]">Tambah sesuai kebutuhan, 13 tipe tersedia</div></div>
          <Button size="sm" onClick={addColumn}><Plus size={14}/> Tambah Kolom</Button>
        </div>

        <div className="space-y-2.5">
          {columns.map((col, idx)=>(
            <Card key={idx} className="border-[#e6e6e6] overflow-hidden">
              <div className="bg-[#f9fafb] border-b border-[#e6e6e6] px-2.5 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0075de] text-white flex items-center justify-center text-[11px] font-bold">{idx+1}</span>
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
              <CardContent className="p-2.5 space-y-2.5">
                <div className="grid md:grid-cols-2 gap-2.5">
                  <div><Label>Nama Kolom *</Label><Input value={col.name} onChange={e=>updateColumn(idx,{name: toSnake(e.target.value)})} placeholder="nama_column" className="font-mono h-7 text-[13px]" /></div>
                  <div><Label>Nama Tampilan *</Label><Input value={col.displayName} onChange={e=>updateColumn(idx,{displayName:e.target.value})} placeholder="Nama Kolom" className="h-7 text-[13px]" /></div>
                </div>

                <div><Label>Tipe Kolom *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mt-1">
                    {columnTypeOptions.map(o=>(
                      <button key={o.value} onClick={()=>updateColumn(idx,{type:o.value})} className={`p-1.5 rounded-[8px] border text-left ${col.type===o.value?"bg-[#0075de] text-white border-[#0075de]":"bg-white hover:border-[#0075de]/30 border-[#e6e6e6]"}`}>
                        <div className="flex items-center gap-1.5"><o.icon size={12}/><span className="text-xs font-bold">{o.label}</span></div>
                        <div className={`text-[11px] ${col.type===o.value?"text-white/80":"text-[#6b7280]"}`}>{o.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {(col.type==="date"||col.type==="datetime"||col.type==="time") && (
                  <div className="bg-amber-50 border border-amber-200 rounded-[8px] p-2.5">
                    <Label className="text-xs">Format Tampilan</Label>
                    <Input value={col.format||""} onChange={e=>updateColumn(idx,{format:e.target.value})} placeholder={col.type==="date"?"m-d-Y":col.type==="datetime"?"m-d-Y H:i:s":"H:i:s"} className="h-7 text-[13px] font-mono mt-1" />
                    <div className="text-[11px] text-amber-800 mt-1">Default: {col.type==="date"?"m-d-Y":col.type==="datetime"?"m-d-Y H:i:s":"H:i:s"} — akan dipakai saat render tabel</div>
                  </div>
                )}

                {(col.type==="select"||col.type==="select_multiple") && (
                  <div className="bg-violet-50 border border-violet-200 rounded-[8px] p-2.5">
                    <Label className="text-xs">Daftar Pilihan (Nilai & Label)</Label>
                    {(col.options||[]).map((opt,oi)=>(
                      <div key={oi} className="flex gap-1.5 mt-1.5">
                        <Input value={opt.value} onChange={e=>{ const no=[...(col.options||[])]; no[oi]={...no[oi], value:e.target.value}; updateColumn(idx,{options:no})}} placeholder="value" className="h-7 text-[13px] flex-1" />
                        <Input value={opt.label} onChange={e=>{ const no=[...(col.options||[])]; no[oi]={...no[oi], label:e.target.value}; updateColumn(idx,{options:no})}} placeholder="label" className="h-7 text-[13px] flex-1" />
                        <button onClick={()=>{ const no=(col.options||[]).filter((_,i)=>i!==oi); updateColumn(idx,{options:no})}} className="p-1.5 hover:bg-white rounded"><Trash2 size={12}/></button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="mt-2" onClick={()=>updateColumn(idx,{options:[...(col.options||[]), {value:`opsi${(col.options?.length||0)+1}`, label:`Opsi ${(col.options?.length||0)+1}`} ]})}><Plus size={12}/> Tambah Option</Button>
                  </div>
                )}

                {(col.type==="select_table"||col.type==="select_table_multiple") && (
                  <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-2.5 space-y-3">
                    <div><Label>Tabel Relasi</Label>
                      <Select value={col.relationTable||""} onChange={e=>updateColumn(idx,{relationTable:e.target.value})}>
                        <option value="">-- pilih tabel --</option>
                        {availableTables.map(t=><option key={t.name} value={t.name}>{t.displayName} ({t.name})</option>)}
                      </Select>
                    </div>
                    {col.relationTable && (
                      <>
                        <div><Label>Kolom yang Ditampilkan</Label>
                          <div className="flex flex-wrap gap-1.5 mt-1">
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
                  <div className="bg-emerald-50 border border-emerald-200 rounded-[8px] p-2.5">
                    <label className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" checked={!!col.isCurrency} onChange={e=>updateColumn(idx,{isCurrency:e.target.checked})} /> Format Mata Uang IDR</label>
                    <div className="text-[11px] text-emerald-800 mt-1">Jika dicentang, label akan menampilkan format IDR realtime saat input: contoh 1000000 → Rp 1.000.000</div>
                    {col.isCurrency && <div className="mt-1.5 p-1.5 bg-white border rounded text-xs">Preview: <span className="font-mono font-bold">Rp {Number(1234567).toLocaleString("id-ID")}</span></div>}
                  </div>
                )}

                {(col.type==="hidden_operation_text"||col.type==="readonly_operation_text") && (
                  <div className="bg-gray-900 text-white rounded-[8px] p-2.5">
                    <Label className="text-xs text-white">Rumus Otomatis</Label>
                    <Textarea value={col.expression||""} onChange={e=>updateColumn(idx,{expression:e.target.value})} placeholder={`"hasil dari "++nama_kolom1++" * "++nama_kolom2++" = "++ nama_kolom1 * nama_kolom2`} className="font-mono text-xs mt-2 bg-white text-black min-h-[80px]" />
                    <div className="text-[11px] text-gray-300 mt-2 leading-relaxed">
                      <div>++ untuk concat string, "" untuk string literal</div>
                      <div><code className="bg-white/10 px-1 rounded">* / + -</code> operasi aritmatika. Contoh: <code className="bg-white/10 px-1 rounded">"hasil dari "++col1++" * "++col2++" = "++ col1 * col2</code> → jika col1=1 col2=2 → "1 * 2 = 2"</div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-2.5">
                  <div><Label>Nilai Default</Label><Input value={col.defaultValue||""} onChange={e=>updateColumn(idx,{defaultValue:e.target.value})} placeholder="opsional" className="h-7 text-[13px]" /></div>
                  <div className="flex flex-col gap-1.5">
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

      <div className="sticky bottom-0 bg-white border border-[#e6e6e6] p-2.5 flex justify-between items-center rounded-[8px] mt-3">
        <div className="text-xs text-[#6b7280]">GUI — tidak perlu JSON manual. Kolom akan jadi physical table <code className="bg-[#f6f5f4] px-1 rounded border">dyn_{toSnake(tableForm.name)||"..."}</code></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>router.push("/global-tables")}>Batal</Button>
          <Button onClick={handleSubmit}>{mode==="edit"?"Update Tabel":"Buat Tabel"}</Button>
        </div>
      </div>
    </div>
  )
}
