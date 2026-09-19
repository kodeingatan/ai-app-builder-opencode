"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileStack, X, Boxes, Eye, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Table, Link2, Image as ImageIcon, Undo, Redo, Heading1, Heading2, Sparkles, Check } from "lucide-react"

type CompUsage = { componentId:number, componentName?:string, dataMapping: Record<string, {source:"administrasi"|"tabel"|"manual", value:string}>, loopConfig?: {table:string, selectedRowIds:number[]}}

function placeCaretAtEnd(el: HTMLElement) {
  try {
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  } catch {}
}

function insertHtmlAtCaret(editor: HTMLElement, html: string) {
  editor.focus()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) {
    const temp = document.createElement("div")
    temp.innerHTML = html
    while (temp.firstChild) editor.appendChild(temp.firstChild)
    placeCaretAtEnd(editor)
    return
  }
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer) && range.commonAncestorContainer !== editor) {
    placeCaretAtEnd(editor)
    const newSel = window.getSelection()
    if (!newSel || newSel.rangeCount === 0) return
    const newRange = newSel.getRangeAt(0)
    const frag = newRange.createContextualFragment(html)
    const last = frag.lastChild
    newRange.insertNode(frag)
    if (last) {
      const after = document.createRange()
      after.setStartAfter(last as Node)
      after.collapse(true)
      newSel.removeAllRanges()
      newSel.addRange(after)
    }
    return
  }
  range.deleteContents()
  const frag = range.createContextualFragment(html)
  const last = frag.lastChild
  range.insertNode(frag)
  if (last) {
    const after = document.createRange()
    after.setStartAfter(last as Node)
    after.collapse(true)
    sel.removeAllRanges()
    sel.addRange(after)
  }
}

