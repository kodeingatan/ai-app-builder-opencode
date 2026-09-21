"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2, X } from "lucide-react"
import { evaluateOperation, getDependentColumns } from "@/lib/renderer/operationEngine"

type Col = {
  id:number, name:string, displayName:string, type:string, optionsJson:string|null, defaultValue:string|null, isRequired:boolean, isOrderable:boolean, isSearchable:boolean, orderIndex:number
}

export default function DynDataForm({ tableName, mode, id }: { tableName: string; mode: "create"|"edit"; id?: string }) {
  const router = useRouter()
  const [meta, setMeta] = useState<any>(null)
  const [columns, setColumns] = useState<Col[]>([])
  const [form, setForm] = useState<Record<string,any>>({})
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [relationData, setRelationData] = useState<Record<string, any[]>>({})
  const [relationSearch, setRelationSearch] = useState<Record<string,string>>({})
  const [showRelationFor, setShowRelationFor] = useState<string | null>(null)

  const loadMeta = async()=>{
    setLoadingMeta(true)
    try{
      const res=await fetch(`/api/global-tables?search=${tableName}&limit=10`)
      const j=await res.json()
      let found=(j.data||[]).find((t:any)=>t.name===tableName)
      if(!found){
        const r=await fetch(`/api/global-tables?limit=100`)
        const jj=await r.json()
        found=(jj.data||[]).find((t:any)=>t.name===tableName)
      }
      if(found){
        const r2=await fetch(`/api/global-tables/${found.id}`)
        const full=await r2.json()
        setMeta(full)
        setColumns(full.columns||[])
        if(mode==="create"){
          const init:Record<string,any>={}
          for(const c of full.columns||[]){
            if(c.type==="hidden_operation_text"||c.type==="readonly_operation_text") continue
            if(c.defaultValue) init[c.name]=c.defaultValue
            else if(c.type==="number") init[c.name]=""
            else init[c.name]=""
          }
          setForm(init)
        }
        // preload relation data
        for(const col of full.columns||[]){
          if(col.type==="select_table"||col.type==="select_table_multiple"){
            const opts = col.optionsJson ? JSON.parse(col.optionsJson) : {}
            const rel = opts.relationTable
            if(rel){
              fetch(`/api/dyn/${rel}?limit=100`).then(r=>r.json()).then(j=> setRelationData(prev=>({...prev, [col.name]: j.data||[]})) )
            }
          }
        }
      }
    }catch{}
    setLoadingMeta(false)
  }

  const loadRow = async()=>{
    if(mode==="edit" && id){
      setLoadingData(true)
      try{
        const res=await fetch(`/api/dyn/${tableName}/${id}`)
        if(res.ok){
          const row=await res.json()
          const copy:any={}
          // need columns to map correctly, if columns not yet loaded, wait
          const cols = columns.length ? columns : (meta?.columns||[])
          for(const c of cols){
            let v=row[c.name]
            if(c.type==="select_multiple"||c.type==="select_table_multiple"){
              try{ v= typeof v==="string" ? JSON.parse(v) : v }catch{}
              if(!Array.isArray(v)) v = v ? [v] : []
            }
            copy[c.name]=v??""
          }
          setForm(copy)
        }
      }catch{}
      setLoadingData(false)
    }
  }

  useEffect(()=>{ loadMeta() },[tableName])
  useEffect(()=>{ if(meta && mode==="edit") loadRow() },[meta, mode, id])
  // Also if columns loaded but form empty for edit, run loadRow again when columns ready
  useEffect(()=>{
    if(mode==="edit" && columns.length>0 && Object.keys(form).length===0){
      // columns just loaded, try to load row if not yet
      loadRow()
    }
  },[columns])

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
        payload[c.name]= form[c.name]
      } else {
        payload[c.name]=form[c.name]
      }
    }
    const url=mode==="edit" ? `/api/dyn/${tableName}/${id}` : `/api/dyn/${tableName}`
    const method=mode==="edit"?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){
      router.push(`/dyn/${tableName}`)
      router.refresh()
    } else alert((await res.json()).message)
  }

  if(loadingMeta) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat meta {tableName}...</div>
  if(!meta) return <div className="p-8 text-center text-sm text-[#6b7280]">Tabel {tableName} tidak ditemukan</div>

  return (
    <div className="space-y-3 bg-white rounded-[8px] border border-[#e6e6e6] p-3">
      <div className="flex items-center justify-between">
        <div className="font-bold text-sm">{mode==="edit" ? "Edit Data" : "Tambah Data"} — {meta.displayName} <span className="font-mono text-xs text-[#6b7280]">dyn_{tableName}</span></div>
        {loadingData && <span className="text-xs text-[#6b7280]">Memuat data...</span>}
      </div>

      {columns.map(col=>{
        const opts = col.optionsJson ? JSON.parse(col.optionsJson):{}
        const val = form[col.name] ?? ""
        const computedVal = computedForm[col.name] ?? ""
        if(col.type==="hidden_operation_text"){
          return <div key={col.name} className="hidden">
            <Input value={computedVal} readOnly className="hidden" />
          </div>
        }
        return (
          <div key={col.name} className="">
            <Label className="text-xs flex items-center gap-1">
              {col.displayName}
              {col.isRequired && <span className="text-red-600">*</span>}
              <span className="ml-auto text-[11px] font-mono text-[#9ca3af]">{col.type}</span>
            </Label>

            {col.type==="text" && <Input value={val} onChange={e=>handleChange(col.name, e.target.value)} placeholder={col.defaultValue||`Masukkan ${col.displayName}`} className="h-7 text-[13px] mt-1" />}

            {col.type==="richtext" && (
              <div className="mt-1 border border-[#e6e6e6] rounded-[8px] overflow-hidden">
                <div className="bg-[#f9fafb] border-b border-[#e6e6e6] px-2 py-1 flex items-center gap-1">
                  <button type="button" className="w-7 h-7 rounded hover:bg-white border border-transparent hover:border-[#e6e6e6] flex items-center justify-center text-xs font-bold" title="Bold" onClick={()=>handleChange(col.name, (val||"")+"<b>bold</b>")}>B</button>
                  <button type="button" className="w-7 h-7 rounded hover:bg-white flex items-center justify-center text-xs italic" title="Italic" onClick={()=>handleChange(col.name, (val||"")+"<i>italic</i>")}>I</button>
                  <button type="button" className="w-7 h-7 rounded hover:bg-white flex items-center justify-center text-xs underline" title="Underline" onClick={()=>handleChange(col.name, (val||"")+"<u>underline</u>")}>U</button>
                  <span className="text-[11px] text-[#6b7280] ml-2">Inline Styles | Block Styles | Lists | Table | Link | Image</span>
                </div>
                <Textarea value={val} onChange={e=>handleChange(col.name, e.target.value)} placeholder="Richtext HTML..." className="min-h-[80px] font-mono text-xs border-0 rounded-none" />
                <div className="bg-[#f6f5f4] px-2 py-1 text-[11px] text-[#6b7280]">Preview: <span dangerouslySetInnerHTML={{__html: val||"<span class='text-[#9ca3af]'>empty</span>"}} /></div>
              </div>
            )}

            {col.type==="date" && <Input type="date" value={val} onChange={e=>handleChange(col.name, e.target.value)} className="h-7 text-[13px] mt-1" />}
            {col.type==="datetime" && <Input type="datetime-local" value={val} onChange={e=>handleChange(col.name, e.target.value)} className="h-7 text-[13px] mt-1" />}
            {col.type==="time" && <Input type="time" value={val} onChange={e=>handleChange(col.name, e.target.value)} className="h-7 text-[13px] mt-1" />}
            {(col.type==="date"||col.type==="datetime"||col.type==="time") && <div className="text-[11px] text-[#6b7280] mt-1">Format display: {opts.format|| (col.type==="date"?"m-d-Y":col.type==="datetime"?"m-d-Y H:i:s":"H:i:s")}</div>}

            {col.type==="image" && (
              <div className="mt-1">
                <Input value={val} onChange={e=>handleChange(col.name, e.target.value)} placeholder="https:// atau /uploads/image.jpg" className="h-7 text-[13px]" />
                <div className="mt-2 flex items-center gap-2">
                  <Input type="file" accept="image/*" onChange={e=>{
                    const f=e.target.files?.[0]
                    if(f){
                      const url=URL.createObjectURL(f)
                      handleChange(col.name, url)
                    }
                  }} className="text-xs" />
                  {val && <img src={val} alt="preview" className="w-12 h-12 object-cover rounded border" />}
                </div>
              </div>
            )}

            {col.type==="select" && (
              <Select value={val} onChange={e=>handleChange(col.name, e.target.value)} className="h-7 text-[13px] mt-1">
                <option value="">-- pilih --</option>
                {(opts.options||[]).map((o:any)=><option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            )}
            {col.type==="select_multiple" && (
              <div className="mt-1 border border-[#e6e6e6] rounded-[8px] p-2 bg-[#fafafa] max-h-[110px] overflow-y-auto">
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
                  <Button type="button" size="sm" variant="outline" onClick={()=>{
                    setShowRelationFor(showRelationFor===col.name?null:col.name)
                    if(!relationData[col.name]){
                      const rel=opts.relationTable
                      if(rel) fetch(`/api/dyn/${rel}?limit=100`).then(r=>r.json()).then(j=> setRelationData(prev=>({...prev, [col.name]: j.data||[]})))
                    }
                  }}><Link2 size={12}/> Pilih dari {opts.relationTable||"tabel"}</Button>
                  <span className="text-xs text-[#6b7280] self-center">{Array.isArray(val)?`${val.length} terpilih`: val?`Terpilih: ${val}`:"Belum pilih"}</span>
                </div>
                {showRelationFor===col.name && (
                  <Card className="mt-2">
                    <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center justify-between"><span>Tabel {opts.relationTable}</span><Button type="button" size="sm" variant="ghost" onClick={()=>setShowRelationFor(null)}><X size={12}/></Button></CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Input value={relationSearch[col.name]||""} onChange={e=>setRelationSearch({...relationSearch, [col.name]: e.target.value})} placeholder="Searching all..." className="h-7 text-xs flex-1" />
                        <Button type="button" size="sm" variant="outline" onClick={()=>{
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
                      {col.type==="select_table_multiple" && <div className="p-2.5 border-t flex justify-end"><Button type="button" size="sm" onClick={()=>setShowRelationFor(null)}>Selesai ({Array.isArray(val)?val.length:0} terpilih)</Button></div>}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {col.type==="number" && (
              <div className="mt-1">
                <Input type="number" value={val} onChange={e=>handleChange(col.name, e.target.value)} placeholder="123" className="h-7 text-[13px]" />
                {opts.isCurrency && <div className="mt-2 text-sm">Preview: <span className="font-bold">Rp {Number(String(val).replace(/[^0-9.-]/g,"")||0).toLocaleString("id-ID")}</span> <span className="text-[11px] text-[#6b7280]">realtime</span></div>}
              </div>
            )}

            {col.type==="readonly_operation_text" && (
              <div className="mt-1">
                <Input value={computedVal} readOnly className="h-7 text-[13px] bg-amber-50 border-amber-200 font-mono" />
                <div className="text-[11px] text-amber-800 mt-1">Otomatis: <code className="bg-white px-1 rounded border font-mono">{opts.expression}</code> → <span className="font-bold">{computedVal}</span> (readonly, tidak bisa diedit)</div>
              </div>
            )}
          </div>
        )
      })}

      <div className="sticky bottom-0 bg-white border-t border-[#e6e6e6] -mx-3 -mb-3 p-2.5 flex justify-end gap-1.5 rounded-b-[8px]">
        <Button type="button" variant="outline" onClick={()=>router.push(`/dyn/${tableName}`)}>Batal</Button>
        <Button type="button" onClick={handleSubmit}>{mode==="edit"?"Update":"Simpan"}</Button>
      </div>
    </div>
  )
}
