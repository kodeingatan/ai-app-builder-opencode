"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { PageBreak } from "@/lib/tiptap/extensions/pageBreak"
import { RepeaterNode } from "@/lib/tiptap/extensions/repeaterNode"
import { ConditionNode } from "@/lib/tiptap/extensions/conditionNode"
import { EditorCanvas } from "@/components/editor/EditorCanvas"
import { EditorRuler } from "@/components/editor/EditorRuler"
import { EditorStatusBar } from "@/components/editor/EditorStatusBar"
import { EditorOutline } from "@/components/editor/EditorOutline"
import { FindBar } from "@/components/editor/FindBar"
import { PageConfig, DEFAULT_PAGE_CONFIG, parsePageConfig } from "@/lib/editor/model/types"
import {
  Plus, FileStack, X, Boxes, Eye, Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table as TableIcon, Link2, Image as ImageIcon, Undo, Redo, Heading1, Heading2, Heading3,
  Sparkles, Check, Trash2, Copy, Info, FileText, Settings2, Type, Quote, Eraser, Minus, Save, Printer, Download, Database,
  Ruler, ZoomIn, ZoomOut, Maximize2, Layers, Code, Repeat, GitBranch, Building2, Palette, Rows3, Columns3, Trash, Combine, Split,
  PaintBucket, Grid3x3, Highlighter, Square, PanelLeft, PanelRight, Columns2, PanelTop, PanelBottom, Frame, MoveVertical, MoveHorizontal, GripVertical, ChevronDown, ChevronUp, Brush, Search, ListChecks, ArrowUp, ArrowDown, Crop, Upload
} from "lucide-react"
import PasteChoicePopup from "@/components/common/PasteChoicePopup"
import ImageCropModal from "@/components/editor/ImageCropModal"
import ImageLayoutButtons from "@/components/editor/ImageLayoutButtons"
import { compressImageFile, formatBytes } from "@/lib/utils/compressImage"
import TableGridPicker from "@/components/editor/TableGridPicker"
import { keepStyleHtml, adaptToEditorHtml, plainToHtml, isWordHtml } from "@/lib/tiptap/paste"

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

// Types
type CompUsage = {
  componentId: number
  componentName?: string
  dataMapping: Record<string, { source: "administrasi" | "tabel" | "manual"; value: string }>
  loopConfig?: { table: string; selectedRowIds: number[] }
  conditionConfig?: { field: string; operator: "equals" | "not_equals" | "contains"; value: string }
}
type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' }