export default function PersuratanTemplateForm({ mode, id }: { mode:"create"|"edit"; id?: string }){
  const router = useRouter()
  const [form, setForm] = useState({ name:"", description:"", contentHtml:"<p>Tulis template di sini... klik kanan untuk insert component</p>" })
  const [components, setComponents] = useState<any[]>([])
  const [globalTables, setGlobalTables] = useState<any[]>([])
  const [usages, setUsages] = useState<CompUsage[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [formGenerated, setFormGenerated] = useState<any[]>([])
  const [contextMenu, setContextMenu] = useState<{x:number,y:number}|null>(null)
  const [selectedCompId, setSelectedCompId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const editorRef=useRef<HTMLDivElement>(null)
  const hasEditedRef = useRef(false)
  const isComposingRef = useRef(false)
  const initialHtmlRef = useRef(form.contentHtml)

  const loadDeps=async()=>{
    const [c,t]=await Promise.all([
      fetch("/api/persuratan/components?limit=100").then(r=>r.json()),
      fetch("/api/global-tables?limit=100").then(r=>r.json()),
    ])
    setComponents(c.data??[])
    setGlobalTables(t.data??[])
  }
  useEffect(()=>{ loadDeps() },[])

  useEffect(()=>{
    if (editorRef.current && !hasEditedRef.current) {
      if (editorRef.current.innerHTML !== initialHtmlRef.current) {
        editorRef.current.innerHTML = initialHtmlRef.current
      }
    }
  },[])

  useEffect(()=>{
    if (!hasEditedRef.current && editorRef.current) {
      if (editorRef.current.innerHTML !== form.contentHtml) {
        editorRef.current.innerHTML = form.contentHtml
        initialHtmlRef.current = form.contentHtml
      }
    } else {
      initialHtmlRef.current = form.contentHtml
    }
  },[form.contentHtml])

  useEffect(()=>{
    if(mode==="edit" && id){
      setLoading(true)
      fetch(`/api/persuratan/templates/${id}`).then(r=>r.json()).then(row=>{
        const html = row.contentHtml || "<p></p>"
        setForm({ name: row.name, description: row.description||"", contentHtml: html })
        initialHtmlRef.current = html
        if (editorRef.current) {
          editorRef.current.innerHTML = html
          setTimeout(()=> { if (editorRef.current) placeCaretAtEnd(editorRef.current)},0)
        }
        hasEditedRef.current = false
        try{ setUsages(row.componentsJson?JSON.parse(row.componentsJson):[]) }catch{ setUsages([])}
        setLoading(false)
      }).catch(()=>setLoading(false))
    }
  },[mode,id])

  const syncContent = useCallback(()=>{
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    initialHtmlRef.current = html
    setForm(prev => prev.contentHtml === html ? prev : {...prev, contentHtml: html})
  },[])

  const handleEditorInput = useCallback(()=>{
    if (isComposingRef.current) return
    hasEditedRef.current = true
    syncContent()
  },[syncContent])

  const handleCompositionStart = ()=>{ isComposingRef.current = true }
  const handleCompositionEnd = ()=>{
    isComposingRef.current = false
    hasEditedRef.current = true
    syncContent()
  }

  const handleSubmit=async()=>{
    let latestHtml = form.contentHtml
    if (editorRef.current) latestHtml = editorRef.current.innerHTML
    if(!latestHtml) latestHtml = initialHtmlRef.current
    if(!form.name) return alert("Nama wajib")
    const payload={ name: form.name, description: form.description, contentHtml: latestHtml, componentsJson: JSON.stringify(usages)}
    const url=mode==="edit"?`/api/persuratan/templates/${id}`:`/api/persuratan/templates`
    const method=mode==="edit"?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ router.push("/templates-persuratan"); router.refresh() } else alert((await res.json()).message)
  }

  const execCommand=(cmd:string,val?:string)=>{
    if (!editorRef.current) return
    editorRef.current.focus()
    try { document.execCommand(cmd,false,val) } catch {}
    hasEditedRef.current = true
    syncContent()
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
    const mapping: Record<string, {source:"administrasi"|"tabel"|"manual", value:string}> = {}
    for(const b of bindings){
      mapping[b.name]={source:"manual", value: `contoh_${b.name}`}
    }
    const usage:CompUsage={ componentId: compId, componentName: comp.name, dataMapping: mapping }
    if(comp.isLooping){
      const table=prompt("Component looping: masukkan nama tabel untuk loop (contoh: pegawai) — kosongkan untuk tanpa loop")
      if(table){
        usage.loopConfig={ table, selectedRowIds: [] }
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
    const placeholder=`<div style="border:2px dashed #3b82f6; background:#eff6ff; padding:8px; border-radius:8px; margin:6px 0;" contenteditable="false" data-component="${compId}"><small style="color:#6b7280">Component: ${comp.name} ${comp.isLooping?"(looping)":""}</small><div>${bindings.map((b:any)=>`{{${b.name}}} `).join("")}</div></div><p><br/></p>`
    if(editorRef.current){
      insertHtmlAtCaret(editorRef.current, placeholder)
      hasEditedRef.current = true
      const html = editorRef.current.innerHTML
      initialHtmlRef.current = html
      setForm(prev=> ({...prev, contentHtml: html}))
    }
    setContextMenu(null)
    setSelectedCompId("")
  }

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
    let latestHtml = form.contentHtml
    if (editorRef.current) latestHtml = editorRef.current.innerHTML
    const w=window.open("","_blank")
    if(w){
      let html=latestHtml
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

  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat data...</div>

  return (
    <div className="space-y-4 bg-white rounded-[12px] border border-[#e6e6e6] p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>Nama Template *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Surat Tugas" /></div>
        <div><Label>Deskripsi</Label><Input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Deskripsi template" /></div>
      </div>

      <div>
        <Label>Konten Richtext — klik kanan untuk opsi komponen</Label>
        <div className="border border-[#e6e6e6] rounded-[10px] overflow-hidden mt-1">
          <div className="bg-[#f9fafb] border-b p-2 flex flex-wrap gap-1">
            <div className="flex gap-1 bg-white border rounded p-1">
              <button type="button" onClick={()=>execCommand("bold")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Bold size={12}/></button>
              <button type="button" onClick={()=>execCommand("italic")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Italic size={12}/></button>
              <button type="button" onClick={()=>execCommand("underline")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Underline size={12}/></button>
            </div>
            <div className="flex gap-1 bg-white border rounded p-1">
              <button type="button" onClick={()=>execCommand("formatBlock","<h1>")} className="px-2 h-7 rounded hover:bg-[#f6f5f4] text-xs"><Heading1 size={12}/></button>
              <button type="button" onClick={()=>execCommand("formatBlock","<h2>")} className="px-2 h-7 rounded hover:bg-[#f6f5f4] text-xs"><Heading2 size={12}/></button>
              <button type="button" onClick={()=>execCommand("justifyLeft")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignLeft size={12}/></button>
              <button type="button" onClick={()=>execCommand("justifyCenter")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignCenter size={12}/></button>
              <button type="button" onClick={()=>execCommand("justifyRight")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignRight size={12}/></button>
              <button type="button" onClick={()=>execCommand("justifyFull")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignJustify size={12}/></button>
            </div>
            <div className="flex gap-1 bg-white border rounded p-1">
              <button type="button" onClick={()=>execCommand("insertUnorderedList")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><List size={12}/></button>
              <button type="button" onClick={()=>execCommand("insertOrderedList")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><ListOrdered size={12}/></button>
              <button type="button" onClick={()=>execCommand("insertHTML","<table border='1' style='width:100%; border-collapse:collapse'><tr><td style='padding:6px'>A</td><td style='padding:6px'>B</td></tr></table>")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Table size={12}/></button>
              <button type="button" onClick={()=>{const u=prompt("URL"); if(u) execCommand("createLink",u)}} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Link2 size={12}/></button>
              <button type="button" onClick={()=>{const u=prompt("URL gambar"); if(u) execCommand("insertImage",u)}} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><ImageIcon size={12}/></button>
            </div>
            <div className="flex gap-1 bg-white border rounded p-1">
              <button type="button" onClick={()=>execCommand("undo")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Undo size={12}/></button>
              <button type="button" onClick={()=>execCommand("redo")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Redo size={12}/></button>
            </div>
            <span className="ml-auto text-[11px] text-[#6b7280]">Klik kanan → pilih component</span>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onBlur={syncContent}
            onContextMenu={handleContextMenu}
            onKeyDown={(e)=>{ if(e.key==="Enter") setTimeout(()=> syncContent(),0)}}
            className="min-h-[180px] p-4 outline-none prose max-w-none text-sm focus:ring-0"
            style={{minHeight:180, wordBreak:"break-word"}}
          />
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
        <Button type="button" variant="outline" onClick={generateForm}><Eye size={14}/> Pratinjau Formulir</Button>
        <Button type="button" variant="outline" onClick={handlePreviewPdf}><FileStack size={14}/> Pratinjau PDF</Button>
      </div>

      {previewOpen && (
        <Card className="border-dashed"><CardHeader className="pb-2"><CardTitle className="text-sm">Formulir Pratinjau</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {formGenerated.length===0 ? <div className="text-xs text-[#6b7280]">Belum ada mapping</div> : formGenerated.map((f,i)=><div key={i} className="flex items-center gap-2 text-xs"><Badge variant="outline">{f.component}</Badge><span className="font-mono">{f.name}</span><span className="text-[#6b7280]">{f.source}:{f.value}</span><Input placeholder="Isi manual jika source manual" className="h-7 text-xs flex-1" /></div>)}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={()=>router.push("/templates-persuratan")}>Batal</Button>
        <Button onClick={handleSubmit}>{mode==="edit"?"Update":"Simpan"}</Button>
      </div>

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
    </div>
  )
}
