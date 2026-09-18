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
import { useEffect, useState, useRef } from "react"
import { Plus, FileStack, Trash2, Pencil, X, Eye, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Table, Link2, Image as ImageIcon, Undo, Redo, Quote, Heading1, Heading2, Sparkles, Boxes, Database, Check, Copy } from "lucide-react"

type CompUsage = { componentId:number, componentName?:string, dataMapping: Record<string, {source:"administrasi"|"tabel"|"manual", value:string}>, loopConfig?: {table:string, selectedRowIds:number[]}}

export default function TemplatesPersuratanPage(){
  const [data,setData]=useState<any[]>([])
  const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState("")
  const [loading,setLoading]=useState(false)
  const [showModal,setShowModal]=useState(false)
  const [editing,setEditing]=useState<any>(null)
  const [form,setForm]=useState({ name:"", description:"", contentHtml:"<p>Tulis template di sini... klik kanan untuk insert component</p>" })
  const [components,setComponents]=useState<any[]>([])
  const [globalTables,setGlobalTables]=useState<any[]>([])
  const [administrasiFields,setAdministrasiFields]=useState<any[]>([])
  const [usages,setUsages]=useState<CompUsage[]>([])
  const [detail,setDetail]=useState<any>(null)
  const [previewOpen,setPreviewOpen]=useState(false)
  const [formGenerated,setFormGenerated]=useState<any[]>([])
  const [contextMenu,setContextMenu]=useState<{x:number,y:number}|null>(null)
  const [selectedCompId,setSelectedCompId]=useState<string>("")
  const editorRef=useRef<HTMLDivElement>(null)

  const load=async(p=page,s=search)=>{
    setLoading(true)
    const res=await fetch(`/api/persuratan/templates?page=${p}&limit=10&search=${encodeURIComponent(s)}`)
    const j=await res.json()
    setData(j.data??[]); setTotal(j.total??0); setLoading(false)
  }
  const loadDeps=async()=>{
    const [c,t,a]=await Promise.all([
      fetch("/api/persuratan/components?limit=100").then(r=>r.json()),
      fetch("/api/global-tables?limit=100").then(r=>r.json()),
      fetch("/api/persuratan/administrations?limit=100").then(r=>r.json()),
    ])
    setComponents(c.data??[])
    setGlobalTables(t.data??[])
  }
  useEffect(()=>{ load(1,""); loadDeps() },[])

  const openCreate=()=>{ setEditing(null); setForm({ name:"", description:"", contentHtml:"<p>Tulis template...</p>"}); setUsages([]); setShowModal(true)}
  const openEdit=async(row:any)=>{
    setEditing(row)
    setForm({ name: row.name, description: row.description||"", contentHtml: row.contentHtml })
    try{ setUsages(row.componentsJson?JSON.parse(row.componentsJson):[]) }catch{ setUsages([])}
    setShowModal(true)
  }
  const handleSubmit=async()=>{
    if(!form.name) return alert("Nama wajib")
    const payload={ name: form.name, description: form.description, contentHtml: form.contentHtml, componentsJson: JSON.stringify(usages)}
    const url=editing?`/api/persuratan/templates/${editing.id}`:`/api/persuratan/templates`
    const method=editing?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ setShowModal(false); load(page,search)} else alert((await res.json()).message)
  }
  const handleDelete=async(id:number)=>{ if(!confirm("Hapus template?")) return; await fetch(`/api/persuratan/templates/${id}`,{method:"DELETE"}); load(page,search)}

  const execCommand=(cmd:string,val?:string)=>{
    document.execCommand(cmd,false,val)
    if(editorRef.current) setForm({...form, contentHtml: editorRef.current.innerHTML})
  }
  const handleContextMenu=(e:React.MouseEvent)=>{
    e.preventDefault()
    setContextMenu({x:e.clientX, y:e.clientY})
  }
  const handleInsertComponent=async()=>{
    if(!selectedCompId) return alert("Pilih component")
    const compId=Number(selectedCompId)
    const comp=components.find(c=>c.id===compId)
    if(!comp) return
    let bindings:any[]=[]
    try{ bindings=JSON.parse(comp.bindingsJson||"[]") }catch{}
    // Create usage with default mapping
    const mapping: Record<string, {source:"administrasi"|"tabel"|"manual", value:string}> = {}
    for(const b of bindings){
      mapping[b.name]={source:"manual", value: `contoh_${b.name}`}
    }
    const usage:CompUsage={ componentId: compId, componentName: comp.name, dataMapping: mapping }
    if(comp.isLooping){
      // Need table selection for looping
      const table=prompt("Component looping: masukkan nama tabel untuk loop (contoh: pegawai) — kosongkan untuk tanpa loop")
      if(table){
        usage.loopConfig={ table, selectedRowIds: [] }
        // fetch rows for selection
        try{
          const res=await fetch(`/api/dyn/${table}?limit=100`)
          const j=await res.json()
          const rows=j.data||[]
          const ids=rows.slice(0,3).map((r:any)=>r.id)
          const sel=confirm(`Ditemukan ${rows.length} rows. Pilih semua? OK=semua, Cancel=pilih 3 pertama`)
          usage.loopConfig.selectedRowIds= sel ? rows.map((r:any)=>r.id) : ids
        }catch{}
      }
    }
    setUsages([...usages, usage])
    // Insert placeholder into editor
    const placeholder=`<div style="border:2px dashed #3b82f6; background:#eff6ff; padding:8px; border-radius:8px; margin:6px 0;" contenteditable="false"><small style="color:#6b7280">Component: ${comp.name} ${comp.isLooping?"(looping)":""}</small><div>${bindings.map((b:any)=>`{{${b.name}}} `).join("")}</div></div>`
    if(editorRef.current){
      editorRef.current.focus()
      document.execCommand("insertHTML", false, placeholder)
      setForm({...form, contentHtml: editorRef.current.innerHTML})
    }
    setContextMenu(null)
    setSelectedCompId("")
  }

  // Generate form preview from usages (C.4)
  const generateForm=()=>{
    const fields:any[]=[]
    for(const u of usages){
      for(const [k,v] of Object.entries(u.dataMapping)){
        fields.push({name:k, source:v.source, value:v.value, component: u.componentName})
      }
      if(u.loopConfig){
        fields.push({name:`loop_${u.componentId}_table`, value:u.loopConfig.table, type:"loop_table"})
        fields.push({name:`loop_${u.componentId}_rows`, value:u.loopConfig.selectedRowIds.join(","), type:"loop_rows"})
      }
    }
    setFormGenerated(fields)
    setPreviewOpen(true)
  }

  const handlePreviewPdf=async()=>{
    // Simple preview via window print of contentHtml + usages
    const w=window.open("","_blank")
    if(w){
      let html=form.contentHtml
      // replace component placeholders with sample?
      for(const u of usages){
        const comp=components.find(c=>c.id===u.componentId)
        let compHtml=comp?.contentHtml||""
        for(const [k,v] of Object.entries(u.dataMapping)){
          const sample = v.source==="manual" ? v.value : `[${v.source}:${v.value}]`
          compHtml=compHtml.replaceAll(`{{${k}}}`, sample)
        }
        html+=`<hr/><div>${compHtml}</div>`
      }
      w.document.write(`<html><head><title>${form.name}</title><style>body{font-family:Inter, sans-serif; padding:24px;}</style></head><body>${html}</body></html>`)
      w.document.close()
      w.print()
    }
  }

  return (
    <PageShell title="Template Administrasi Persuratan" description="Kelola template — buat, atur komponen, pratinjau formulir, dan cetak PDF." breadcrumbs={[{label:"Persuratan"},{label:"Templates"}]} actions={<Button onClick={openCreate}><Plus size={16}/> Buat Template</Button>}>
      <DataTable data={data} total={total} page={page} limit={10} totalPages={Math.ceil(total/10)} onPageChange={(p)=>{setPage(p); load(p,search)}} onSearch={(s)=>{setSearch(s); setPage(1); load(1,s)}} searchPlaceholder="Cari template..." loading={loading}
        columns={[
          {key:"name", header:"Nama", render:(r)=><div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-amber-700"><FileStack size={14}/></div><div><div className="font-bold text-xs">{r.name}</div><div className="text-[11px] text-[#6b7280]">{r.description||"-"}</div></div></div>},
          {key:"components", header:"Components", render:(r)=>{ try{ const j=JSON.parse(r.componentsJson||"[]"); return <Badge variant="secondary">{j.length} comp</Badge>}catch{return "-"}}},
          {key:"actions", header:"Aksi", render:(r)=><div className="flex gap-1"><button onClick={()=>setDetail(r)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Eye size={14}/></button><button onClick={()=>openEdit(r)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Pencil size={14}/></button><button onClick={()=>handleDelete(r.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14}/></button></div>}
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setShowModal(false)} />
          <div className="relative bg-white rounded-[16px] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div><div className="font-bold text-sm">{editing?"Edit":"Buat"} Template Administrasi</div><div className="text-xs text-[#6b7280]">Isi nama, deskripsi, dan konten. Klik kanan di editor untuk menyisipkan komponen.</div></div>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-[#f6f5f4] rounded-full"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Nama Template *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Surat Tugas" /></div>
                <div><Label>Deskripsi</Label><Input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Deskripsi template" /></div>
              </div>

              <div>
                <Label>Konten Richtext — klik kanan untuk opsi komponen</Label>
                <div className="border border-[#e6e6e6] rounded-[10px] overflow-hidden mt-1">
                  <div className="bg-[#f9fafb] border-b p-2 flex flex-wrap gap-1">
                    <div className="flex gap-1 bg-white border rounded p-1">
                      <button onClick={()=>execCommand("bold")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Bold size={12}/></button>
                      <button onClick={()=>execCommand("italic")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Italic size={12}/></button>
                      <button onClick={()=>execCommand("underline")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Underline size={12}/></button>
                    </div>
                    <div className="flex gap-1 bg-white border rounded p-1">
                      <button onClick={()=>execCommand("formatBlock","<h1>")} className="px-2 h-7 rounded hover:bg-[#f6f5f4] text-xs"><Heading1 size={12}/></button>
                      <button onClick={()=>execCommand("formatBlock","<h2>")} className="px-2 h-7 rounded hover:bg-[#f6f5f4] text-xs"><Heading2 size={12}/></button>
                      <button onClick={()=>execCommand("justifyLeft")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignLeft size={12}/></button>
                      <button onClick={()=>execCommand("justifyCenter")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignCenter size={12}/></button>
                      <button onClick={()=>execCommand("justifyRight")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignRight size={12}/></button>
                      <button onClick={()=>execCommand("justifyFull")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignJustify size={12}/></button>
                    </div>
                    <div className="flex gap-1 bg-white border rounded p-1">
                      <button onClick={()=>execCommand("insertUnorderedList")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><List size={12}/></button>
                      <button onClick={()=>execCommand("insertOrderedList")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><ListOrdered size={12}/></button>
                      <button onClick={()=>execCommand("insertHTML","<table border='1' style='width:100%; border-collapse:collapse'><tr><td style='padding:6px'>A</td><td style='padding:6px'>B</td></tr></table>")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Table size={12}/></button>
                      <button onClick={()=>{const u=prompt("URL"); if(u) execCommand("createLink",u)}} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Link2 size={12}/></button>
                      <button onClick={()=>{const u=prompt("URL gambar"); if(u) execCommand("insertImage",u)}} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><ImageIcon size={12}/></button>
                    </div>
                    <div className="flex gap-1 bg-white border rounded p-1">
                      <button onClick={()=>execCommand("undo")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Undo size={12}/></button>
                      <button onClick={()=>execCommand("redo")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Redo size={12}/></button>
                    </div>
                    <span className="ml-auto text-[11px] text-[#6b7280]">Klik kanan → pilih component</span>
                  </div>
                  <div ref={editorRef} contentEditable dangerouslySetInnerHTML={{__html: form.contentHtml}} onInput={e=> setForm({...form, contentHtml: (e.target as HTMLDivElement).innerHTML})} onContextMenu={handleContextMenu} className="min-h-[180px] p-4 outline-none prose max-w-none text-sm" style={{minHeight:180}} />
                </div>
              </div>

              {usages.length>0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Boxes size={14}/> Komponen Terpasang ({usages.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {usages.map((u,idx)=>(
                      <div key={idx} className="border border-[#e6e6e6] rounded-[8px] p-3 bg-[#fafafa]">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xs flex items-center gap-2"><Boxes size={12}/>{u.componentName} <Badge variant="secondary" className="text-[10px]">{u.componentId}</Badge>{u.loopConfig && <Badge variant="outline" className="text-[10px]">looping: {u.loopConfig.table} ({u.loopConfig.selectedRowIds.length} rows)</Badge>}</div>
                          <button onClick={()=> setUsages(usages.filter((_,i)=>i!==idx))} className="p-1 hover:bg-white rounded"><X size={12}/></button>
                        </div>
                        <div className="mt-2 space-y-2">
                          {Object.entries(u.dataMapping).map(([k,v])=>(
                            <div key={k} className="grid grid-cols-3 gap-2 items-center text-xs">
                              <span className="font-mono bg-white border px-2 py-1 rounded">{k}</span>
                              <Select value={v.source} onChange={e=>{
                                const next=[...usages]; next[idx].dataMapping[k].source=e.target.value as any; setUsages(next)
                              }}>
                                <option value="manual">Manual</option>
                                <option value="administrasi">Administrasi Persuratan</option>
                                <option value="tabel">Tabel Global</option>
                              </Select>
                              <Input value={v.value} onChange={e=>{
                                const next=[...usages]; next[idx].dataMapping[k].value=e.target.value; setUsages(next)
                              }} placeholder={v.source==="manual"?"ketik manual": v.source==="tabel"?"nama_tabel.kolom":"field administrasi"} className="h-7 text-xs" />
                            </div>
                          ))}
                          {u.loopConfig && (
                            <div className="bg-white border rounded p-2 text-xs">
                              <div className="font-semibold">Pengaturan Pengulangan — pilih tabel & baris</div>
                              <div className="flex gap-2 mt-1">
                                <Select value={u.loopConfig.table} onChange={e=>{
                                  const next=[...usages]; next[idx].loopConfig!.table=e.target.value; setUsages(next)
                                }}>
                                  <option value="">-- pilih table --</option>
                                  {globalTables.map(t=><option key={t.name} value={t.name}>{t.displayName}</option>)}
                                </Select>
                                <Button size="sm" variant="outline" onClick={async()=>{
                                  const tbl=u.loopConfig?.table
                                  if(!tbl) return alert("Pilih table dulu")
                                  const res=await fetch(`/api/dyn/${tbl}?limit=100`)
                                  const j=await res.json()
                                  const rows=j.data||[]
                                  const sel=confirm(`Pilih semua ${rows.length} rows? OK=semua, Cancel=batal`)
                                  if(sel){
                                    const next=[...usages]; next[idx].loopConfig!.selectedRowIds=rows.map((r:any)=>r.id); setUsages(next)
                                  }
                                }}><Check size={12}/> Pilih Semua</Button>
                              </div>
                              <div className="text-[11px] text-[#6b7280] mt-1">Terpilih: {u.loopConfig.selectedRowIds.join(", ")||"belum"}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={generateForm}><Eye size={14}/> Pratinjau Formulir</Button>
                <Button variant="outline" onClick={handlePreviewPdf}><FileStack size={14}/> Pratinjau PDF</Button>
              </div>

              {previewOpen && (
                <Card className="border-dashed"><CardHeader className="pb-2"><CardTitle className="text-sm">Formulir Pratinjau</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {formGenerated.length===0 ? <div className="text-xs text-[#6b7280]">Belum ada mapping</div> : formGenerated.map((f,i)=><div key={i} className="flex items-center gap-2 text-xs"><Badge variant="outline">{f.component}</Badge><span className="font-mono">{f.name}</span><span className="text-[#6b7280]">{f.source}:{f.value}</span><Input placeholder="Isi manual jika source manual" className="h-7 text-xs flex-1" /></div>)}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setShowModal(false)}>Batal</Button>
                <Button onClick={handleSubmit}>{editing?"Update":"Simpan"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div className="fixed inset-0 z-40" onClick={()=>setContextMenu(null)}>
          <div className="absolute bg-white border rounded-[10px] shadow-xl p-3 w-[360px]" style={{left: Math.min(contextMenu.x, window.innerWidth-380), top: Math.min(contextMenu.y, window.innerHeight-300)}} onClick={e=>e.stopPropagation()}>
            <div className="font-bold text-sm mb-2 flex items-center gap-2"><Sparkles size={12} className="text-[#0075de]"/> Pilih Komponen</div>
            <Select value={selectedCompId} onChange={e=>setSelectedCompId(e.target.value)}>
              <option value="">-- pilih component --</option>
              {components.map(c=> <option key={c.id} value={c.id}>{c.name} {c.isLooping?"(looping)":""}</option>)}
            </Select>
            <div className="text-[11px] text-[#6b7280] mt-2">Atur sumber data untuk setiap komponen. Pilih dari administrasi, tabel, atau isi manual. Jika komponen mendukung pengulangan, pilih tabel dan baris yang akan dipakai.</div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={()=>setContextMenu(null)}>Batal</Button>
              <Button size="sm" onClick={handleInsertComponent}><Plus size={12}/> Insert</Button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><div className="font-bold text-sm">{detail.name}</div><button onClick={()=>setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6">
              <div className="detail-view">
                <div className="detail-field"><span className="detail-label">Deskripsi</span><span className="detail-value">{detail.description||"-"}</span></div>
                <div className="detail-field"><span className="detail-label">Content</span><div className="detail-value border rounded p-3 bg-[#fafafa]" dangerouslySetInnerHTML={{__html: detail.contentHtml}} /></div>
                <div className="detail-field"><span className="detail-label">Components</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded text-xs font-mono overflow-auto">{detail.componentsJson||"[]"}</pre></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