export default function PersuratanTemplateForm({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", description: "", contentHtml: "<p>Tulis template di sini... klik kanan untuk insert component</p>", contentJson: "" })
  const [components, setComponents] = useState<any[]>([])
  const [globalTables, setGlobalTables] = useState<any[]>([])
  const [usages, setUsages] = useState<CompUsage[]>([])
  const [selectedUsageIdx, setSelectedUsageIdx] = useState<number | null>(null)
  const [previewHtml, setPreviewHtml] = useState("")
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [selectedCompId, setSelectedCompId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)
  const savedPosRef = useRef<number | null>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [linkModal, setLinkModal] = useState<{ open: boolean; url: string }>({ open: false, url: '' })
  const [imageModal, setImageModal] = useState<{ open: boolean; url: string }>({ open: false, url: '' })
  const [cropSrc, setCropSrc] = useState<string|null>(null)
  const [cellBg, setCellBg] = useState('#ffffff')
  const [borderColor, setBorderColor] = useState('#e6e6e6')
  const [borderWidth, setBorderWidth] = useState('1px')
  const [borderStyle, setBorderStyle] = useState('solid')
  const [cellHeight, setCellHeight] = useState('')
  const [rowHeight, setRowHeight] = useState('')
  const [editorHeight, setEditorHeight] = useState(480)
  const [pageConfig, setPageConfig] = useState<PageConfig>({ ...DEFAULT_PAGE_CONFIG })
  const [findOpen, setFindOpen] = useState(false)
  const [tablePickerOpen, setTablePickerOpen] = useState(false)
  const [saved, setSaved] = useState(true)
  const [showOutline, setShowOutline] = useState(true)
  const [officeMode, setOfficeMode] = useState<'office' | 'structure' | 'json'>('office')
  const [textColor, setTextColor] = useState('#111827')
  const [highlightColor, setHighlightColor] = useState('#fff59d')
  const [fontFamily, setFontFamily] = useState('')
  const [fontSize, setFontSize] = useState('')
  const [pastePopup, setPastePopup] = useState(false)
  const [pasteCoords, setPasteCoords] = useState<{ x: number; y: number } | null>(null)
  const pasteRangeRef = useRef<{ from: number; to: number } | null>(null)
  const pasteDataRef = useRef<{ html: string; text: string; keep: string; adapt: string; plain: string } | null>(null)
  const pasteTimerRef = useRef<any>(null)
  const [previewData, setPreviewData] = useState<string>(JSON.stringify({ letter: { number: "800/001/VI/2026", title: "SURAT TUGAS", consideration: "perlu penugasan" }, office: { name: "PEMERINTAH PROVINSI ACEH", address: "Jl. T. Nyak Arief No.219 Banda Aceh" }, signer: { name: "Drs. H. Ahmad Yani, M.Si", position: "Kepala Dinas", nip: "196501011990031001" }, employees: [{ name: "Afdal", nip: "19900101", position: "Programmer", status: "active" }], current_date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) }, null, 2))
  const isDraggingEditorRef = useRef(false)
  const startYRef = useRef(0)
  const startHRef = useRef(0)

  const showToast = (message: string, type: Toast['type'] = 'error') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }

  const loadDeps = async () => {
    try {
      const safeJson = async (res: Response) => {
        try {
          const text = await res.text()
          if (!text) return null
          return JSON.parse(text)
        } catch { return null }
      }
      const [c, t] = await Promise.all([
        fetch("/api/persuratan/components?limit=100").then(safeJson),
        fetch("/api/global-tables?limit=100").then(safeJson),
      ])
      setComponents(c?.data ?? [])
      setGlobalTables(t?.data ?? [])
    } catch {
      setComponents([])
      setGlobalTables([])
    }
  }
  useEffect(() => { loadDeps() }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
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
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false, HTMLAttributes: { class: 'text-[#0075de] underline underline-offset-2 cursor-pointer' } }),
      ResizableImage.configure({ inline: true, allowBase64: true }),
      Table.configure({ resizable: true, handleWidth: 8, lastColumnResizable: true, allowTableNodeSelection: true }),
      CustomTableRow,
      CustomTableHeader,
      CustomTableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      Placeholder.configure({ placeholder: 'Ketik konten di sini… klik kanan untuk insert component, repeater, atau condition' }),
      InlineBinding,
      ComponentBinding,
      RepeaterNode,
      ConditionNode,
      PageBreak,
    ],
    content: "<p>Tulis template di sini... klik kanan untuk insert component</p>",
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
      setForm(prev => (prev.contentHtml === html && (prev as any).contentJson === json ? prev : { ...prev, contentHtml: html, contentJson: json } as any))
      setSaved(false)
      setTick(v => v + 1)
    },
    onSelectionUpdate: () => setTick(v => v + 1),
    onTransaction: () => setTick(v => v + 1),
  })

  useEffect(() => {
    if (mode === "edit" && id) {
      setLoading(true)
      fetch(`/api/persuratan/templates/${id}`).then(async r => { try { const t = await r.text(); return t ? JSON.parse(t) : null } catch { return null } }).then(row => {
        if(!row){ setLoading(false); return }
        const html = row.contentHtml || "<p></p>"
        const json = row.contentJson || ""
        setForm({ name: row.name, description: row.description || "", contentHtml: html, contentJson: json } as any)
        setPageConfig(parsePageConfig(row.pageConfigJson))
        setTimeout(() => {
          if (editor) {
            try {
              if (json) editor.commands.setContent(JSON.parse(json))
              else editor.commands.setContent(html || "<p></p>")
            } catch { editor.commands.setContent(html || "<p></p>") }
            setSaved(true)
          }
        }, 100)
        try { setUsages(row.componentsJson ? JSON.parse(row.componentsJson) : []) } catch { setUsages([]) }
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [mode, id, editor])

  // Sync font family/size/color from selection
  useEffect(() => {
    if (!editor) return
    const attrs = editor.getAttributes('textStyle') as any
    setFontFamily(attrs.fontFamily || '')
    setFontSize(attrs.fontSize || '')
    if (attrs.color) setTextColor(attrs.color)
    const hl = editor.getAttributes('highlight') as any
    if (hl?.color) setHighlightColor(hl.color)
  }, [tick, editor])

  // Shortcuts: Find (Ctrl+F), Clear (Ctrl+\)
  useEffect(() => {
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
      // Tab — indent list / sisip indentasi (Shift+Tab = outdent / hapus indent)
      if (e.key === 'Tab') {
        // Di dalam tabel biarkan navigasi sel bawaan (Tab = sel berikutnya)
        if (editor.isActive('table')) return
        e.preventDefault()
        if (e.shiftKey) {
          if (!editor.chain().focus().liftListItem('listItem').run()) {
            try {
              const { state } = editor.view
              const { $from } = state.selection
              if ($from.parentOffset >= 4) {
                const before = $from.parent.textBetween(Math.max(0, $from.parentOffset - 4), $from.parentOffset, null, '￼')
                if (/^[ \u00a0]{4}$/.test(before)) editor.view.dispatch(state.tr.delete($from.pos - 4, $from.pos))
              }
            } catch {}
          }
        } else if (!editor.chain().focus().sinkListItem('listItem').run()) {
          editor.chain().focus().insertContent('    ').run()
        }
      }
    }
    dom.addEventListener('keydown', onKey)
    return () => dom.removeEventListener('keydown', onKey)
  }, [editor])

  // Preview debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      let html = editor ? editor.getHTML() : form.contentHtml
      for (const u of usages) {
        const comp = components.find(c => c.id === u.componentId)
        let compHtml = comp?.contentHtml || ""
        for (const [k, v] of Object.entries(u.dataMapping)) {
          const sample = v.source === "manual" ? v.value : `[${v.source}:${v.value}]`
          compHtml = compHtml.replaceAll(`{{${k}}}`, sample)
        }
        // replace component placeholder with preview
        html = html.replaceAll(`data-component="${u.componentId}"`, `data-component="${u.componentId}" data-preview="true"`)
        // also replace inline component html sample
        const placeholderRegex = new RegExp(`<div[^>]*data-component="${u.componentId}"[^>]*>.*?<\\/div>`, 'gs')
        // fallback simple
        if (compHtml) {
          // inject comp preview after placeholder for live view (simplified)
        }
      }
      // also handle repeater/condition nodes preview via data attributes
      try {
        const dataObj = JSON.parse(previewData || "{}")
        // simple interpolate for preview
        html = html.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, p) => {
          const path = p.trim()
          if (path === "current_date") return new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
          const tryGet = (o: any, pp: string) => pp.split(".").reduce((a: any, c: string) => a?.[c], o)
          let v = tryGet(dataObj, path)
          if (v !== undefined) return String(v)
          return `{{${path}}}`
        })
      } catch {}
      setPreviewHtml(html)
    }, 150)
    return () => clearTimeout(timer)
  }, [form.contentHtml, usages, components, tick, previewData])

  // Row height drag via bottom edge
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom as HTMLElement
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.column-resize-handle')) return
      const tr = target.closest('tr') as HTMLElement | null
      if (!tr || !dom.contains(tr)) return
      const rect = tr.getBoundingClientRect()
      const distToBottom = rect.bottom - e.clientY
      if (distToBottom < 0 || distToBottom > 9) return
      e.preventDefault()
      const startY = e.clientY
      const startH = tr.offsetHeight || 40
      const trEl = tr
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
        setTimeout(() => { const html = editor.getHTML(); setForm(prev => ({ ...prev, contentHtml: html })); setTick(v => v + 1); showToast(`Tinggi baris → ${finalH}`, 'success') }, 30)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'row-resize'
    }
    dom.addEventListener('mousedown', onMouseDown)
    return () => dom.removeEventListener('mousedown', onMouseDown)
  }, [editor])

  // Paste from Word / doc lain — intercept, default adapt, popup 3 pilihan (tetap sampai user pilih)
  useEffect(()=>{
    if (!editor) return
    const dom = editor.view.dom as HTMLElement
    const onPaste = (e: ClipboardEvent) => {
      // Paste gambar hasil copy (screenshot / klik kanan copy image) → sisipkan sebagai base64
      const clipFiles = e.clipboardData?.files
      if (clipFiles && clipFiles.length > 0) {
        const clipImg = Array.from(clipFiles).find(f => f.type.startsWith('image/'))
        if (clipImg) {
          e.preventDefault()
          e.stopPropagation()
          ;(e as any).stopImmediatePropagation?.()
          compressImageFile(clipImg).then(({ dataUrl, bytes, compressed }) => {
            editor.chain().focus().setImage({ src: dataUrl }).run()
            setTick(v => v + 1)
            showToast(compressed ? `Gambar dikompres ke ${formatBytes(bytes)} lalu disisipkan` : 'Gambar dari clipboard disisipkan', 'success')
          }).catch(() => showToast('Gagal memproses gambar', 'error'))
          return
        }
      }
      const html = e.clipboardData?.getData('text/html') || ''
      const text = e.clipboardData?.getData('text/plain') || ''
      if (!html && !text) return
      const hasHtml = !!html && /<(p|h\d|span|div|table|ul|ol|strong|em)/i.test(html)
      if (!hasHtml && text.length < 20) return
      const isExternalStyled = !!html && (isWordHtml(html) || /style=|font-family|font-size|color:/i.test(html) || html.includes('mso-'))
      if (hasHtml && !isExternalStyled && !/<(table|ul|ol)/i.test(html) && html.length < 800) return
      e.preventDefault()
      e.stopPropagation()
      ;(e as any).stopImmediatePropagation?.()
      const from = editor.state.selection.from
      const keep = hasHtml ? keepStyleHtml(html) : plainToHtml(text)
      const adapt = hasHtml ? adaptToEditorHtml(html) : plainToHtml(text)
      const plain = plainToHtml(text)
      editor.chain().focus().insertContent(adapt).run()
      const to = editor.state.selection.to
      pasteRangeRef.current = { from, to }
      pasteDataRef.current = { html, text, keep, adapt, plain }
      let coords = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      try {
        const pos = editor.view.coordsAtPos(to)
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
    }
    dom.addEventListener('paste', onPaste as any, true)
    return ()=> {
      dom.removeEventListener('paste', onPaste as any, true)
    }
  }, [editor])

  // Esc untuk tutup popup paste
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!editor) return
    try {
      const view = editor.view
      const coords = { left: e.clientX, top: e.clientY }
      const posInfo = (view as any).posAtCoords?.(coords)
      if (posInfo && typeof posInfo.pos === 'number') savedPosRef.current = posInfo.pos
      else savedPosRef.current = editor.state.selection.from
      try { if (savedPosRef.current !== null) editor.chain().setTextSelection(savedPosRef.current).run() } catch {}
    } catch { savedPosRef.current = editor.state.selection.from }
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleInsertComponent = async () => {
    if (!selectedCompId) return showToast('Pilih component', 'error')
    const compId = Number(selectedCompId)
    const comp = components.find(c => c.id === compId)
    if (!comp) return
    let bindings: any[] = []
    try { bindings = JSON.parse(comp.bindingsJson || "[]") } catch {}
    const mapping: Record<string, { source: "administrasi" | "tabel" | "manual"; value: string }> = {}
    for (const b of bindings) mapping[b.name] = { source: "manual", value: `contoh_${b.name}` }
    const usage: CompUsage = { componentId: compId, componentName: comp.name, dataMapping: mapping }
    if (comp.isLooping) {
      usage.loopConfig = { table: "", selectedRowIds: [] }
    }
    const newUsages = [...usages, usage]
    setUsages(newUsages)
    setSelectedUsageIdx(newUsages.length - 1)
    const insertAt = savedPosRef.current ?? editor!.state.selection.from
    const safePos = Math.max(0, Math.min(insertAt, editor!.state.doc.content.size))
    try { editor!.chain().focus().setTextSelection(safePos).run() } catch {}
    const placeholderInserted = editor!.chain().focus().insertContentAt(safePos, { type: 'componentBinding', attrs: { name: bindings[0]?.name || `comp_${compId}`, componentId: compId, componentName: comp.name } } as any).run()
    if (!placeholderInserted) {
      const html = `<div style="border:2px dashed #3b82f6; background:#eff6ff; padding:8px; border-radius:8px; margin:6px 0;" contenteditable="false" data-component="${compId}"><small style="color:#6b7280">Component: ${comp.name} ${comp.isLooping ? "(looping)" : ""}</small><div>${bindings.map((b: any) => `{{${b.name}}} `).join("")}</div></div><p><br/></p>`
      editor!.chain().focus().insertContent(html).run()
    }
    setTimeout(() => { const html = editor!.getHTML(); setForm(prev => ({ ...prev, contentHtml: html })); setTick(v => v + 1) }, 30)
    setContextMenu(null)
    setSelectedCompId("")
    showToast(`Component ${comp.name} ditambahkan`, 'success')
  }

  const handleInsertRepeater = () => {
    if (!editor) return
    const source = prompt("Repeater source (contoh: employees, pegawai, items) — kosongkan untuk employees", "employees") || "employees"
    const item = prompt("Item variable (contoh: employee, item) — kosongkan untuk employee", "employee") || "employee"
    const insertAt = savedPosRef.current ?? editor.state.selection.from
    const ok = editor.chain().focus().setTextSelection(Math.min(insertAt, editor.state.doc.content.size)).insertContent({ type: 'repeaterNode', attrs: { source, item } } as any).run()
    if (ok) {
      setContextMenu(null)
      showToast(`Repeater untuk ${item} in ${source} ditambahkan`, 'success')
      setTimeout(() => { setForm(prev => ({ ...prev, contentHtml: editor.getHTML() })); setTick(v => v + 1) }, 30)
    }
  }

  const handleInsertCondition = () => {
    if (!editor) return
    const field = prompt("Field untuk condition (contoh: employee.status, status, department)", "employee.status") || "employee.status"
    const operator = (prompt("Operator: equals / not_equals / contains", "equals") as any) || "equals"
    const value = prompt("Value (contoh: active)", "active") || "active"
    const insertAt = savedPosRef.current ?? editor.state.selection.from
    const ok = editor.chain().focus().setTextSelection(Math.min(insertAt, editor.state.doc.content.size)).insertContent({ type: 'conditionNode', attrs: { field, operator, value } } as any).run()
    if (ok) {
      setContextMenu(null)
      showToast(`Condition IF ${field} ${operator} "${value}" ditambahkan`, 'success')
      setTimeout(() => { setForm(prev => ({ ...prev, contentHtml: editor.getHTML() })); setTick(v => v + 1) }, 30)
    }
  }

  const handleSubmit = async () => {
    let latestHtml = form.contentHtml
    let latestJson = (form as any).contentJson || ""
    if (editor) {
      latestHtml = editor.getHTML()
      try { latestJson = JSON.stringify(editor.getJSON()) } catch {}
    }
    if (!latestHtml) latestHtml = form.contentHtml
    if (!form.name) return showToast('Nama wajib', 'error')
    const payload = { name: form.name, description: form.description, contentHtml: latestHtml, contentJson: latestJson, pageConfigJson: JSON.stringify(pageConfig), componentsJson: JSON.stringify(usages) }
    const url = mode === "edit" ? `/api/persuratan/templates/${id}` : `/api/persuratan/templates`
    const method = mode === "edit" ? "PUT" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (res.ok) { showToast(mode === "edit" ? 'Template diperbarui' : 'Template disimpan', 'success'); setTimeout(() => { router.push("/templates-persuratan"); router.refresh() }, 400) } else {
      let msg = "Gagal simpan"
      try { const t = await res.text(); if (t) msg = (JSON.parse(t) as any)?.message || msg } catch {}
      showToast(`${msg} (${res.status})`, 'error')
    }
  }

  const isActive = (name: any, attrs?: any) => { if (!editor) return false; try { return (editor.isActive as any)(name, attrs) } catch { return false } }
  const isAlignActive = (align: string) => { if (!editor) return false; try { return (editor.isActive as any)({ textAlign: align }) } catch { return false } }
  const can = (cb: () => boolean) => { if (!editor) return false; try { return cb() } catch { return false } }
  const getHeadingLevel = () => {
    if (!editor) return 'p'
    for (let i = 1; i <= 6; i++) if (isActive('heading', { level: i })) return String(i)
    if (isActive('paragraph')) return 'p'
    return 'p'
  }
  const openLinkModal = () => { if (!editor) return; const href = editor.getAttributes('link').href || ''; setLinkModal({ open: true, url: href }) }
  const submitLinkModal = () => {
    if (!editor) return
    const url = linkModal.url.trim()
    if (!url) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); showToast('Link dihapus', 'info') }
    else {
      const isValid = (() => { try { new URL(url); return true } catch { return url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:') } })()
      if (!isValid) { showToast('URL tidak valid', 'error'); return }
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run(); showToast('Link diperbarui', 'success')
    }
    setLinkModal({ open: false, url: '' })
  }
  const openImageModal = () => setImageModal({ open: true, url: '' })
  const submitImageModal = () => {
    if (!editor) return
    const url = imageModal.url.trim()
    if (!url) { showToast('URL gambar wajib diisi', 'error'); return }
    try { new URL(url) } catch { showToast('URL gambar tidak valid', 'error'); return }
    editor.chain().focus().setImage({ src: url }).run(); showToast('Gambar disisipkan', 'success'); setImageModal({ open: false, url: '' })
  }

  const handleImageFile = async (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('image/')) { showToast('File harus berupa gambar', 'error'); return }
    try {
      const { dataUrl, bytes, compressed } = await compressImageFile(f)
      if (!dataUrl.startsWith('data:image')) { showToast('Gagal membaca gambar', 'error'); return }
      setImageModal({ open: true, url: dataUrl })
      showToast(compressed ? `Gambar dikompres ke ${formatBytes(bytes)} — siap disisipkan` : 'Gambar siap disisipkan (base64)', 'success')
    } catch {
      showToast('Gagal memproses gambar', 'error')
    }
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

  // Border helpers
  const applyBorderPreset = (preset: string) => {
    if (!editor) return
    editor.chain().focus().setCellAttribute('borderColor', borderColor).setCellAttribute('borderWidth', borderWidth).setCellAttribute('borderStyle', borderStyle).run()
    if (preset === 'outer') { applyOuterBorder(); return }
    if (preset === 'all') { editor.chain().focus().setCellAttribute('borderPosition', null).run(); showToast('Border: semua sisi', 'success'); return }
    editor.chain().focus().setCellAttribute('borderPosition', preset).run()
    const labels: Record<string, string> = { none: 'Tanpa border', left: 'Border kiri saja', right: 'Border kanan saja', leftRight: 'Border kiri & kanan', top: 'Border atas saja', bottom: 'Border bawah saja' }
    showToast(labels[preset] || `Border: ${preset}`, 'success')
  }
  const applyOuterBorder = () => {
    if (!editor) return
    try {
      const domTable = editor.view.dom.querySelector('table')
      if (!domTable) { editor.chain().focus().setCellAttribute('borderPosition', null).setCellAttribute('borderColor', borderColor).setCellAttribute('borderWidth', borderWidth).setCellAttribute('borderStyle', borderStyle).run(); showToast('Outer border diterapkan ke cell terpilih', 'success'); return }
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
          if (rowCount === 1 && colCount === 1) preset = null
          else if (isSingleRow && !isSingleCol) {
            if (isFirstCol) preset = 'leftTopBottom'
            else if (isLastCol) preset = 'rightTopBottom'
            else preset = 'topBottom'
          } else if (isSingleCol && !isSingleRow) {
            if (isFirstRow) preset = 'leftRightTop'
            else if (isLastRow) preset = 'leftRightBottom'
            else preset = 'leftRight'
          } else {
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
              if (preset === null) newAttrs.borderPosition = null
              else newAttrs.borderPosition = preset
              newAttrs.borderColor = borderColor
              newAttrs.borderWidth = borderWidth
              newAttrs.borderStyle = borderStyle
              tr2 = tr2.setNodeMarkup(pos, undefined, newAttrs)
              any = true
            }
          }
        })
      })
      if (any) { editor.view.dispatch(tr2); showToast('Outer border: hanya tepi luar tabel', 'success'); setTimeout(() => { const html = editor.getHTML(); setForm(prev => ({ ...prev, contentHtml: html })); setTick(v => v + 1) }, 40) }
      else editor.chain().focus().setCellAttribute('borderPosition', null).run()
    } catch (e: any) { console.error(e); editor.chain().focus().setCellAttribute('borderPosition', null).run(); showToast('Outer border fallback ke semua sisi', 'info') }
  }
  const applyCellHeight = () => {
    if (!editor) return
    const h = cellHeight.trim()
    if (!h) { editor.chain().focus().setCellAttribute('height', null).run(); showToast('Tinggi cell direset ke auto', 'info'); return }
    const val = /^\d+$/.test(h) ? `${h}px` : h
    if (!/^\d+(px|%|em|rem)$/.test(val)) { showToast('Format tinggi tidak valid (contoh 48px)', 'error'); return }
    editor.chain().focus().setCellAttribute('height', val).run(); showToast(`Tinggi cell: ${val}`, 'success')
  }
  const applyRowHeight = () => {
    if (!editor) return
    const h = rowHeight.trim()
    if (!h) { try { (editor.chain().focus() as any).updateAttributes('tableRow', { height: null }).run() } catch {} editor.chain().focus().setCellAttribute('height', null).run(); showToast('Tinggi baris direset', 'info'); return }
    const val = /^\d+$/.test(h) ? `${h}px` : h
    if (!/^\d+(px|%|em|rem)$/.test(val)) { showToast('Format tinggi tidak valid', 'error'); return }
    try { (editor.chain().focus() as any).updateAttributes('tableRow', { height: val }).run() } catch { editor.chain().focus().setCellAttribute('height', val).run() }
    showToast(`Tinggi baris: ${val}`, 'success')
  }
  const handleRowDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const el = editor?.view.dom.querySelector('.selectedCell')?.closest('tr') as HTMLElement | null
    const targetTr = el || (editor?.view.dom.querySelector('table tr') as HTMLElement | null)
    if (!targetTr) return
    const startH = targetTr.offsetHeight || 40
    const startY = e.clientY
    const onMove = (ev: MouseEvent) => {
      const nh = Math.max(24, startH + (ev.clientY - startY))
      targetTr.style.height = `${nh}px`
      targetTr.querySelectorAll('td, th').forEach(c => (c as HTMLElement).style.height = `${nh}px`)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      const finalH = targetTr.style.height
      try { (editor!.chain().focus() as any).updateAttributes('tableRow', { height: finalH }).run() } catch {}
      try { editor!.chain().focus().setCellAttribute('height', finalH).run() } catch {}
      setTimeout(() => { const html = editor!.getHTML(); setForm(prev => ({ ...prev, contentHtml: html })); setTick(v => v + 1) }, 30)
      showToast(`Tinggi baris → ${finalH}`, 'success')
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'row-resize'
  }

  if (loading) return <div className="p-8 text-center text-sm text-[#6b7280] animate-pulse">Memuat data...</div>
  if (!editor) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat editor…</div>

  const selectedUsage = selectedUsageIdx !== null ? usages[selectedUsageIdx] : null

  return (
    <div className="min-h-[calc(100vh-120px)]">
      {/* Paste Choice Popup */}
      <PasteChoicePopup open={pastePopup} coords={pasteCoords} onClose={() => setPastePopup(false)} onChoose={applyPasteChoice} />
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto min-w-[280px] max-w-[420px] rounded-[8px] border px-2.5 py-2 shadow-lg flex items-start gap-2.5 text-sm ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${t.type === 'error' ? 'bg-red-600 text-white' : t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
              {t.type === 'error' ? <X size={14} /> : t.type === 'success' ? <Copy size={12} /> : <Info size={14} />}
            </div>
            <div className="flex-1 pt-0.5 leading-relaxed">{t.message}</div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="p-1 hover:bg-black/5 rounded"><X size={12} /></button>
          </div>
        ))}
      </div>

      {/* Link & Image Modals */}
      {linkModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLinkModal({ open: false, url: '' })} />
          <div className="relative bg-white rounded-[8px] w-full max-w-md shadow-xl border border-[#e6e6e6] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-[13px] flex items-center gap-2"><Link2 size={14} className="text-[#0075de]" /> Atur Link</div>
              <button onClick={() => setLinkModal({ open: false, url: '' })} className="w-6 h-6 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14} /></button>
            </div>
            <div className="space-y-2">
              <div><Label className="text-xs font-semibold">URL Link</Label><Input value={linkModal.url} onChange={e => setLinkModal({ ...linkModal, url: e.target.value })} placeholder="https://example.com" className="mt-1 h-7 text-[13px]" autoFocus /></div>
              <div className="flex gap-2 justify-end pt-2"><Button variant="outline" size="sm" onClick={() => setLinkModal({ open: false, url: '' })}>Batal</Button><Button size="sm" onClick={submitLinkModal} className="bg-[#0075de] hover:bg-[#0063be]">Simpan Link</Button></div>
            </div>
          </div>
        </div>
      )}
      {cropSrc && (
        <ImageCropModal src={cropSrc} onClose={()=>setCropSrc(null)} onApply={applyCrop} showToast={showToast} />
      )}
      {imageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setImageModal({ open: false, url: '' })} />
          <div className="relative bg-white rounded-[8px] w-full max-w-md shadow-xl border border-[#e6e6e6] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-[13px] flex items-center gap-2"><ImageIcon size={14} className="text-[#0075de]" /> Sisipkan Gambar</div>
              <button onClick={() => setImageModal({ open: false, url: '' })} className="w-6 h-6 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14} /></button>
            </div>
            <div className="space-y-2">
              <div><Label className="text-xs font-semibold">URL Gambar</Label><Input value={imageModal.url} onChange={e => setImageModal({ ...imageModal, url: e.target.value })} placeholder="https://example.com/image.jpg" className="mt-1 h-7 text-[13px]" autoFocus /></div>
              <div className="flex items-center gap-2 text-[11px] text-[#9ca3af]"><span className="flex-1 h-px bg-[#e6e6e6]"/>atau<span className="flex-1 h-px bg-[#e6e6e6]"/></div>
              <label className="flex items-center justify-center gap-1.5 h-8 rounded-[6px] border border-dashed border-[#0075de]/40 bg-[#eff6ff] text-[#0075de] text-[13px] font-medium cursor-pointer hover:bg-[#dbeafe]" title="Upload gambar dari perangkat — otomatis jadi base64"><Upload size={14}/> Upload dari perangkat (base64)<input type="file" accept="image/*" className="hidden" onChange={e=>{handleImageFile(e.target.files?.[0]); (e.target as HTMLInputElement).value=""}} /></label>
              {imageModal.url && <div className="border border-[#e6e6e6] rounded-[8px] p-2 bg-[#f9fafb]"><div className="text-[11px] font-semibold mb-1">Preview</div><img src={imageModal.url} alt="preview" className="max-h-[180px] w-auto mx-auto rounded" onError={e => (e.currentTarget.style.display = 'none')} /></div>}
              <div className="flex gap-2 justify-end pt-2"><Button variant="outline" size="sm" onClick={() => setImageModal({ open: false, url: '' })}>Batal</Button><Button size="sm" onClick={submitImageModal} className="bg-[#0075de] hover:bg-[#0063be]"><ImageIcon size={14} /> Sisipkan</Button></div>
            </div>
          </div>
        </div>
      )}

      {/* Header info */}
      <div className="mb-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-[#6b7280]">
          <span className="inline-flex items-center gap-1.5 bg-white border border-[#e6e6e6] rounded-full px-3 py-1"><FileStack size={12} className="text-[#0075de]" /> Template Builder Persuratan</span>
          <span className="hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-1"><Palette size={12} /> Components persuratan + Repeater + Condition</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 items-start">
        {/* LEFT: Components Palette */}
        <Card className="col-span-12 lg:col-span-3 sticky top-2.5 order-2 lg:order-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-[13px] flex items-center gap-2"><Sparkles size={14} className="text-[#0075de]" /> Components</CardTitle>
            <CardDescription className="text-[11px]">Klik untuk tambah ke canvas. Pilih node di tengah lalu tambah sebagai child. Klik kanan di editor untuk insert tepat di kursor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div>
              <div className="text-[11px] font-semibold tracking-widest uppercase text-[#9ca3af] mb-2 flex items-center gap-1.5"><Building2 size={11} /> Persuratan (Branding)</div>
              <div className="grid grid-cols-2 gap-1.5 max-h-[280px] overflow-y-auto pr-1">
                {components.length === 0 ? <div className="col-span-2 text-[11px] text-[#6b7280] py-6 text-center border border-dashed rounded-[8px]">Belum ada component — buat dulu di Components Persuratan</div> : components.map(comp => (
                  <button key={comp.id} onClick={() => { setSelectedCompId(String(comp.id)); const rect = editorContainerRef.current?.getBoundingClientRect(); const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2; const y = rect ? rect.top + 120 : window.innerHeight / 2; savedPosRef.current = editor.state.selection.from; setContextMenu({ x, y }) }} className="flex flex-col items-center gap-1 p-2.5 rounded-[8px] border border-[#e6e6e6] bg-white hover:border-[#0075de] hover:bg-[#0075de]/5 transition-colors text-center group">
                    <Boxes size={18} className="text-[#0075de] group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-medium leading-tight line-clamp-2">{comp.name}</span>
                    <span className="text-[10px] font-mono text-[#6b7280]">{comp.isLooping ? "looping" : "single"}</span>
                    {comp.isLooping && <Badge variant="outline" className="text-[10px] px-1 py-0">Loop</Badge>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-widest uppercase text-[#9ca3af] mb-2 flex items-center gap-1.5"><Layers size={11} /> Dynamic</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={handleInsertRepeater} className="flex flex-col items-center gap-1 p-2.5 rounded-[8px] border border-amber-200 bg-amber-50 hover:border-amber-400 hover:bg-amber-100 transition-colors text-center group">
                  <Repeat size={18} className="text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-amber-800">Repeater</span>
                  <span className="text-[10px] text-amber-700">Loop</span>
                </button>
                <button onClick={handleInsertCondition} className="flex flex-col items-center gap-1 p-2.5 rounded-[8px] border border-violet-200 bg-violet-50 hover:border-violet-400 hover:bg-violet-100 transition-colors text-center group">
                  <GitBranch size={18} className="text-violet-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-violet-800">Condition</span>
                  <span className="text-[10px] text-violet-700">IF</span>
                </button>
              </div>
              <div className="rounded-[8px] bg-[#f6f5f4] p-2.5 text-[11px] leading-relaxed mt-2">
                <div className="font-semibold">Binding syntax:</div>
                <div className="font-mono mt-1">{"{{nama_karyawan}} {{tanggal}} {{office.name}}"}</div>
                <div className="mt-1">Loop: <code className="bg-white px-1 rounded border">Repeater source="pegawai"</code></div>
                <div>Condition: <code className="bg-white px-1 rounded border">IF status == active</code></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CENTER: Document Editor Office Doc */}
        <div className="col-span-12 lg:col-span-6 space-y-2.5 order-1 lg:order-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b bg-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[13px] flex items-center gap-2">
                  <FileText size={16} className="text-[#0075de]" /> Document Editor
                  <span className="hidden sm:inline text-[11px] font-normal text-[#6b7280]">— Simple Office Doc (Tiptap)</span>
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] hidden sm:flex">{pageConfig.paper} {pageConfig.orientation} • {pageConfig.zoom}% • {previewHtml.length} chars</Badge>
                <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${!pageConfig.isPageless ? "bg-[#0075de] text-white border-[#0075de]" : "bg-white text-[#6b7280] border-[#e6e6e6]"}`}>{pageConfig.isPageless ? "Pageless" : "Pages"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-2">
                <div><Label className="text-[11px]">Nama Template *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Surat Tugas" className="h-7 text-[13px]" /></div>
                <div><Label className="text-[11px]">Deskripsi</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi template" className="h-7 text-[13px]" /></div>
              </div>
              {/* Page Config — kertas hanya di Template, sesuai pengecualian Component tanpa kertas */}
              <div className="mt-2 rounded-[8px] border border-[#e6e6e6] bg-white p-2.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#111]"><Ruler size={14} className="text-[#0075de]"/> Pengaturan Kertas — Template only</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  <div><Label className="text-[11px]">Kertas</Label><Select value={pageConfig.paper} onChange={e=>setPageConfig(c=>({...c, paper:e.target.value as any}))}><option value="A4">A4 (210×297mm)</option><option value="Letter">Letter (216×279mm)</option><option value="Legal">Legal (216×356mm)</option><option value="Custom">Custom</option></Select></div>
                  <div><Label className="text-[11px]">Orientasi</Label><Select value={pageConfig.orientation} onChange={e=>setPageConfig(c=>({...c, orientation:e.target.value as any}))}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></Select></div>
                  <div><Label className="text-[11px]">Margins (mm) T</Label><Input type="number" value={pageConfig.margins.top} onChange={e=>setPageConfig(c=>({...c, margins:{...c.margins, top:Number(e.target.value)}}))} className="h-7 text-[13px]" /></div>
                  <div><Label className="text-[11px]">L</Label><Input type="number" value={pageConfig.margins.left} onChange={e=>setPageConfig(c=>({...c, margins:{...c.margins, left:Number(e.target.value)}}))} className="h-7 text-[13px]" /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  <div><Label className="text-[11px]">R (mm)</Label><Input type="number" value={pageConfig.margins.right} onChange={e=>setPageConfig(c=>({...c, margins:{...c.margins, right:Number(e.target.value)}}))} className="h-7 text-[13px]" /></div>
                  <div><Label className="text-[11px]">B (mm)</Label><Input type="number" value={pageConfig.margins.bottom} onChange={e=>setPageConfig(c=>({...c, margins:{...c.margins, bottom:Number(e.target.value)}}))} className="h-7 text-[13px]" /></div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={!pageConfig.isPageless} onChange={e=>setPageConfig(c=>({...c, isPageless:!e.target.checked}))} className="rounded" /> Pages</label>
                    <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={pageConfig.showRuler ?? true} onChange={e=>setPageConfig(c=>({...c, showRuler:e.target.checked}))} className="rounded" /> Ruler</label>
                  </div>
                  <div className="flex items-end gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-[13px]" onClick={()=>setPageConfig(c=>({...c, zoom:Math.max(50, c.zoom-10)}))}><ZoomOut size={12}/></Button>
                    <span className="text-xs font-mono w-10 text-center">{pageConfig.zoom}%</span>
                    <Button variant="outline" size="sm" className="h-7 text-[13px]" onClick={()=>setPageConfig(c=>({...c, zoom:Math.min(200, c.zoom+10)}))}><ZoomIn size={12}/></Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  <div><Label className="text-[11px]">Watermark (opsional)</Label><Input value={pageConfig.watermark?.text || ""} onChange={e=>setPageConfig(c=>({...c, watermark: e.target.value ? { text:e.target.value, opacity:0.08, rotation:-30 } : null}))} placeholder="CONFIDENTIAL / DRAFT" className="h-7 text-[13px]" /></div>
                  <div><Label className="text-[11px]">Header HTML (opsional)</Label><Input value={pageConfig.headerHtml || ""} onChange={e=>setPageConfig(c=>({...c, headerHtml:e.target.value}))} placeholder="<div>Kop surat</div>" className="h-7 text-[13px] font-mono" /></div>
                </div>
                <div><Label className="text-[11px]">Footer HTML (opsional)</Label><Input value={pageConfig.footerHtml || ""} onChange={e=>setPageConfig(c=>({...c, footerHtml:e.target.value}))} placeholder="Footer • halaman" className="h-7 text-[13px] font-mono" /></div>
              </div>
              <div className="mt-3 flex items-center gap-1 bg-[#f6f5f4] p-1 rounded-[8px] w-fit">
                {(["office", "structure", "json"] as const).map(m => (
                  <button key={m} onClick={() => setOfficeMode(m)} className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors flex items-center gap-1.5 ${officeMode === m ? "bg-white shadow text-[#111] border border-[#e6e6e6]" : "text-[#6b7280] hover:text-[#111]"}`}>
                    {m === "office" && <FileText size={12} />}
                    {m === "structure" && <Layers size={12} />}
                    {m === "json" && <Code size={12} />}{m === "office" ? "Office Doc" : m === "structure" ? "Structure" : "Raw JSON"}
                  </button>
                ))}
              </div>
            </CardHeader>

            {officeMode === "office" && (
              <>
                {/* Toolbar exact snippet + pageSize/ruler/zoom */}
                <div className="sticky top-0 z-10 bg-gradient-to-b from-[#fcfcfc] to-[#f9fafb] border-y border-[#e6e6e6]">
                  <div className="p-1.5 flex flex-wrap items-center gap-1.5">
                    <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                      <span className="hidden xl:flex items-center px-2 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Riwayat</span>
                      <button type="button" title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!can(() => editor.can().chain().focus().undo().run())} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30 transition-colors"><Undo size={14} /></button>
                      <button type="button" title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!can(() => editor.can().chain().focus().redo().run())} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30 transition-colors"><Redo size={14} /></button>
                    </div>
                    <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                      <span className="hidden xl:flex items-center px-1 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Format</span>
                      <button type="button" title="Bold (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('bold') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Bold size={14} /></button>
                      <button type="button" title="Italic (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('italic') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Italic size={14} /></button>
                      <button type="button" title="Underline (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('underline') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><UnderlineIcon size={14} /></button>
                      <button type="button" title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('strike') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Highlighter size={14} /></button>
                      <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center" />
                      <button type="button" title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className="w-7 h-7 rounded-[6px] hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center text-[#6b7280] transition-colors"><Eraser size={14} /></button>
                    </div>
                    {/* Group: Font Family & Size */}
                    <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm items-center">
                      <span className="hidden xl:flex items-center px-1 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Font</span>
                      <select value={fontFamily} onChange={e => { const v = e.target.value; setFontFamily(v); if (v) (editor.chain().focus() as any).setFontFamily(v).run(); else (editor.chain().focus() as any).unsetFontFamily().run() }} className="h-7 text-[13px] border-0 bg-transparent pr-1 focus:ring-0 focus:outline-none cursor-pointer max-w-[110px]" title="Font Family">
                        {FONT_FAMILIES.map(f => <option key={f.label} value={f.value} style={{ fontFamily: f.value || undefined }}>{f.label}</option>)}
                      </select>
                      <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center" />
                      <select value={fontSize} onChange={e => { const v = e.target.value; setFontSize(v); if (v) (editor.chain().focus() as any).setFontSize(v).run(); else (editor.chain().focus() as any).unsetFontSize().run() }} className="h-7 text-[13px] border-0 bg-transparent pr-1 focus:ring-0 focus:outline-none cursor-pointer w-[68px]" title="Font Size">
                        {FONT_SIZES.map(f => <option key={f.label} value={f.value}>{f.label}{f.value ? ` (${f.value})` : ''}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm items-center">
                      <div className="hidden lg:flex items-center gap-1.5 px-2 border-r border-[#e6e6e6] mr-1">
                        <Type size={12} className="text-[#6b7280]" />
                        <select value={getHeadingLevel()} onChange={e => { const v = e.target.value; if (v === 'p') editor.chain().focus().setParagraph().run(); else editor.chain().focus().toggleHeading({ level: Number(v) as any }).run(); }} className="h-7 text-[13px] font-medium border-0 bg-transparent pr-2 focus:ring-0 focus:outline-none cursor-pointer">
                          <option value="p">Paragraf</option><option value="1">Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">H4</option><option value="5">H5</option><option value="6">H6</option>
                        </select>
                      </div>
                      <button type="button" title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`hidden sm:flex px-2 h-7 rounded-[6px] items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${isActive('heading', { level: 1 }) ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading1 size={12} /> H1</button>
                      <button type="button" title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`hidden sm:flex px-2 h-7 rounded-[6px] items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${isActive('heading', { level: 2 }) ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading2 size={12} /> H2</button>
                      <button type="button" title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`hidden md:flex px-2 h-7 rounded-[6px] items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${isActive('heading', { level: 3 }) ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading3 size={12} /> H3</button>
                      <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center hidden sm:block" />
                      <button type="button" title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('blockquote') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Quote size={14} /></button>
                    </div>
                    <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                      <button type="button" title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isAlignActive('left') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignLeft size={14} /></button>
                      <button type="button" title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isAlignActive('center') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignCenter size={14} /></button>
                      <button type="button" title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isAlignActive('right') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignRight size={14} /></button>
                      <button type="button" title="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isAlignActive('justify') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignJustify size={14} /></button>
                    </div>
                    <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                      <button type="button" title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('bulletList') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><List size={14} /></button>
                      <button type="button" title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('orderedList') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><ListOrdered size={14} /></button>
                      <div className="w-px h-5 bg-[#e6e6e6] mx-1 self-center" />
                      <button type="button" title="Kurangi indent" onClick={() => editor.chain().focus().liftListItem('listItem').run()} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280] text-[11px] font-mono">←</button>
                      <button type="button" title="Tambah indent" onClick={() => editor.chain().focus().sinkListItem('listItem').run()} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280] text-[11px] font-mono">→</button>
                    </div>
                    <SpacingDropdown editor={editor} tick={tick} />
                    {/* Group: Color & Highlight */}
                    <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm items-center">
                      <div className="flex items-center gap-1">
                        <input type="color" value={textColor} onChange={e=>{setTextColor(e.target.value); (editor.chain().focus() as any).setColor(e.target.value).run()}} className="w-7 h-7 rounded-[6px] border border-[#e6e6e6] p-0.5 cursor-pointer" title="Warna teks" />
                        <input type="color" value={highlightColor} onChange={e=>setHighlightColor(e.target.value)} className="w-7 h-7 rounded-[6px] border border-[#e6e6e6] p-0.5 cursor-pointer" title="Highlight" />
                      </div>
                      <button type="button" title="Highlight" onClick={()=>editor.chain().focus().toggleHighlight({ color: highlightColor }).run()} className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${isActive('highlight') ? 'bg-amber-400 text-white' : 'hover:bg-amber-50 text-[#374151]'}`}><Highlighter size={14}/></button>
                      <button type="button" title="Hapus warna" onClick={()=>{editor.chain().focus().unsetColor().run(); editor.chain().focus().unsetHighlight().run()}} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><Eraser size={12}/></button>
                    </div>
                    <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                      <button type="button" title="Checklist" onClick={()=>{try{(editor.chain().focus() as any).toggleTaskList().run()}catch{editor.chain().focus().toggleBulletList().run()}}} className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${isActive('taskList') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><ListChecks size={14}/></button>
                      <button type="button" title="Superscript" onClick={()=>{try{(editor.chain().focus() as any).toggleSuperscript().run()}catch{}}} className={`w-7 h-7 rounded-[6px] flex items-center justify-center text-xs font-bold ${isActive('superscript') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}>x²</button>
                      <button type="button" title="Subscript" onClick={()=>{try{(editor.chain().focus() as any).toggleSubscript().run()}catch{}}} className={`w-7 h-7 rounded-[6px] flex items-center justify-center text-xs font-bold ${isActive('subscript') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4]'}`}>x₂</button>
                      <button type="button" title="Find & Replace (Ctrl+F)" onClick={()=>setFindOpen(!findOpen)} className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${findOpen ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Search size={14}/></button>
                      <button type="button" title="Outline" onClick={()=>setShowOutline(!showOutline)} className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${showOutline ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Layers size={14}/></button>
                    </div>
                    <div className="flex gap-0.5 bg-white border border-[#e6e6e6] rounded-[8px] p-1 shadow-sm">
                      <div className="relative">
                        <button type="button" title="Sisipkan tabel — pilih ukuran (tanpa header otomatis)" onClick={() => setTablePickerOpen(o => !o)} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${tablePickerOpen ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><TableIcon size={14} /></button>
                        {tablePickerOpen && <TableGridPicker onClose={() => setTablePickerOpen(false)} onPick={(r, c) => { editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: false }).run(); showToast(`Tabel ${c}×${r} ditambahkan — tanpa header`, 'success'); setTablePickerOpen(false) }} />}
                      </div>
                      <button type="button" title="Atur link (modal)" onClick={openLinkModal} className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${isActive('link') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Link2 size={14} /></button>
                      <button type="button" title="Sisipkan gambar (modal)" onClick={openImageModal} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#374151]"><ImageIcon size={14} /></button>
                      <button type="button" title="Garis horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="w-7 h-7 rounded-[6px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><Minus size={14} /></button>
                      <button type="button" title="Page break (Ctrl+Enter)" onClick={() => (editor.chain().focus() as any).setPageBreak().run()} className="w-7 h-7 rounded-[6px] hover:bg-amber-50 hover:text-amber-700 flex items-center justify-center text-[#6b7280] border border-dashed border-[#e6e6e6]">↵</button>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-[#f6f5f4]/70 border-t border-[#e6e6e6]/60 flex items-center gap-2 text-[11px] text-[#6b7280]">
                    <Sparkles size={11} className="text-[#0075de] shrink-0" />
                    <span className="hidden sm:inline">Heading H1–H6, list, tabel, link & gambar semua aktif — klik kanan di posisi kursor untuk menambah <span className="font-mono bg-white border border-[#e6e6e6] px-1 py-0.5 rounded text-[#111] text-[10px]">{"{{data}}"}</span> atau Repeater/Condition</span>
                    <span className="sm:hidden">Klik kanan → tambah {"{{data}}"}</span>
                  </div>
                </div>

                {/* FindBar */}
                {findOpen && (
                  <div className="p-2 bg-white border-b border-[#e6e6e6]">
                    <FindBar editor={editor} open={findOpen} onClose={()=>setFindOpen(false)} />
                  </div>
                )}

                {/* Ruler — Template only (Components tidak punya ruler) */}
                {pageConfig.showRuler && !pageConfig.isPageless && (
                  <div className="px-2.5 py-1.5 bg-[#e8ecef] border-y border-[#e6e6e6] flex justify-center">
                    <EditorRuler pageConfig={pageConfig} />
                  </div>
                )}

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
                    <ImageLayoutButtons editor={editor} />
                    <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0"/>
                    <button type="button" title="Hapus gambar" onClick={()=>{editor.chain().focus().deleteSelection().run()}} className="w-7 h-7 rounded-[6px] hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-[#6b7280] transition-colors shrink-0"><Trash2 size={14}/></button>
                  </div>
                )}

                <div ref={editorContainerRef} onContextMenu={handleContextMenu} className="relative">
                  {showOutline && (
                    <div className="absolute top-2 right-2 z-10 w-[240px] hidden xl:block">
                      <EditorOutline editor={editor} />
                    </div>
                  )}
                  <div className="bg-[#e8ecef] p-2.5 md:p-3 flex justify-center overflow-auto" style={{ minHeight: 520 }}>
                    <EditorCanvas pageConfig={pageConfig} variant={pageConfig.isPageless ? "continuous" : "page"} className="w-full flex justify-center">
                      <div className="w-full">
                        <div className="h-7 bg-white border-b border-[#e6e6e6] flex items-center justify-between px-4 text-[10px] text-[#9ca3af] font-mono rounded-t">
                          <span className="flex items-center gap-2"><FileText size={10} /> {form.name || "Template Baru"}</span>
                          <span className="hidden sm:flex items-center gap-2"><Eye size={10} /> {pageConfig.isPageless ? "Pageless" : `Pages • ${pageConfig.paper}`} • {pageConfig.zoom}%</span>
                        </div>
                        <div className="min-h-[240px]" style={{ minHeight: `${editorHeight}px` }}>
                          <EditorContent editor={editor} className="focus-within:ring-2 focus-within:ring-[#0075de]/10 overflow-y-auto [&_.tiptap]:min-h-[240px] [&_.tiptap]:p-6" />
                        </div>
                      </div>
                    </EditorCanvas>
                  </div>
                  <div className="px-2.5 pb-2.5 bg-[#e8ecef]">
                    <EditorStatusBar editor={editor} pageConfig={pageConfig} variant={pageConfig.isPageless ? "continuous" : "page"} saved={saved} onZoomChange={(z)=>setPageConfig(c=>({...c, zoom:z}))} />
                  </div>
                </div>
                <div onMouseDown={handleEditorGripMouseDown} className="h-7 bg-[#f9fafb] hover:bg-[#eff6ff] border-t border-[#e6e6e6] flex items-center justify-center gap-2 cursor-ns-resize select-none group transition-colors" title="Drag untuk memperbesar / memperkecil tinggi editor">
                  <div className="w-8 h-1 rounded-full bg-[#d1d5db] group-hover:bg-[#0075de] transition-colors" />
                  <span className="text-[11px] font-medium text-[#6b7280] group-hover:text-[#0075de] hidden sm:inline">Tarik untuk atur tinggi</span>
                  <MoveVertical size={12} className="text-[#9ca3af] group-hover:text-[#0075de]" />
                </div>


                <div className="px-2.5 py-1.5 bg-[#f9fafb] border-t border-[#e6e6e6] flex items-center justify-between">
                  <div className="text-[11px] text-[#6b7280] flex items-center gap-1.5"><Info size={12} /> Data terikat & Repeater/Condition akan tersisip tepat di posisi kursor</div>
                  <button type="button" onClick={() => { const rect = editorContainerRef.current?.getBoundingClientRect(); const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2; const y = rect ? rect.top + 120 : window.innerHeight / 2; savedPosRef.current = editor.state.selection.from; setContextMenu({ x, y }) }} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0075de] hover:text-[#005bb5]"><Plus size={12} /> Tambah data terikat</button>
                </div>
              </>
            )}

            {officeMode === "structure" && (
              <CardContent>
                <div className="rounded-[8px] border-2 border-dashed border-[#e6e6e6] bg-[#fafafa] p-2.5 min-h-[300px]">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[#9ca3af] mb-2 flex items-center gap-1.5"><Layers size={12} /> Structure — daftar komponen & repeater/condition</div>
                  <div className="space-y-2">
                    {usages.length === 0 ? <div className="py-12 text-center text-xs text-[#9ca3af]">Belum ada component — tambah dari palette kiri atau klik kanan di Office Doc</div> : usages.map((u, idx) => (
                      <div key={idx} onClick={() => setSelectedUsageIdx(idx)} className={`p-2.5 rounded-[8px] border text-xs cursor-pointer transition-colors ${selectedUsageIdx === idx ? "bg-[#0075de] text-white border-[#0075de] shadow" : "bg-white border-[#e6e6e6] hover:border-[#0075de]/30"}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-[6px] flex items-center justify-center text-[11px] font-bold shrink-0 ${selectedUsageIdx === idx ? "bg-white/20 text-white" : "bg-[#f6f5f4] text-[#6b7280]"}`}>{u.componentId}</span>
                          <span className="font-medium flex-1 truncate">{u.componentName}</span>
                          {u.loopConfig && <Badge variant={selectedUsageIdx === idx ? "secondary" : "outline"} className="text-[10px]">Loop: {u.loopConfig.table || "—"}</Badge>}
                          {u.conditionConfig && <Badge variant={selectedUsageIdx === idx ? "secondary" : "outline"} className="text-[10px]">IF {u.conditionConfig.field}</Badge>}
                        </div>
                        <div className={`mt-1 text-[11px] ${selectedUsageIdx === idx ? "text-white/80" : "text-[#6b7280]"}`}>{Object.keys(u.dataMapping).join(", ") || "no mapping"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}

            {officeMode === "json" && (
              <CardContent>
                <Label className="text-[11px]">Raw JSON — contentHtml + componentsJson</Label>
                <Textarea className="font-mono text-[11px] min-h-[320px]" value={JSON.stringify({ contentHtml: form.contentHtml, usages }, null, 2)} onChange={e => { try { const parsed = JSON.parse(e.target.value); if (parsed.contentHtml) { setForm(prev => ({ ...prev, contentHtml: parsed.contentHtml })); editor?.commands.setContent(parsed.contentHtml) } if (parsed.usages) setUsages(parsed.usages) } catch {} }} />
              </CardContent>
            )}
          </Card>

          {/* Live Preview — Render Engine */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2"><Eye size={14} className="text-[#0075de]" /> Live Preview — Render Engine</CardTitle>
              <CardDescription className="text-[11px]">Pratinjau 1:1 Office Doc + data sample di bawah. Coba ganti status jadi inactive untuk lihat Condition.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs">Data JSON Sample (Binding)</Label>
                <Textarea className="font-mono text-[11px] min-h-[110px]" value={previewData} onChange={e => setPreviewData(e.target.value)} placeholder='{"employees":[{"name":"Afdal"}]}' />
              </div>
              <div className="border rounded-[8px] bg-white overflow-hidden shadow-sm">
                <div className="h-8 bg-[#f6f5f4] border-b flex items-center px-3 gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="ml-2 text-[11px] text-[#6b7280] font-mono">preview — Document → Repeater → Condition</span>
                  <span className="ml-auto text-[11px] text-[#6b7280]">{previewHtml.length} chars</span>
                </div>
                <div className="p-2.5 max-h-[520px] overflow-auto bg-[#e5e7eb]">
                  <div className="bg-white shadow-lg rounded-[4px] min-h-[300px] p-6 text-[13px] leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml || "<div style='padding:24px; text-align:center; color:#9ca3af;'>Preview kosong</div>" }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(`<html><head><title>${form.name}</title><style>body{font-family:Inter, sans-serif; padding:24px;}</style></head><body>${previewHtml}</body></html>`); w.document.close(); w.print() } }}><Printer size={14} /> Cetak</Button>
                <Button size="sm" onClick={async () => {
                  try {
                    const data = JSON.parse(previewData)
                    let html = editor.getHTML()
                    for (const u of usages) {
                      const comp = components.find(c => c.id === u.componentId)
                      let compHtml = comp?.contentHtml || ""
                      for (const [k, v] of Object.entries(u.dataMapping)) {
                        const sample = v.source === "manual" ? v.value : (String(tryGet(data, v.value) ?? `[${v.value}]`))
                        compHtml = compHtml.replaceAll(`{{${k}}}`, sample)
                      }
                      html += `<hr/><div>${compHtml}</div>`
                    }
                    const w = window.open("", "_blank"); if (w) { w.document.write(`<html><head><title>${form.name}</title></head><body>${html}</body></html>`); w.document.close(); w.print() }
                  } catch (e: any) { showToast(e.message, 'error') }
                  function tryGet(o: any, pp: string) { return pp.split(".").reduce((a, c) => a?.[c], o) }
                }}><Download size={14} /> Export PDF (print)</Button>
                <Button size="sm" variant="ghost" onClick={() => setTick(v => v + 1)}><Eye size={14} /> Refresh</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Properties */}
        <Card className="col-span-12 lg:col-span-3 sticky top-2.5 order-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-[13px] flex items-center gap-2"><Settings2 size={14} className="text-[#0075de]" /> Properties</CardTitle>
            <CardDescription className="text-[11px]">Pilih komponen di tengah atau daftar di Structure untuk edit mapping, loop & condition.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {usages.length === 0 ? (
              <div className="text-center py-5 border border-dashed border-[#e6e6e6] rounded-[8px] bg-[#fafafa]">
                <div className="w-8 h-8 rounded-full bg-white border border-[#e6e6e6] flex items-center justify-center mx-auto mb-1.5"><Boxes size={16} className="text-[#9ca3af]" /></div>
                <div className="text-xs font-semibold text-[#374151]">Belum ada komponen</div>
                <div className="text-[11px] text-[#6b7280] mt-1 px-4">Tambah dari palette kiri atau klik kanan di Office Doc → Insert Component / Repeater / Condition</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {usages.map((u, idx) => (
                  <div key={idx} onClick={() => setSelectedUsageIdx(idx)} className={`rounded-[8px] border p-2.5 cursor-pointer transition-colors ${selectedUsageIdx === idx ? "bg-[#eff6ff] border-[#0075de] shadow-sm" : "bg-[#fafafa] border-[#e6e6e6] hover:border-[#0075de]/30 hover:bg-white"}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs flex items-center gap-2"><Boxes size={12} className={selectedUsageIdx === idx ? "text-[#0075de]" : "text-[#6b7280]"} />{u.componentName} <Badge variant="secondary" className="text-[10px]">{u.componentId}</Badge></div>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); const next = [...usages]; const moved = next.splice(idx, 1)[0]; const newIdx = Math.max(0, idx - 1); next.splice(newIdx, 0, moved); setUsages(next); setSelectedUsageIdx(newIdx) }} className="w-6 h-6 rounded hover:bg-white flex items-center justify-center"><ChevronUp size={12} /></button>
                        <button onClick={e => { e.stopPropagation(); const next = [...usages]; const moved = next.splice(idx, 1)[0]; const newIdx = Math.min(next.length, idx + 1); next.splice(newIdx, 0, moved); setUsages(next); setSelectedUsageIdx(newIdx) }} className="w-6 h-6 rounded hover:bg-white flex items-center justify-center"><ChevronDown size={12} /></button>
                        <button onClick={e => { e.stopPropagation(); setUsages(usages.filter((_, i) => i !== idx)); setSelectedUsageIdx(null) }} className="w-6 h-6 rounded hover:bg-red-50 hover:text-red-600 flex items-center justify-center"><X size={12} /></button>
                      </div>
                    </div>
                    {selectedUsageIdx === idx && (
                      <div className="mt-2 space-y-2">
                        {Object.entries(u.dataMapping).map(([k, v]) => (
                          <div key={k} className="space-y-1">
                            <Label className="text-[11px] font-mono">{k}</Label>
                            <div className="grid grid-cols-2 gap-1">
                              <Select value={v.source} onChange={e => { const next = [...usages]; next[idx].dataMapping[k].source = e.target.value as any; setUsages(next) }}>
                                <option value="manual">Manual</option><option value="administrasi">Administrasi</option><option value="tabel">Tabel Global</option>
                              </Select>
                              <Input value={v.value} onChange={e => { const next = [...usages]; next[idx].dataMapping[k].value = e.target.value; setUsages(next) }} placeholder={v.source === "manual" ? "ketik manual" : v.source === "tabel" ? "nama_tabel.kolom" : "field administrasi"} className="h-7 text-[13px]" />
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-[#e6e6e6] space-y-2">
                          <div className="text-[11px] font-semibold flex items-center gap-1"><Repeat size={11} className="text-amber-600" /> Repeater / Loop</div>
                          <div className="flex gap-2">
                            <Select value={u.loopConfig?.table || ""} onChange={e => { const next = [...usages]; if (!next[idx].loopConfig) next[idx].loopConfig = { table: "", selectedRowIds: [] }; next[idx].loopConfig!.table = e.target.value; setUsages(next) }}>
                              <option value="">-- tanpa loop --</option>
                              {globalTables.map(t => <option key={t.name} value={t.name}>{t.displayName} ({t.name})</option>)}
                            </Select>
                            <Button size="sm" variant="outline" className="shrink-0" onClick={async () => {
                              const tbl = usages[idx].loopConfig?.table; if (!tbl) return showToast('Pilih table dulu', 'error')
                              const res = await fetch(`/api/dyn/${tbl}?limit=100`); const j = await res.json(); const rows = j.data || []; const sel = confirm(`Pilih semua ${rows.length} rows? OK=semua, Cancel=3 pertama`); const ids = sel ? rows.map((r: any) => r.id) : rows.slice(0, 3).map((r: any) => r.id); const next = [...usages]; next[idx].loopConfig!.selectedRowIds = ids; setUsages(next); showToast(`${ids.length} rows dipilih`, 'success')
                            }}><Check size={12} /> Pilih</Button>
                          </div>
                          {u.loopConfig?.table && <div className="text-[11px] text-[#6b7280]">Terpilih: {u.loopConfig.selectedRowIds.length ? u.loopConfig.selectedRowIds.join(", ") : "belum"}</div>}
                        </div>
                        <div className="pt-2 border-t border-[#e6e6e6] space-y-2">
                          <div className="text-[11px] font-semibold flex items-center gap-1"><GitBranch size={11} className="text-violet-600" /> Condition / IF</div>
                          <div className="grid grid-cols-3 gap-1">
                            <Input value={u.conditionConfig?.field || ""} onChange={e => { const next = [...usages]; if (!next[idx].conditionConfig) next[idx].conditionConfig = { field: "", operator: "equals", value: "" }; next[idx].conditionConfig!.field = e.target.value; setUsages(next) }} placeholder="field" className="h-7 text-[13px]" />
                            <Select value={u.conditionConfig?.operator || "equals"} onChange={e => { const next = [...usages]; if (!next[idx].conditionConfig) next[idx].conditionConfig = { field: "", operator: "equals", value: "" }; next[idx].conditionConfig!.operator = e.target.value as any; setUsages(next) }}>
                              <option value="equals">equals</option><option value="not_equals">not equals</option><option value="contains">contains</option>
                            </Select>
                            <Input value={u.conditionConfig?.value || ""} onChange={e => { const next = [...usages]; if (!next[idx].conditionConfig) next[idx].conditionConfig = { field: "", operator: "equals", value: "" }; next[idx].conditionConfig!.value = e.target.value; setUsages(next) }} placeholder="value" className="h-7 text-[13px]" />
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="flex-1 h-7 text-[13px]" onClick={() => { const next = [...usages]; delete (next[idx] as any).conditionConfig; setUsages(next); showToast('Condition dihapus', 'info') }}>Hapus Condition</Button>
                            {!u.conditionConfig && <Button size="sm" variant="outline" className="flex-1 h-7 text-[13px]" onClick={() => { const next = [...usages]; next[idx].conditionConfig = { field: "status", operator: "equals", value: "active" }; setUsages(next) }}>+ Tambah IF</Button>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2.5 border-t border-[#e6e6e6] flex gap-1.5">
              <Button variant="outline" className="flex-1" size="sm" onClick={() => router.push("/templates-persuratan")}>Batal</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-[#0075de] hover:bg-[#0063be]" size="sm"><Save size={14} /> {mode === "edit" ? "Update" : "Simpan"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom preview for mobile */}
      <div className="lg:hidden">
        <Card>
          <CardHeader><CardTitle className="text-[13px] flex items-center gap-2"><Eye size={14} /> Pratinjau</CardTitle></CardHeader>
          <CardContent><div className="bg-[#e5e7eb] p-2.5 rounded-[8px]"><div className="bg-white p-2.5 min-h-[200px] text-xs prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml || "<div style='color:#9ca3af; text-align:center;'>Preview kosong</div>" }} /></div></CardContent>
        </Card>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} onContextMenu={e => e.preventDefault()}>
          <div className="fixed bg-white border border-[#e6e6e6] rounded-[8px] shadow-2xl w-[360px] max-h-[85vh] overflow-y-auto" style={{ left: Math.min(contextMenu.x, window.innerWidth - 380), top: Math.min(contextMenu.y, window.innerHeight - 340) }} onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white rounded-t-[8px] p-2.5 pb-2 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="font-bold text-[13px] flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-[#0075de] text-white flex items-center justify-center"><Sparkles size={12} /></div> Tambah ke Template</div>
              <button onClick={() => setContextMenu(null)} className="w-6 h-6 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14} /></button>
            </div>
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={handleInsertRepeater} className="flex flex-col items-center gap-1 p-2.5 rounded-[8px] border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"><Repeat size={16} /><span className="text-xs font-bold">Repeater</span><span className="text-[10px]">Loop</span></button>
                <button onClick={handleInsertCondition} className="flex flex-col items-center gap-1 p-2.5 rounded-[8px] border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-800"><GitBranch size={16} /><span className="text-xs font-bold">Condition</span><span className="text-[10px]">IF</span></button>
                <button onClick={() => { setContextMenu(null); const rect = editorContainerRef.current?.getBoundingClientRect(); const x = rect ? rect.left + 100 : 100; const y = rect ? rect.top + 100 : 100; setContextMenu({ x, y }) }} className="flex flex-col items-center gap-1 p-2.5 rounded-[8px] border border-[#e6e6e6] bg-white hover:bg-[#f6f5f4]"><Boxes size={16} className="text-[#0075de]" /><span className="text-xs font-bold">Component</span><span className="text-[10px] text-[#6b7280]">Branding</span></button>
              </div>
              <div className="border-t pt-2">
                <Label className="text-xs font-semibold">Pilih Component Persuratan</Label>
                <Select value={selectedCompId} onChange={e => setSelectedCompId(e.target.value)} className="mt-1">
                  <option value="">-- pilih component --</option>
                  {components.map(c => <option key={c.id} value={c.id}>{c.name} {c.isLooping ? "(looping)" : ""}</option>)}
                </Select>
                <div className="flex gap-1.5 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setContextMenu(null)} className="flex-1">Batal</Button>
                  <Button size="sm" onClick={handleInsertComponent} className="flex-1 bg-[#0075de] hover:bg-[#0063be]"><Plus size={12} /> Insert Component</Button>
                </div>
              </div>
              <div className="text-[11px] text-[#6b7280] bg-amber-50 border border-amber-200 rounded-[8px] p-2">Repeater & Condition akan disisip sebagai block di posisi kursor. Component branding dari <code className="bg-white px-1 rounded border">/components-persuratan</code> akan masuk ke daftar Properties di kanan.</div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #9ca3af; pointer-events: none; height: 0; font-style: italic; }
        .tiptap p:empty { min-height: 1.5em; }
        .tiptap p:empty::before { content: "\\00a0"; visibility: hidden; }
        .tiptap table { border-collapse: collapse; width: 100%; margin: 12px 0; position: relative; }
        .tiptap table td, .tiptap table th { border: 1px solid #e6e6e6; padding: 6px 10px; min-width: 80px; position: relative; vertical-align: top; }
        .tiptap table th { background: #f9fafb; font-weight: 600; text-align: left; }
        .tiptap .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(0,117,222,0.12); pointer-events: none; border: 1px solid #0075de; }
        .tiptap .column-resize-handle { position: absolute; right: -4px; top: 0; bottom: 0; width: 8px; background: transparent; cursor: col-resize; pointer-events: auto; z-index: 3; }
        .tiptap .column-resize-handle::after { content: ""; position: absolute; left: 3px; top: 0; bottom: 0; width: 2px; background: #0075de; opacity: 0; transition: opacity 0.15s; }
        .tiptap .column-resize-handle:hover::after, .tiptap .column-resize-handle:active::after { opacity: 1; }
        .tiptap table tr::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 6px; cursor: row-resize; z-index: 2; }
        .tiptap table tr:hover::after { background: rgba(0,117,222,0.08); }
        .tiptap img { max-width: 100%; }
        .tiptap a { color: #0075de; text-decoration: underline; text-underline-offset: 2px; }
        .tiptap blockquote { border-left: 3px solid #e5e7eb; padding-left: 12px; margin-left: 0; font-style: italic; color: #4b5563; }
        .tiptap h1 { font-size: 1.875rem; line-height: 1.2; font-weight: 800; margin: 16px 0 8px; }
        .tiptap h2 { font-size: 1.5rem; line-height: 1.3; font-weight: 700; margin: 14px 0 8px; }
        .tiptap h3 { font-size: 1.25rem; line-height: 1.4; font-weight: 700; margin: 12px 0 6px; }
        .tiptap ul { list-style-type: disc; padding-left: 24px; margin: 8px 0; }
        .tiptap ol { list-style-type: decimal; padding-left: 24px; margin: 8px 0; }
        .tiptap li { margin: 2px 0; }
        .tiptap hr { border: none; border-top: 1px solid #e6e6e6; margin: 16px 0; }
      `}} />
    </div>
  )
}
