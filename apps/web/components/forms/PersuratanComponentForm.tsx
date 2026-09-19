"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableHeader from "@tiptap/extension-table-header"
import TableCell from "@tiptap/extension-table-cell"
import Placeholder from "@tiptap/extension-placeholder"
import { Node, mergeAttributes } from "@tiptap/core"
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table as TableIcon, Link2, Image as ImageIcon, Undo, Redo, Quote, Heading1, Heading2, Heading3,
  Minus, Eraser, X, Plus, Sparkles, Eye, Boxes, Trash2, Copy, Info, FileText, Settings2, LayoutTemplate, MousePointer2,
  Palette, Pipette, Rows3, Columns3, Trash, Combine, Split, ArrowUp, ArrowDown, MinusSquare, PaintBucket, Grid3x3, Type, Highlighter
} from "lucide-react"

type Binding = { name: string, type: "text"|"image"|"component", componentId?: number, width?: number, height?: number }
type Toast = { id:number, message:string, type:'success'|'error'|'info' }

// --- Custom Inline Binding (pill) ---
const InlineBinding = Node.create({
  name: 'inlineBinding',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-binding'),
        renderHTML: (attrs: any) => ({ 'data-binding': attrs.name })
      }
    }
  },
  parseHTML() { return [{ tag: 'span[data-binding]' }] },
  renderHTML({ node, HTMLAttributes }: any) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-binding': node.attrs.name,
      'class': 'inline-flex items-center gap-1 bg-[#dbeafe] border border-dashed border-[#3b82f6] px-2 py-0.5 rounded-full text-xs font-mono text-[#1e40af] select-none whitespace-nowrap align-baseline mx-0.5',
      'style': 'background:#dbeafe;border:1px dashed #3b82f6;padding:2px 6px;border-radius:9999px;font-size:12px;display:inline-flex;align-items:center;font-family:ui-monospace,monospace;',
      'contenteditable': 'false',
    }), `{{${node.attrs.name}}}`]
  },
})

// --- Custom Component Block ---
const ComponentBinding = Node.create({
  name: 'componentBinding',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      name: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('data-binding'), renderHTML: (attrs: any) => ({ 'data-binding': attrs.name }) },
      componentId: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('data-component') ? Number(el.getAttribute('data-component')) : null, renderHTML: (attrs: any) => attrs.componentId ? { 'data-component': String(attrs.componentId) } : {} },
      componentName: { default: null }
    }
  },
  parseHTML() { return [{ tag: 'div[data-component]' }, { tag: 'div[data-binding][style*="dashed"]' }] },
  renderHTML({ node, HTMLAttributes }: any) {
    const compLabel = node.attrs.componentName ? `Component: ${node.attrs.componentName}` : (node.attrs.componentId ? `Component #${node.attrs.componentId}` : 'Component')
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-binding': node.attrs.name,
      ...(node.attrs.componentId ? { 'data-component': String(node.attrs.componentId) } : {}),
      'class': 'my-3 rounded-[10px] border-2 border-dashed border-[#8b5cf6] bg-[#f5f3ff] p-3 select-none',
      'style': 'border:2px dashed #8b5cf6;background:#f5f3ff;padding:12px;border-radius:10px;margin:12px 0;',
      'contenteditable': 'false',
    }),
      ['div', { 'class': 'flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[#6d28d9] uppercase' }, `${compLabel} · {{${node.attrs.name}}}`],
      ['div', { 'class': 'mt-1 text-xs text-[#4c1d95] font-mono bg-white/70 border border-violet-200 rounded px-2 py-1 inline-block' }, `{{${node.attrs.name}}}`]
    ]
  }
})

// --- Custom Image with data-binding support ---
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-binding': {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-binding'),
        renderHTML: (attrs: any) => attrs['data-binding'] ? { 'data-binding': attrs['data-binding'] } : {}
      },
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.width ? parseInt(el.style.width) : (el.getAttribute('width') ? Number(el.getAttribute('width')) : null),
        renderHTML: (attrs: any) => attrs.width ? { width: String(attrs.width) } : {}
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.height ? parseInt(el.style.height) : (el.getAttribute('height') ? Number(el.getAttribute('height')) : null),
        renderHTML: (attrs: any) => attrs.height ? { height: String(attrs.height) } : {}
      }
    }
  },
  parseHTML() {
    return [
      {
        tag: 'img[data-binding]',
        getAttrs: (el: HTMLElement) => {
          const binding = el.getAttribute('data-binding')
          const styleW = el.style.width ? parseInt(el.style.width as string) : null
          const styleH = el.style.height ? parseInt(el.style.height as string) : null
          const src = el.getAttribute('src') || ''
          const isTemplate = src?.startsWith('{{')
          return {
            src: isTemplate ? `https://via.placeholder.com/${styleW||200}x${styleH||120}?text=${encodeURIComponent(binding||'img')}` : src,
            'data-binding': binding,
            alt: el.getAttribute('alt') || `{{${binding}}}`,
            width: styleW || 200,
            height: styleH || 120,
          }
        }
      },
      { tag: 'img[src]:not([data-binding])' }
    ]
  },
  renderHTML({ HTMLAttributes }: any) {
    const binding = HTMLAttributes['data-binding']
    if (binding) {
      const w = HTMLAttributes.width || 200
      const h = HTMLAttributes.height || 120
      return ['img', mergeAttributes(HTMLAttributes, {
        src: `{{${binding}}}`,
        alt: `{{${binding}}}`,
        'data-binding': binding,
        style: `width:${w}px; height:${h}px; border:1px dashed #3b82f6; background:#eff6ff; display:inline-block; border-radius:8px; object-fit:cover;`,
        class: 'rounded-[8px] border border-dashed border-[#3b82f6] bg-[#eff6ff] mx-1 align-middle'
      })]
    }
    return ['img', mergeAttributes(HTMLAttributes, { class: 'rounded-[8px] max-w-full' })]
  }
})

// --- Custom Table Cell with background, verticalAlign, borders ---
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.backgroundColor || el.getAttribute('data-bg-color') || null,
        renderHTML: (attrs: any) => {
          if (!attrs.backgroundColor) return {}
          return { 'data-bg-color': attrs.backgroundColor, style: `background-color: ${attrs.backgroundColor}` }
        },
      },
      verticalAlign: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.verticalAlign || el.getAttribute('data-valign') || null,
        renderHTML: (attrs: any) => {
          if (!attrs.verticalAlign) return {}
          return { 'data-valign': attrs.verticalAlign, style: `vertical-align: ${attrs.verticalAlign}` }
        },
      },
      borderColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.borderColor || el.getAttribute('data-border-color') || null,
        renderHTML: (attrs: any) => attrs.borderColor ? { 'data-border-color': attrs.borderColor, style: `border-color: ${attrs.borderColor}` } : {}
      },
      borderWidth: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.borderWidth || el.getAttribute('data-border-width') || null,
        renderHTML: (attrs: any) => attrs.borderWidth ? { style: `border-width: ${attrs.borderWidth}` } : {}
      },
      borderStyle: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.borderStyle || el.getAttribute('data-border-style') || null,
        renderHTML: (attrs: any) => attrs.borderStyle ? { style: `border-style: ${attrs.borderStyle}` } : {}
      },
    }
  }
})

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.backgroundColor || el.getAttribute('data-bg-color') || null,
        renderHTML: (attrs: any) => {
          if (!attrs.backgroundColor) return {}
          return { 'data-bg-color': attrs.backgroundColor, style: `background-color: ${attrs.backgroundColor}` }
        },
      },
      verticalAlign: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.verticalAlign || el.getAttribute('data-valign') || null,
        renderHTML: (attrs: any) => attrs.verticalAlign ? { 'data-valign': attrs.verticalAlign, style: `vertical-align: ${attrs.verticalAlign}` } : {}
      },
      borderColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.borderColor || el.getAttribute('data-border-color') || null,
        renderHTML: (attrs: any) => attrs.borderColor ? { 'data-border-color': attrs.borderColor, style: `border-color: ${attrs.borderColor}` } : {}
      },
      borderWidth: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.borderWidth || el.getAttribute('data-border-width') || null,
        renderHTML: (attrs: any) => attrs.borderWidth ? { style: `border-width: ${attrs.borderWidth}` } : {}
      },
      borderStyle: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.borderStyle || el.getAttribute('data-border-style') || null,
        renderHTML: (attrs: any) => attrs.borderStyle ? { style: `border-style: ${attrs.borderStyle}` } : {}
      },
    }
  }
})

