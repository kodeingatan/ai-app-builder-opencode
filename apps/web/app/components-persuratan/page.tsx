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
import { Plus, Boxes, Trash2, Pencil, X, Eye, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Table, Link2, Image as ImageIcon, Undo, Redo, Quote, Heading1, Heading2, Sparkles } from "lucide-react"

type Binding = { name: string, type: "text"|"image"|"component", componentId?: number, width?: number, height?: number }

export default function ComponentsPersuratanPage(){
  const [data,setData]=useState<any[]>([])
  const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState("")
  const [loading,setLoading]=useState(false)
  const [showModal,setShowModal]=useState(false)
  const [editing,setEditing]=useState<any>(null)
  const [form,setForm]=useState({ name:"", isLooping:false, contentHtml:"<p>Ketik konten di sini... gunakan klik kanan untuk binding data</p>", bindings: [] as Binding[] })
  const [detail,setDetail]=useState<any>(null)
  const [previewHtml,setPreviewHtml]=useState("")
  const [showBindingPopup,setShowBindingPopup]=useState(false)
  const [bindingForm,setBindingForm]=useState<Binding>({ name:"", type:"text" })
  const [contextMenu,setContextMenu]=useState<{x:number,y:number}|null>(null)
  const [allComponents,setAllComponents]=useState<any[]>([])
  const editorRef=useRef<HTMLDivElement>(null)

  const load=async(p=page,s=search)=>{
    setLoading(true)
    const res=await fetch(`/api/persuratan/components?page=${p}&limit=10&search=${encodeURIComponent(s)}`)
    const j=await res.json()
    setData(j.data??[]); setTotal(j.total??0); setLoading(false)
  }
  const loadAll=async()=>{
    const res=await fetch(`/api/persuratan/components?limit=100`)
    const j=await res.json()
    setAllComponents(j.data??[])
  }
  useEffect(()=>{ load(1,""); loadAll() },[])

  const openCreate=()=>{ setEditing(null); setForm({ name:"", isLooping:false, contentHtml:"<p>Ketik konten component...</p>", bindings:[] }); setShowModal(true)}
  const openEdit=async(row:any)=>{
    setEditing(row)
    let bindings:Binding[]=[]
    try{ bindings=row.bindingsJson?JSON.parse(row.bindingsJson):[] }catch{}
    setForm({ name: row.name, isLooping: !!row.isLooping, contentHtml: row.contentHtml, bindings })
    setShowModal(true)
  }
  const handleSubmit=async()=>{
    if(!form.name) return alert("Nama component wajib")
    const payload={ name: form.name, isLooping: form.isLooping, contentHtml: form.contentHtml, bindingsJson: JSON.stringify(form.bindings) }
    const url=editing?`/api/persuratan/components/${editing.id}`:`/api/persuratan/components`
    const method=editing?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ setShowModal(false); load(page,search); loadAll() } else alert((await res.json()).message)
  }
  const handleDelete=async(id:number)=>{ if(!confirm("Hapus component?")) return; await fetch(`/api/persuratan/components/${id}`,{method:"DELETE"}); load(page,search)}

  const execCommand=(cmd:string,val?:string)=>{
    document.execCommand(cmd,false,val)
    if(editorRef.current) setForm({...form, contentHtml: editorRef.current.innerHTML})
  }
  const handleContextMenu=(e:React.MouseEvent)=>{
    e.preventDefault()
    setContextMenu({x:e.clientX, y:e.clientY})
  }
  const handleAddBinding=()=>{
    if(!bindingForm.name) return alert("Nama data wajib")
    const newBinding={...bindingForm}
    const newBindings=[...form.bindings, newBinding]
    // Insert placeholder at cursor or append
    let placeholder=""
    if(newBinding.type==="text") placeholder=`<span style="background:#dbeafe; border:1px dashed #3b82f6; padding:1px 4px; border-radius:4px; font-size:12px;" contenteditable="false">{{${newBinding.name}}}</span>&nbsp;`
    else if(newBinding.type==="image") placeholder=`<img src="{{${newBinding.name}}}" style="width:${newBinding.width||200}px; height:${newBinding.height||120}px; border:1px dashed #3b82f6; background:#eff6ff;" alt="{{${newBinding.name}}}" />`
    else if(newBinding.type==="component"){
      const comp=allComponents.find(c=>c.id===newBinding.componentId)
      placeholder=`<div style="border:2px dashed #8b5cf6; background:#f5f3ff; padding:8px; border-radius:8px; margin:4px 0;" contenteditable="false"><small style="color:#6b7280">Component: ${comp?.name||newBinding.componentId}</small><div>{{${newBinding.name}}}</div></div>`
    }
    if(editorRef.current){
      editorRef.current.focus()
      document.execCommand("insertHTML", false, placeholder)
      setForm({...form, contentHtml: editorRef.current.innerHTML, bindings: newBindings})
    } else {
      setForm({...form, bindings: newBindings})
    }
    setShowBindingPopup(false)
    setBindingForm({name:"",type:"text"})
    setContextMenu(null)
  }

  const renderPreview=()=>{
    let html=form.contentHtml
    // replace bindings with sample data preview
    for(const b of form.bindings){
      const sample = b.type==="image" ? "https://via.placeholder.com/200x120" : b.type==="component" ? "[component preview]" : `Contoh ${b.name}`
      html=html.replaceAll(`{{${b.name}}}`, sample).replaceAll(`{{ ${b.name} }}`, sample)
    }
    setPreviewHtml(html)
  }
  useEffect(()=>{ renderPreview() },[form.contentHtml, form.bindings])

  return (
    <PageShell title="Component Persuratan" description="Kelola komponen — buat, pratinjau, dan hapus. Editor mendukung pengulangan dan penyisipan data." breadcrumbs={[{label:"Persuratan"},{label:"Components"}]} actions={<Button onClick={openCreate}><Plus size={16}/> Buat Component</Button>}>
      <DataTable data={data} total={total} page={page} limit={10} totalPages={Math.ceil(total/10)} onPageChange={(p)=>{setPage(p); load(p,search)}} onSearch={(s)=>{setSearch(s); setPage(1); load(1,s)}} searchPlaceholder="Cari nama component..." loading={loading}
        columns={[
          {key:"name", header:"Nama", render:(r)=><div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-violet-100 flex items-center justify-center text-violet-600"><Boxes size={14}/></div><div><div className="font-bold text-xs">{r.name}</div><div className="text-[11px] text-[#6b7280]">{r.isLooping?"Looping":"Single"}</div></div></div>},
          {key:"bindings", header:"Bindings", render:(r)=>{ try{ const b=JSON.parse(r.bindingsJson||"[]"); return <span className="text-xs">{b.length} data</span>}catch{return "-"}}},
          {key:"preview", header:"Preview", render:(r)=><div className="text-xs max-w-[240px] truncate" dangerouslySetInnerHTML={{__html:(r.contentHtml||"").slice(0,80)}} />},
          {key:"actions", header:"Aksi", render:(r)=><div className="flex gap-1"><button onClick={()=>{setDetail(r); let b=[]; try{b=JSON.parse(r.bindingsJson||"[]")}catch{}; let html=r.contentHtml; for(const bb of b){ html=html.replaceAll(`{{${bb.name}}}`, `[${bb.name}]`)}; setPreviewHtml(html)}} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Eye size={14}/></button><button onClick={()=>openEdit(r)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><Pencil size={14}/></button><button onClick={()=>handleDelete(r.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14}/></button></div>}
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setShowModal(false)} />
          <div className="relative bg-white rounded-[16px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div><div className="font-bold text-sm">{editing?"Edit":"Buat"} Component Persuratan</div><div className="text-xs text-[#6b7280]">Isi nama, atur pengulangan, dan tulis konten</div></div>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-[#f6f5f4] rounded-full"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Nama Komponen *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Kop Surat / Tanda Tangan" /></div>
                <div className="flex items-end gap-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isLooping} onChange={e=>setForm({...form, isLooping:e.target.checked})} /> Pengulangan</label>{form.isLooping && <Badge variant="secondary">Looping: akan diulang per data</Badge>}</div>
              </div>

              <div>
                <Label>Konten Richtext — toolbar dasar | Klik kanan untuk menambahkan data</Label>
                <div className="border border-[#e6e6e6] rounded-[10px] overflow-hidden mt-1">
                  <div className="bg-[#f9fafb] border-b border-[#e6e6e6] p-2 flex flex-wrap items-center gap-1">
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded p-1">
                      <button onClick={()=>execCommand("bold")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Bold size={12}/></button>
                      <button onClick={()=>execCommand("italic")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Italic size={12}/></button>
                      <button onClick={()=>execCommand("underline")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Underline size={12}/></button>
                    </div>
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded p-1">
                      <button onClick={()=>execCommand("formatBlock","<h1>")} className="px-2 h-7 rounded hover:bg-[#f6f5f4] text-xs flex items-center gap-1"><Heading1 size={12}/> H1</button>
                      <button onClick={()=>execCommand("formatBlock","<h2>")} className="px-2 h-7 rounded hover:bg-[#f6f5f4] text-xs flex items-center gap-1"><Heading2 size={12}/> H2</button>
                      <button onClick={()=>execCommand("formatBlock","<blockquote>")} className="px-2 h-7 rounded hover:bg-[#f6f5f4] text-xs"><Quote size={12}/></button>
                    </div>
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded p-1">
                      <button onClick={()=>execCommand("justifyLeft")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignLeft size={12}/></button>
                      <button onClick={()=>execCommand("justifyCenter")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignCenter size={12}/></button>
                      <button onClick={()=>execCommand("justifyRight")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignRight size={12}/></button>
                      <button onClick={()=>execCommand("justifyFull")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><AlignJustify size={12}/></button>
                    </div>
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded p-1">
                      <button onClick={()=>execCommand("insertUnorderedList")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><List size={12}/></button>
                      <button onClick={()=>execCommand("insertOrderedList")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><ListOrdered size={12}/></button>
                      <button onClick={()=>{ const url=prompt("URL"); if(url) execCommand("createLink",url)}} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Link2 size={12}/></button>
                      <button onClick={()=>{ const url=prompt("URL gambar"); if(url) execCommand("insertImage",url)}} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><ImageIcon size={12}/></button>
                      <button onClick={()=>execCommand("insertHTML","<table border='1' style='border-collapse:collapse; width:100%'><tr><td style='padding:6px'>Cell 1</td><td style='padding:6px'>Cell 2</td></tr></table>")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Table size={12}/></button>
                    </div>
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded p-1">
                      <button onClick={()=>execCommand("undo")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Undo size={12}/></button>
                      <button onClick={()=>execCommand("redo")} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Redo size={12}/></button>
                    </div>
                    <div className="ml-auto text-[11px] text-[#6b7280] hidden md:block">Klik kanan di konten untuk binding</div>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    dangerouslySetInnerHTML={{__html: form.contentHtml}}
                    onInput={(e)=> setForm({...form, contentHtml: (e.target as HTMLDivElement).innerHTML})}
                    onContextMenu={handleContextMenu}
                    className="min-h-[180px] p-4 outline-none prose max-w-none text-sm"
                    style={{minHeight:180}}
                  />
                </div>
                <div className="text-[11px] text-[#6b7280] mt-1">Klik kanan pada editor untuk menambahkan data — pilih nama dan jenis tampilan yang diinginkan.</div>
              </div>

              {form.bindings.length>0 && (
                <div className="bg-violet-50 border border-violet-200 rounded-[8px] p-3">
                  <div className="text-xs font-bold text-violet-800">Bindings ({form.bindings.length})</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.bindings.map((b,i)=>(
                      <span key={i} className="px-2 py-1 bg-white border border-violet-200 rounded-full text-xs flex items-center gap-1">
                        {b.name} <Badge variant="secondary" className="text-[10px]">{b.type}</Badge>
                        {b.type==="image" && <span className="text-[10px]">{b.width}x{b.height}</span>}
                        {b.type==="component" && <span className="text-[10px]">→ {allComponents.find(c=>c.id===b.componentId)?.name||b.componentId}</span>}
                        <button onClick={()=> setForm({...form, bindings: form.bindings.filter((_,j)=>j!==i)})} className="p-0.5 hover:bg-red-50 rounded"><X size={10}/></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Card className="border-dashed"><CardHeader className="pb-2"><CardTitle className="text-sm">Pratinjau Komponen</CardTitle></CardHeader><CardContent><div className="border rounded-[8px] p-4 bg-white min-h-[120px]" dangerouslySetInnerHTML={{__html: previewHtml || "<span class='text-[#9ca3af]'>Preview kosong</span>"}} /></CardContent></Card>

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
          <div className="absolute bg-white border border-[#e6e6e6] rounded-[10px] shadow-xl p-3 w-[320px]" style={{left: Math.min(contextMenu.x, window.innerWidth-340), top: Math.min(contextMenu.y, window.innerHeight-300)}} onClick={e=>e.stopPropagation()}>
            <div className="font-bold text-sm mb-3">Tambah Data Terikat</div>
            <div className="space-y-3">
              <div><Label className="text-xs">Nama Data</Label><Input value={bindingForm.name} onChange={e=>setBindingForm({...bindingForm, name:e.target.value})} placeholder="nama_karyawan" className="h-8 text-xs font-mono" /></div>
              <div><Label className="text-xs">Jenis Tampilan</Label><Select value={bindingForm.type} onChange={e=>setBindingForm({...bindingForm, type:e.target.value as any})}><option value="text">Text</option><option value="image">Image</option><option value="component">Component</option></Select></div>
              {bindingForm.type==="text" && <div className="text-[11px] text-[#6b7280]">Teks: tampilkan teks dan atur gaya lewat toolbar</div>}
              {bindingForm.type==="image" && (
                <div className="space-y-2">
                  <div className="text-[11px] text-[#6b7280]">Gambar: atur lebar dan tinggi</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-[11px]">Width</Label><Input type="number" value={bindingForm.width||200} onChange={e=>setBindingForm({...bindingForm, width: Number(e.target.value)})} className="h-7 text-xs" /></div>
                    <div><Label className="text-[11px]">Height</Label><Input type="number" value={bindingForm.height||120} onChange={e=>setBindingForm({...bindingForm, height: Number(e.target.value)})} className="h-7 text-xs" /></div>
                  </div>
                </div>
              )}
              {bindingForm.type==="component" && (
                <div>
                  <div className="text-[11px] text-[#6b7280]">Komponen: pilih komponen yang sudah ada</div>
                  <Select value={String(bindingForm.componentId||"")} onChange={e=>setBindingForm({...bindingForm, componentId: Number(e.target.value)})}>
                    <option value="">-- pilih component --</option>
                    {allComponents.map(c=> <option key={c.id} value={c.id}>{c.name} {c.isLooping?"(looping)":""}</option>)}
                  </Select>
                  <div className="text-[11px] text-[#6b7280] mt-1">Syarat: component harus sudah memenuhi permintaan input yang dibuat sebelumnya</div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={()=>setContextMenu(null)}>Batal</Button>
                <Button size="sm" onClick={handleAddBinding}>Insert</Button>
              </div>
              <div className="text-[10px] text-[#9ca3af] mt-2">Popup muncul saat klik kanan di konten richtext</div>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><div className="font-bold text-sm">{detail.name}</div><button onClick={()=>setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6">
              <div className="detail-view">
                <div className="detail-field"><span className="detail-label">Looping</span><span className="detail-value">{detail.isLooping?"Ya":"Tidak"}</span></div>
                <div className="detail-field"><span className="detail-label">Content</span><div className="detail-value border rounded p-3 bg-[#fafafa]" dangerouslySetInnerHTML={{__html: detail.contentHtml}} /></div>
                <div className="detail-field"><span className="detail-label">Bindings</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded text-xs font-mono overflow-auto">{detail.bindingsJson||"[]"}</pre></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
