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
import { Table } from "@tiptap/extension-table"
import Placeholder from "@tiptap/extension-placeholder"
import { TextStyle } from "@tiptap/extension-text-style"
import FontFamily from "@tiptap/extension-font-family"
import Highlight from "@tiptap/extension-highlight"
import Color from "@tiptap/extension-color"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import CharacterCount from "@tiptap/extension-character-count"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import { SpacingExtension } from "@/lib/tiptap/spacing"
import SpacingDropdown from "@/components/common/SpacingDropdown"
import { FontSize } from "@/lib/tiptap/extensions/fontSize"
import { InlineBinding } from "@/lib/tiptap/extensions/inlineBinding"
import { ComponentBinding } from "@/lib/tiptap/extensions/componentBinding"
import { ResizableImage } from "@/lib/tiptap/extensions/resizableImage"
import { CustomTableCell, CustomTableHeader, CustomTableRow } from "@/lib/tiptap/extensions/customTable"
import { EditorCanvas } from "@/components/editor/EditorCanvas"
import { EditorStatusBar } from "@/components/editor/EditorStatusBar"
import { FindBar } from "@/components/editor/FindBar"
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table as TableIcon, Link2, Image as ImageIcon, Undo, Redo, Quote, Heading1, Heading2, Heading3,
  Minus, Eraser, X, Plus, Sparkles, Eye, Boxes, Trash2, Copy, Info, FileText, Settings2, LayoutTemplate, MousePointer2,
  Palette, Pipette, Rows3, Columns3, Trash, Combine, Split, ArrowUp, ArrowDown, MinusSquare, PaintBucket, Grid3x3, Type, Highlighter,
  Square, PanelLeft, PanelRight, Columns2, PanelTop, PanelBottom, Frame, Maximize2, MoveVertical, MoveHorizontal, GripVertical, ChevronDown, ChevronUp, SlidersHorizontal, Brush, Layers, Search, ListChecks, BookOpen, Database, Crop, Upload
} from "lucide-react"
import PasteChoicePopup from "@/components/common/PasteChoicePopup"
import ImageCropModal from "@/components/editor/ImageCropModal"
import { keepStyleHtml, adaptToEditorHtml, plainToHtml, isWordHtml } from "@/lib/tiptap/paste"

type Binding = { name: string, type: "text"|"image"|"component", componentId?: number, width?: number, height?: number }
type Toast = { id:number, message:string, type:'success'|'error'|'info' }