export default function PersuratanComponentForm({ mode, id }: { mode: "create"|"edit"; id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ name:"", isLooping:false, contentHtml:"<p></p>", bindings: [] as Binding[] })
  const [previewHtml, setPreviewHtml] = useState("")
  const [contextMenu, setContextMenu] = useState<{x:number,y:number}|null>(null)
  const [bindingForm, setBindingForm] = useState<Binding>({ name:"", type:"text", width:200, height:120 })
  const [allComponents, setAllComponents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)
  const [showPreview, setShowPreview] = useState(true)
  const savedPosRef = useRef<number | null>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [linkModal, setLinkModal] = useState<{open:boolean, url:string}>({open:false, url:''})
  const [imageModal, setImageModal] = useState<{open:boolean, url:string}>({open:false, url:''})
  const [cellBg, setCellBg] = useState('#ffffff')

  const showToast = (message:string, type:Toast['type']='error')=>{
    const id = Date.now() + Math.random()
    setToasts(prev=> [...prev, {id, message, type}])
    setTimeout(()=> setToasts(prev=> prev.filter(t=>t.id!==id)), 3200)
  }

  const loadAll=async()=>{
    const res=await fetch(`/api/persuratan/components?limit=100`)
    const j=await res.json()
    setAllComponents(j.data??[])
  }

  useEffect(()=>{ loadAll() },[])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1,2,3,4,5,6] },
        bulletList: { keepMarks:true, keepAttributes:false },
        orderedList: { keepMarks:true, keepAttributes:false },
        listItem: {},
        blockquote: {},
        codeBlock: {},
        horizontalRule: {},
        link: false,
        underline: false,
      }),
      Underline.configure({}),
      TextAlign.configure({ types: ['heading','paragraph'] }),
      Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false, HTMLAttributes: { class: 'text-[#0075de] underline underline-offset-2 cursor-pointer' } }),
      CustomImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true, handleWidth:5, lastColumnResizable:true, allowTableNodeSelection:true }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      Placeholder.configure({ placeholder: 'Ketik konten di sini… gunakan klik kanan untuk menambah data terikat tepat di posisi kursor' }),
      InlineBinding,
      ComponentBinding,
    ],
    content: "<p>Ketik konten di sini... gunakan klik kanan untuk binding data</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm max-w-none focus:outline-none min-h-[280px] p-6 leading-relaxed text-[14px] text-[#111827] prose-p:my-2 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-blockquote:border-l-4 prose-blockquote:border-[#e5e7eb] prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-[#0075de] prose-strong:font-bold prose-ul:list-disc prose-ol:list-decimal prose-li:my-1 prose-table:border-collapse prose-th:bg-[#f9fafb] prose-th:p-2 prose-th:border prose-td:p-2 prose-td:border prose-img:rounded-lg'
      },
      handleKeyDown(view, e) { return false }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setForm(prev => (prev.contentHtml === html ? prev : { ...prev, contentHtml: html }))
      setTick(v=>v+1)
    },
    onSelectionUpdate: () => setTick(v=>v+1),
    onTransaction: () => setTick(v=>v+1),
  })

  // Init load for edit
  useEffect(()=>{
    if(mode==="edit" && id){
      setLoading(true)
      fetch(`/api/persuratan/components/${id}`).then(r=>r.json()).then(row=>{
        let bindings:Binding[]=[]
        try{ bindings=row.bindingsJson?JSON.parse(row.bindingsJson):[] }catch{}
        const html = row.contentHtml || "<p></p>"
        setForm({ name: row.name, isLooping: !!row.isLooping, contentHtml: html, bindings })
        setTimeout(()=>{
          if (editor) {
            editor.commands.setContent(html || "<p></p>")
          }
        }, 100)
        setLoading(false)
      }).catch(()=>setLoading(false))
    }
  },[mode,id, editor])

  // Preview debounced - harus 1:1 dengan EditorContent (tiptap styles)
  useEffect(()=>{
    const timer = setTimeout(()=>{
      let html = editor ? editor.getHTML() : form.contentHtml
      for(const b of form.bindings){
        const sampleText = `Contoh ${b.name}`
        const sampleImg = `https://via.placeholder.com/${b.width||200}x${b.height||120}?text=${encodeURIComponent(b.name)}`
        if (b.type==="image") {
          html = html.replaceAll(`src="{{${b.name}}}"`, `src="${sampleImg}"`).replaceAll(`src='{{${b.name}}}'`, `src="${sampleImg}"`).replaceAll(`{{${b.name}}}`, sampleImg)
        } else if (b.type==="component") {
          const compPreview = `<span style="background:#f5f3ff; border:1px dashed #8b5cf6; padding:2px 6px; border-radius:6px; font-size:11px; color:#6d28d9;">[Component ${b.name}]</span>`
          html = html.replaceAll(`{{${b.name}}}`, compPreview).replaceAll(`{{ ${b.name} }}`, compPreview)
        } else {
          html = html.replaceAll(`{{${b.name}}}`, sampleText).replaceAll(`{{ ${b.name} }}`, sampleText)
        }
      }
      setPreviewHtml(html)
    }, 120)
    return ()=> clearTimeout(timer)
  },[form.contentHtml, form.bindings, tick])

  const handleContextMenu=(e:React.MouseEvent)=>{
    e.preventDefault()
    if (!editor) return
    try {
      const view = editor.view
      const coords = { left: e.clientX, top: e.clientY }
      const posInfo = (view as any).posAtCoords?.(coords)
      if (posInfo && typeof posInfo.pos === 'number') {
        savedPosRef.current = posInfo.pos
      } else {
        savedPosRef.current = editor.state.selection.from
      }
      // set selection to that pos so toolbar reflects location but don't scroll
      try { if(savedPosRef.current!==null) editor.chain().setTextSelection(savedPosRef.current).run() } catch {}
    } catch {
      savedPosRef.current = editor.state.selection.from
    }
    setContextMenu({x:e.clientX, y:e.clientY})
  }

  const handleAddBinding=()=>{
    if(!bindingForm.name.trim()){
      showToast('Nama data wajib diisi', 'error')
      return
    }
    const name = bindingForm.name.trim().replace(/\s+/g,'_')
    if (!/^[a-zA-Z0-9_]+$/.test(name)){
      showToast('Nama hanya boleh huruf, angka, underscore', 'error')
      return
    }
    if(form.bindings.find(b=>b.name===name)){
      showToast('Nama data sudah ada', 'error')
      return
    }
    const newBinding:Binding = { ...bindingForm, name }
    if (newBinding.type==="component" && !newBinding.componentId){
      showToast('Pilih component untuk tipe Component', 'error')
      return
    }
    if (!editor) {
      showToast('Editor belum siap', 'error')
      return
    }
    const insertAt = savedPosRef.current ?? editor.state.selection.from
    const docSize = editor.state.doc.content.size
    const safePos = Math.max(0, Math.min(insertAt, docSize))
    let chainSuccess = false
    try {
      // set selection first to safePos (robust against table/list nesting)
      try { editor.chain().focus().setTextSelection(safePos).run() } catch {}
      if(newBinding.type==="text"){
        chainSuccess = editor.chain().focus().insertContentAt(safePos, [{ type: 'inlineBinding', attrs: { name } }, { type: 'text', text: ' ' }] as any).run()
        if(!chainSuccess) chainSuccess = editor.chain().focus().insertContent([{ type: 'inlineBinding', attrs: { name } }, { type: 'text', text: ' ' }] as any).run()
      } else if(newBinding.type==="image"){
        const w = newBinding.width || 200
        const h = newBinding.height || 120
        chainSuccess = editor.chain().focus().insertContentAt(safePos, [{ type: 'image', attrs: { src: `https://via.placeholder.com/${w}x${h}?text=${encodeURIComponent(name)}`, alt: `{{${name}}}`, 'data-binding': name, width: w, height: h } }, { type: 'text', text: ' ' }] as any).run()
        if(!chainSuccess) chainSuccess = editor.chain().focus().insertContent({ type: 'image', attrs: { src: `https://via.placeholder.com/${w}x${h}?text=${encodeURIComponent(name)}`, alt: `{{${name}}}`, 'data-binding': name, width: w, height: h } } as any).run()
      } else if(newBinding.type==="component"){
        const comp = allComponents.find(c=>c.id===newBinding.componentId)
        chainSuccess = editor.chain().focus().insertContentAt(safePos, { type: 'componentBinding', attrs: { name, componentId: newBinding.componentId, componentName: comp?.name || String(newBinding.componentId) } } as any).run()
        if(!chainSuccess) chainSuccess = editor.chain().focus().insertContent({ type: 'componentBinding', attrs: { name, componentId: newBinding.componentId, componentName: comp?.name || String(newBinding.componentId) } } as any).run()
      }
      if (!chainSuccess) {
        // fallback insert html at selection
        let fallbackHtml=""
        if(newBinding.type==="text") fallbackHtml=`<span data-binding="${name}" class="inline-flex items-center gap-1 bg-[#dbeafe] border border-dashed border-[#3b82f6] px-2 py-0.5 rounded-full text-xs font-mono text-[#1e40af]">{{${name}}}</span> `
        else if(newBinding.type==="image") fallbackHtml=`<img src="{{${name}}}" data-binding="${name}" style="width:${newBinding.width||200}px;height:${newBinding.height||120}px;border:1px dashed #3b82f6;background:#eff6ff;display:inline-block;border-radius:8px;" /> `
        else fallbackHtml=`<div data-binding="${name}" data-component="${newBinding.componentId}" style="border:2px dashed #8b5cf6;background:#f5f3ff;padding:12px;border-radius:10px;margin:12px 0;"><small style="color:#6b7280">Component: ${allComponents.find(c=>c.id===newBinding.componentId)?.name||newBinding.componentId}</small><div>{{${name}}}</div></div>`
        editor.chain().focus().insertContent(fallbackHtml).run()
        chainSuccess = true
      }
    } catch (err) {
      console.error(err)
      showToast('Gagal menyisipkan, coba pindahkan kursor lalu ulangi', 'error')
      return
    }
    if(chainSuccess){
      setTimeout(()=>{
        const html = editor.getHTML()
        setForm(prev=> ({...prev, contentHtml: html, bindings: [...prev.bindings, newBinding]}))
        setTick(v=>v+1)
      }, 20)
      setBindingForm({name:"",type:"text", width:200, height:120})
      setContextMenu(null)
      savedPosRef.current = null
      showToast(`Data "${name}" berhasil disisipkan di posisi kursor`, 'success')
    } else {
      showToast('Gagal menyisipkan data di posisi tersebut', 'error')
    }
  }

  const handleSubmit=async()=>{
    let latestHtml = form.contentHtml
    if (editor) latestHtml = editor.getHTML()
    if(!form.name.trim()){
      showToast('Nama component wajib diisi', 'error')
      return
    }
    const payload={ name: form.name.trim(), isLooping: form.isLooping, contentHtml: latestHtml, bindingsJson: JSON.stringify(form.bindings) }
    const url=mode==="edit" ? `/api/persuratan/components/${id}`:`/api/persuratan/components`
    const method=mode==="edit"?"PUT":"POST"
    try{
      const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})
      if(res.ok){
        showToast(mode==="edit" ? 'Component berhasil diupdate' : 'Component berhasil disimpan', 'success')
        setTimeout(()=>{ router.push("/components-persuratan"); router.refresh() }, 400)
      } else {
        const j=await res.json().catch(()=>({message:"Gagal simpan"}))
        showToast(j.message || "Gagal simpan", 'error')
      }
    } catch(e:any){
      showToast(e?.message || 'Gagal koneksi', 'error')
    }
  }

  const isActive = (name: any, attrs?: any) => {
    if (!editor) return false
    try { return (editor.isActive as any)(name, attrs) } catch { return false }
  }
  const isAlignActive = (align: string) => {
    if (!editor) return false
    try { return (editor.isActive as any)({ textAlign: align }) } catch { return false }
  }
  const can = (cb: ()=>boolean) => {
    if (!editor) return false
    try { return cb() } catch { return false }
  }
  const getHeadingLevel = ()=>{
    if (!editor) return 'p'
    for(let i=1;i<=6;i++) if(isActive('heading',{level:i})) return String(i)
    if(isActive('paragraph')) return 'p'
    return 'p'
  }

  const openLinkModal = ()=>{
    if(!editor) return
    const href = editor.getAttributes('link').href || ''
    setLinkModal({open:true, url: href})
  }
  const submitLinkModal = ()=>{
    if(!editor) return
    const url = linkModal.url.trim()
    if(!url){
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      showToast('Link dihapus', 'info')
    } else {
      // basic url validation
      const isValid = (()=>{ try{ new URL(url); return true } catch{ return url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:') } })()
      if(!isValid){
        showToast('URL tidak valid (contoh: https://example.com)', 'error')
        return
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      showToast('Link diperbarui', 'success')
    }
    setLinkModal({open:false, url:''})
  }
  const openImageModal = ()=> setImageModal({open:true, url:''})
  const submitImageModal = ()=>{
    if(!editor) return
    const url = imageModal.url.trim()
    if(!url){
      showToast('URL gambar wajib diisi', 'error')
      return
    }
    try { new URL(url) } catch {
      showToast('URL gambar tidak valid', 'error')
      return
    }
    editor.chain().focus().setImage({ src: url }).run()
    showToast('Gambar disisipkan', 'success')
    setImageModal({open:false, url:''})
  }

  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280] animate-pulse">Memuat data...</div>
  if (!editor) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat editor…</div>

  return (
    <div className="min-h-[calc(100vh-120px)]">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t=>(
          <div key={t.id} className={`pointer-events-auto min-w-[280px] max-w-[420px] rounded-[10px] border px-4 py-3 shadow-lg flex items-start gap-2.5 text-sm ${t.type==='error' ? 'bg-red-50 border-red-200 text-red-800' : t.type==='success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${t.type==='error' ? 'bg-red-600 text-white' : t.type==='success' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
              {t.type==='error' ? <X size={14}/> : t.type==='success' ? <Copy size={12}/> : <Info size={14}/>}
            </div>
            <div className="flex-1 pt-0.5 leading-relaxed">{t.message}</div>
            <button onClick={()=> setToasts(prev=> prev.filter(x=>x.id!==t.id))} className="p-1 hover:bg-black/5 rounded"><X size={12}/></button>
          </div>
        ))}
      </div>

      {/* Link Modal */}
      {linkModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setLinkModal({open:false, url:''})} />
          <div className="relative bg-white rounded-[12px] w-full max-w-md shadow-xl border border-[#e6e6e6] p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-sm flex items-center gap-2"><Link2 size={14} className="text-[#0075de]"/> Atur Link</div>
              <button onClick={()=> setLinkModal({open:false, url:''})} className="w-7 h-7 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">URL Link</Label>
                <Input value={linkModal.url} onChange={e=> setLinkModal({...linkModal, url: e.target.value})} placeholder="https://example.com" className="mt-1 h-9 text-sm" autoFocus />
                <p className="text-[11px] text-[#6b7280] mt-1">Kosongkan lalu Simpan untuk menghapus link. Mendukung https://, /, #, mailto:</p>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={()=> setLinkModal({open:false, url:''})}>Batal</Button>
                <Button size="sm" onClick={submitLinkModal} className="bg-[#0075de] hover:bg-[#0063be]">Simpan Link</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Image Modal */}
      {imageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setImageModal({open:false, url:''})} />
          <div className="relative bg-white rounded-[12px] w-full max-w-md shadow-xl border border-[#e6e6e6] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-sm flex items-center gap-2"><ImageIcon size={14} className="text-[#0075de]"/> Sisipkan Gambar</div>
              <button onClick={()=> setImageModal({open:false, url:''})} className="w-7 h-7 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">URL Gambar</Label>
                <Input value={imageModal.url} onChange={e=> setImageModal({...imageModal, url: e.target.value})} placeholder="https://example.com/image.jpg" className="mt-1 h-9 text-sm" autoFocus />
                <p className="text-[11px] text-[#6b7280] mt-1">Tempel URL gambar publik (jpg, png, webp). Gambar akan disisipkan di posisi kursor.</p>
              </div>
              {imageModal.url && (
                <div className="border border-[#e6e6e6] rounded-[8px] p-2 bg-[#f9fafb]">
                  <div className="text-[11px] font-semibold mb-1">Preview</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageModal.url} alt="preview" className="max-h-[180px] w-auto mx-auto rounded" onError={(e)=> (e.currentTarget.style.display='none')} />
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={()=> setImageModal({open:false, url:''})}>Batal</Button>
                <Button size="sm" onClick={submitImageModal} className="bg-[#0075de] hover:bg-[#0063be]"><ImageIcon size={14}/> Sisipkan</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header info bar */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-[#6b7280]">
          <span className="inline-flex items-center gap-1.5 bg-white border border-[#e6e6e6] rounded-full px-3 py-1"><LayoutTemplate size={12} className="text-[#0075de]"/> Component Persuratan</span>
          <span className="hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-1"><MousePointer2 size={12}/> Klik kanan di editor untuk insert tepat di kursor</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* MAIN COLUMN */}
        <div className="space-y-4">
          {/* Informasi Komponen */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4 border-b bg-[#fafafa]/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-[15px] flex items-center gap-2"><FileText size={16} className="text-[#0075de]"/> Informasi Komponen</CardTitle>
                  <CardDescription className="text-xs mt-1">Nama unik, atur apakah komponen akan diulang per data (looping).</CardDescription>
                </div>
                <Badge variant={form.isLooping ? "default" : "secondary"} className="text-[11px] shrink-0">{form.isLooping ? "Looping Aktif" : "Single"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="comp-name" className="text-xs font-semibold text-[#374151]">Nama Komponen <span className="text-red-500">*</span></Label>
                  <Input id="comp-name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Contoh: Kop Surat, Tanda Tangan, Daftar Hadir" className="h-10 text-sm bg-white" />
                  <p className="text-[11px] text-[#6b7280]">Gunakan nama deskriptif — akan dipakai saat memilih komponen di Template.</p>
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-[#e6e6e6] bg-white p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center ${form.isLooping ? 'bg-violet-600 text-white' : 'bg-[#f6f5f4] text-[#6b7280]'}`}><Settings2 size={16}/></div>
                    <div>
                      <div className="text-sm font-semibold">Mode Pengulangan</div>
                      <div className="text-xs text-[#6b7280]">Jika aktif, komponen akan diulang untuk setiap baris data terpilih.</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.isLooping} onChange={e=>setForm({...form, isLooping:e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#e5e7eb] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0075de]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0075de]"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[13px] font-bold flex items-center gap-2"><Sparkles size={14} className="text-[#0075de]"/> Editor Konten</CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#6b7280] hidden sm:inline">Tiptap • Rich Text</span>
                  <Badge variant="outline" className="text-[10px] font-mono">{previewHtml.length} chars</Badge>
                </div>
              </div>
              <p className="text-[11px] text-[#6b7280] mt-1">Toolbar lengkap — heading H1-H6, list, tabel, link, gambar semua aktif. Klik kanan di posisi kursor untuk menambah <span className="font-mono bg-[#f6f5f4] px-1 py-0.5 rounded text-[#111]">{`{{data}}`}</span> tepat di pointer terbaru.</p>
            </CardHeader>
            <CardContent className="p-0">
              {/* Toolbar */}
              <div className="sticky top-0 z-10 bg-[#f9fafb] border-y border-[#e6e6e6] p-2 flex flex-wrap items-center gap-1.5">
                {/* Group: History */}
                <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1">
                  <button type="button" title="Undo (Ctrl+Z)" onClick={()=>editor.chain().focus().undo().run()} disabled={!can(()=>editor.can().chain().focus().undo().run())} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30"><Undo size={14}/></button>
                  <button type="button" title="Redo (Ctrl+Y)" onClick={()=>editor.chain().focus().redo().run()} disabled={!can(()=>editor.can().chain().focus().redo().run())} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30"><Redo size={14}/></button>
                </div>
                {/* Group: Text style */}
                <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1">
                  <button type="button" title="Bold (Ctrl+B)" onClick={()=>editor.chain().focus().toggleBold().run()} className={`w-7 h-7 rounded flex items-center justify-center ${isActive('bold') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><Bold size={14}/></button>
                  <button type="button" title="Italic (Ctrl+I)" onClick={()=>editor.chain().focus().toggleItalic().run()} className={`w-7 h-7 rounded flex items-center justify-center ${isActive('italic') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><Italic size={14}/></button>
                  <button type="button" title="Underline (Ctrl+U)" onClick={()=>editor.chain().focus().toggleUnderline().run()} className={`w-7 h-7 rounded flex items-center justify-center ${isActive('underline') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><UnderlineIcon size={14}/></button>
                  <button type="button" title="Strikethrough" onClick={()=>editor.chain().focus().toggleStrike().run()} className={`w-7 h-7 rounded flex items-center justify-center ${isActive('strike') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><Strikethrough size={14}/></button>
                  <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center"/>
                  <button type="button" title="Clear formatting" onClick={()=>editor.chain().focus().unsetAllMarks().clearNodes().run()} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Eraser size={14}/></button>
                </div>
                {/* Group: Headings H1-H6 */}
                <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 items-center">
                  <div className="flex items-center gap-1">
                    <Type size={12} className="text-[#6b7280] ml-1"/>
                    <select value={getHeadingLevel()} onChange={e=>{
                      const v=e.target.value
                      if(v==='p') editor.chain().focus().setParagraph().run()
                      else editor.chain().focus().toggleHeading({level: Number(v) as any}).run()
                    }} className="h-7 text-xs border-0 bg-transparent px-1 focus:ring-0 focus:outline-none">
                      <option value="p">P</option>
                      <option value="1">H1</option>
                      <option value="2">H2</option>
                      <option value="3">H3</option>
                      <option value="4">H4</option>
                      <option value="5">H5</option>
                      <option value="6">H6</option>
                    </select>
                  </div>
                  <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center"/>
                  <button type="button" title="Heading 1" onClick={()=>editor.chain().focus().toggleHeading({level:1}).run()} className={`px-1.5 h-7 rounded flex items-center justify-center gap-0.5 text-[11px] ${isActive('heading',{level:1}) ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><Heading1 size={12}/>1</button>
                  <button type="button" title="Heading 2" onClick={()=>editor.chain().focus().toggleHeading({level:2}).run()} className={`px-1.5 h-7 rounded flex items-center justify-center gap-0.5 text-[11px] ${isActive('heading',{level:2}) ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><Heading2 size={12}/>2</button>
                  <button type="button" title="Heading 3" onClick={()=>editor.chain().focus().toggleHeading({level:3}).run()} className={`px-1.5 h-7 rounded flex items-center justify-center gap-0.5 text-[11px] ${isActive('heading',{level:3}) ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><Heading3 size={12}/>3</button>
                  <button type="button" title="Heading 4" onClick={()=>editor.chain().focus().toggleHeading({level:4}).run()} className={`px-1.5 h-7 rounded flex items-center justify-center text-[11px] ${isActive('heading',{level:4}) ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}>H4</button>
                  <button type="button" title="Heading 5" onClick={()=>editor.chain().focus().toggleHeading({level:5}).run()} className={`px-1.5 h-7 rounded flex items-center justify-center text-[11px] ${isActive('heading',{level:5}) ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}>H5</button>
                  <button type="button" title="Heading 6" onClick={()=>editor.chain().focus().toggleHeading({level:6}).run()} className={`px-1.5 h-7 rounded flex items-center justify-center text-[11px] ${isActive('heading',{level:6}) ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}>H6</button>
                  <button type="button" title="Blockquote" onClick={()=>editor.chain().focus().toggleBlockquote().run()} className={`w-7 h-7 rounded flex items-center justify-center ${isActive('blockquote') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><Quote size={14}/></button>
                </div>
                {/* Group: Align */}
                <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1">
                  <button type="button" title="Align left" onClick={()=>editor.chain().focus().setTextAlign('left').run()} className={`w-7 h-7 rounded flex items-center justify-center ${isAlignActive('left') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><AlignLeft size={14}/></button>
                  <button type="button" title="Align center" onClick={()=>editor.chain().focus().setTextAlign('center').run()} className={`w-7 h-7 rounded flex items-center justify-center ${isAlignActive('center') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><AlignCenter size={14}/></button>
                  <button type="button" title="Align right" onClick={()=>editor.chain().focus().setTextAlign('right').run()} className={`w-7 h-7 rounded flex items-center justify-center ${isAlignActive('right') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><AlignRight size={14}/></button>
                  <button type="button" title="Justify" onClick={()=>editor.chain().focus().setTextAlign('justify').run()} className={`w-7 h-7 rounded flex items-center justify-center ${isAlignActive('justify') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><AlignJustify size={14}/></button>
                </div>
                {/* Group: Lists */}
                <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1">
                  <button type="button" title="Bullet list" onClick={()=> editor.chain().focus().toggleBulletList().run()} className={`w-7 h-7 rounded flex items-center justify-center ${isActive('bulletList') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><List size={14}/></button>
                  <button type="button" title="Ordered list" onClick={()=> editor.chain().focus().toggleOrderedList().run()} className={`w-7 h-7 rounded flex items-center justify-center ${isActive('orderedList') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><ListOrdered size={14}/></button>
                  <button type="button" title="Sintesis: turunkan indent (Tab)" onClick={()=> editor.chain().focus().sinkListItem('listItem').run()} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center text-[10px]">→</button>
                  <button type="button" title="Naikkan indent (Shift+Tab)" onClick={()=> editor.chain().focus().liftListItem('listItem').run()} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center text-[10px]">←</button>
                </div>
                {/* Group: Table insert */}
                <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1">
                  <button type="button" title="Insert table 3x3" onClick={()=>editor.chain().focus().insertTable({rows:3, cols:3, withHeaderRow:true}).run()} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><TableIcon size={14}/></button>
                </div>
                {/* Group: Link Image HR */}
                <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1">
                  <button type="button" title="Atur link (modal)" onClick={openLinkModal} className={`w-7 h-7 rounded flex items-center justify-center ${isActive('link') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}><Link2 size={14}/></button>
                  <button type="button" title="Hapus link" onClick={()=>{editor.chain().focus().unsetLink().run(); showToast('Link dihapus','info')}} disabled={!isActive('link')} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30"><Eraser size={12}/></button>
                  <button type="button" title="Sisipkan gambar (modal)" onClick={openImageModal} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><ImageIcon size={14}/></button>
                  <button type="button" title="Horizontal rule" onClick={()=>editor.chain().focus().setHorizontalRule().run()} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><Minus size={14}/></button>
                  <button type="button" title="Hard break" onClick={()=>editor.chain().focus().setHardBreak().run()} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center text-[10px]">↵</button>
                </div>
                <div className="ml-auto hidden lg:flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                  <span className="hidden xl:inline">Tip: seleksi teks lalu pakai toolbar • klik kanan untuk binding di posisi pointer</span>
                  <span className="xl:hidden">Klik kanan → insert di kursor</span>
                </div>
              </div>

              {/* Editor area */}
              <div
                ref={editorContainerRef}
                onContextMenu={handleContextMenu}
                className="relative bg-white"
              >
                <div className="border-t border-[#e6e6e6]" />
                <EditorContent editor={editor} className="min-h-[280px] max-h-[560px] overflow-y-auto focus-within:ring-2 focus-within:ring-[#0075de]/10" />
                {/* floating hint */}
                <div className="absolute bottom-2 right-2 hidden sm:flex items-center gap-1.5 bg-white/90 backdrop-blur border border-[#e6e6e6] rounded-full px-2.5 py-1 text-[11px] text-[#6b7280] shadow-sm">
                  <MousePointer2 size={12} className="text-[#0075de]"/> Klik kanan untuk tambah data terikat
                </div>
              </div>

              {/* Table Controls - bottom of editor, only when table active */}
              {editor && editor.isActive('table') && (
                <div className="border-t border-[#e6e6e6] bg-[#f9fafb] p-3 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#111]"><Grid3x3 size={14} className="text-[#0075de]"/> Operasi Tabel</div>
                  <div className="flex flex-wrap gap-2">
                    {/* Rows */}
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[8px] p-1 items-center">
                      <span className="text-[11px] font-semibold px-2 flex items-center gap-1"><Rows3 size={12}/> Baris</span>
                      <button type="button" onClick={()=>{editor.chain().focus().addRowBefore().run(); showToast('Baris ditambahkan di atas','success')}} className="px-2.5 py-1.5 text-xs border border-[#e6e6e6] rounded hover:bg-[#f6f5f4]">+ Sebelum</button>
                      <button type="button" onClick={()=>{editor.chain().focus().addRowAfter().run(); showToast('Baris ditambahkan di bawah','success')}} className="px-2.5 py-1.5 text-xs border border-[#e6e6e6] rounded hover:bg-[#f6f5f4]">+ Sesudah</button>
                      <button type="button" onClick={()=>{editor.chain().focus().deleteRow().run(); showToast('Baris dihapus','info')}} className="px-2.5 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"><Trash size={12} className="inline mr-1"/>Hapus Baris</button>
                    </div>
                    {/* Columns */}
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[8px] p-1 items-center">
                      <span className="text-[11px] font-semibold px-2 flex items-center gap-1"><Columns3 size={12}/> Kolom</span>
                      <button type="button" onClick={()=>{editor.chain().focus().addColumnBefore().run(); showToast('Kolom ditambahkan di kiri','success')}} className="px-2.5 py-1.5 text-xs border border-[#e6e6e6] rounded hover:bg-[#f6f5f4]">+ Kiri</button>
                      <button type="button" onClick={()=>{editor.chain().focus().addColumnAfter().run(); showToast('Kolom ditambahkan di kanan','success')}} className="px-2.5 py-1.5 text-xs border border-[#e6e6e6] rounded hover:bg-[#f6f5f4]">+ Kanan</button>
                      <button type="button" onClick={()=>{editor.chain().focus().deleteColumn().run(); showToast('Kolom dihapus','info')}} className="px-2.5 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"><Trash size={12} className="inline mr-1"/>Hapus Kolom</button>
                    </div>
                    {/* Table actions */}
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[8px] p-1 items-center">
                      <button type="button" onClick={()=>{editor.chain().focus().deleteTable().run(); showToast('Tabel dihapus','info')}} className="px-2.5 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"><Trash2 size={12}/> Hapus Tabel</button>
                      <button type="button" onClick={()=>{editor.chain().focus().mergeCells().run(); showToast('Cell digabung','success')}} className="px-2.5 py-1.5 text-xs border border-[#e6e6e6] rounded hover:bg-[#f6f5f4] flex items-center gap-1"><Combine size={12}/> Gabung Cell</button>
                      <button type="button" onClick={()=>{editor.chain().focus().splitCell().run(); showToast('Cell dipecah','success')}} className="px-2.5 py-1.5 text-xs border border-[#e6e6e6] rounded hover:bg-[#f6f5f4] flex items-center gap-1"><Split size={12}/> Pecah Cell</button>
                      <button type="button" onClick={()=>{/* select table via selectParentNode twice */ try{ (editor.chain().focus() as any).selectParentNode().run(); (editor.chain().focus() as any).selectParentNode().run(); showToast('Tabel dipilih (drag untuk seleksi cell)','info')}catch{ showToast('Gunakan drag untuk seleksi cell','info')}}} className="px-2.5 py-1.5 text-xs border border-[#e6e6e6] rounded hover:bg-[#f6f5f4]">Pilih Tabel</button>
                      <button type="button" onClick={()=>{editor.chain().focus().toggleHeaderRow().run(); showToast('Header baris toggled','success')}} className="px-2.5 py-1.5 text-xs border border-[#e6e6e6] rounded hover:bg-[#f6f5f4]">Header Baris</button>
                      <button type="button" onClick={()=>{editor.chain().focus().toggleHeaderColumn().run(); showToast('Header kolom toggled','success')}} className="px-2.5 py-1.5 text-xs border border-[#e6e6e6] rounded hover:bg-[#f6f5f4]">Header Kolom</button>
                      <button type="button" onClick={()=>{editor.chain().focus().toggleHeaderCell().run(); showToast('Header cell toggled','success')}} className="px-2.5 py-1.5 text-xs border border-[#e6e6e6] rounded hover:bg-[#f6f5f4]">Header Cell</button>
                    </div>
                    {/* Cell styling */}
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[8px] p-1 items-center flex-wrap">
                      <span className="text-[11px] font-semibold px-2 flex items-center gap-1"><Palette size={12}/> Cell</span>
                      <div className="flex items-center gap-1.5 border border-[#e6e6e6] rounded px-2 py-1">
                        <PaintBucket size={12} className="text-[#6b7280]"/>
                        <span className="text-[11px]">BG</span>
                        <input type="color" value={cellBg} onChange={e=>{setCellBg(e.target.value)}} className="w-6 h-6 p-0 border-0 rounded overflow-hidden" title="Pilih warna" />
                        <button type="button" onClick={()=>{editor.chain().focus().setCellAttribute('backgroundColor', cellBg).run(); showToast(`Background cell: ${cellBg}`,'success')}} className="px-2 py-1 text-xs bg-[#0075de] text-white rounded">Terapkan</button>
                        <button type="button" onClick={()=>{editor.chain().focus().setCellAttribute('backgroundColor', null).run(); showToast('Background dihapus','info')}} className="px-2 py-1 text-xs border rounded">Hapus</button>
                      </div>
                      <select onChange={e=>{const v=e.target.value; if(v) {editor.chain().focus().setCellAttribute('verticalAlign', v).run(); showToast(`Vertical align: ${v}`,'success')}}} className="text-xs border border-[#e6e6e6] rounded px-2 py-1.5 bg-white">
                        <option value="">Align Vertical</option>
                        <option value="top">Top</option>
                        <option value="middle">Middle</option>
                        <option value="bottom">Bottom</option>
                      </select>
                      <select onChange={e=>{const v=e.target.value; if(v) {editor.chain().focus().setCellAttribute('borderStyle', v).run(); showToast(`Border style: ${v}`,'success')}}} className="text-xs border border-[#e6e6e6] rounded px-2 py-1.5 bg-white">
                        <option value="">Border Style</option>
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="double">Double</option>
                        <option value="hidden">Hidden</option>
                      </select>
                      <select onChange={e=>{const v=e.target.value; if(v) {editor.chain().focus().setCellAttribute('borderWidth', v).run(); showToast(`Border width: ${v}`,'success')}}} className="text-xs border border-[#e6e6e6] rounded px-2 py-1.5 bg-white">
                        <option value="">Border Width</option>
                        <option value="1px">1px</option>
                        <option value="2px">2px</option>
                        <option value="3px">3px</option>
                        <option value="4px">4px</option>
                      </select>
                      <div className="flex items-center gap-1 border border-[#e6e6e6] rounded px-2 py-1">
                        <Grid3x3 size={12} className="text-[#6b7280]"/>
                        <input type="color" onChange={e=>{editor.chain().focus().setCellAttribute('borderColor', e.target.value).run(); showToast(`Border color: ${e.target.value}`,'success')}} className="w-6 h-6 p-0 border-0 rounded" title="Border color" defaultValue="#e6e6e6" />
                        <span className="text-[11px]">Border Color</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#6b7280] flex items-start gap-1.5">
                    <Info size={12} className="mt-0.5 shrink-0"/>
                    <span>Drag handle di tepi kolom untuk <b>resize lebar kolom</b>. Seleksi beberapa cell (drag) lalu <b>Gabung</b>. Klik cell lalu pilih <b>Align Vertical</b> / <b>Background</b> untuk styling. Tinggi baris menyesuaikan konten.</span>
                  </div>
                </div>
              )}

              <div className="px-4 py-2 bg-[#f9fafb] border-t border-[#e6e6e6] flex items-center justify-between">
                <div className="text-[11px] text-[#6b7280] flex items-center gap-1.5"><Info size={12}/> Data terikat akan tersisip tepat di posisi kursor terakhir, bukan di awal.</div>
                <button
                  type="button"
                  onClick={()=>{
                    const rect = editorContainerRef.current?.getBoundingClientRect()
                    const x = rect ? rect.left + rect.width/2 : window.innerWidth/2
                    const y = rect ? rect.top + 120 : window.innerHeight/2
                    savedPosRef.current = editor.state.selection.from
                    try{ editor.chain().setTextSelection(savedPosRef.current).run()}catch{}
                    setContextMenu({x,y})
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0075de] hover:text-[#005bb5]"
                ><Plus size={12}/> Tambah data terikat</button>
              </div>
            </CardContent>
          </Card>

          {/* Bindings list inline for mobile */}
          <div className="lg:hidden">
            <BindingsPanel form={form} setForm={setForm} allComponents={allComponents} savedPosRef={savedPosRef} editor={editor} tick={tick} showToast={showToast} />
          </div>
        </div>

        {/* RIGHT SIDEBAR - Desktop */}
        <div className="hidden lg:block space-y-4 sticky top-6">
          <BindingsPanel form={form} setForm={setForm} allComponents={allComponents} savedPosRef={savedPosRef} editor={editor} tick={tick} showToast={showToast} />

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Eye size={14} className="text-[#0075de]"/> Pratinjau</CardTitle>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={showPreview} onChange={e=>setShowPreview(e.target.checked)} className="rounded border-[#e6e6e6]" />
                  Live
                </label>
              </div>
              <CardDescription className="text-[11px]">Render 1:1 dengan Editor. Binding <span className="font-mono">{"{{nama}}"}</span> → nilai contoh. Heading, list, tabel tampil identik.</CardDescription>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="rounded-[10px] border border-[#e6e6e6] bg-[#f6f5f4] p-3">
                  <div className="bg-white rounded-[8px] shadow-[0_1px_8px_rgba(0,0,0,0.08)] border border-[#e6e6e6] min-h-[220px] p-0 overflow-auto">
                    {/* Preview uses same tiptap class for 1:1 match */}
                    <div className="tiptap p-5 min-h-[180px]" style={{fontSize:'14px', lineHeight:'1.6'}} dangerouslySetInnerHTML={{__html: previewHtml || "<p class='text-[#9ca3af] italic'>Preview kosong — ketik di editor</p>"}} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#6b7280]">
                    <span>{form.bindings.length} binding • {previewHtml.length} chars</span>
                    <button onClick={()=>{
                      const html = previewHtml
                      const w = window.open("","_blank")
                      if(w){
                        w.document.write(`<html><head><title>${form.name||'Preview'}</title><style>body{font-family:Inter,system-ui,sans-serif;padding:24px;max-width:800px;margin:auto;line-height:1.6;} .tiptap h1{font-size:1.75rem;font-weight:800;margin:16px 0 8px} .tiptap h2{font-size:1.35rem;font-weight:700;margin:14px 0 8px} .tiptap h3{font-size:1.1rem;font-weight:700;margin:12px 0 6px} .tiptap h4{font-size:1rem;font-weight:700} .tiptap h5{font-size:0.95rem;font-weight:600} .tiptap h6{font-size:0.85rem;font-weight:600} .tiptap ul{list-style:disc;padding-left:20px} .tiptap ol{list-style:decimal;padding-left:20px} .tiptap table{border-collapse:collapse;width:100%;margin:12px 0} .tiptap td,.tiptap th{border:1px solid #e6e6e6;padding:6px 10px;min-width:80px} .tiptap th{background:#f9fafb} img{max-width:100%;}</style></head><body><div class="tiptap">${html}</div></body></html>`)
                        w.document.close()
                      }
                    }} className="text-[#0075de] hover:underline inline-flex items-center gap-1"><Eye size={11}/> Buka di tab</button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#6b7280] bg-[#f9fafb] border border-dashed border-[#e6e6e6] rounded-[8px] p-4 text-center">Preview nonaktif — aktifkan untuk melihat hasil live</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed bg-[#fafafa]">
            <CardContent className="pt-4">
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-white border border-[#e6e6e6] flex items-center justify-center shrink-0"><Info size={14} className="text-[#0075de]"/></div>
                <div className="text-xs leading-relaxed text-[#4b5563]">
                  <div className="font-semibold text-[#111] mb-1">Cara pakai cepat</div>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Letakkan kursor di editor pada posisi yang diinginkan.</li>
                    <li>Klik kanan → isi <span className="font-mono bg-white border px-1 rounded">nama_data</span> & pilih jenis.</li>
                    <li>Insert — pil akan muncul tepat di pointer terbaru.</li>
                    <li>Heading H1-H6, list, tabel semua aktif. Saat tabel terpilih, panel Operasi Tabel muncul di bawah editor.</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Preview */}
      <div className="lg:hidden mt-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Eye size={14}/> Pratinjau Langsung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[#f6f5f4] border border-[#e6e6e6] rounded-[10px] p-3">
              <div className="bg-white rounded-[8px] border border-[#e6e6e6] min-h-[160px] p-0 overflow-auto">
                <div className="tiptap p-4 min-h-[140px]" dangerouslySetInnerHTML={{__html: previewHtml || "<p class='text-[#9ca3af] italic'>Preview kosong</p>"}} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom actions */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white border border-[#e6e6e6] rounded-[12px] p-4 shadow-sm">
        <div className="text-xs text-[#6b7280] flex items-center gap-2"><Highlighter size={12} className="text-[#0075de]"/>{form.bindings.length} data terikat • {editor ? editor.getText().length : 0} karakter konten</div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={()=>router.push("/components-persuratan")} className="flex-1 sm:flex-none">Batal</Button>
          <Button onClick={handleSubmit} className="flex-1 sm:flex-none bg-[#0075de] hover:bg-[#0063be]">{mode==="edit"?"Update Komponen":"Simpan Komponen"}</Button>
        </div>
      </div>

      {/* Context Menu - scrollable fix */}
      {contextMenu && (
        <div className="fixed inset-0 z-40" onClick={()=>{setContextMenu(null); savedPosRef.current=null}} onContextMenu={e=>e.preventDefault()}>
          <div
            className="absolute bg-white border border-[#e6e6e6] rounded-[12px] shadow-2xl w-[360px] max-h-[85vh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95"
            style={{left: Math.min(contextMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 1200)-380), top: Math.min(contextMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 800)-420)}}
            onClick={e=>e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white rounded-t-[12px] p-4 pb-3 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="font-bold text-sm flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-[#0075de] text-white flex items-center justify-center"><Sparkles size={12}/></div> Tambah Data Terikat</div>
              <button onClick={()=>{setContextMenu(null); savedPosRef.current=null}} className="w-7 h-7 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14}/></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-2.5 py-2 text-[11px] text-amber-800 flex gap-1.5">
                <MousePointer2 size={12} className="shrink-0 mt-0.5"/> Akan disisipkan tepat di posisi klik kanan terbaru — bukan di awal. Scroll popup ini jika terpotong, pindahkan kursor lalu klik kanan lagi untuk ganti posisi.
              </div>
              <div><Label className="text-xs font-semibold">Nama Data <span className="text-red-500">*</span></Label><Input value={bindingForm.name} onChange={e=>setBindingForm({...bindingForm, name:e.target.value})} placeholder="contoh: nama_karyawan" className="h-9 text-xs font-mono mt-1" /><p className="text-[11px] text-[#6b7280] mt-1">Hanya huruf/angka/underscore. Akan jadi <span className="font-mono bg-[#f6f5f4] px-1 rounded">{"{{nama}}"}</span></p></div>
              <div><Label className="text-xs font-semibold">Jenis Tampilan</Label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {[
                    {v:'text', label:'Teks', icon: FileText, desc:'Inline pill'},
                    {v:'image', label:'Gambar', icon: ImageIcon, desc:'Placeholder img'},
                    {v:'component', label:'Komponen', icon: Boxes, desc:'Block + label'},
                  ].map(opt=>(
                    <button key={opt.v} type="button" onClick={()=>setBindingForm({...bindingForm, type: opt.v as any})} className={`border rounded-[8px] p-2.5 text-left flex flex-col gap-1 ${bindingForm.type===opt.v ? 'border-[#0075de] bg-[#eff6ff] text-[#0075de]' : 'border-[#e6e6e6] bg-white hover:bg-[#f6f5f4]'}`}>
                      <opt.icon size={14}/><span className="text-xs font-semibold">{opt.label}</span><span className="text-[10px] opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              {bindingForm.type==="text" && <div className="text-[11px] text-[#6b7280] bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-2.5">Teks akan tampil sebagai pill biru <span className="font-mono bg-[#dbeafe] px-1 rounded">{"{{nama}}"}</span> yang bisa diberi gaya Bold/Italic/Warna via toolbar. Posisinya di kursor terakhir.</div>}
              {bindingForm.type==="image" && (
                <div className="space-y-2 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-3">
                  <div className="text-[11px] font-semibold text-[#374151]">Ukuran placeholder (px)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-[11px]">Lebar</Label><Input type="number" value={bindingForm.width||200} onChange={e=>setBindingForm({...bindingForm, width: Number(e.target.value)||200})} className="h-8 text-xs mt-1" /></div>
                    <div><Label className="text-[11px]">Tinggi</Label><Input type="number" value={bindingForm.height||120} onChange={e=>setBindingForm({...bindingForm, height: Number(e.target.value)||120})} className="h-8 text-xs mt-1" /></div>
                  </div>
                  <div className="text-[11px] text-[#6b7280]">Gambar akan disisipkan sebagai <span className="font-mono">{"<img src=\"{{name}}\">"}</span> dengan border putus-putus biru di editor. Preview akan ganti src jadi placeholder.</div>
                </div>
              )}
              {bindingForm.type==="component" && (
                <div className="space-y-2 bg-violet-50 border border-violet-200 rounded-[8px] p-3">
                  <Label className="text-xs font-semibold text-violet-900">Pilih Komponen</Label>
                  <Select value={String(bindingForm.componentId||"")} onChange={e=>setBindingForm({...bindingForm, componentId: Number(e.target.value)||undefined})}>
                    <option value="">-- pilih component --</option>
                    {allComponents.filter(c=> String(c.id)!==String(id)).map(c=> <option key={c.id} value={c.id}>{c.name} {c.isLooping?"(looping)":""}</option>)}
                  </Select>
                  <p className="text-[11px] text-violet-700">Akan tampil sebagai block ungu dashed dengan label component + pill. Cocok untuk nesting komponen.</p>
                </div>
              )}
              <div className="flex gap-2 pt-2 sticky bottom-0 bg-white p-1 -mx-1">
                <Button size="sm" variant="outline" onClick={()=>{setContextMenu(null); savedPosRef.current=null}} className="flex-1">Batal</Button>
                <Button size="sm" onClick={handleAddBinding} className="flex-1 bg-[#0075de] hover:bg-[#0063be]"><Plus size={14}/> Sisipkan di Kursor</Button>
              </div>
              <div className="text-[10px] text-center text-[#9ca3af]">Posisi insert: {savedPosRef.current !== null ? `offset ${savedPosRef.current}` : 'kursor saat ini'}</div>
              <div className="h-2"/>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .tiptap table { border-collapse: collapse; width: 100%; margin: 12px 0; position: relative; }
        .tiptap table td, .tiptap table th { border: 1px solid #e6e6e6; padding: 6px 10px; min-width: 80px; position: relative; vertical-align: top; }
        .tiptap table th { background: #f9fafb; font-weight: 600; text-align: left; }
        .tiptap .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(0,117,222,0.12); pointer-events: none; border: 1px solid #0075de; }
        .tiptap .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background: #0075de; pointer-events: none; }
        .tiptap img { max-width: 100%; }
        .tiptap a { color: #0075de; text-decoration: underline; text-underline-offset: 2px; }
        .tiptap blockquote { border-left: 3px solid #e5e7eb; padding-left: 12px; margin-left: 0; font-style: italic; color: #4b5563; }
        .tiptap h1 { font-size: 1.875rem; line-height: 1.2; font-weight: 800; margin: 16px 0 8px; }
        .tiptap h2 { font-size: 1.5rem; line-height: 1.3; font-weight: 700; margin: 14px 0 8px; }
        .tiptap h3 { font-size: 1.25rem; line-height: 1.4; font-weight: 700; margin: 12px 0 6px; }
        .tiptap h4 { font-size: 1.1rem; line-height: 1.4; font-weight: 700; margin: 12px 0 6px; }
        .tiptap h5 { font-size: 1rem; line-height: 1.5; font-weight: 600; margin: 10px 0 6px; }
        .tiptap h6 { font-size: 0.9rem; line-height: 1.5; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; color: #374151; margin: 10px 0 6px; }
        .tiptap ul { list-style-type: disc; padding-left: 24px; margin: 8px 0; }
        .tiptap ol { list-style-type: decimal; padding-left: 24px; margin: 8px 0; }
        .tiptap li { margin: 2px 0; }
        .tiptap li p { margin: 0; }
        .tiptap ul ul, .tiptap ol ol, .tiptap ul ol, .tiptap ol ul { margin: 4px 0; }
        .tiptap hr { border: none; border-top: 1px solid #e6e6e6; margin: 16px 0; }
        .tiptap code { background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.85em; font-family: ui-monospace, monospace; }
        .tiptap pre { background: #111827; color: #e5e7eb; padding: 12px; border-radius: 8px; overflow-x: auto; }
        .tiptap pre code { background: transparent; padding: 0; }
      `}} />
    </div>
  )
}

function BindingsPanel({ form, setForm, allComponents, savedPosRef, editor, tick, showToast }: any){
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Boxes size={14} className="text-violet-600"/> Data Terikat
          <Badge variant="secondary" className="ml-auto text-[11px]">{form.bindings.length}</Badge>
        </CardTitle>
        <CardDescription className="text-[11px]">Klik kanan di editor untuk tambah — atau klik chip untuk sisip ulang di kursor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {form.bindings.length===0 ? (
          <div className="text-center py-6 border border-dashed border-[#e6e6e6] rounded-[10px] bg-[#fafafa]">
            <div className="w-10 h-10 rounded-full bg-white border border-[#e6e6e6] flex items-center justify-center mx-auto mb-2"><Sparkles size={16} className="text-[#9ca3af]"/></div>
            <div className="text-xs font-semibold text-[#374151]">Belum ada binding</div>
            <div className="text-[11px] text-[#6b7280] mt-1 px-4">Klik kanan di editor, isi nama & jenis, lalu <span className="font-medium">Sisipkan di Kursor</span> — pill akan muncul tepat di pointer.</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[340px] overflow-auto pr-1">
            {form.bindings.map((b: Binding, i:number)=>(
              <div key={i} className="group flex items-center gap-2 p-2.5 bg-white border border-[#e6e6e6] rounded-[10px] hover:border-[#0075de]/30 hover:bg-[#f8fafc] transition-colors">
                <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${b.type==='text' ? 'bg-blue-50 text-[#0075de] border border-blue-200' : b.type==='image' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-violet-50 text-violet-600 border border-violet-200'}`}>
                  {b.type==='text' ? <FileText size={14}/> : b.type==='image' ? <ImageIcon size={14}/> : <Boxes size={14}/>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono font-semibold truncate flex items-center gap-1.5"><span>{"{{"+b.name+"}}"}</span> <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{b.type}</Badge></div>
                  <div className="text-[11px] text-[#6b7280] truncate">
                    {b.type==="image" && <span>{b.width}×{b.height}px</span>}
                    {b.type==="component" && <span>→ {allComponents.find((c:any)=>c.id===b.componentId)?.name||b.componentId}</span>}
                    {b.type==="text" && <span>Inline pill biru</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
                  <button
                    title="Sisipkan lagi di posisi kursor saat ini"
                    onClick={()=>{
                      if (!editor) return
                      const pos = editor.state.selection.from
                      savedPosRef.current = pos
                      let ok=false
                      if (b.type==="text") ok = editor.chain().focus().insertContentAt(pos, [{type:'inlineBinding', attrs:{name:b.name}}, {type:'text', text:' '}] as any).run()
                      else if (b.type==="image") ok = editor.chain().focus().insertContentAt(pos, [{type:'image', attrs:{src:`https://via.placeholder.com/${b.width||200}x${b.height||120}?text=${encodeURIComponent(b.name)}`, alt:`{{${b.name}}}`, 'data-binding': b.name, width:b.width||200, height:b.height||120}}, {type:'text', text:' '}] as any).run()
                      else if (b.type==="component") {
                        const comp = allComponents.find((c:any)=>c.id===b.componentId)
                        ok = editor.chain().focus().insertContentAt(pos, {type:'componentBinding', attrs:{name:b.name, componentId:b.componentId, componentName: comp?.name}} as any).run()
                      }
                      if(ok) showToast && showToast(`Disisipkan ulang {{${b.name}}} di kursor`, 'success')
                      else showToast && showToast('Gagal menyisipkan', 'error')
                    }}
                    className="w-7 h-7 rounded-full bg-white border border-[#e6e6e6] hover:border-[#0075de] hover:text-[#0075de] flex items-center justify-center"
                  ><Copy size={12}/></button>
                  <button onClick={()=> setForm({...form, bindings: form.bindings.filter((_:any,j:number)=>j!==i)})} className="w-7 h-7 rounded-full bg-white border border-[#e6e6e6] hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center"><X size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="pt-2 border-t border-[#f0f0f0] flex items-center justify-between text-[11px] text-[#6b7280]">
          <span>{form.bindings.length} total • klik <Copy size={10} className="inline"/> untuk sisip ulang</span>
          {form.bindings.length>0 && <button onClick={()=>setForm({...form, bindings: []})} className="text-red-600 hover:underline inline-flex items-center gap-1"><Trash2 size={12}/> Kosongkan</button>}
        </div>
      </CardContent>
    </Card>
  )
}