const FONT_FAMILIES = [
  { label: "Default (Inter)", value: "" },
  { label: "Inter", value: "Inter" },
  { label: "Arial", value: "Arial" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Times New Roman", value: '"Times New Roman"' },
  { label: "Georgia", value: "Georgia" },
  { label: "Courier New", value: '"Courier New"' },
  { label: "Verdana", value: "Verdana" },
  { label: "Tahoma", value: "Tahoma" },
  { label: "Trebuchet MS", value: '"Trebuchet MS"' },
  { label: "Comic Sans MS", value: '"Comic Sans MS"' },
]

const FONT_SIZES = [
  { label: "Default", value: "" },
  { label: "8", value: "8px" },
  { label: "9", value: "9px" },
  { label: "10", value: "10px" },
  { label: "11", value: "11px" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "36", value: "36px" },
  { label: "48", value: "48px" },
]



export default function PersuratanComponentForm({ mode, id }: { mode: "create"|"edit"; id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ name:"", isLooping:false, contentHtml:"<p></p>", contentJson:"", bindings: [] as Binding[] })
  const [previewHtml, setPreviewHtml] = useState("")
  const [contextMenu, setContextMenu] = useState<{x:number,y:number}|null>(null)
  const [bindingForm, setBindingForm] = useState<Binding>({ name:"", type:"text", width:200, height:120 })
  const [allComponents, setAllComponents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)
  const [showPreview, setShowPreview] = useState(true)
  const [activeTab, setActiveTab] = useState<"editor"|"preview">("editor")
  const [showBindingsPopup, setShowBindingsPopup] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const [saved, setSaved] = useState(true)
  const [textColor, setTextColor] = useState('#111827')
  const [highlightColor, setHighlightColor] = useState('#fff59d')
  const savedPosRef = useRef<number | null>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [linkModal, setLinkModal] = useState<{open:boolean, url:string}>({open:false, url:''})
  const [imageModal, setImageModal] = useState<{open:boolean, url:string}>({open:false, url:''})
  const [cropSrc, setCropSrc] = useState<string|null>(null)
  const [cellBg, setCellBg] = useState('#ffffff')
  const [borderColor, setBorderColor] = useState('#e6e6e6')
  const [borderWidth, setBorderWidth] = useState('1px')
  const [borderStyle, setBorderStyle] = useState('solid')
  const [fontFamily, setFontFamily] = useState('')
  const [fontSize, setFontSize] = useState('')
  const [cellHeight, setCellHeight] = useState('')
  const [rowHeight, setRowHeight] = useState('')
  const [editorHeight, setEditorHeight] = useState(380)
  const isDraggingEditorRef = useRef(false)
  const startYRef = useRef(0)
  const startHRef = useRef(0)
  const isDraggingRowRef = useRef(false)
  const rowDragStartY = useRef(0)
  const rowDragStartH = useRef(0)
  const [pastePopup, setPastePopup] = useState(false)
  const [pasteCoords, setPasteCoords] = useState<{ x: number; y: number } | null>(null)
  const pasteRangeRef = useRef<{ from: number; to: number } | null>(null)
  const pasteDataRef = useRef<{ html: string; text: string; keep: string; adapt: string; plain: string } | null>(null)
  const pasteTimerRef = useRef<any>(null)

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
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      Color.configure({ types: ['textStyle'] }),
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      FontSize,
      SpacingExtension,
      TextAlign.configure({ types: ['heading','paragraph'] }),
      Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false, HTMLAttributes: { class: 'text-[#0075de] underline underline-offset-2 cursor-pointer' } }),
      ResizableImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true, handleWidth: 8, lastColumnResizable:true, allowTableNodeSelection:true }),
      CustomTableRow,
      CustomTableHeader,
      CustomTableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
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
      let json = ""
      try { json = JSON.stringify(editor.getJSON()) } catch {}
      setForm(prev => (prev.contentHtml === html && prev.contentJson === json ? prev : { ...prev, contentHtml: html, contentJson: json }))
      setSaved(false)
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
        const json = row.contentJson || ""
        setForm({ name: row.name, isLooping: !!row.isLooping, contentHtml: html, contentJson: json, bindings })
        setTimeout(()=>{
          if (editor) {
            try {
              if (json) editor.commands.setContent(JSON.parse(json))
              else editor.commands.setContent(html || "<p></p>")
            } catch {
              editor.commands.setContent(html || "<p></p>")
            }
            setSaved(true)
          }
        }, 100)
        setLoading(false)
      }).catch(()=>setLoading(false))
    }
  },[mode,id, editor])

  // Sync font family/size/color from selection
  useEffect(()=>{
    if (!editor) return
    const attrs = editor.getAttributes('textStyle') as any
    setFontFamily(attrs.fontFamily || '')
    setFontSize(attrs.fontSize || '')
    if (attrs.color) setTextColor(attrs.color)
    const hl = editor.getAttributes('highlight') as any
    if (hl?.color) setHighlightColor(hl.color)
  }, [tick, editor])

  // Keyboard shortcuts — Find (Ctrl+F), Clear formatting (Ctrl+\), Bold/Italic reuse via editor
  useEffect(()=>{
    if (!editor) return
    const dom = editor.view.dom as HTMLElement
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setFindOpen(o => !o)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        editor.chain().focus().unsetAllMarks().clearNodes().run()
      }
    }
    dom.addEventListener('keydown', onKey)
    return ()=> dom.removeEventListener('keydown', onKey)
  }, [editor])

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

  // Row height drag via bottom edge — cursor row-resize & drag to resize height
  useEffect(()=>{
    if (!editor) return
    const dom = editor.view.dom as HTMLElement
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // ignore if clicking on column handle
      if (target.closest('.column-resize-handle')) return
      const tr = target.closest('tr') as HTMLElement | null
      if (!tr || !dom.contains(tr)) return
      const rect = tr.getBoundingClientRect()
      const distToBottom = rect.bottom - e.clientY
      if (distToBottom < 0 || distToBottom > 9) return // only within 9px from bottom edge
      e.preventDefault()
      const startY = e.clientY
      const startH = tr.offsetHeight || 40
      const trEl = tr
      // visual feedback
      trEl.style.outline = '2px solid #0075de'
      const onMove = (ev: MouseEvent) => {
        const nh = Math.max(28, startH + (ev.clientY - startY))
        trEl.style.height = `${nh}px`
        trEl.querySelectorAll('td, th').forEach(c => (c as HTMLElement).style.height = `${nh}px`)
        document.body.style.cursor = 'row-resize'
        document.body.style.userSelect = 'none'
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        trEl.style.outline = ''
        const finalH = trEl.style.height
        try { (editor.chain().focus() as any).updateAttributes('tableRow', { height: finalH }).run() } catch {}
        try { editor.chain().focus().setCellAttribute('height', finalH).run() } catch {}
        setTimeout(()=>{ const html = editor.getHTML(); setForm(prev=>({...prev, contentHtml: html})); setTick(v=>v+1); showToast(`Tinggi baris → ${finalH}`, 'success') }, 30)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'row-resize'
    }
    dom.addEventListener('mousedown', onMouseDown)
    return ()=> dom.removeEventListener('mousedown', onMouseDown)
  }, [editor])

  // Paste from Word / doc lain — intercept, default adapt, popup 3 pilihan
  useEffect(()=>{
    if (!editor) return
    const dom = editor.view.dom as HTMLElement
    const onPaste = (e: ClipboardEvent) => {
      const html = e.clipboardData?.getData('text/html') || ''
      const text = e.clipboardData?.getData('text/plain') || ''
      if (!html && !text) return
      const hasHtml = !!html && /<(p|h\d|span|div|table|ul|ol|strong|em)/i.test(html)
      if (!hasHtml && text.length < 20) return
      const isExternalStyled = !!html && (isWordHtml(html) || /style=|font-family|font-size|color:/i.test(html) || html.includes('mso-'))
      if (hasHtml && !isExternalStyled && !/<(table|ul|ol)/i.test(html) && html.length < 800) return
      e.preventDefault()
      e.stopPropagation()
      // @ts-ignore stopImmediatePropagation may not exist on some browsers but safe
      ;(e as any).stopImmediatePropagation?.()
      const from = editor.state.selection.from
      const keep = hasHtml ? keepStyleHtml(html) : plainToHtml(text)
      const adapt = hasHtml ? adaptToEditorHtml(html) : plainToHtml(text)
      const plain = plainToHtml(text)
      // default insert adapt (sekali saja, jangan double)
      editor.chain().focus().insertContent(adapt).run()
      const to = editor.state.selection.to
      pasteRangeRef.current = { from, to }
      pasteDataRef.current = { html, text, keep, adapt, plain }
      let coords = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      try {
        const view = editor.view
        const pos = view.coordsAtPos(to)
        coords = { x: pos.left, y: pos.top }
      } catch {}
      if (!coords.x) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount) {
          const r = sel.getRangeAt(0).getBoundingClientRect()
          coords = { x: r.left, y: r.bottom }
        }
      }
      setPasteCoords(coords)
      setPastePopup(true)
      // popup tetap sampai user pilih / Esc / X — tidak auto-hide
    }
    // capture true agar cegah ProseMirror default double insert
    dom.addEventListener('paste', onPaste as any, true)
    return ()=> {
      dom.removeEventListener('paste', onPaste as any, true)
    }
  }, [editor])

  // Esc untuk tutup popup paste (tetap sampai user pilih)
  useEffect(()=>{
    if (!pastePopup) return
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setPastePopup(false) }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [pastePopup])

  const applyPasteChoice = (choice: 'keep'|'adapt'|'plain') => {
    if (!editor || !pasteRangeRef.current || !pasteDataRef.current) { setPastePopup(false); return }
    const { from, to } = pasteRangeRef.current
    const data = pasteDataRef.current
    let htmlChoice = data.adapt
    if (choice === 'keep') htmlChoice = data.keep
    else if (choice === 'plain') htmlChoice = data.plain
    try {
      // hapus range adapt yang baru di-insert lalu insert pilihan — single transaction, tidak double
      editor.chain().focus().deleteRange({ from, to } as any).insertContentAt(from, htmlChoice).run()
      setTick(v=>v+1)
      setForm(prev=> ({ ...prev, contentHtml: editor.getHTML() }))
      showToast(choice==='keep' ? 'Paste: style asli dipertahankan' : choice==='plain' ? 'Paste: hanya text' : 'Paste: disesuaikan dengan editor', 'success')
    } catch (err) {
      console.error('applyPasteChoice error', err)
      showToast('Gagal menerapkan pilihan paste', 'error')
    }
    setPastePopup(false)
    pasteRangeRef.current = null
    pasteDataRef.current = null
  }

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
    let latestJson = form.contentJson
    if (editor) {
      latestHtml = editor.getHTML()
      try { latestJson = JSON.stringify(editor.getJSON()) } catch {}
    }
    if(!form.name.trim()){
      showToast('Nama component wajib diisi', 'error')
      return
    }
    const payload={ name: form.name.trim(), isLooping: form.isLooping, contentHtml: latestHtml, contentJson: latestJson, bindingsJson: JSON.stringify(form.bindings) }
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

  const handleImageFile = (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('image/')) { showToast('File harus berupa gambar', 'error'); return }
    if (f.size > 5 * 1024 * 1024) { showToast('Ukuran gambar maksimal 5MB', 'error'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      if (!dataUrl.startsWith('data:image')) { showToast('Gagal membaca gambar', 'error'); return }
      setImageModal({ open: true, url: dataUrl })
      showToast('Gambar siap disisipkan (base64)', 'success')
    }
    reader.onerror = () => showToast('Gagal membaca file', 'error')
    reader.readAsDataURL(f)
  }

  const openCropFromSelection = () => {
    if (!editor) return
    const src = ((editor.getAttributes('image') as any)?.src as string) || ''
    if (!src) { showToast('Pilih gambar di editor dulu', 'error'); return }
    setCropSrc(src)
  }

  const applyCrop = (dataUrl: string, cw: number, ch: number) => {
    if (!editor) return
    const w = Math.min(cw, 860)
    const h = Math.max(24, Math.round((Math.min(cw, 860) * ch) / Math.max(1, cw)))
    editor.chain().focus().updateAttributes('image', { src: dataUrl, width: w, height: h }).run()
    setCropSrc(null)
    setTimeout(() => { const html = editor.getHTML(); setForm(prev => ({ ...prev, contentHtml: html })); setTick(v => v + 1) }, 20)
    showToast('Crop diterapkan', 'success')
  }


  // --- Border helpers ---
  const applyBorderPreset = (preset: string) => {
    if (!editor) return
    // Always sync border attrs first so renderHTML has fresh color/width/style
    editor.chain().focus().setCellAttribute('borderColor', borderColor).setCellAttribute('borderWidth', borderWidth).setCellAttribute('borderStyle', borderStyle).run()
    if (preset === 'outer') {
      applyOuterBorder()
      return
    }
    // 'all' clears borderPosition (default all borders via individual attrs)
    if (preset === 'all') {
      editor.chain().focus().setCellAttribute('borderPosition', null).run()
      showToast('Border: semua sisi', 'success')
      return
    }
    editor.chain().focus().setCellAttribute('borderPosition', preset).run()
    const labels: Record<string,string> = { none: 'Tanpa border', left: 'Border kiri saja', right: 'Border kanan saja', leftRight: 'Border kiri & kanan', top: 'Border atas saja', bottom: 'Border bawah saja' }
    showToast(labels[preset] || `Border: ${preset}`, 'success')
  }
  const applyOuterBorder = () => {
    if (!editor) return
    try {
      const domTable = editor.view.dom.querySelector('table')
      if (!domTable) {
        editor.chain().focus().setCellAttribute('borderPosition', null).setCellAttribute('borderColor', borderColor).setCellAttribute('borderWidth', borderWidth).setCellAttribute('borderStyle', borderStyle).run()
        showToast('Outer border diterapkan ke cell terpilih', 'success')
        return
      }
      const domRows = domTable.querySelectorAll('tr')
      const rowCount = domRows.length
      if (rowCount === 0) return
      const firstRowCells = domRows[0].querySelectorAll('td, th').length
      const isSingleRow = rowCount === 1
      const isSingleCol = firstRowCells === 1
      const { state } = editor.view
      let tr2 = state.tr
      let any = false
      domRows.forEach((trEl, ri) => {
        const cells = trEl.querySelectorAll('td, th')
        const colCount = cells.length
        cells.forEach((cellEl, ci) => {
          const isFirstRow = ri === 0
          const isLastRow = ri === rowCount - 1
          const isFirstCol = ci === 0
          const isLastCol = ci === colCount - 1
          let preset: string | null = 'none'
          if (rowCount === 1 && colCount === 1) {
            preset = null // single cell = all sides
          } else if (isSingleRow && !isSingleCol) {
            // single row, multiple cols -> need top+bottom plus left/right edges
            if (isFirstCol) preset = 'leftTopBottom'
            else if (isLastCol) preset = 'rightTopBottom'
            else preset = 'topBottom'
          } else if (isSingleCol && !isSingleRow) {
            // single column, multiple rows
            if (isFirstRow) preset = 'leftRightTop'
            else if (isLastRow) preset = 'leftRightBottom'
            else preset = 'leftRight'
          } else {
            // normal multi-row multi-col
            if (isFirstRow && isFirstCol) preset = 'topLeft'
            else if (isFirstRow && isLastCol) preset = 'topRight'
            else if (isLastRow && isFirstCol) preset = 'bottomLeft'
            else if (isLastRow && isLastCol) preset = 'bottomRight'
            else if (isFirstRow) preset = 'top'
            else if (isLastRow) preset = 'bottom'
            else if (isFirstCol) preset = 'left'
            else if (isLastCol) preset = 'right'
            else preset = 'none'
          }

          const pos = (editor.view as any).posAtDOM(cellEl, 0) as number | null
          if (typeof pos === 'number') {
            const node = state.doc.nodeAt(pos)
            if (node) {
              const newAttrs: any = { ...node.attrs }
              if (preset === null) {
                newAttrs.borderPosition = null
              } else {
                newAttrs.borderPosition = preset
              }
              newAttrs.borderColor = borderColor
              newAttrs.borderWidth = borderWidth
              newAttrs.borderStyle = borderStyle
              tr2 = tr2.setNodeMarkup(pos, undefined, newAttrs)
              any = true
            }
          }
        })
      })
      if (any) {
        editor.view.dispatch(tr2)
        showToast('Outer border: hanya tepi luar tabel', 'success')
        setTimeout(()=>{ const html = editor.getHTML(); setForm(prev=>({...prev, contentHtml: html})); setTick(v=>v+1)}, 40)
      } else {
        editor.chain().focus().setCellAttribute('borderPosition', null).run()
      }
    } catch (e: any) {
      console.error(e)
      editor.chain().focus().setCellAttribute('borderPosition', null).run()
      showToast('Outer border fallback ke semua sisi', 'info')
    }
  }

  const applyCellHeight = () => {
    if (!editor) return
    const h = cellHeight.trim()
    if (!h) {
      editor.chain().focus().setCellAttribute('height', null).run()
      showToast('Tinggi cell direset ke auto', 'info')
      return
    }
    const val = /^\d+$/.test(h) ? `${h}px` : h
    if (!/^\d+(px|%|em|rem)$/.test(val)) { showToast('Format tinggi tidak valid (contoh 48px atau 2em)', 'error'); return }
    editor.chain().focus().setCellAttribute('height', val).run()
    showToast(`Tinggi cell: ${val}`, 'success')
  }
  const applyRowHeight = () => {
    if (!editor) return
    const h = rowHeight.trim()
    if (!h) {
      try { (editor.chain().focus() as any).updateAttributes('tableRow', { height: null }).run() } catch {}
      // also clear cell heights in row
      editor.chain().focus().setCellAttribute('height', null).run()
      showToast('Tinggi baris direset', 'info')
      return
    }
    const val = /^\d+$/.test(h) ? `${h}px` : h
    if (!/^\d+(px|%|em|rem)$/.test(val)) { showToast('Format tinggi tidak valid', 'error'); return }
    try { (editor.chain().focus() as any).updateAttributes('tableRow', { height: val }).run() } catch { editor.chain().focus().setCellAttribute('height', val).run() }
    showToast(`Tinggi baris: ${val}`, 'success')
  }

  // Editor container height drag
  const handleEditorGripMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingEditorRef.current = true
    startYRef.current = e.clientY
    startHRef.current = editorHeight
    const onMove = (ev: MouseEvent) => {
      if (!isDraggingEditorRef.current) return
      const dy = ev.clientY - startYRef.current
      const nh = Math.max(240, Math.min(900, startHRef.current + dy))
      setEditorHeight(nh)
    }
    const onUp = () => {
      isDraggingEditorRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
  }
  // Row height drag (bottom edge of selected row)
  const handleRowDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const el = editor?.view.dom.querySelector('.selectedCell')?.closest('tr') as HTMLElement | null
    const targetTr = el || (editor?.view.dom.querySelector('table tr') as HTMLElement | null)
    if (!targetTr) return
    const startH = targetTr.offsetHeight || 40
    const onMove = (ev: MouseEvent) => {
      const dy = ev.clientY - startY
      const nh = Math.max(24, startH + dy)
      targetTr.style.height = `${nh}px`
      // also apply to cells
      targetTr.querySelectorAll('td, th').forEach(c => (c as HTMLElement).style.height = `${nh}px`)
    }
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      // sync to editor attribute
      const finalH = targetTr.style.height
      try { (editor!.chain().focus() as any).updateAttributes('tableRow', { height: finalH }).run() } catch {}
      try { editor!.chain().focus().setCellAttribute('height', finalH).run() } catch {}
      setTimeout(() => {
        const html = editor!.getHTML()
        setForm(prev => ({ ...prev, contentHtml: html }))
        setTick(v=>v+1)
      }, 30)
      showToast(`Tinggi baris → ${finalH}`, 'success')
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'row-resize'
  }

  if(loading) return <div className="p-8 text-center text-sm text-[#6b7280] animate-pulse">Memuat data...</div>
  if (!editor) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat editor…</div>

  return (
    <div className="min-h-[calc(100vh-120px)]">
      {/* Paste Choice Popup */}
      <PasteChoicePopup open={pastePopup} coords={pasteCoords} onClose={()=>setPastePopup(false)} onChoose={applyPasteChoice} />
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t=>(
          <div key={t.id} className={`pointer-events-auto min-w-[280px] max-w-[420px] rounded-[8px] border px-2.5 py-2 shadow-lg flex items-start gap-2.5 text-sm ${t.type==='error' ? 'bg-red-50 border-red-200 text-red-800' : t.type==='success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${t.type==='error' ? 'bg-red-600 text-white' : t.type==='success' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
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
          <div className="relative bg-white rounded-[8px] w-full max-w-md shadow-xl border border-[#e6e6e6] p-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-[13px] flex items-center gap-2"><Link2 size={14} className="text-[#0075de]"/> Atur Link</div>
              <button onClick={()=> setLinkModal({open:false, url:''})} className="w-6 h-6 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14}/></button>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs font-semibold">URL Link</Label>
                <Input value={linkModal.url} onChange={e=> setLinkModal({...linkModal, url: e.target.value})} placeholder="https://example.com" className="mt-1 h-7 text-[13px]" autoFocus />
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
      {cropSrc && (
        <ImageCropModal src={cropSrc} onClose={()=>setCropSrc(null)} onApply={applyCrop} showToast={showToast} />
      )}
      {/* Image Modal */}
      {imageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setImageModal({open:false, url:''})} />
          <div className="relative bg-white rounded-[8px] w-full max-w-md shadow-xl border border-[#e6e6e6] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-[13px] flex items-center gap-2"><ImageIcon size={14} className="text-[#0075de]"/> Sisipkan Gambar</div>
              <button onClick={()=> setImageModal({open:false, url:''})} className="w-6 h-6 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14}/></button>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs font-semibold">URL Gambar</Label>
                <Input value={imageModal.url} onChange={e=> setImageModal({...imageModal, url: e.target.value})} placeholder="https://example.com/image.jpg" className="mt-1 h-7 text-[13px]" autoFocus />
                <p className="text-[11px] text-[#6b7280] mt-1">Tempel URL gambar publik (jpg, png, webp). Gambar akan disisipkan di posisi kursor.</p>
              <div className="flex items-center gap-2 text-[11px] text-[#9ca3af]"><span className="flex-1 h-px bg-[#e6e6e6]"/>atau<span className="flex-1 h-px bg-[#e6e6e6]"/></div>
              <label className="flex items-center justify-center gap-1.5 h-8 rounded-[6px] border border-dashed border-[#0075de]/40 bg-[#eff6ff] text-[#0075de] text-[13px] font-medium cursor-pointer hover:bg-[#dbeafe]" title="Upload gambar dari perangkat — otomatis jadi base64"><Upload size={14}/> Upload dari perangkat (base64)<input type="file" accept="image/*" className="hidden" onChange={e=>{handleImageFile(e.target.files?.[0]); e.target.value=""}} /></label>
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

      {/* Page top bar — status + tutorial */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 bg-white border border-[#e6e6e6] rounded-full px-3 py-1 text-xs text-[#6b7280]"><LayoutTemplate size={12} className="text-[#0075de]"/> Component Persuratan</span>
        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[#6b7280]"><MousePointer2 size={12}/> Klik kanan di editor untuk insert tepat di kursor</span>
        <span className="ml-auto" />
        <Badge variant={form.isLooping ? "default" : "secondary"} className="text-[11px]">{form.isLooping ? "Looping Aktif" : "Single"}</Badge>
        <Button size="sm" variant="outline" onClick={()=>setShowTutorial(true)}><BookOpen size={14}/> Tutorial</Button>
      </div>

      {/* FULL editor konten — single card */}
      <div className="space-y-2.5">
          {/* Editor */}
          <Card className="overflow-hidden shadow-sm">
            {/* Identity header — penamaan + mode pengulangan dalam satu card editor */}
            <div className="border-b border-[#e6e6e6] bg-gradient-to-r from-[#eff6ff] via-white to-[#faf5ff]">
              <div className="p-3 flex flex-col md:flex-row gap-2.5 md:items-center">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-[8px] bg-[#0075de] text-white flex items-center justify-center shadow-sm shrink-0"><FileText size={16}/></div>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="comp-name" className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Nama Komponen <span className="text-red-500">*</span></Label>
                    <Input id="comp-name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Contoh: Kop Surat, Tanda Tangan, Daftar Hadir" className="h-8 text-sm font-semibold bg-white border-[#e6e6e6] mt-0.5" />
                  </div>
                </div>
                <div className={`flex items-center gap-2.5 rounded-[8px] border px-2.5 py-2 shrink-0 transition-colors ${form.isLooping ? 'bg-violet-600 border-violet-600 text-white shadow-sm' : 'bg-white border-[#e6e6e6]'}`}>
                  <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${form.isLooping ? 'bg-white/20 text-white' : 'bg-[#f6f5f4] text-[#6b7280]'}`}><Settings2 size={14}/></div>
                  <div>
                    <div className={`text-[13px] font-semibold leading-tight ${form.isLooping ? 'text-white' : ''}`}>Mode Pengulangan</div>
                    <div className={`text-[11px] leading-tight ${form.isLooping ? 'text-white/80' : 'text-[#6b7280]'}`}>{form.isLooping ? 'Diulang per baris data' : 'Sekali tampil (single)'}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-1">
                    <input type="checkbox" checked={form.isLooping} onChange={e=>setForm({...form, isLooping:e.target.checked})} className="sr-only peer" />
                    <div className={`w-10 h-[22px] rounded-full transition-colors relative peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/40 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:after:translate-x-[18px] ${form.isLooping ? 'bg-white/30' : 'bg-[#e5e7eb]'}`}></div>
                  </label>
                </div>
              </div>
              {/* Tab Editor / Preview + quick actions */}
              <div className="px-3 pb-2.5 flex items-center gap-2 flex-wrap">
                <div className="flex bg-[#f0f0f0] border border-[#e6e6e6] rounded-full p-0.5">
                  <button type="button" onClick={()=>setActiveTab("editor")} className={`h-7 px-3.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 transition-colors ${activeTab==="editor" ? 'bg-white text-[#111] shadow-sm border border-[#e6e6e6]' : 'text-[#6b7280] hover:text-[#111]'}`}><Sparkles size={13}/> Editor</button>
                  <button type="button" onClick={()=>setActiveTab("preview")} className={`h-7 px-3.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 transition-colors ${activeTab==="preview" ? 'bg-white text-[#111] shadow-sm border border-[#e6e6e6]' : 'text-[#6b7280] hover:text-[#111]'}`}><Eye size={13}/> Preview {form.bindings.length > 0 && <span className="text-[10px] bg-[#0075de] text-white rounded-full px-1.5">{form.bindings.length}</span>}</button>
                </div>
                <span className="text-[11px] text-[#6b7280] hidden md:inline">Klik kanan di posisi kursor untuk menambah <span className="font-mono bg-white border px-1 py-0.5 rounded text-[#111]">{`{{data}}`}</span></span>
                <div className="ml-auto flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono hidden sm:inline-flex">{previewHtml.length} chars</Badge>
                  <Button size="sm" variant="outline" onClick={()=>{ savedPosRef.current = editor?.state.selection.from ?? null; setShowBindingsPopup(true) }} className="border-violet-200 text-violet-700 hover:bg-violet-50"><Database size={13}/> Data Terkait {form.bindings.length > 0 && <span className="ml-0.5 bg-violet-600 text-white text-[10px] rounded-full px-1.5">{form.bindings.length}</span>}</Button>
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              {activeTab === "preview" ? (
                <div className="p-2.5 bg-[#f6f5f4]">
                  <div className="bg-white rounded-[8px] shadow-[0_1px_8px_rgba(0,0,0,0.08)] border border-[#e6e6e6] min-h-[280px] overflow-auto">
                    <div className="flex items-center justify-between px-3 py-2 bg-[#fcfcfc] border-b border-[#e6e6e6] text-[11px] text-[#6b7280]">
                      <span className="flex items-center gap-1.5 font-medium"><Eye size={12} className="text-[#0075de]"/> Pratinjau — render 1:1 dengan editor</span>
                      <button onClick={()=>{
                        const html = previewHtml
                        const w = window.open("","_blank")
                        if(w){
                          w.document.write(`<html><head><title>${form.name||'Preview'}</title></head><body><div>${html}</div></body></html>`)
                          w.document.close()
                        }
                      }} className="text-[#0075de] hover:underline inline-flex items-center gap-1"><Eye size={11}/> Buka di tab</button>
                    </div>
                    <div className="tiptap prose prose-sm max-w-none p-6 min-h-[280px] leading-relaxed text-[14px] text-[#111827] prose-p:my-2 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-blockquote:border-l-4 prose-blockquote:border-[#e5e7eb] prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-[#0075de] prose-strong:font-bold prose-ul:list-disc prose-ol:list-decimal prose-li:my-1 prose-table:border-collapse prose-th:bg-[#f9fafb] prose-th:p-2 prose-th:border prose-td:p-2 prose-td:border prose-img:rounded-lg focus:outline-none" dangerouslySetInnerHTML={{__html: previewHtml || "<p class='text-[#9ca3af] italic'>Preview kosong — ketik di editor</p>"}} />
                  </div>
                  <div className="mt-2 text-[11px] text-[#6b7280] flex items-center gap-1.5"><Info size={12}/> Binding <span className="font-mono">{"{{nama}}"}</span> → nilai contoh. Heading, list, tabel tampil identik.</div>
                </div>
              ) : (
              <>
              {/* FindBar — Ctrl+F */}
              {findOpen && (
                <div className="p-2 bg-white border-b border-[#e6e6e6]">
                  <FindBar editor={editor} open={findOpen} onClose={()=>setFindOpen(false)} />
                </div>
              )}
              {/* Toolbar - Redesigned: lebih rapi, berlabel, grouping jelas */}
              <div className="sticky top-0 z-10 bg-gradient-to-b from-[#fcfcfc] to-[#f9fafb] border-y border-[#e6e6e6]">
                {/* Top row - main formatting */}
                <div className="p-1.5 flex flex-wrap items-center gap-1.5">
                  {/* Group: History */}
                  <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                    <span className="hidden xl:flex items-center px-2 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Riwayat</span>
                    <button type="button" title="Undo (Ctrl+Z)" onClick={()=>editor.chain().focus().undo().run()} disabled={!can(()=>editor.can().chain().focus().undo().run())} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30 transition-colors"><Undo size={14}/></button>
                    <button type="button" title="Redo (Ctrl+Y)" onClick={()=>editor.chain().focus().redo().run()} disabled={!can(()=>editor.can().chain().focus().redo().run())} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30 transition-colors"><Redo size={14}/></button>
                  </div>
                  {/* Group: Text style */}
                  <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                    <span className="hidden xl:flex items-center px-1 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Format</span>
                    <button type="button" title="Bold (Ctrl+B)" onClick={()=>editor.chain().focus().toggleBold().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('bold') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Bold size={14}/></button>
                    <button type="button" title="Italic (Ctrl+I)" onClick={()=>editor.chain().focus().toggleItalic().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('italic') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Italic size={14}/></button>
                    <button type="button" title="Underline (Ctrl+U)" onClick={()=>editor.chain().focus().toggleUnderline().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('underline') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><UnderlineIcon size={14}/></button>
                    <button type="button" title="Strikethrough" onClick={()=>editor.chain().focus().toggleStrike().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('strike') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Strikethrough size={14}/></button>
                    <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center"/>
                    <button type="button" title="Clear formatting" onClick={()=>editor.chain().focus().unsetAllMarks().clearNodes().run()} className="w-7 h-7 rounded-[6px] hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center text-[#6b7280] transition-colors"><Eraser size={14}/></button>
                  </div>
                  {/* Group: Font Family & Size */}
                  <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm items-center">
                    <span className="hidden xl:flex items-center px-1 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Font</span>
                    <select value={fontFamily} onChange={e=>{ const v=e.target.value; setFontFamily(v); if(v) (editor.chain().focus() as any).setFontFamily(v).run(); else (editor.chain().focus() as any).unsetFontFamily().run() }} className="h-7 text-[13px] border-0 bg-transparent pr-1 focus:ring-0 focus:outline-none cursor-pointer max-w-[110px]" title="Font Family">
                      {FONT_FAMILIES.map(f=> <option key={f.label} value={f.value} style={{fontFamily: f.value || undefined}}>{f.label}</option>)}
                    </select>
                    <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center"/>
                    <select value={fontSize} onChange={e=>{ const v=e.target.value; setFontSize(v); if(v) (editor.chain().focus() as any).setFontSize(v).run(); else (editor.chain().focus() as any).unsetFontSize().run() }} className="h-7 text-[13px] border-0 bg-transparent pr-1 focus:ring-0 focus:outline-none cursor-pointer w-[68px]" title="Font Size">
                      {FONT_SIZES.map(f=> <option key={f.label} value={f.value}>{f.label}{f.value ? ` (${f.value})` : ''}</option>)}
                    </select>
                  </div>
                  {/* Group: Headings */}
                  <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm items-center">
                    <div className="hidden lg:flex items-center gap-1.5 px-2 border-r border-[#e6e6e6] mr-1">
                      <Type size={12} className="text-[#6b7280]"/>
                      <select value={getHeadingLevel()} onChange={e=>{
                        const v=e.target.value
                        if(v==='p') editor.chain().focus().setParagraph().run()
                        else editor.chain().focus().toggleHeading({level: Number(v) as any}).run()
                      }} className="h-7 text-[13px] font-medium border-0 bg-transparent pr-2 focus:ring-0 focus:outline-none cursor-pointer">
                        <option value="p">Paragraf</option>
                        <option value="1">Heading 1</option>
                        <option value="2">Heading 2</option>
                        <option value="3">Heading 3</option>
                        <option value="4">H4</option>
                        <option value="5">H5</option>
                        <option value="6">H6</option>
                      </select>
                    </div>
                    {/* Mobile select */}
                    <div className="lg:hidden flex items-center">
                      <select value={getHeadingLevel()} onChange={e=>{
                        const v=e.target.value
                        if(v==='p') editor.chain().focus().setParagraph().run()
                        else editor.chain().focus().toggleHeading({level: Number(v) as any}).run()
                      }} className="h-7 text-[13px] border-0 bg-transparent px-1 focus:ring-0 focus:outline-none">
                        <option value="p">P</option>
                        <option value="1">H1</option>
                        <option value="2">H2</option>
                        <option value="3">H3</option>
                      </select>
                    </div>
                    <button type="button" title="Heading 1" onClick={()=>editor.chain().focus().toggleHeading({level:1}).run()} className={`hidden sm:flex px-2 h-7 rounded-[6px] items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${isActive('heading',{level:1}) ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading1 size={12}/> H1</button>
                    <button type="button" title="Heading 2" onClick={()=>editor.chain().focus().toggleHeading({level:2}).run()} className={`hidden sm:flex px-2 h-7 rounded-[6px] items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${isActive('heading',{level:2}) ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading2 size={12}/> H2</button>
                    <button type="button" title="Heading 3" onClick={()=>editor.chain().focus().toggleHeading({level:3}).run()} className={`hidden md:flex px-2 h-7 rounded-[6px] items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${isActive('heading',{level:3}) ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading3 size={12}/> H3</button>
                    <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center hidden sm:block"/>
                    <button type="button" title="Blockquote" onClick={()=>editor.chain().focus().toggleBlockquote().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('blockquote') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Quote size={14}/></button>
                  </div>
                  {/* Group: Align */}
                  <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                    <button type="button" title="Align left" onClick={()=>editor.chain().focus().setTextAlign('left').run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isAlignActive('left') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignLeft size={14}/></button>
                    <button type="button" title="Align center" onClick={()=>editor.chain().focus().setTextAlign('center').run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isAlignActive('center') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignCenter size={14}/></button>
                    <button type="button" title="Align right" onClick={()=>editor.chain().focus().setTextAlign('right').run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isAlignActive('right') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignRight size={14}/></button>
                    <button type="button" title="Justify" onClick={()=>editor.chain().focus().setTextAlign('justify').run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isAlignActive('justify') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignJustify size={14}/></button>
                  </div>
                  {/* Group: Lists */}
                  <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                    <button type="button" title="Bullet list" onClick={()=> editor.chain().focus().toggleBulletList().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('bulletList') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><List size={14}/></button>
                    <button type="button" title="Ordered list" onClick={()=> editor.chain().focus().toggleOrderedList().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('orderedList') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><ListOrdered size={14}/></button>
                    <div className="w-px h-5 bg-[#e6e6e6] mx-1 self-center"/>
                    <button type="button" title="Kurangi indent" onClick={()=> editor.chain().focus().liftListItem('listItem').run()} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280] text-[11px] font-mono">←</button>
                    <button type="button" title="Tambah indent" onClick={()=> editor.chain().focus().sinkListItem('listItem').run()} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280] text-[11px] font-mono">→</button>
                  </div>
                    <SpacingDropdown editor={editor} tick={tick} />
                  {/* Group: Text Color & Highlight */}
                  <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm items-center">
                    <div className="flex items-center gap-1">
                      <input type="color" value={textColor} onChange={e=>{setTextColor(e.target.value); (editor.chain().focus() as any).setColor(e.target.value).run()}} className="w-7 h-7 rounded-[6px] border border-[#e6e6e6] p-0.5 cursor-pointer" title="Warna teks" />
                      <input type="color" value={highlightColor} onChange={e=>{setHighlightColor(e.target.value)}} className="w-7 h-7 rounded-[6px] border border-[#e6e6e6] p-0.5 cursor-pointer" title="Warna highlight" />
                    </div>
                    <button type="button" title="Highlight (Ctrl+Shift+H)" onClick={()=>editor.chain().focus().toggleHighlight({ color: highlightColor }).run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('highlight') ? 'bg-amber-400 text-white shadow-sm' : 'hover:bg-amber-50 text-[#374151]'}`}><Highlighter size={14}/></button>
                    <button type="button" title="Hapus warna" onClick={()=>{editor.chain().focus().unsetColor().run(); editor.chain().focus().unsetHighlight().run()}} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><Eraser size={12}/></button>
                  </div>
                  {/* Group: Checklist & Super/Sub */}
                  <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                    <button type="button" title="Checklist" onClick={()=>{try{(editor.chain().focus() as any).toggleTaskList().run()}catch{editor.chain().focus().toggleBulletList().run()}}} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('taskList') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><ListChecks size={14}/></button>
                    <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center"/>
                    <button type="button" title="Superscript (Ctrl+.)" onClick={()=>{try{(editor.chain().focus() as any).toggleSuperscript().run()}catch{}}} className={`w-7 h-7 rounded-[6px] flex items-center justify-center text-xs font-bold transition-colors ${isActive('superscript') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}>x²</button>
                    <button type="button" title="Subscript (Ctrl+,)" onClick={()=>{try{(editor.chain().focus() as any).toggleSubscript().run()}catch{}}} className={`w-7 h-7 rounded-[6px] flex items-center justify-center text-xs font-bold transition-colors ${isActive('subscript') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}>x₂</button>
                  </div>
                  {/* Group: Data Terkait — toolbar khusus */}
                  <div className="flex gap-0.5 bg-violet-50 border border-violet-200 rounded-[8px] p-1 shadow-sm">
                    <button type="button" title="Data Terkait — kelola binding" onClick={()=>{ savedPosRef.current = editor?.state.selection.from ?? null; setShowBindingsPopup(true) }} className="h-7 px-2 rounded-[6px] flex items-center gap-1.5 text-[13px] font-medium text-violet-700 hover:bg-violet-100 transition-colors"><Database size={14}/> Data {form.bindings.length > 0 && <span className="bg-violet-600 text-white text-[10px] rounded-full px-1.5 leading-4">{form.bindings.length}</span>}</button>
                  </div>
                  {/* Group: Find */}
                  <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                    <button type="button" title="Find & Replace (Ctrl+F)" onClick={()=>setFindOpen(!findOpen)} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${findOpen ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Search size={14}/></button>
                  </div>
                  {/* Group: Insert */}
                  <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                    <button type="button" title="Insert table 3x3" onClick={()=>{editor.chain().focus().insertTable({rows:3, cols:3, withHeaderRow:true}).run(); showToast('Tabel 3×3 ditambahkan','success')}} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#374151]"><TableIcon size={14}/></button>
                    <button type="button" title="Atur link (modal)" onClick={openLinkModal} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('link') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Link2 size={14}/></button>
                    <button type="button" title="Sisipkan gambar (modal)" onClick={openImageModal} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#374151]"><ImageIcon size={14}/></button>
                    <button type="button" title="Garis horizontal" onClick={()=>editor.chain().focus().setHorizontalRule().run()} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><Minus size={14}/></button>
                  </div>
                  <div className="ml-auto hidden xl:flex items-center gap-2">
                    <span className="text-[11px] text-[#9ca3af]">Seleksi teks → gunakan toolbar</span>
                    <span className="w-px h-4 bg-[#e6e6e6]"/>
                    <span className="text-[11px] font-medium text-[#0075de] flex items-center gap-1"><MousePointer2 size={11}/> Klik kanan → binding</span>
                  </div>
                </div>
                {/* Hint bar */}
                <div className="px-3 py-1.5 bg-[#f6f5f4]/70 border-t border-[#e6e6e6]/60 flex items-center gap-2 text-[11px] text-[#6b7280]">
                  <Sparkles size={11} className="text-[#0075de] shrink-0"/>
                  <span className="hidden sm:inline">Heading H1–H6, list, tabel, link & gambar semua aktif — klik kanan di posisi kursor untuk menambah <span className="font-mono bg-white border border-[#e6e6e6] px-1 py-0.5 rounded text-[#111] text-[10px]">{"{{data}}"}</span></span>
                  <span className="sm:hidden">Klik kanan → tambah {"{{data}}"}</span>
                </div>
              </div>

              {/* Table Ops — satu baris ikon + tooltip */}
              {editor && editor.isActive('table') && (
                <div className="border-b border-[#e6e6e6] bg-[#fcfcfc] px-2 py-1 flex items-center gap-0.5 flex-wrap">
                  <span className="w-6 h-6 rounded-[6px] bg-[#0075de] text-white flex items-center justify-center shrink-0 mr-0.5" title="Operasi Tabel — muncul karena kursor di dalam tabel"><Grid3x3 size={13}/></span>
                  <button type="button" title="Tambah baris di atas" onClick={()=>{editor.chain().focus().addRowBefore().run(); showToast('Baris ditambahkan di atas','success')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><ArrowUp size={14}/></button>
                  <button type="button" title="Tambah baris di bawah" onClick={()=>{editor.chain().focus().addRowAfter().run(); showToast('Baris ditambahkan di bawah','success')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><ArrowDown size={14}/></button>
                  <button type="button" title="Hapus baris" onClick={()=>{editor.chain().focus().deleteRow().run(); showToast('Baris dihapus','info')}} className="w-7 h-7 rounded-[6px] hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-[#6b7280] transition-colors shrink-0"><Trash size={14}/></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0"/>
                  <button type="button" title="Tambah kolom di kiri" onClick={()=>{editor.chain().focus().addColumnBefore().run(); showToast('Kolom ditambahkan di kiri','success')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><PanelLeft size={14}/></button>
                  <button type="button" title="Tambah kolom di kanan" onClick={()=>{editor.chain().focus().addColumnAfter().run(); showToast('Kolom ditambahkan di kanan','success')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><PanelRight size={14}/></button>
                  <button type="button" title="Hapus kolom" onClick={()=>{editor.chain().focus().deleteColumn().run(); showToast('Kolom dihapus','info')}} className="w-7 h-7 rounded-[6px] hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-[#6b7280] transition-colors shrink-0"><Trash2 size={14}/></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0"/>
                  <button type="button" title="Gabung cell terpilih" onClick={()=>{editor.chain().focus().mergeCells().run(); showToast('Cell digabung','success')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><Combine size={14}/></button>
                  <button type="button" title="Pecah cell" onClick={()=>{editor.chain().focus().splitCell().run(); showToast('Cell dipecah','success')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><Split size={14}/></button>
                  <button type="button" title="Baris pertama jadi header" onClick={()=>{editor.chain().focus().toggleHeaderRow().run()}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><PanelTop size={14}/></button>
                  <button type="button" title="Kolom pertama jadi header" onClick={()=>{editor.chain().focus().toggleHeaderColumn().run()}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><Columns3 size={14}/></button>
                  <button type="button" title="Cell ini jadi header" onClick={()=>{editor.chain().focus().toggleHeaderCell().run()}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><Square size={14}/></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0"/>
                  <input type="color" value={cellBg} onChange={e=>setCellBg(e.target.value)} className="w-7 h-7 p-1 rounded-[6px] border border-[#e6e6e6] bg-white cursor-pointer shrink-0" title="Warna background cell" />
                  <button type="button" title="Terapkan warna ke cell terpilih" onClick={()=>{editor.chain().focus().setCellAttribute('backgroundColor', cellBg).run(); showToast('Background diterapkan','success')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><PaintBucket size={14}/></button>
                  <button type="button" title="Hapus background cell" onClick={()=>{editor.chain().focus().setCellAttribute('backgroundColor', null).run()}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><Eraser size={14}/></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0"/>
                  <input type="color" value={borderColor} onChange={e=>setBorderColor(e.target.value)} className="w-7 h-7 p-1 rounded-[6px] border border-[#e6e6e6] bg-white cursor-pointer shrink-0" title="Warna border" />
                  <select value={borderWidth} onChange={e=>setBorderWidth(e.target.value)} className="h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-1 bg-white shrink-0" title="Ketebalan border"><option value="1px">1px</option><option value="2px">2px</option><option value="3px">3px</option><option value="4px">4px</option></select>
                  <select value={borderStyle} onChange={e=>setBorderStyle(e.target.value)} className="h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-1 bg-white shrink-0" title="Gaya border"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option></select>
                  <button type="button" title="Tanpa border" onClick={()=>{applyBorderPreset('none')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><Minus size={14}/></button>
                  <button type="button" title="Border kiri" onClick={()=>{applyBorderPreset('left')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><PanelLeft size={14}/></button>
                  <button type="button" title="Border kanan" onClick={()=>{applyBorderPreset('right')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><PanelRight size={14}/></button>
                  <button type="button" title="Border kiri + kanan" onClick={()=>{applyBorderPreset('leftRight')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><Columns2 size={14}/></button>
                  <button type="button" title="Border atas" onClick={()=>{applyBorderPreset('top')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><PanelTop size={14}/></button>
                  <button type="button" title="Border bawah" onClick={()=>{applyBorderPreset('bottom')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><PanelBottom size={14}/></button>
                  <button type="button" title="Hanya border luar tabel" onClick={()=>{applyBorderPreset('outer')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><Frame size={14}/></button>
                  <button type="button" title="Border semua sisi" onClick={()=>{applyBorderPreset('all')}} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><Grid3x3 size={14}/></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0"/>
                  <button type="button" onMouseDown={handleRowDragMouseDown} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0 cursor-row-resize" title="Tahan + drag untuk atur tinggi baris"><GripVertical size={14}/></button>
                  <button type="button" title="Hapus seluruh tabel" onClick={()=>{editor.chain().focus().deleteTable().run(); showToast('Tabel dihapus','info')}} className="w-7 h-7 rounded-[6px] hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-[#6b7280] transition-colors shrink-0"><Trash2 size={14}/></button>
                </div>
              )}

              {/* Image Ops — gambar terpilih: crop + resize */}
              {editor && editor.isActive('image') && (
                <div className="border-b border-[#e6e6e6] bg-[#fcfcfc] px-2 py-1 flex items-center gap-0.5 flex-wrap">
                  <span className="w-6 h-6 rounded-[6px] bg-[#0075de] text-white flex items-center justify-center shrink-0 mr-0.5" title="Gambar terpilih — tarik handle di sudut/tepi gambar untuk resize (tahan Shift di sudut = proporsional)"><ImageIcon size={13}/></span>
                  <button type="button" title="Crop gambar" onClick={openCropFromSelection} className="w-7 h-7 rounded-[6px] hover:bg-[#e9eef5] flex items-center justify-center text-[#374151] transition-colors shrink-0"><Crop size={14}/></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0"/>
                  <button type="button" title="Lebar 240px (tinggi otomatis)" onClick={()=>{editor.chain().focus().updateAttributes('image', { width: 240, height: null }).run(); showToast('Lebar gambar 240px','success')}} className="h-7 min-w-7 px-1.5 rounded-[6px] hover:bg-[#e9eef5] text-[11px] font-bold text-[#374151] transition-colors shrink-0">S</button>
                  <button type="button" title="Lebar 420px (tinggi otomatis)" onClick={()=>{editor.chain().focus().updateAttributes('image', { width: 420, height: null }).run(); showToast('Lebar gambar 420px','success')}} className="h-7 min-w-7 px-1.5 rounded-[6px] hover:bg-[#e9eef5] text-[11px] font-bold text-[#374151] transition-colors shrink-0">M</button>
                  <button type="button" title="Lebar 640px (tinggi otomatis)" onClick={()=>{editor.chain().focus().updateAttributes('image', { width: 640, height: null }).run(); showToast('Lebar gambar 640px','success')}} className="h-7 min-w-7 px-1.5 rounded-[6px] hover:bg-[#e9eef5] text-[11px] font-bold text-[#374151] transition-colors shrink-0">L</button>
                  <button type="button" title="Lebar 860px (tinggi otomatis)" onClick={()=>{editor.chain().focus().updateAttributes('image', { width: 860, height: null }).run(); showToast('Lebar gambar 860px','success')}} className="h-7 min-w-7 px-1.5 rounded-[6px] hover:bg-[#e9eef5] text-[11px] font-bold text-[#374151] transition-colors shrink-0">XL</button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0"/>
                  <button type="button" title="Hapus gambar" onClick={()=>{editor.chain().focus().deleteSelection().run()}} className="w-7 h-7 rounded-[6px] hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-[#6b7280] transition-colors shrink-0"><Trash2 size={14}/></button>
                </div>
              )}

              {/* Editor area — Component = continuous, tanpa kertas (sesuai spec pengecualian) */}
              <div
                ref={editorContainerRef}
                onContextMenu={handleContextMenu}
                className="p-2.5 bg-[#f6f5f4]"
              >
                <EditorCanvas variant="continuous">
                  <div className="bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-[#fcfcfc] border-b border-[#e6e6e6] text-[11px] text-[#6b7280]">
                      <span className="flex items-center gap-1.5 font-medium"><FileText size={12} className="text-[#9ca3af]"/> Fragment Editor — tanpa kertas</span>
                      <span className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1"><Boxes size={11}/> Component</span>
                        <span className="w-px h-3 bg-[#e6e6e6] hidden sm:block"/>
                        <span className="flex items-center gap-1"><Maximize2 size={11}/> Drag bawah untuk perbesar</span>
                      </span>
                    </div>
                    <div className="relative">
                      <EditorContent editor={editor} style={{ minHeight: `${editorHeight}px`, maxHeight: 'none' }} className="focus-within:ring-2 focus-within:ring-[#0075de]/10 overflow-y-auto [&_.tiptap]:min-h-[240px] [&_.tiptap]:p-6" />
                      {/* floating hint inside paper */}
                      <div className="absolute bottom-3 right-3 hidden lg:flex items-center gap-1.5 bg-[#111827] text-white rounded-full px-3 py-1.5 text-[11px] shadow-lg">
                        <MousePointer2 size={12} className="text-white"/> Klik kanan untuk tambah data terikat
                      </div>
                    </div>
                    {/* Grip to resize editor height */}
                    <div
                      onMouseDown={handleEditorGripMouseDown}
                      className="h-7 bg-[#f9fafb] hover:bg-[#eff6ff] border-t border-[#e6e6e6] flex items-center justify-center gap-2 cursor-ns-resize select-none group transition-colors"
                      title="Drag untuk memperbesar / memperkecil tinggi editor"
                    >
                      <div className="w-8 h-1 rounded-full bg-[#d1d5db] group-hover:bg-[#0075de] transition-colors"/>
                      <span className="text-[11px] font-medium text-[#6b7280] group-hover:text-[#0075de] hidden sm:inline">Tarik untuk atur tinggi</span>
                      <MoveVertical size={12} className="text-[#9ca3af] group-hover:text-[#0075de]"/>
                    </div>
                  </div>
                </EditorCanvas>
                <div className="mt-3">
                  <EditorStatusBar editor={editor} variant="continuous" saved={saved} />
                </div>
              </div>


              <div className="px-2.5 py-1.5 bg-[#f9fafb] border-t border-[#e6e6e6] flex items-center justify-between">
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
              </>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Bottom actions */}
      <div className="mt-3 flex flex-col sm:flex-row justify-between items-center gap-2 bg-white border border-[#e6e6e6] rounded-[8px] p-2.5 shadow-sm">
        <div className="text-xs text-[#6b7280] flex items-center gap-2"><Highlighter size={12} className="text-[#0075de]"/>{form.bindings.length} data terikat • {editor ? editor.getText().length : 0} karakter konten</div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={()=>router.push("/components-persuratan")} className="flex-1 sm:flex-none">Batal</Button>
          <Button onClick={handleSubmit} className="flex-1 sm:flex-none bg-[#0075de] hover:bg-[#0063be]">{mode==="edit"?"Update Komponen":"Simpan Komponen"}</Button>
        </div>
      </div>

      {/* Popup Data Terkait — toolbar khusus editor */}
      {showBindingsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowBindingsPopup(false)} />
          <div className="relative bg-white rounded-[8px] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl border border-[#e6e6e6] animate-in fade-in zoom-in-95">
            <div className="sticky top-0 bg-white rounded-t-[8px] p-2.5 pb-2 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="font-bold text-[13px] flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center"><Database size={12}/></div> Data Terkait <Badge variant="secondary" className="text-[11px]">{form.bindings.length}</Badge></div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" onClick={()=>{ setShowBindingsPopup(false); savedPosRef.current = editor?.state.selection.from ?? null; try{ editor?.chain().setTextSelection(savedPosRef.current ?? 0).run() }catch{}; const rect = editorContainerRef.current?.getBoundingClientRect(); const x = rect ? rect.left + rect.width/2 : window.innerWidth/2; const y = rect ? rect.top + 120 : window.innerHeight/2; setContextMenu({x,y}) }} className="bg-[#0075de] hover:bg-[#0063be]"><Plus size={13}/> Tambah Baru</Button>
                <button onClick={()=>setShowBindingsPopup(false)} className="w-6 h-6 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14}/></button>
              </div>
            </div>
            <div className="p-2.5">
              <BindingsPanel form={form} setForm={setForm} allComponents={allComponents} savedPosRef={savedPosRef} editor={editor} tick={tick} showToast={showToast} />
            </div>
          </div>
        </div>
      )}

      {/* Popup Tutorial — cara pakai */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowTutorial(false)} />
          <div className="relative bg-white rounded-[8px] w-full max-w-md shadow-xl border border-[#e6e6e6] p-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-[13px] flex items-center gap-2"><div className="w-7 h-7 rounded-[8px] bg-[#0075de] text-white flex items-center justify-center"><BookOpen size={14}/></div> Tutorial Component Persuratan</div>
              <button onClick={()=>setShowTutorial(false)} className="w-6 h-6 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14}/></button>
            </div>
            <ol className="list-decimal ml-5 space-y-1.5 text-[13px] text-[#374151] leading-relaxed">
              <li><b>Isi nama komponen</b> di header editor (mis. Kop Surat, Tanda Tangan).</li>
              <li><b>Aktifkan Mode Pengulangan</b> jika komponen diulang per baris data (looping).</li>
              <li><b>Letakkan kursor</b> di editor pada posisi yang diinginkan.</li>
              <li>Klik tombol <b>Data Terkait</b> di toolbar (ungu) atau <b>klik kanan</b> → isi <span className="font-mono bg-[#f6f5f4] border px-1 rounded">nama_data</span> & pilih jenis (Teks/Gambar/Komponen).</li>
              <li>Klik <b>Sisipkan di Kursor</b> — pill <span className="font-mono bg-[#dbeafe] px-1 rounded">{"{{nama}}"}</span> muncul tepat di pointer.</li>
              <li>Cek hasil di tab <b>Preview</b> — binding tampil sebagai nilai contoh.</li>
              <li>Klik <b>Simpan Komponen</b> — komponen siap dipakai di Template.</li>
            </ol>
            <div className="mt-3 rounded-[8px] bg-[#eff6ff] border border-[#dbeafe] p-2.5 text-xs text-[#1e40af] leading-relaxed">Heading H1-H6, list, tabel, link & gambar semua aktif. Saat tabel terpilih, panel <b>Operasi Tabel</b> muncul ramping di atas editor.</div>
            <div className="mt-3 flex justify-end"><Button size="sm" onClick={()=>setShowTutorial(false)} className="bg-[#0075de] hover:bg-[#0063be]">Mengerti</Button></div>
          </div>
        </div>
      )}

            {/* Context Menu - absolute, anti-terpotong */}
      {contextMenu && (()=> {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800
        const POP_W = 360
        const POP_H = 520
        const M = 16
        let left = contextMenu.x
        let top = contextMenu.y
        // horizontal: geser kiri jika melebihi viewport
        if (left + POP_W + M > vw) left = vw - POP_W - M
        if (left < M) left = M
        // vertical: flip ke atas jika klik di bawah dan tidak cukup ruang bawah
        const spaceBelow = vh - contextMenu.y
        const spaceAbove = contextMenu.y
        if (spaceBelow < 260 && spaceAbove > spaceBelow) {
          top = contextMenu.y - POP_H
        }
        // clamp agar tidak keluar viewport
        if (top + POP_H + M > vh) top = vh - POP_H - M
        if (top < M) top = M
        return (
        <div className="fixed inset-0 z-40" onClick={()=>{setContextMenu(null); savedPosRef.current=null}} onContextMenu={e=>e.preventDefault()}>
          <div
            className="fixed bg-white border border-[#e6e6e6] rounded-[8px] shadow-2xl w-[360px] max-h-[85vh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95"
            style={{left, top}}
            onClick={e=>e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white rounded-t-[8px] p-2.5 pb-2 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="font-bold text-[13px] flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-[#0075de] text-white flex items-center justify-center"><Sparkles size={12}/></div> Tambah Data Terikat</div>
              <button onClick={()=>{setContextMenu(null); savedPosRef.current=null}} className="w-6 h-6 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14}/></button>
            </div>
            <div className="p-2.5 space-y-2">
              <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-2.5 py-2 text-[11px] text-amber-800 flex gap-1.5">
                <MousePointer2 size={12} className="shrink-0 mt-0.5"/> Akan disisipkan tepat di posisi klik kanan terbaru — bukan di awal. Scroll popup ini jika terpotong, pindahkan kursor lalu klik kanan lagi untuk ganti posisi.
              </div>
              <div><Label className="text-xs font-semibold">Nama Data <span className="text-red-500">*</span></Label><Input value={bindingForm.name} onChange={e=>setBindingForm({...bindingForm, name:e.target.value})} placeholder="contoh: nama_karyawan" className="h-7 text-[13px] font-mono mt-1" /><p className="text-[11px] text-[#6b7280] mt-1">Hanya huruf/angka/underscore. Akan jadi <span className="font-mono bg-[#f6f5f4] px-1 rounded">{"{{nama}}"}</span></p></div>
              <div><Label className="text-xs font-semibold">Jenis Tampilan</Label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {[
                    {v:'text', label:'Teks', icon: FileText, desc:'Inline pill'},
                    {v:'image', label:'Gambar', icon: ImageIcon, desc:'Placeholder img'},
                    {v:'component', label:'Komponen', icon: Boxes, desc:'Block + label'},
                  ].map(opt=>(
                    <button key={opt.v} type="button" onClick={()=>setBindingForm({...bindingForm, type: opt.v as any})} className={`border rounded-[8px] p-2 text-left flex flex-col gap-1 ${bindingForm.type===opt.v ? 'border-[#0075de] bg-[#eff6ff] text-[#0075de]' : 'border-[#e6e6e6] bg-white hover:bg-[#f6f5f4]'}`}>
                      <opt.icon size={14}/><span className="text-xs font-semibold">{opt.label}</span><span className="text-[10px] opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              {bindingForm.type==="text" && <div className="text-[11px] text-[#6b7280] bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-2.5">Teks akan tampil sebagai pill biru <span className="font-mono bg-[#dbeafe] px-1 rounded">{"{{nama}}"}</span> yang bisa diberi gaya Bold/Italic/Warna via toolbar. Posisinya di kursor terakhir.</div>}
              {bindingForm.type==="image" && (
                <div className="space-y-2 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-2.5">
                  <div className="text-[11px] font-semibold text-[#374151]">Ukuran placeholder (px)</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div><Label className="text-[11px]">Lebar</Label><Input type="number" value={bindingForm.width||200} onChange={e=>setBindingForm({...bindingForm, width: Number(e.target.value)||200})} className="h-7 text-[13px] mt-1" /></div>
                    <div><Label className="text-[11px]">Tinggi</Label><Input type="number" value={bindingForm.height||120} onChange={e=>setBindingForm({...bindingForm, height: Number(e.target.value)||120})} className="h-7 text-[13px] mt-1" /></div>
                  </div>
                  <div className="text-[11px] text-[#6b7280]">Gambar akan disisipkan sebagai <span className="font-mono">{"<img src=\"{{name}}\">"}</span> dengan border putus-putus biru di editor. Preview akan ganti src jadi placeholder.</div>
                </div>
              )}
              {bindingForm.type==="component" && (
                <div className="space-y-2 bg-violet-50 border border-violet-200 rounded-[8px] p-2.5">
                  <Label className="text-xs font-semibold text-violet-900">Pilih Komponen</Label>
                  <Select value={String(bindingForm.componentId||"")} onChange={e=>setBindingForm({...bindingForm, componentId: Number(e.target.value)||undefined})}>
                    <option value="">-- pilih component --</option>
                    {allComponents.filter(c=> String(c.id)!==String(id)).map(c=> <option key={c.id} value={c.id}>{c.name} {c.isLooping?"(looping)":""}</option>)}
                  </Select>
                  <p className="text-[11px] text-violet-700">Akan tampil sebagai block ungu dashed dengan label component + pill. Cocok untuk nesting komponen.</p>
                </div>
              )}
              <div className="flex gap-1.5 pt-1.5 sticky bottom-0 bg-white p-1 -mx-1">
                <Button size="sm" variant="outline" onClick={()=>{setContextMenu(null); savedPosRef.current=null}} className="flex-1">Batal</Button>
                <Button size="sm" onClick={handleAddBinding} className="flex-1 bg-[#0075de] hover:bg-[#0063be]"><Plus size={14}/> Sisipkan di Kursor</Button>
              </div>
              <div className="text-[10px] text-center text-[#9ca3af]">Posisi insert: {savedPosRef.current !== null ? `offset ${savedPosRef.current}` : 'kursor saat ini'}</div>
              <div className="h-2"/>
            </div>
          </div>
        </div>
        )
      })()}

      <style dangerouslySetInnerHTML={{__html: `
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .tiptap p:empty { min-height: 1.5em; }
        .tiptap p:empty::before { content: "\\00a0"; visibility: hidden; }
        .tiptap table { border-collapse: collapse; width: 100%; margin: 16px 0; position: relative; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .tiptap table td, .tiptap table th { border: 1px solid #e6e6e6; padding: 8px 12px; min-width: 80px; position: relative; vertical-align: top; transition: background 0.12s; }
        .tiptap table th { background: #f9fafb; font-weight: 600; text-align: left; }
        .tiptap table tr { position: relative; }
        .tiptap .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(0,117,222,0.12); pointer-events: none; border: 1.5px solid #0075de; border-radius: 2px; }
        .tiptap .column-resize-handle { position: absolute; right: -4px; top: 0; bottom: 0; width: 8px; background: transparent; cursor: col-resize; pointer-events: auto; z-index: 3; }
        .tiptap .column-resize-handle::after { content: ""; position: absolute; left: 3px; top: 0; bottom: 0; width: 2px; background: #0075de; opacity: 0; transition: opacity 0.15s; }
        .tiptap .column-resize-handle:hover::after, .tiptap .column-resize-handle:active::after { opacity: 1; }
        .tiptap table td:hover, .tiptap table th:hover { outline: 1px dashed rgba(0,117,222,0.15); outline-offset: -1px; }
        .tiptap .tableWrapper { overflow-x: auto; }
        /* Row resize handle (bottom edge of row) */
        .tiptap table tr::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 6px; cursor: row-resize; z-index: 2; }
        .tiptap table tr:hover::after { background: rgba(0,117,222,0.08); }
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
        <CardTitle className="text-[13px] flex items-center gap-2">
          <Boxes size={14} className="text-violet-600"/> Data Terikat
          <Badge variant="secondary" className="ml-auto text-[11px]">{form.bindings.length}</Badge>
        </CardTitle>
        <CardDescription className="text-[11px]">Klik kanan di editor untuk tambah — atau klik chip untuk sisip ulang di kursor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {form.bindings.length===0 ? (
          <div className="text-center py-4 border border-dashed border-[#e6e6e6] rounded-[8px] bg-[#fafafa]">
            <div className="w-8 h-8 rounded-full bg-white border border-[#e6e6e6] flex items-center justify-center mx-auto mb-1.5"><Sparkles size={16} className="text-[#9ca3af]"/></div>
            <div className="text-xs font-semibold text-[#374151]">Belum ada binding</div>
            <div className="text-[11px] text-[#6b7280] mt-1 px-4">Klik kanan di editor, isi nama & jenis, lalu <span className="font-medium">Sisipkan di Kursor</span> — pill akan muncul tepat di pointer.</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[340px] overflow-auto pr-1">
            {form.bindings.map((b: Binding, i:number)=>(
              <div key={i} className="group flex items-center gap-2 p-2.5 bg-white border border-[#e6e6e6] rounded-[8px] hover:border-[#0075de]/30 hover:bg-[#f8fafc] transition-colors">
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
                    className="w-6 h-6 rounded-full bg-white border border-[#e6e6e6] hover:border-[#0075de] hover:text-[#0075de] flex items-center justify-center"
                  ><Copy size={12}/></button>
                  <button onClick={()=> setForm({...form, bindings: form.bindings.filter((_:any,j:number)=>j!==i)})} className="w-6 h-6 rounded-full bg-white border border-[#e6e6e6] hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center"><X size={12}/></button>
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
