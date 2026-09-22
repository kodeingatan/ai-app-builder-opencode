"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
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
  Ruler, ZoomIn, ZoomOut, Layers, Code, Repeat, GitBranch, Building2, Palette, Rows3, Columns3, Trash, Combine, Split,
  PaintBucket, Grid3x3, Highlighter, PanelLeft, PanelRight, Columns2, PanelTop, PanelBottom, Frame, GripVertical, ChevronDown, ChevronUp, Search, ListChecks, ArrowUp, ArrowDown, Crop, Upload, ArrowLeft, MonitorPlay, Pencil, Braces, FileCog, PanelRightOpen, Table2
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

type CompUsage = {
  componentId: number
  componentName?: string
  dataMapping: Record<string, { source: "administrasi" | "tabel" | "manual"; value: string }>
  loopConfig?: { table: string; selectedRowIds: number[] }
  conditionConfig?: { field: string; operator: "equals" | "not_equals" | "contains"; value: string }
}
type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' }

// ---------- helpers: variables & render ----------
function extractVariables(html: string, extraHtml: string[] = []): string[] {
  const out = new Set<string>()
  const scan = (s: string) => {
    const re = /\{\{\s*([^}#/]+?)\s*\}\}/g
    let m: any
    while ((m = re.exec(s || ""))) {
      const p = (m[1] || "").trim()
      if (!p || p.startsWith("#") || p.startsWith("/")) continue
      if (p === "index") continue
      out.add(p)
    }
  }
  scan(html)
  extraHtml.forEach(scan)
  return Array.from(out).sort()
}
function getPath(obj: any, path: string): any {
  if (!obj || !path) return undefined
  if (path === "current_date") return new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
  const parts = path.split(".")
  let cur = obj
  for (const part of parts) {
    if (cur == null) return undefined
    cur = cur[part]
  }
  return cur
}
function interpolateHtml(html: string, values: Record<string, string>): string {
  return (html || "").replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, raw) => {
    const path = String(raw || "").trim()
    if (!path || path.startsWith("#") || path.startsWith("/")) return ""
    if (values[path] !== undefined && values[path] !== "") return values[path]
    const v = getPath(values, path)
    if (v !== undefined && v !== null && typeof v !== "object") return String(v)
    return `<span style="background:#fef3c7;border:1px dashed #f59e0b;border-radius:4px;padding:0 4px;font-size:11px;color:#92400e;">{{${path}}}</span>`
  })
}
function evalCondition(field: string, operator: string, expected: string, values: Record<string, string>): boolean {
  const actual = values[field] ?? String(getPath(values, field) ?? "")
  const a = String(actual ?? ""), e = String(expected ?? "")
  switch (operator) {
    case "equals": return a === e
    case "not_equals": return a !== e
    case "contains": return a.includes(e)
    case "not_contains": return !a.includes(e)
    case "exists": return a !== ""
    case "not_exists": return a === ""
    case "gt": return Number(a) > Number(e)
    case "lt": return Number(a) < Number(e)
    case "gte": return Number(a) >= Number(e)
    case "lte": return Number(a) <= Number(e)
    default: return a === e
  }
}
function pageSizeCss(paper: string, orientation: string): string {
  const p = paper === "Letter" ? "letter" : paper === "Legal" ? "legal" : "A4"
  return `${p} ${orientation}`
}
function prettyLabel(path: string): string {
  const last = path.split(".").pop() || path
  return last.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function PersuratanTemplateForm({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", description: "", contentHtml: "<p>Tulis template di sini... klik kanan untuk insert component</p>", contentJson: "" })
  const [components, setComponents] = useState<any[]>([])
  const [globalTables, setGlobalTables] = useState<any[]>([])
  const [usages, setUsages] = useState<CompUsage[]>([])
  const [selectedUsageIdx, setSelectedUsageIdx] = useState<number | null>(null)
  const [selectedCompId, setSelectedCompId] = useState<string>("")
  const [compSearch, setCompSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tick, setTick] = useState(0)
  const savedPosRef = useRef<number | null>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [linkModal, setLinkModal] = useState<{ open: boolean; url: string }>({ open: false, url: '' })
  const [imageModal, setImageModal] = useState<{ open: boolean; url: string }>({ open: false, url: '' })
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cellBg, setCellBg] = useState('#ffffff')
  const [borderColor, setBorderColor] = useState('#e6e6e6')
  const [borderWidth, setBorderWidth] = useState('1px')
  const [borderStyle, setBorderStyle] = useState('solid')
  const [pageConfig, setPageConfig] = useState<PageConfig>({ ...DEFAULT_PAGE_CONFIG })
  const [findOpen, setFindOpen] = useState(false)
  const [tablePickerOpen, setTablePickerOpen] = useState(false)
  const [saved, setSaved] = useState(true)
  const [showOutline, setShowOutline] = useState(false)
  const [textColor, setTextColor] = useState('#111827')
  const [highlightColor, setHighlightColor] = useState('#fff59d')
  const [fontFamily, setFontFamily] = useState('')
  const [fontSize, setFontSize] = useState('')
  const [pastePopup, setPastePopup] = useState(false)
  const [pasteCoords, setPasteCoords] = useState<{ x: number; y: number } | null>(null)
  const pasteRangeRef = useRef<{ from: number; to: number } | null>(null)
  const pasteDataRef = useRef<{ html: string; text: string; keep: string; adapt: string; plain: string } | null>(null)

  // ---- new UX states ----
  const [compPopup, setCompPopup] = useState<{ x?: number; y?: number } | null>(null)
  const [pagePopupOpen, setPagePopupOpen] = useState(false)
  const [propsOpen, setPropsOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<"props" | "structure" | "json">("props")
  const [drawerWidth, setDrawerWidth] = useState(360)
  const drawerDragRef = useRef<{ startX: number; startW: number } | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({
    "letter.number": "800/001/VI/2026",
    "letter.title": "SURAT TUGAS",
    "office.name": "PEMERINTAH PROVINSI ACEH",
    "office.address": "Jl. T. Nyak Arief No.219 Banda Aceh",
    "signer.name": "Drs. H. Ahmad Yani, M.Si",
    "signer.position": "Kepala Dinas",
    "signer.nip": "196501011990031001",
    "nama_karyawan": "Afdal",
    "tanggal": new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
  })
  const [repeaterRows, setRepeaterRows] = useState<Record<string, { table: string; rows: any[]; ids: number[]; loading?: boolean }>>({})
  const [browse, setBrowse] = useState<{ field: string; table: string; search: string; rows: any[]; cols: string[]; loading: boolean } | null>(null)
  const [showAdvJson, setShowAdvJson] = useState(false)

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
      Placeholder.configure({ placeholder: 'Ketik surat di sini… klik kanan atau tekan Components untuk menyisipkan data {{nama_karyawan}}' }),
      InlineBinding,
      ComponentBinding,
      RepeaterNode,
      ConditionNode,
      PageBreak,
    ],
    content: "<p>Tulis template di sini... klik kanan untuk insert component</p>",
    immediatelyRender: false,
    editable: true,
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
        if (!row) { setLoading(false); return }
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

  useEffect(() => {
    if (!editor) return
    const attrs = editor.getAttributes('textStyle') as any
    setFontFamily(attrs.fontFamily || '')
    setFontSize(attrs.fontSize || '')
    if (attrs.color) setTextColor(attrs.color)
    const hl = editor.getAttributes('highlight') as any
    if (hl?.color) setHighlightColor(hl.color)
  }, [tick, editor])

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
      if (e.key === 'Tab') {
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

  // Paste handling
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom as HTMLElement
    const onPaste = (e: ClipboardEvent) => {
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
    return () => {
      dom.removeEventListener('paste', onPaste as any, true)
    }
  }, [editor])

  useEffect(() => {
    if (!pastePopup) return
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setPastePopup(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pastePopup])

  const applyPasteChoice = (choice: 'keep' | 'adapt' | 'plain') => {
    if (!editor || !pasteRangeRef.current || !pasteDataRef.current) { setPastePopup(false); return }
    const { from, to } = pasteRangeRef.current
    const data = pasteDataRef.current
    let htmlChoice = data.adapt
    if (choice === 'keep') htmlChoice = data.keep
    else if (choice === 'plain') htmlChoice = data.plain
    try {
      editor.chain().focus().deleteRange({ from, to } as any).insertContentAt(from, htmlChoice).run()
      setTick(v => v + 1)
      setForm(prev => ({ ...prev, contentHtml: editor.getHTML() }))
      showToast(choice === 'keep' ? 'Paste: style asli dipertahankan' : choice === 'plain' ? 'Paste: hanya text' : 'Paste: disesuaikan dengan editor', 'success')
    } catch (err) {
      console.error('applyPasteChoice error', err)
      showToast('Gagal menerapkan pilihan paste', 'error')
    }
    setPastePopup(false)
    pasteRangeRef.current = null
    pasteDataRef.current = null
  }

  const openCompPopupAtCursor = () => {
    if (!editor) { setCompPopup({}); return }
    try {
      const coords = editor.view.coordsAtPos(editor.state.selection.from) as any
      setCompPopup({ x: Math.min(coords.left, window.innerWidth - 420), y: Math.min(coords.bottom + 8, window.innerHeight - 400) })
    } catch {
      setCompPopup({})
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!editor) return
    try {
      const view = editor.view
      const posInfo = (view as any).posAtCoords?.({ left: e.clientX, top: e.clientY })
      if (posInfo && typeof posInfo.pos === 'number') savedPosRef.current = posInfo.pos
      else savedPosRef.current = editor.state.selection.from
      try { if (savedPosRef.current !== null) editor.chain().setTextSelection(savedPosRef.current).run() } catch {}
    } catch { savedPosRef.current = editor.state.selection.from }
    setCompPopup({ x: Math.min(e.clientX, window.innerWidth - 420), y: Math.min(e.clientY, window.innerHeight - 380) })
  }

  const handleInsertComponent = async (compIdOverride?: number) => {
    const raw = compIdOverride ?? Number(selectedCompId)
    if (!raw) return showToast('Pilih component dulu', 'error')
    const comp = components.find(c => c.id === raw)
    if (!comp) return
    let bindings: any[] = []
    try { bindings = JSON.parse(comp.bindingsJson || "[]") } catch {}
    const mapping: Record<string, { source: "administrasi" | "tabel" | "manual"; value: string }> = {}
    for (const b of bindings) mapping[b.name] = { source: "manual", value: `contoh_${b.name}` }
    const usage: CompUsage = { componentId: raw, componentName: comp.name, dataMapping: mapping }
    if (comp.isLooping) usage.loopConfig = { table: "", selectedRowIds: [] }
    const newUsages = [...usages, usage]
    setUsages(newUsages)
    setSelectedUsageIdx(newUsages.length - 1)
    const insertAt = savedPosRef.current ?? editor!.state.selection.from
    const safePos = Math.max(0, Math.min(insertAt, editor!.state.doc.content.size))
    try { editor!.chain().focus().setTextSelection(safePos).run() } catch {}
    const placeholderInserted = editor!.chain().focus().insertContentAt(safePos, { type: 'componentBinding', attrs: { name: bindings[0]?.name || `comp_${raw}`, componentId: raw, componentName: comp.name } } as any).run()
    if (!placeholderInserted) {
      const html = `<div style="border:2px dashed #3b82f6; background:#eff6ff; padding:8px; border-radius:8px; margin:6px 0;" contenteditable="false" data-component="${raw}"><small style="color:#6b7280">Component: ${comp.name} ${comp.isLooping ? "(looping)" : ""}</small><div>${bindings.map((b: any) => `{{${b.name}}} `).join("")}</div></div><p><br/></p>`
      editor!.chain().focus().insertContent(html).run()
    }
    setTimeout(() => { const html = editor!.getHTML(); setForm(prev => ({ ...prev, contentHtml: html })); setTick(v => v + 1) }, 30)
    setCompPopup(null)
    setSelectedCompId("")
    setCompSearch("")
    if (!propsOpen) setPropsOpen(true)
    setDrawerTab("props")
    showToast(`Component ${comp.name} ditambahkan — atur di Properties`, 'success')
  }

  const handleInsertInlineBinding = (name: string) => {
    if (!editor) return
    const clean = name.trim().replace(/[{}]/g, "")
    if (!clean) return showToast("Nama binding wajib diisi", "error")
    const insertAt = savedPosRef.current ?? editor.state.selection.from
    const safePos = Math.max(0, Math.min(insertAt, editor.state.doc.content.size))
    try { editor.chain().focus().setTextSelection(safePos).run() } catch {}
    const ok = editor.chain().focus().insertContentAt(safePos, { type: 'inlineBinding', attrs: { name: clean } } as any).run()
    if (!ok) editor.chain().focus().insertContent(`{{${clean}}}`).run()
    setTimeout(() => { setForm(prev => ({ ...prev, contentHtml: editor.getHTML() })); setTick(v => v + 1) }, 30)
    setCompPopup(null)
    setPreviewValues(prev => (prev[clean] !== undefined ? prev : { ...prev, [clean]: "" }))
    showToast(`Binding {{${clean}}} disisipkan`, 'success')
  }

  const handleInsertRepeater = (source?: string, item?: string) => {
    if (!editor) return
    const src = source || prompt("Repeater source (contoh: employees, pegawai) — kosongkan untuk employees", "employees") || "employees"
    const itm = item || prompt("Item variable (contoh: employee) — kosongkan untuk employee", "employee") || "employee"
    const insertAt = savedPosRef.current ?? editor.state.selection.from
    const ok = editor.chain().focus().setTextSelection(Math.min(insertAt, editor.state.doc.content.size)).insertContent({ type: 'repeaterNode', attrs: { source: src, item: itm } } as any).run()
    if (ok) {
      setCompPopup(null)
      showToast(`Repeater ${itm} in ${src} ditambahkan`, 'success')
      setRepeaterRows(prev => (prev[src] ? prev : { ...prev, [src]: { table: src, rows: [], ids: [], loading: false } }))
      setTimeout(() => { setForm(prev => ({ ...prev, contentHtml: editor.getHTML() })); setTick(v => v + 1) }, 30)
    }
  }

  const handleInsertCondition = (field?: string, operator?: string, value?: string) => {
    if (!editor) return
    const f = field || prompt("Field untuk condition (contoh: status)", "status") || "status"
    const op = (operator || prompt("Operator: equals / not_equals / contains", "equals") as any) || "equals"
    const v = value ?? prompt("Value (contoh: active)", "active") ?? "active"
    const insertAt = savedPosRef.current ?? editor.state.selection.from
    const ok = editor.chain().focus().setTextSelection(Math.min(insertAt, editor.state.doc.content.size)).insertContent({ type: 'conditionNode', attrs: { field: f, operator: op, value: v } } as any).run()
    if (ok) {
      setCompPopup(null)
      showToast(`Condition IF ${f} ${op} "${v}" ditambahkan`, 'success')
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
    if (!form.name) return showToast('Nama template wajib diisi', 'error')
    setSaving(true)
    try {
      const payload = { name: form.name, description: form.description, contentHtml: latestHtml, contentJson: latestJson, pageConfigJson: JSON.stringify(pageConfig), componentsJson: JSON.stringify(usages) }
      const url = mode === "edit" ? `/api/persuratan/templates/${id}` : `/api/persuratan/templates`
      const method = mode === "edit" ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (res.ok) {
        showToast(mode === "edit" ? 'Template diperbarui' : 'Template disimpan', 'success')
        setSaved(true)
        setTimeout(() => { router.push("/templates-persuratan"); router.refresh() }, 500)
      } else {
        let msg = "Gagal simpan"
        try { const t = await res.text(); if (t) msg = (JSON.parse(t) as any)?.message || msg } catch {}
        showToast(`${msg} (${res.status})`, 'error')
      }
    } finally { setSaving(false) }
  }

  // ---------- live preview data ----------
  const detectedVars = useMemo(() => {
    const compHtmls = usages.map(u => components.find(c => c.id === u.componentId)?.contentHtml || "").filter(Boolean)
    return extractVariables(editor ? editor.getHTML() : form.contentHtml, compHtmls)
  }, [editor, tick, form.contentHtml, usages, components])

  const repeaterSources = useMemo(() => {
    const out = new Set<string>()
    try {
      if (editor) {
        editor.state.doc.descendants((node: any) => {
          if (node.type.name === "repeaterNode" && node.attrs?.source) out.add(String(node.attrs.source))
          return true
        })
      }
    } catch {}
    Object.keys(repeaterRows).forEach(s => out.add(s))
    return Array.from(out)
  }, [editor, tick, repeaterRows])

  // auto-register new vars into form values
  useEffect(() => {
    setPreviewValues(prev => {
      const next = { ...prev }
      let changed = false
      for (const v of detectedVars) {
        if (next[v] === undefined) { next[v] = ""; changed = true }
      }
      return changed ? next : prev
    })
  }, [detectedVars])

  const filledHtml = useMemo(() => {
    let html = editor ? editor.getHTML() : form.contentHtml
    // expand component placeholders
    for (const u of usages) {
      const comp = components.find(c => c.id === u.componentId)
      if (!comp?.contentHtml) continue
      let compHtml = String(comp.contentHtml)
      for (const [k, m] of Object.entries(u.dataMapping)) {
        let sample = ""
        if (m.source === "manual") sample = m.value
        else if (previewValues[m.value] !== undefined) sample = previewValues[m.value]
        else sample = String(getPath(previewValues, m.value) ?? `[${m.value}]`)
        compHtml = compHtml.split(`{{${k}}}`).join(sample)
        compHtml = compHtml.split(`{{ ${k} }}`).join(sample)
      }
      compHtml = interpolateHtml(compHtml, previewValues)
      const re = new RegExp(`<div[^>]*data-component="${u.componentId}"[^>]*>[\\s\\S]*?<\\/div>`, 'g')
      if (re.test(html)) html = html.replace(re, () => compHtml)
      else html += compHtml
    }
    // expand repeater placeholders into real rows
    html = html.replace(new RegExp('<div[^>]*data-repeater[^>]*data-source="([^"]+)"[^>]*data-item="([^"]+)"[^>]*>[\\s\\S]*?<\\/div>', 'g'), (_m, src, item) => {
      const st = repeaterRows[src]
      const rows = st && st.ids.length ? st.rows.filter(r => st.ids.includes(r.id)) : st?.rows?.slice(0, 3) || []
      if (!rows.length) {
        return `<div style="border:1px dashed #f59e0b;background:#fffbeb;border-radius:8px;padding:10px;margin:8px 0;font-size:12px;color:#92400e;">Repeater <b>${src}</b> — belum ada data. Pilih data di panel kiri preview lalu refresh.</div>`
      }
      const cards = rows.map((r: any, i: number) => {
        const fields = Object.entries(r).filter(([k]) => !["id", "createdAt", "updatedAt"].includes(k)).slice(0, 6)
        return `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;margin:6px 0;background:#fff;font-size:12px;"><div style="font-size:10px;font-weight:700;color:#6b7280;letter-spacing:.06em;">${item} #${i + 1}</div><div style="margin-top:4px;color:#111;">${fields.map(([k, v]) => `<span style="display:inline-block;background:#f3f4f6;border-radius:4px;padding:1px 6px;margin:1px 4px 1px 0;"><b>${k}:</b> ${String(v ?? "-")}</span>`).join("")}</div></div>`
      }).join("")
      return `<div style="margin:8px 0;">${cards}</div>`
    })
    // condition placeholders → badge tampil/sembunyi
    html = html.replace(new RegExp('<div[^>]*data-condition[^>]*data-field="([^"]+)"[^>]*data-operator="([^"]+)"[^>]*data-value="([^"]*)"[^>]*>[\\s\\S]*?<\\/div>', 'g'), (_m, f, op, v) => {
      const pass = evalCondition(f, op, v, previewValues)
      return pass
        ? `<div style="border:1px dashed #8b5cf6;background:#f5f3ff;border-radius:8px;padding:8px 10px;margin:8px 0;font-size:12px;color:#5b21b6;">IF <b>${f} ${op} "${v}"</b> → <b>terpenuhi</b>, konten di bawahnya tampil.</div>`
        : `<div style="border:1px dashed #d1d5db;background:#f9fafb;border-radius:8px;padding:8px 10px;margin:8px 0;font-size:12px;color:#6b7280;">IF <b>${f} ${op} "${v}"</b> → tidak terpenuhi, konten disembunyikan.</div>`
    })
    html = interpolateHtml(html, previewValues)
    return html
  }, [editor, tick, form.contentHtml, usages, components, previewValues, repeaterRows])

  const loadRepeaterTable = async (source: string, table?: string) => {
    const tbl = table || repeaterRows[source]?.table || source
    setRepeaterRows(prev => ({ ...prev, [source]: { table: tbl, rows: prev[source]?.rows || [], ids: prev[source]?.ids || [], loading: true } }))
    try {
      const res = await fetch(`/api/dyn/${encodeURIComponent(tbl)}?limit=50`)
      const j = await res.json()
      const rows = j.data || []
      setRepeaterRows(prev => ({ ...prev, [source]: { table: tbl, rows, ids: rows.slice(0, 3).map((r: any) => r.id), loading: false } }))
      showToast(`${rows.length} baris dimuat untuk ${source}`, 'success')
    } catch {
      setRepeaterRows(prev => ({ ...prev, [source]: { table: tbl, rows: [], ids: [], loading: false } }))
      showToast(`Gagal memuat tabel ${tbl}`, 'error')
    }
  }

  const openBrowse = (field: string) => {
    const guess = globalTables[0]?.name || ""
    setBrowse({ field, table: guess, search: "", rows: [], cols: [], loading: false })
    if (guess) loadBrowseRows(guess, "", field)
  }
  const loadBrowseRows = async (table: string, search: string, fieldOverride?: string) => {
    const targetField = fieldOverride ?? browse?.field ?? ""
    setBrowse(prev => (prev ? { ...prev, table, search, loading: true } : { field: targetField, table, search, rows: [], cols: [], loading: true }))
    try {
      const res = await fetch(`/api/dyn/${encodeURIComponent(table)}?limit=20&search=${encodeURIComponent(search)}`)
      const j = await res.json()
      const rows = j.data || []
      const cols = rows.length ? Object.keys(rows[0]).filter(k => !["createdAt", "updatedAt"].includes(k)).slice(0, 7) : []
      setBrowse(prev => (prev ? { ...prev, table, search, rows, cols, loading: false } : null))
    } catch {
      setBrowse(prev => (prev ? { ...prev, rows: [], cols: [], loading: false } : null))
    }
  }
  const pickBrowseRow = (row: any, col?: string) => {
    if (!browse) return
    if (col) {
      setPreviewValues(prev => ({ ...prev, [browse.field]: String(row[col] ?? "") }))
      showToast(`${browse.field} ← ${col}: ${String(row[col] ?? "").slice(0, 40)}`, 'success')
      setBrowse(null)
      return
    }
    // auto-map: isi semua var yang cocok dengan kolom row
    setPreviewValues(prev => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(row)) {
        if (v == null || typeof v === "object") continue
        const kl = k.toLowerCase()
        for (const varName of detectedVars) {
          const vl = varName.toLowerCase()
          if (vl === kl || vl.endsWith(kl) || kl.endsWith(vl.split(".").pop() || "") || vl.split(".").pop() === kl) {
            if (!next[varName]) next[varName] = String(v)
          }
        }
      }
      return next
    })
    showToast("Data baris diterapkan ke form preview", 'success')
    setBrowse(null)
  }

  // ---------- print / pdf ----------
  const buildPrintDoc = (bodyHtml: string, title: string) => {
    const { margins } = pageConfig
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>
      @page { size: ${pageSizeCss(pageConfig.paper, pageConfig.orientation)}; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }
      * { box-sizing: border-box; }
      body { font-family: Inter, Arial, sans-serif; color: #111; line-height: 1.6; font-size: 12pt; margin: 0; padding: 0; }
      table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid #999; padding: 6px 8px; }
      img { max-width: 100%; } a { color: #111; text-decoration: none; }
      ${pageConfig.watermark?.text ? `.wm{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;opacity:${pageConfig.watermark.opacity ?? 0.08};transform:rotate(${pageConfig.watermark.rotation ?? -30}deg);font-size:72pt;font-weight:900;letter-spacing:.1em;pointer-events:none;}` : ""}
    </style></head><body>
      ${pageConfig.watermark?.text ? `<div class="wm">${pageConfig.watermark.text}</div>` : ""}
      ${pageConfig.headerHtml ? `<div style="text-align:center;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:12px;">${pageConfig.headerHtml}</div>` : ""}
      ${bodyHtml}
      ${pageConfig.footerHtml ? `<div style="text-align:center;border-top:1px solid #999;padding-top:8px;margin-top:16px;font-size:9pt;color:#555;">${pageConfig.footerHtml}</div>` : ""}
    </body></html>`
  }
  const doPrint = (useFilled: boolean) => {
    const body = useFilled ? filledHtml : interpolateHtml(editor ? editor.getHTML() : form.contentHtml, previewValues)
    const w = window.open("", "_blank")
    if (!w) return showToast("Popup diblokir browser — izinkan popup", "error")
    w.document.write(buildPrintDoc(body, form.name || "Surat"))
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 400)
  }
  const doExportPdf = () => {
    // browser print → Save as PDF (tanpa dependensi tambahan, hasil 1:1 kertas)
    showToast("Dialog cetak dibuka — pilih 'Save as PDF' untuk export PDF", "info")
    doPrint(true)
  }

  // ---------- toolbar helpers ----------
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
    } catch { showToast('Gagal memproses gambar', 'error') }
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

  // drawer resize
  const onDrawerGripDown = (e: React.MouseEvent) => {
    e.preventDefault()
    drawerDragRef.current = { startX: e.clientX, startW: drawerWidth }
    const onMove = (ev: MouseEvent) => {
      if (!drawerDragRef.current) return
      const dx = drawerDragRef.current.startX - ev.clientX
      const nw = Math.max(280, Math.min(560, drawerDragRef.current.startW + dx))
      setDrawerWidth(nw)
    }
    const onUp = () => {
      drawerDragRef.current = null
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  if (loading) return <div className="p-8 text-center text-sm text-[#6b7280] animate-pulse">Memuat data...</div>
  if (!editor) return <div className="p-8 text-center text-sm text-[#6b7280]">Memuat editor…</div>

  const selectedUsage = selectedUsageIdx !== null ? usages[selectedUsageIdx] : null
  const filteredComps = components.filter(c => !compSearch || String(c.name).toLowerCase().includes(compSearch.toLowerCase()))
  const tbBtn = "h-7 min-w-7 px-1.5 rounded-[6px] flex items-center justify-center gap-1 text-xs font-medium transition-colors shrink-0"
  const tbIcon = "w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors shrink-0"

  return (
    <div className="min-h-[calc(100vh-120px)] -m-1">
      <PasteChoicePopup open={pastePopup} coords={pasteCoords} onClose={() => setPastePopup(false)} onChoose={applyPasteChoice} />
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto min-w-[280px] max-w-[420px] rounded-[8px] border px-2.5 py-2 shadow-lg flex items-start gap-2.5 text-sm ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${t.type === 'error' ? 'bg-red-600 text-white' : t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
              {t.type === 'error' ? <X size={14} /> : t.type === 'success' ? <Check size={12} /> : <Info size={14} />}
            </div>
            <div className="flex-1 pt-0.5 leading-relaxed">{t.message}</div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="p-1 hover:bg-black/5 rounded"><X size={12} /></button>
          </div>
        ))}
      </div>

      {/* Link & Image & Crop modals */}
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
      {cropSrc && (<ImageCropModal src={cropSrc} onClose={() => setCropSrc(null)} onApply={applyCrop} showToast={showToast} />)}
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
              <div className="flex items-center gap-2 text-[11px] text-[#9ca3af]"><span className="flex-1 h-px bg-[#e6e6e6]" />atau<span className="flex-1 h-px bg-[#e6e6e6]" /></div>
              <label className="flex items-center justify-center gap-1.5 h-8 rounded-[6px] border border-dashed border-[#0075de]/40 bg-[#eff6ff] text-[#0075de] text-[13px] font-medium cursor-pointer hover:bg-[#dbeafe]"><Upload size={14} /> Upload dari perangkat (base64)<input type="file" accept="image/*" className="hidden" onChange={e => { handleImageFile(e.target.files?.[0]); (e.target as HTMLInputElement).value = "" }} /></label>
              {imageModal.url && <div className="border border-[#e6e6e6] rounded-[8px] p-2 bg-[#f9fafb]"><div className="text-[11px] font-semibold mb-1">Preview</div><img src={imageModal.url} alt="preview" className="max-h-[180px] w-auto mx-auto rounded" onError={e => (e.currentTarget.style.display = 'none')} /></div>}
              <div className="flex gap-2 justify-end pt-2"><Button variant="outline" size="sm" onClick={() => setImageModal({ open: false, url: '' })}>Batal</Button><Button size="sm" onClick={submitImageModal} className="bg-[#0075de] hover:bg-[#0063be]"><ImageIcon size={14} /> Sisipkan</Button></div>
            </div>
          </div>
        </div>
      )}

      {/* ===== App bar: identitas template + aksi utama ===== */}
      <div className="bg-white border border-[#e6e6e6] rounded-[12px] shadow-sm overflow-hidden">
        <div className="px-3 py-2 flex flex-wrap items-center gap-2">
          <button onClick={() => router.push("/templates-persuratan")} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]" title="Kembali ke daftar template"><ArrowLeft size={16} /></button>
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#0075de] to-[#005bb5] text-white flex items-center justify-center shrink-0"><FileStack size={16} /></div>
          <div className="flex-1 min-w-[200px]">
            <Input value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setSaved(false) }} placeholder="Nama template — mis. Surat Tugas" className="h-8 text-[14px] font-bold border-transparent hover:border-[#e6e6e6] focus:border-[#0075de] px-2 -ml-2 shadow-none" />
            <Input value={form.description} onChange={e => { setForm({ ...form, description: e.target.value }); setSaved(false) }} placeholder="Deskripsi singkat template (opsional)" className="h-6 text-[12px] text-[#6b7280] border-transparent hover:border-[#e6e6e6] focus:border-[#0075de] px-2 -ml-2 shadow-none" />
          </div>
          <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${saved ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${saved ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />{saved ? "Tersimpan" : "Belum tersimpan"}
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant={isPreview ? "default" : "outline"} size="sm" onClick={() => setIsPreview(v => !v)} className={isPreview ? "bg-[#0075de] hover:bg-[#0063be]" : ""} title="Live preview surat jadi + form isian data"><MonitorPlay size={14} /> {isPreview ? "Edit" : "Live Preview"}</Button>
            <Button variant="outline" size="sm" onClick={() => doPrint(isPreview)} title="Cetak surat"><Printer size={14} /><span className="hidden md:inline">Cetak</span></Button>
            <Button variant="outline" size="sm" onClick={doExportPdf} title="Export PDF via dialog cetak"><Download size={14} /><span className="hidden md:inline">PDF</span></Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-[#0075de] hover:bg-[#0063be]" title="Simpan template"><Save size={14} /> {saving ? "Menyimpan…" : mode === "edit" ? "Update" : "Simpan"}</Button>
          </div>
        </div>
      </div>

      {/* ===== Toolbar dokumen: insert + view + output ===== */}
      <div className="mt-2 bg-white border border-[#e6e6e6] rounded-[12px] shadow-sm overflow-hidden sticky top-2 z-20">
        <div className="px-2 py-1.5 flex flex-wrap items-center gap-1.5">
          <span className="hidden xl:flex items-center px-2 text-[10px] font-bold tracking-widest text-[#9ca3af] uppercase">Sisip</span>
          <button type="button" onClick={() => { savedPosRef.current = editor.state.selection.from; setCompPopup({}) }} className={`${tbBtn} bg-[#0075de] text-white hover:bg-[#0063be] shadow-sm px-2.5`} title="Sisipkan component persuratan (popup)"><Boxes size={14} /> Components</button>
          <button type="button" onClick={() => handleInsertRepeater()} className={`${tbBtn} bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100`} title="Sisipkan repeater / loop"><Repeat size={14} /> Repeater</button>
          <button type="button" onClick={() => handleInsertCondition()} className={`${tbBtn} bg-violet-50 border border-violet-200 text-violet-800 hover:bg-violet-100`} title="Sisipkan condition / IF"><GitBranch size={14} /> Condition</button>
          <button type="button" onClick={() => { savedPosRef.current = editor.state.selection.from; setCompPopup({}) }} className={`${tbBtn} bg-white border border-[#e6e6e6] hover:bg-[#f6f5f4] text-[#374151]`} title="Sisipkan binding {{data}}"><Braces size={14} /> {"{{data}}"}</button>
          <div className="w-px h-6 bg-[#e6e6e6] mx-1" />
          <span className="hidden xl:flex items-center px-1 text-[10px] font-bold tracking-widest text-[#9ca3af] uppercase">Halaman</span>
          <button type="button" onClick={() => setPagePopupOpen(true)} className={`${tbIcon} hover:bg-[#f6f5f4] text-[#374151] border border-[#e6e6e6]`} title="Pengaturan kertas & template (popup)"><FileCog size={15} /></button>
          <button type="button" onClick={() => { setPropsOpen(true); setDrawerTab("props") }} className={`${tbIcon} border ${propsOpen ? "bg-[#0075de] text-white border-[#0075de]" : "hover:bg-[#f6f5f4] text-[#374151] border-[#e6e6e6]"}`} title="Tampilkan Properties (drawer kanan, geser untuk resize)"><PanelRightOpen size={15} /></button>
          <button type="button" onClick={() => setShowOutline(v => !v)} className={`${tbIcon} ${showOutline ? "bg-[#0075de] text-white" : "hover:bg-[#f6f5f4] text-[#374151] border border-[#e6e6e6]"}`} title="Outline heading"><Layers size={14} /></button>
          <button type="button" onClick={() => setPageConfig(c => ({ ...c, showRuler: !(c.showRuler ?? true) }))} className={`${tbIcon} ${(pageConfig.showRuler ?? true) ? "bg-[#111827] text-white" : "hover:bg-[#f6f5f4] text-[#374151] border border-[#e6e6e6]"}`} title="Tampilkan / sembunyikan ruler"><Ruler size={14} /></button>
          <div className="w-px h-6 bg-[#e6e6e6] mx-1" />
          <span className="hidden xl:flex items-center px-1 text-[10px] font-bold tracking-widest text-[#9ca3af] uppercase">Hasil</span>
          <button type="button" onClick={() => setIsPreview(v => !v)} className={`${tbBtn} border ${isPreview ? "bg-[#0075de] text-white border-[#0075de]" : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"}`} title="Live preview + form isian data"><Eye size={14} /> Preview</button>
          <button type="button" onClick={doExportPdf} className={`${tbIcon} hover:bg-[#f6f5f4] text-[#374151] border border-[#e6e6e6]`} title="Export PDF"><Download size={14} /></button>
          <button type="button" onClick={() => doPrint(isPreview)} className={`${tbIcon} hover:bg-[#f6f5f4] text-[#374151] border border-[#e6e6e6]`} title="Cetak"><Printer size={14} /></button>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setPageConfig(c => ({ ...c, zoom: Math.max(50, c.zoom - 10) }))} className={`${tbIcon} hover:bg-[#f6f5f4] border border-[#e6e6e6]`} title="Zoom out"><ZoomOut size={13} /></button>
            <span className="text-[11px] font-mono w-11 text-center font-semibold">{pageConfig.zoom}%</span>
            <button type="button" onClick={() => setPageConfig(c => ({ ...c, zoom: Math.min(200, c.zoom + 10) }))} className={`${tbIcon} hover:bg-[#f6f5f4] border border-[#e6e6e6]`} title="Zoom in"><ZoomIn size={13} /></button>
          </div>
        </div>
        {/* formatting ribbon */}
        {!isPreview && (
          <div className="px-2 pb-1.5 flex flex-wrap items-center gap-1.5 border-t border-[#f0f0f0] pt-1.5">
            <div className="flex gap-0.5 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-1">
              <button type="button" title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!can(() => editor.can().chain().focus().undo().run())} className={`${tbIcon} hover:bg-white disabled:opacity-30`}><Undo size={14} /></button>
              <button type="button" title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!can(() => editor.can().chain().focus().redo().run())} className={`${tbIcon} hover:bg-white disabled:opacity-30`}><Redo size={14} /></button>
            </div>
            <div className="flex gap-0.5 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-1">
              <button type="button" title="Bold (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} className={`${tbIcon} ${isActive('bold') ? 'bg-[#111827] text-white' : 'hover:bg-white text-[#374151]'}`}><Bold size={14} /></button>
              <button type="button" title="Italic (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${tbIcon} ${isActive('italic') ? 'bg-[#111827] text-white' : 'hover:bg-white text-[#374151]'}`}><Italic size={14} /></button>
              <button type="button" title="Underline (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${tbIcon} ${isActive('underline') ? 'bg-[#111827] text-white' : 'hover:bg-white text-[#374151]'}`}><UnderlineIcon size={14} /></button>
              <button type="button" title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${tbIcon} ${isActive('strike') ? 'bg-[#111827] text-white' : 'hover:bg-white text-[#374151]'}`}><Highlighter size={14} /></button>
              <button type="button" title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className={`${tbIcon} hover:bg-amber-50 hover:text-amber-600 text-[#6b7280]`}><Eraser size={14} /></button>
            </div>
            <div className="flex gap-0.5 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-1 items-center">
              <select value={fontFamily} onChange={e => { const v = e.target.value; setFontFamily(v); if (v) (editor.chain().focus() as any).setFontFamily(v).run(); else (editor.chain().focus() as any).unsetFontFamily().run() }} className="h-7 text-[13px] border-0 bg-transparent pr-1 focus:ring-0 focus:outline-none cursor-pointer max-w-[104px]" title="Font Family">
                {FONT_FAMILIES.map(f => <option key={f.label} value={f.value} style={{ fontFamily: f.value || undefined }}>{f.label}</option>)}
              </select>
              <div className="w-px h-6 bg-[#e6e6e6] mx-1" />
              <select value={fontSize} onChange={e => { const v = e.target.value; setFontSize(v); if (v) (editor.chain().focus() as any).setFontSize(v).run(); else (editor.chain().focus() as any).unsetFontSize().run() }} className="h-7 text-[13px] border-0 bg-transparent pr-1 focus:ring-0 focus:outline-none cursor-pointer w-[64px]" title="Font Size">
                {FONT_SIZES.map(f => <option key={f.label} value={f.value}>{f.label}{f.value ? ` (${f.value})` : ''}</option>)}
              </select>
            </div>
            <div className="hidden lg:flex gap-0.5 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-1 items-center">
              <Type size={12} className="text-[#6b7280] ml-1" />
              <select value={getHeadingLevel()} onChange={e => { const v = e.target.value; if (v === 'p') editor.chain().focus().setParagraph().run(); else editor.chain().focus().toggleHeading({ level: Number(v) as any }).run(); }} className="h-7 text-[13px] font-medium border-0 bg-transparent pr-2 focus:ring-0 focus:outline-none cursor-pointer">
                <option value="p">Paragraf</option><option value="1">Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">H4</option><option value="5">H5</option><option value="6">H6</option>
              </select>
              <button type="button" title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`hidden sm:flex px-2 h-7 rounded-[6px] items-center text-[11px] font-bold ${isActive('heading', { level: 1 }) ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#374151]'}`}><Heading1 size={12} /> H1</button>
              <button type="button" title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`hidden sm:flex px-2 h-7 rounded-[6px] items-center text-[11px] font-bold ${isActive('heading', { level: 2 }) ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#374151]'}`}><Heading2 size={12} /> H2</button>
              <button type="button" title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`hidden md:flex px-2 h-7 rounded-[6px] items-center text-[11px] font-bold ${isActive('heading', { level: 3 }) ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#374151]'}`}><Heading3 size={12} /> H3</button>
              <button type="button" title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${tbIcon} ${isActive('blockquote') ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#374151]'}`}><Quote size={14} /></button>
            </div>
            <div className="flex gap-0.5 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-1">
              <button type="button" title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`${tbIcon} ${isAlignActive('left') ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#6b7280]'}`}><AlignLeft size={14} /></button>
              <button type="button" title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`${tbIcon} ${isAlignActive('center') ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#6b7280]'}`}><AlignCenter size={14} /></button>
              <button type="button" title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`${tbIcon} ${isAlignActive('right') ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#6b7280]'}`}><AlignRight size={14} /></button>
              <button type="button" title="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`${tbIcon} ${isAlignActive('justify') ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#6b7280]'}`}><AlignJustify size={14} /></button>
            </div>
            <div className="flex gap-0.5 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-1">
              <button type="button" title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${tbIcon} ${isActive('bulletList') ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#374151]'}`}><List size={14} /></button>
              <button type="button" title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${tbIcon} ${isActive('orderedList') ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#374151]'}`}><ListOrdered size={14} /></button>
            </div>
            <SpacingDropdown editor={editor} tick={tick} />
            <div className="flex gap-0.5 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-1 items-center">
              <input type="color" value={textColor} onChange={e => { setTextColor(e.target.value); (editor.chain().focus() as any).setColor(e.target.value).run() }} className="w-7 h-7 rounded-[6px] border border-[#e6e6e6] p-0.5 cursor-pointer" title="Warna teks" />
              <input type="color" value={highlightColor} onChange={e => setHighlightColor(e.target.value)} className="w-7 h-7 rounded-[6px] border border-[#e6e6e6] p-0.5 cursor-pointer" title="Highlight" />
              <button type="button" title="Highlight" onClick={() => editor.chain().focus().toggleHighlight({ color: highlightColor }).run()} className={`${tbIcon} ${isActive('highlight') ? 'bg-amber-400 text-white' : 'hover:bg-amber-50 text-[#374151]'}`}><Highlighter size={14} /></button>
            </div>
            <div className="flex gap-0.5 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-1">
              <button type="button" title="Checklist" onClick={() => { try { (editor.chain().focus() as any).toggleTaskList().run() } catch { editor.chain().focus().toggleBulletList().run() } }} className={`${tbIcon} ${isActive('taskList') ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#374151]'}`}><ListChecks size={14} /></button>
              <button type="button" title="Find & Replace (Ctrl+F)" onClick={() => setFindOpen(!findOpen)} className={`${tbIcon} ${findOpen ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#374151]'}`}><Search size={14} /></button>
            </div>
            <div className="flex gap-0.5 bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] p-1">
              <div className="relative">
                <button type="button" title="Sisipkan tabel" onClick={() => setTablePickerOpen(o => !o)} className={`${tbIcon} ${tablePickerOpen ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#374151]'}`}><TableIcon size={14} /></button>
                {tablePickerOpen && <TableGridPicker onClose={() => setTablePickerOpen(false)} onPick={(r, c) => { editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: false }).run(); showToast(`Tabel ${c}×${r} ditambahkan`, 'success'); setTablePickerOpen(false) }} />}
              </div>
              <button type="button" title="Atur link" onClick={openLinkModal} className={`${tbIcon} ${isActive('link') ? 'bg-[#0075de] text-white' : 'hover:bg-white text-[#374151]'}`}><Link2 size={14} /></button>
              <button type="button" title="Sisipkan gambar" onClick={openImageModal} className={`${tbIcon} hover:bg-white text-[#374151]`}><ImageIcon size={14} /></button>
              <button type="button" title="Garis horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={`${tbIcon} hover:bg-white text-[#6b7280]`}><Minus size={14} /></button>
              <button type="button" title="Page break" onClick={() => (editor.chain().focus() as any).setPageBreak().run()} className={`${tbIcon} hover:bg-amber-50 hover:text-amber-700 text-[#6b7280] border border-dashed border-[#e6e6e6]`}>↵</button>
            </div>
          </div>
        )}
      </div>

      {/* ===== Main: dokumen full + drawer kanan ===== */}
      <div className="mt-2 flex items-start gap-2.5">
        <div className="flex-1 min-w-0 space-y-2">
          {!isPreview ? (
            <>
              {findOpen && (<div className="bg-white border border-[#e6e6e6] rounded-[12px] p-2"><FindBar editor={editor} open={findOpen} onClose={() => setFindOpen(false)} /></div>)}
              {editor && editor.isActive('table') && (
                <div className="bg-white border border-[#e6e6e6] rounded-[12px] px-2 py-1 flex items-center gap-0.5 flex-wrap">
                  <span className="w-6 h-6 rounded-[6px] bg-[#0075de] text-white flex items-center justify-center shrink-0 mr-0.5" title="Operasi Tabel"><Grid3x3 size={13} /></span>
                  <button type="button" title="Tambah baris di atas" onClick={() => { editor.chain().focus().addRowBefore().run() }} className={`${tbIcon} hover:bg-[#e9eef5]`}><ArrowUp size={14} /></button>
                  <button type="button" title="Tambah baris di bawah" onClick={() => { editor.chain().focus().addRowAfter().run() }} className={`${tbIcon} hover:bg-[#e9eef5]`}><ArrowDown size={14} /></button>
                  <button type="button" title="Hapus baris" onClick={() => { editor.chain().focus().deleteRow().run() }} className={`${tbIcon} hover:bg-red-50 hover:text-red-600 text-[#6b7280]`}><Trash size={14} /></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0" />
                  <button type="button" title="Tambah kolom di kiri" onClick={() => { editor.chain().focus().addColumnBefore().run() }} className={`${tbIcon} hover:bg-[#e9eef5]`}><PanelLeft size={14} /></button>
                  <button type="button" title="Tambah kolom di kanan" onClick={() => { editor.chain().focus().addColumnAfter().run() }} className={`${tbIcon} hover:bg-[#e9eef5]`}><PanelRight size={14} /></button>
                  <button type="button" title="Hapus kolom" onClick={() => { editor.chain().focus().deleteColumn().run() }} className={`${tbIcon} hover:bg-red-50 hover:text-red-600 text-[#6b7280]`}><Trash2 size={14} /></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0" />
                  <button type="button" title="Gabung cell" onClick={() => { editor.chain().focus().mergeCells().run() }} className={`${tbIcon} hover:bg-[#e9eef5]`}><Combine size={14} /></button>
                  <button type="button" title="Pecah cell" onClick={() => { editor.chain().focus().splitCell().run() }} className={`${tbIcon} hover:bg-[#e9eef5]`}><Split size={14} /></button>
                  <button type="button" title="Baris pertama jadi header" onClick={() => { editor.chain().focus().toggleHeaderRow().run() }} className={`${tbIcon} hover:bg-[#e9eef5]`}><PanelTop size={14} /></button>
                  <button type="button" title="Kolom pertama jadi header" onClick={() => { editor.chain().focus().toggleHeaderColumn().run() }} className={`${tbIcon} hover:bg-[#e9eef5]`}><Columns3 size={14} /></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0" />
                  <input type="color" value={cellBg} onChange={e => setCellBg(e.target.value)} className="w-7 h-7 p-1 rounded-[6px] border border-[#e6e6e6] bg-white cursor-pointer shrink-0" title="Warna background cell" />
                  <button type="button" title="Terapkan warna" onClick={() => { editor.chain().focus().setCellAttribute('backgroundColor', cellBg).run() }} className={`${tbIcon} hover:bg-[#e9eef5]`}><PaintBucket size={14} /></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0" />
                  <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-7 h-7 p-1 rounded-[6px] border border-[#e6e6e6] bg-white cursor-pointer shrink-0" title="Warna border" />
                  <select value={borderWidth} onChange={e => setBorderWidth(e.target.value)} className="h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-1 bg-white shrink-0"><option value="1px">1px</option><option value="2px">2px</option><option value="3px">3px</option><option value="4px">4px</option></select>
                  <select value={borderStyle} onChange={e => setBorderStyle(e.target.value)} className="h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-1 bg-white shrink-0"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option></select>
                  <button type="button" title="Tanpa border" onClick={() => applyBorderPreset('none')} className={`${tbIcon} hover:bg-[#e9eef5]`}><Minus size={14} /></button>
                  <button type="button" title="Hanya border luar" onClick={() => applyBorderPreset('outer')} className={`${tbIcon} hover:bg-[#e9eef5]`}><Frame size={14} /></button>
                  <button type="button" title="Semua sisi" onClick={() => applyBorderPreset('all')} className={`${tbIcon} hover:bg-[#e9eef5]`}><Grid3x3 size={14} /></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0" />
                  <button type="button" onMouseDown={handleRowDragMouseDown} className={`${tbIcon} hover:bg-[#e9eef5] cursor-row-resize`} title="Drag untuk tinggi baris"><GripVertical size={14} /></button>
                  <button type="button" title="Hapus tabel" onClick={() => { editor.chain().focus().deleteTable().run() }} className={`${tbIcon} hover:bg-red-50 hover:text-red-600 text-[#6b7280]`}><Trash2 size={14} /></button>
                </div>
              )}
              {editor && editor.isActive('image') && (
                <div className="bg-white border border-[#e6e6e6] rounded-[12px] px-2 py-1 flex items-center gap-0.5 flex-wrap">
                  <span className="w-6 h-6 rounded-[6px] bg-[#0075de] text-white flex items-center justify-center shrink-0 mr-0.5"><ImageIcon size={13} /></span>
                  <button type="button" title="Crop gambar" onClick={openCropFromSelection} className={`${tbIcon} hover:bg-[#e9eef5]`}><Crop size={14} /></button>
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0" />
                  {[240, 420, 640, 860].map((w, i) => (
                    <button key={w} type="button" title={`Lebar ${w}px`} onClick={() => { editor.chain().focus().updateAttributes('image', { width: w, height: null }).run() }} className="h-7 min-w-7 px-1.5 rounded-[6px] hover:bg-[#e9eef5] text-[11px] font-bold text-[#374151] shrink-0">{["S", "M", "L", "XL"][i]}</button>
                  ))}
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0" />
                  <ImageLayoutButtons editor={editor} />
                  <span className="w-px h-5 bg-[#e6e6e6] mx-1 shrink-0" />
                  <button type="button" title="Hapus gambar" onClick={() => { editor.chain().focus().deleteSelection().run() }} className={`${tbIcon} hover:bg-red-50 hover:text-red-600 text-[#6b7280]`}><Trash2 size={14} /></button>
                </div>
              )}

              {/* Ruler Word-like */}
              {(pageConfig.showRuler ?? true) && !pageConfig.isPageless && (
                <div className="bg-[#e8ecef] border border-[#e6e6e6] rounded-[12px] px-3 py-2">
                  <EditorRuler pageConfig={pageConfig} editor={editor} tick={tick} onMarginsChange={(m) => { setPageConfig(c => ({ ...c, margins: { ...c.margins, ...m } })); setSaved(false) }} />
                  <div className="mt-1 text-center text-[10px] text-[#6b7280]">Drag tepi abu-abu = margin kertas · drag segitiga = indent paragraf · klik ruler = tambah tab stop · klik kanan marker = hapus</div>
                </div>
              )}

              {/* Full document canvas */}
              <div ref={editorContainerRef} onContextMenu={handleContextMenu} className="relative">
                {showOutline && (
                  <div className="absolute top-2 right-2 z-10 w-[240px] hidden xl:block">
                    <EditorOutline editor={editor} />
                  </div>
                )}
                <div className="bg-[#e8ecef] border border-[#e6e6e6] rounded-[12px] p-2.5 md:p-4 flex justify-center overflow-auto" style={{ minHeight: 560 }}>
                  <EditorCanvas pageConfig={pageConfig} variant={pageConfig.isPageless ? "continuous" : "page"} className="w-full flex justify-center">
                    <div className="w-full">
                      <div className="h-7 bg-white border-b border-[#e6e6e6] flex items-center justify-between px-4 text-[10px] text-[#9ca3af] font-mono rounded-t">
                        <span className="flex items-center gap-2"><FileText size={10} /> {form.name || "Template Baru"}</span>
                        <span className="hidden sm:flex items-center gap-2"><Eye size={10} /> {pageConfig.isPageless ? "Pageless" : `Pages • ${pageConfig.paper}`} • {pageConfig.zoom}%</span>
                      </div>
                      <div className="min-h-[480px]">
                        <EditorContent editor={editor} className="focus-within:ring-2 focus-within:ring-[#0075de]/10 overflow-y-auto [&_.tiptap]:min-h-[480px] [&_.tiptap]:p-6" />
                      </div>
                    </div>
                  </EditorCanvas>
                </div>
                <div className="mt-2">
                  <EditorStatusBar editor={editor} pageConfig={pageConfig} variant={pageConfig.isPageless ? "continuous" : "page"} saved={saved} onZoomChange={(z) => setPageConfig(c => ({ ...c, zoom: z }))} />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#6b7280] px-1">
                  <span className="flex items-center gap-1.5"><Info size={12} /> Klik kanan di dokumen atau tekan <b>Components</b> untuk sisip data {"{{nama_karyawan}}"}</span>
                  <button type="button" onClick={openCompPopupAtCursor} className="inline-flex items-center gap-1.5 font-medium text-[#0075de] hover:text-[#005bb5]"><Plus size={12} /> Sisip data</button>
                </div>
              </div>
            </>
          ) : (
            /* ===== LIVE PREVIEW: form isian + surat jadi ===== */
            <div className="grid grid-cols-12 gap-2.5 items-start">
              <div className="col-span-12 xl:col-span-4 space-y-2.5">
                <div className="bg-white border border-[#e6e6e6] rounded-[12px] overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-[#e6e6e6] bg-gradient-to-b from-[#fcfcfc] to-[#f6f5f4]">
                    <div className="font-bold text-[13px] flex items-center gap-2"><Pencil size={14} className="text-[#0075de]" /> Isi Data Surat</div>
                    <div className="text-[11px] text-[#6b7280] mt-0.5">Terdeteksi <b>{detectedVars.length}</b> variabel dari template & component. Isi manual atau ambil dari Browse Data.</div>
                  </div>
                  <div className="p-3 space-y-2.5 max-h-[62vh] overflow-y-auto">
                    {detectedVars.length === 0 && (
                      <div className="text-center py-6 border border-dashed rounded-[8px] text-xs text-[#9ca3af]">Belum ada {"{{variabel}}"} di dokumen.<br />Sisipkan via Components / {"{{data}}"} dulu.</div>
                    )}
                    {detectedVars.map(v => (
                      <div key={v} className="space-y-1">
                        <Label className="text-[11px] font-mono bg-[#f6f5f4] border px-1.5 py-0.5 rounded inline-block">{"{{"}{v}{"}}"}</Label>
                        <div className="flex gap-1.5">
                          <Input value={previewValues[v] ?? ""} onChange={e => setPreviewValues(p => ({ ...p, [v]: e.target.value }))} placeholder={prettyLabel(v)} className="h-8 text-[13px] flex-1" />
                          <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => openBrowse(v)} title="Ambil dari tabel data"><Database size={13} /> Browse</Button>
                        </div>
                      </div>
                    ))}
                    {repeaterSources.length > 0 && (
                      <div className="pt-2 border-t space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] flex items-center gap-1.5"><Table2 size={11} /> Data Repeater</div>
                        {repeaterSources.map(src => {
                          const st = repeaterRows[src] || { table: src, rows: [], ids: [] as number[] }
                          return (
                            <div key={src} className="border rounded-[8px] p-2 space-y-1.5 bg-[#fffbeb]/50">
                              <div className="text-xs font-bold">Loop: {src}</div>
                              <div className="flex gap-1.5">
                                <Select value={st.table} onChange={e => setRepeaterRows(p => ({ ...p, [src]: { ...(p[src] || { rows: [], ids: [] }), table: e.target.value, rows: [], ids: [] } }))} className="h-7 text-xs flex-1">
                                  {globalTables.map((t: any) => <option key={t.name} value={t.name}>{t.displayName} ({t.name})</option>)}
                                  {globalTables.length === 0 && <option value={src}>{src}</option>}
                                </Select>
                                <Button size="sm" variant="outline" className="h-7" disabled={st.loading} onClick={() => loadRepeaterTable(src, st.table)}>{st.loading ? "…" : "Muat"}</Button>
                              </div>
                              {st.rows.length > 0 && (
                                <div className="space-y-1 max-h-[160px] overflow-y-auto">
                                  {st.rows.slice(0, 12).map((r: any) => (
                                    <label key={r.id} className="flex items-center gap-2 text-[11px] bg-white border rounded px-1.5 py-1 cursor-pointer hover:border-[#0075de]">
                                      <input type="checkbox" checked={st.ids.includes(r.id)} onChange={e => setRepeaterRows(p => ({ ...p, [src]: { ...st, ids: e.target.checked ? [...st.ids, r.id] : st.ids.filter(x => x !== r.id) } }))} className="rounded" />
                                      <span className="font-mono text-[#6b7280]">#{r.id}</span>
                                      <span className="truncate flex-1">{Object.entries(r).filter(([k]) => !["id", "createdAt", "updatedAt"].includes(k)).slice(0, 3).map(([, v]) => String(v ?? "-")).join(" · ")}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div>
                      <button onClick={() => setShowAdvJson(v => !v)} className="text-[11px] text-[#0075de] hover:underline">Advanced: JSON mentah {showAdvJson ? "▾" : "▸"}</button>
                      {showAdvJson && (
                        <Textarea className="font-mono text-[11px] min-h-[110px] mt-1" value={JSON.stringify(previewValues, null, 2)} onChange={e => { try { setPreviewValues(JSON.parse(e.target.value)) } catch {} }} />
                      )}
                    </div>
                  </div>
                  <div className="px-3 py-2 border-t bg-[#f9fafb] flex gap-1.5">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setPreviewValues({}); setTick(v => v + 1) }}>Reset</Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => doPrint(true)}><Printer size={13} /> Cetak</Button>
                    <Button size="sm" className="flex-1 bg-[#0075de] hover:bg-[#0063be]" onClick={doExportPdf}><Download size={13} /> PDF</Button>
                  </div>
                </div>
              </div>
              <div className="col-span-12 xl:col-span-8">
                <div className="bg-[#e8ecef] border border-[#e6e6e6] rounded-[12px] p-2.5 md:p-4 overflow-auto" style={{ maxHeight: "calc(100vh - 220px)", minHeight: 560 }}>
                  <EditorCanvas pageConfig={pageConfig} variant={pageConfig.isPageless ? "continuous" : "page"} className="w-full flex justify-center">
                    <div className="w-full">
                      <div className="h-7 bg-emerald-600 text-white flex items-center justify-between px-4 text-[10px] font-mono rounded-t">
                        <span className="flex items-center gap-2"><Eye size={10} /> SURAT JADI — {form.name || "Template"}</span>
                        <span>{detectedVars.length} variabel terisi</span>
                      </div>
                      <div className="bg-white p-6 text-[13px] leading-relaxed prose prose-sm max-w-none min-h-[480px]" dangerouslySetInnerHTML={{ __html: filledHtml || "<div style='color:#9ca3af;text-align:center;'>Isi data di kiri untuk melihat surat jadi</div>" }} />
                    </div>
                  </EditorCanvas>
                </div>
                <div className="mt-2"><EditorStatusBar editor={editor} pageConfig={pageConfig} variant={pageConfig.isPageless ? "continuous" : "page"} saved={saved} onZoomChange={(z) => setPageConfig(c => ({ ...c, zoom: z }))} /></div>
              </div>
            </div>
          )}
        </div>

        {/* ===== Drawer kanan: Properties (push + resizable, close via X) ===== */}
        {propsOpen && (
          <aside className="hidden lg:flex flex-col shrink-0 bg-white border border-[#e6e6e6] rounded-[12px] shadow-sm overflow-hidden relative" style={{ width: `${drawerWidth}px`, minHeight: 560, maxHeight: "calc(100vh - 180px)" }}>
            <div onMouseDown={onDrawerGripDown} className="absolute left-0 inset-y-0 w-2 cursor-ew-resize z-10 group flex items-center justify-center hover:bg-[#0075de]/10" title="Drag untuk ubah lebar drawer">
              <div className="w-1 h-12 rounded-full bg-[#d1d5db] group-hover:bg-[#0075de] transition-colors" />
            </div>
            <div className="pl-3 pr-2.5 py-2.5 border-b border-[#e6e6e6] bg-gradient-to-b from-[#fcfcfc] to-[#f6f5f4]">
              <div className="flex items-center gap-2">
                <Settings2 size={14} className="text-[#0075de]" />
                <span className="font-bold text-[13px]">Properties</span>
                <Badge variant="secondary" className="text-[10px]">{usages.length}</Badge>
                <button onClick={() => setPropsOpen(false)} className="ml-auto w-7 h-7 rounded-[8px] hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-[#6b7280]" title="Tutup (X)"><X size={14} /></button>
              </div>
              <div className="mt-2 flex items-center gap-1 bg-[#f0f0f0] p-1 rounded-[8px] w-fit">
                {(["props", "structure", "json"] as const).map(t => (
                  <button key={t} onClick={() => setDrawerTab(t)} className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium flex items-center gap-1 ${drawerTab === t ? "bg-white shadow border border-[#e6e6e6] text-[#111]" : "text-[#6b7280] hover:text-[#111]"}`}>
                    {t === "props" && <Settings2 size={11} />}{t === "structure" && <Layers size={11} />}{t === "json" && <Code size={11} />}
                    {t === "props" ? "Mapping" : t === "structure" ? "Struktur" : "JSON"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5">
              {drawerTab === "props" && (
                usages.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-[8px] bg-[#fafafa]">
                    <div className="w-9 h-9 rounded-full bg-white border flex items-center justify-center mx-auto mb-2"><Boxes size={16} className="text-[#9ca3af]" /></div>
                    <div className="text-xs font-semibold">Belum ada komponen</div>
                    <div className="text-[11px] text-[#6b7280] mt-1 px-4">Tekan <b>Components</b> di toolbar atau klik kanan di dokumen.</div>
                    <Button size="sm" className="mt-2 bg-[#0075de] hover:bg-[#0063be]" onClick={() => setCompPopup({})}><Plus size={12} /> Tambah Component</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {usages.map((u, idx) => (
                      <div key={idx} onClick={() => setSelectedUsageIdx(idx)} className={`rounded-[8px] border p-2.5 cursor-pointer ${selectedUsageIdx === idx ? "bg-[#eff6ff] border-[#0075de]" : "bg-[#fafafa] border-[#e6e6e6] hover:bg-white"}`}>
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-bold text-xs flex items-center gap-1.5 min-w-0"><Boxes size={12} className={selectedUsageIdx === idx ? "text-[#0075de]" : "text-[#6b7280]"} /><span className="truncate">{u.componentName}</span><Badge variant="secondary" className="text-[10px] shrink-0">{u.componentId}</Badge></div>
                          <div className="flex gap-0.5 shrink-0">
                            <button onClick={e => { e.stopPropagation(); const next = [...usages]; const moved = next.splice(idx, 1)[0]; const ni = Math.max(0, idx - 1); next.splice(ni, 0, moved); setUsages(next); setSelectedUsageIdx(ni); setSaved(false) }} className="w-6 h-6 rounded hover:bg-white flex items-center justify-center"><ChevronUp size={12} /></button>
                            <button onClick={e => { e.stopPropagation(); const next = [...usages]; const moved = next.splice(idx, 1)[0]; const ni = Math.min(next.length, idx + 1); next.splice(ni, 0, moved); setUsages(next); setSelectedUsageIdx(ni); setSaved(false) }} className="w-6 h-6 rounded hover:bg-white flex items-center justify-center"><ChevronDown size={12} /></button>
                            <button onClick={e => { e.stopPropagation(); setUsages(usages.filter((_, i) => i !== idx)); setSelectedUsageIdx(null); setSaved(false) }} className="w-6 h-6 rounded hover:bg-red-50 hover:text-red-600 flex items-center justify-center"><X size={12} /></button>
                          </div>
                        </div>
                        {selectedUsageIdx === idx && (
                          <div className="mt-2 space-y-2" onClick={e => e.stopPropagation()}>
                            {Object.entries(u.dataMapping).map(([k, v]) => (
                              <div key={k} className="space-y-1">
                                <Label className="text-[11px] font-mono bg-white border px-1 rounded inline-block">{k}</Label>
                                <div className="grid grid-cols-2 gap-1">
                                  <Select value={v.source} onChange={e => { const next = [...usages]; next[idx].dataMapping[k].source = e.target.value as any; setUsages(next); setSaved(false) }}>
                                    <option value="manual">Manual</option><option value="administrasi">Administrasi</option><option value="tabel">Tabel Global</option>
                                  </Select>
                                  <Input value={v.value} onChange={e => { const next = [...usages]; next[idx].dataMapping[k].value = e.target.value; setUsages(next); setSaved(false) }} placeholder={v.source === "manual" ? "ketik manual" : "field / tabel.kolom"} className="h-7 text-[13px]" />
                                </div>
                              </div>
                            ))}
                            <div className="pt-2 border-t space-y-1.5">
                              <div className="text-[11px] font-semibold flex items-center gap-1"><Repeat size={11} className="text-amber-600" /> Repeater / Loop</div>
                              <div className="flex gap-1.5">
                                <Select value={u.loopConfig?.table || ""} onChange={e => { const next = [...usages]; if (!next[idx].loopConfig) next[idx].loopConfig = { table: "", selectedRowIds: [] }; next[idx].loopConfig!.table = e.target.value; setUsages(next); setSaved(false) }} className="h-7 text-xs flex-1">
                                  <option value="">-- tanpa loop --</option>
                                  {globalTables.map(t => <option key={t.name} value={t.name}>{t.displayName} ({t.name})</option>)}
                                </Select>
                                <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={async () => {
                                  const tbl = usages[idx].loopConfig?.table; if (!tbl) return showToast('Pilih table dulu', 'error')
                                  const res = await fetch(`/api/dyn/${tbl}?limit=100`); const j = await res.json(); const rows = j.data || []
                                  const sel = confirm(`Pilih semua ${rows.length} rows? OK=semua, Cancel=3 pertama`)
                                  const ids = sel ? rows.map((r: any) => r.id) : rows.slice(0, 3).map((r: any) => r.id)
                                  const next = [...usages]; next[idx].loopConfig!.selectedRowIds = ids; setUsages(next); showToast(`${ids.length} rows dipilih`, 'success')
                                }}><Check size={12} /></Button>
                              </div>
                            </div>
                            <div className="pt-2 border-t space-y-1.5">
                              <div className="text-[11px] font-semibold flex items-center gap-1"><GitBranch size={11} className="text-violet-600" /> Condition / IF</div>
                              <div className="grid grid-cols-3 gap-1">
                                <Input value={u.conditionConfig?.field || ""} onChange={e => { const next = [...usages]; if (!next[idx].conditionConfig) next[idx].conditionConfig = { field: "", operator: "equals", value: "" }; next[idx].conditionConfig!.field = e.target.value; setUsages(next); setSaved(false) }} placeholder="field" className="h-7 text-[13px]" />
                                <Select value={u.conditionConfig?.operator || "equals"} onChange={e => { const next = [...usages]; if (!next[idx].conditionConfig) next[idx].conditionConfig = { field: "", operator: "equals", value: "" }; next[idx].conditionConfig!.operator = e.target.value as any; setUsages(next); setSaved(false) }}>
                                  <option value="equals">equals</option><option value="not_equals">not equals</option><option value="contains">contains</option>
                                </Select>
                                <Input value={u.conditionConfig?.value || ""} onChange={e => { const next = [...usages]; if (!next[idx].conditionConfig) next[idx].conditionConfig = { field: "", operator: "equals", value: "" }; next[idx].conditionConfig!.value = e.target.value; setUsages(next); setSaved(false) }} placeholder="value" className="h-7 text-[13px]" />
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="flex-1 h-7 text-[13px]" onClick={() => { const next = [...usages]; delete (next[idx] as any).conditionConfig; setUsages(next) }}>Hapus Condition</Button>
                                {!u.conditionConfig && <Button size="sm" variant="outline" className="flex-1 h-7 text-[13px]" onClick={() => { const next = [...usages]; next[idx].conditionConfig = { field: "status", operator: "equals", value: "active" }; setUsages(next) }}>+ Tambah IF</Button>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
              {drawerTab === "structure" && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">Daftar komponen & repeater</div>
                  {usages.length === 0 && repeaterSources.length === 0 && <div className="text-xs text-[#9ca3af] border border-dashed rounded p-4 text-center">Belum ada struktur.</div>}
                  {usages.map((u, i) => (
                    <button key={i} onClick={() => setSelectedUsageIdx(i)} className={`w-full text-left p-2.5 rounded-[8px] border text-xs ${selectedUsageIdx === i ? "bg-[#0075de] text-white border-[#0075de]" : "bg-white border-[#e6e6e6]"}`}>
                      <div className="flex items-center gap-2"><span className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold ${selectedUsageIdx === i ? "bg-white/20" : "bg-[#f6f5f4] text-[#6b7280]"}`}>{u.componentId}</span><span className="font-medium truncate flex-1">{u.componentName}</span></div>
                      <div className={`mt-1 text-[11px] ${selectedUsageIdx === i ? "text-white/80" : "text-[#6b7280]"}`}>{Object.keys(u.dataMapping).join(", ") || "no mapping"}</div>
                    </button>
                  ))}
                  {repeaterSources.map(s => (
                    <div key={s} className="p-2.5 rounded-[8px] border border-amber-200 bg-amber-50 text-xs"><Repeat size={11} className="inline mr-1 text-amber-600" />Repeater: <b>{s}</b></div>
                  ))}
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] pt-1">Variabel terdeteksi ({detectedVars.length})</div>
                  <div className="flex flex-wrap gap-1">{detectedVars.map(v => <code key={v} className="text-[10px] font-mono bg-[#f6f5f4] border px-1.5 py-0.5 rounded">{"{{"}{v}{"}}"}</code>)}</div>
                </div>
              )}
              {drawerTab === "json" && (
                <div className="space-y-2">
                  <Label className="text-[11px]">Raw JSON — contentHtml + usages</Label>
                  <Textarea className="font-mono text-[11px] min-h-[420px]" value={JSON.stringify({ contentHtml: form.contentHtml, usages }, null, 2)} onChange={e => { try { const parsed = JSON.parse(e.target.value); if (parsed.contentHtml) { setForm(prev => ({ ...prev, contentHtml: parsed.contentHtml })); editor?.commands.setContent(parsed.contentHtml) } if (parsed.usages) setUsages(parsed.usages) } catch {} }} />
                </div>
              )}
            </div>
            <div className="pl-3 pr-2.5 py-2 border-t bg-[#f9fafb] flex gap-1.5">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setPropsOpen(false)}>Tutup (X)</Button>
              <Button size="sm" className="flex-1 bg-[#0075de] hover:bg-[#0063be]" onClick={handleSubmit} disabled={saving}><Save size={13} /> Simpan</Button>
            </div>
          </aside>
        )}
        {/* mobile properties fallback */}
        {propsOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute right-0 inset-y-0 w-[86vw] max-w-[380px] bg-white shadow-2xl flex flex-col">
              <div className="p-3 border-b flex items-center gap-2"><Settings2 size={14} className="text-[#0075de]" /><b className="text-sm">Properties</b><button onClick={() => setPropsOpen(false)} className="ml-auto w-8 h-8 rounded hover:bg-[#f6f5f4] flex items-center justify-center"><X size={15} /></button></div>
              <div className="flex-1 overflow-y-auto p-3 text-xs text-[#6b7280]">Buka di layar lebar untuk edit mapping lengkap. {usages.length} komponen terpasang.</div>
              <div className="p-3 border-t"><Button className="w-full bg-[#0075de]" size="sm" onClick={() => setPropsOpen(false)}>Tutup</Button></div>
            </div>
          </div>
        )}
      </div>

      {/* ===== Popup Components (toolbar / klik kanan) ===== */}
      {compPopup && (
        <div className="fixed inset-0 z-50" onClick={() => setCompPopup(null)} onContextMenu={e => e.preventDefault()}>
          <div
            className="fixed bg-white border border-[#e6e6e6] rounded-[12px] shadow-2xl w-[400px] max-w-[92vw] max-h-[86vh] flex flex-col overflow-hidden"
            style={compPopup.x !== undefined ? { left: Math.min(compPopup.x, window.innerWidth - 420), top: Math.min(compPopup.y ?? 120, window.innerHeight - 420) } : { left: "50%", top: "12vh", transform: "translateX(-50%)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3 pb-2 border-b flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#0075de] text-white flex items-center justify-center"><Sparkles size={13} /></div>
              <div><div className="font-bold text-[13px]">Sisip ke Dokumen</div><div className="text-[11px] text-[#6b7280]">Component · Repeater · Condition · Binding</div></div>
              <button onClick={() => setCompPopup(null)} className="ml-auto w-7 h-7 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14} /></button>
            </div>
            <div className="p-3 space-y-2.5 overflow-y-auto">
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={() => handleInsertRepeater()} className="flex flex-col items-center gap-1 p-2.5 rounded-[8px] border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"><Repeat size={16} /><span className="text-xs font-bold">Repeater</span><span className="text-[10px]">Loop data</span></button>
                <button onClick={() => handleInsertCondition()} className="flex flex-col items-center gap-1 p-2.5 rounded-[8px] border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-800"><GitBranch size={16} /><span className="text-xs font-bold">Condition</span><span className="text-[10px]">IF tampil</span></button>
                <button onClick={() => { const v = prompt("Nama binding, contoh: nama_karyawan", "nama_karyawan"); if (v) handleInsertInlineBinding(v) }} className="flex flex-col items-center gap-1 p-2.5 rounded-[8px] border border-[#e6e6e6] bg-white hover:bg-[#f6f5f4]"><Braces size={16} className="text-[#0075de]" /><span className="text-xs font-bold">{"{{data}}"}</span><span className="text-[10px] text-[#6b7280]">Binding</span></button>
              </div>
              <div className="border-t pt-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5"><Building2 size={12} /> Component Persuratan</Label>
                <div className="relative mt-1.5">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <Input value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="Cari component…" className="h-8 text-[13px] pl-8" />
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-1.5 max-h-[260px] overflow-y-auto pr-0.5">
                  {filteredComps.length === 0 && <div className="col-span-2 text-[11px] text-[#6b7280] py-6 text-center border border-dashed rounded-[8px]">Tidak ada component — buat dulu di Components Persuratan</div>}
                  {filteredComps.map(comp => (
                    <button key={comp.id} onClick={() => handleInsertComponent(comp.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-[8px] border text-center transition-colors ${String(selectedCompId) === String(comp.id) ? "border-[#0075de] bg-[#eff6ff]" : "border-[#e6e6e6] bg-white hover:border-[#0075de] hover:bg-[#0075de]/5"}`}>
                      <Boxes size={17} className="text-[#0075de]" />
                      <span className="text-[11px] font-medium leading-tight line-clamp-2">{comp.name}</span>
                      <span className="text-[10px] font-mono text-[#6b7280]">{comp.isLooping ? "looping" : "single"}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-2">
                  <Select value={selectedCompId} onChange={e => setSelectedCompId(e.target.value)} className="h-8 text-[13px] flex-1">
                    <option value="">-- atau pilih dari daftar --</option>
                    {components.map(c => <option key={c.id} value={c.id}>{c.name} {c.isLooping ? "(looping)" : ""}</option>)}
                  </Select>
                  <Button size="sm" onClick={() => handleInsertComponent()} className="bg-[#0075de] hover:bg-[#0063be] h-8"><Plus size={12} /> Sisip</Button>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Binding cepat</Label>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {["nama_karyawan", "tanggal", "letter.number", "office.name", "signer.name"].map(b => (
                    <button key={b} onClick={() => handleInsertInlineBinding(b)} className="text-[11px] font-mono bg-[#f6f5f4] border px-1.5 py-1 rounded hover:border-[#0075de] hover:text-[#0075de]">{"{{"}{b}{"}}"}</button>
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-[#6b7280] bg-[#f6f5f4] border rounded-[8px] p-2">Disisip tepat di posisi kursor. Mapping & loop diatur di <b>Properties</b> (drawer kanan).</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Popup Pengaturan Kertas & Template ===== */}
      {pagePopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPagePopupOpen(false)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-2 rounded-t-[12px]">
              <FileCog size={16} className="text-[#0075de]" />
              <div><div className="font-bold text-sm">Pengaturan Kertas & Template</div><div className="text-[11px] text-[#6b7280]">Ukuran, margin, header/footer, watermark, zoom</div></div>
              <button onClick={() => setPagePopupOpen(false)} className="ml-auto w-8 h-8 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={15} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><Label className="text-[11px]">Kertas</Label><Select value={pageConfig.paper} onChange={e => { setPageConfig(c => ({ ...c, paper: e.target.value as any })); setSaved(false) }} className="mt-1"><option value="A4">A4 (210×297)</option><option value="Letter">Letter (216×279)</option><option value="Legal">Legal (216×356)</option><option value="Custom">Custom</option></Select></div>
                <div><Label className="text-[11px]">Orientasi</Label><Select value={pageConfig.orientation} onChange={e => { setPageConfig(c => ({ ...c, orientation: e.target.value as any })); setSaved(false) }} className="mt-1"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></Select></div>
                <div><Label className="text-[11px]">Margin atas (mm)</Label><Input type="number" value={pageConfig.margins.top} onChange={e => { setPageConfig(c => ({ ...c, margins: { ...c.margins, top: Number(e.target.value) } })); setSaved(false) }} className="h-8 text-[13px] mt-1" /></div>
                <div><Label className="text-[11px]">Margin kiri (mm)</Label><Input type="number" value={pageConfig.margins.left} onChange={e => { setPageConfig(c => ({ ...c, margins: { ...c.margins, left: Number(e.target.value) } })); setSaved(false) }} className="h-8 text-[13px] mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><Label className="text-[11px]">Margin kanan (mm)</Label><Input type="number" value={pageConfig.margins.right} onChange={e => { setPageConfig(c => ({ ...c, margins: { ...c.margins, right: Number(e.target.value) } })); setSaved(false) }} className="h-8 text-[13px] mt-1" /></div>
                <div><Label className="text-[11px]">Margin bawah (mm)</Label><Input type="number" value={pageConfig.margins.bottom} onChange={e => { setPageConfig(c => ({ ...c, margins: { ...c.margins, bottom: Number(e.target.value) } })); setSaved(false) }} className="h-8 text-[13px] mt-1" /></div>
                {pageConfig.paper === "Custom" && (
                  <>
                    <div><Label className="text-[11px]">Lebar custom (mm)</Label><Input type="number" value={pageConfig.customWidthMm ?? 210} onChange={e => setPageConfig(c => ({ ...c, customWidthMm: Number(e.target.value) }))} className="h-8 text-[13px] mt-1" /></div>
                    <div><Label className="text-[11px]">Tinggi custom (mm)</Label><Input type="number" value={pageConfig.customHeightMm ?? 297} onChange={e => setPageConfig(c => ({ ...c, customHeightMm: Number(e.target.value) }))} className="h-8 text-[13px] mt-1" /></div>
                  </>
                )}
                <div className="flex items-end gap-1 pb-0.5">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setPageConfig(c => ({ ...c, zoom: Math.max(50, c.zoom - 10) }))}><ZoomOut size={13} /></Button>
                  <span className="text-xs font-mono w-12 text-center font-bold">{pageConfig.zoom}%</span>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setPageConfig(c => ({ ...c, zoom: Math.min(200, c.zoom + 10) }))}><ZoomIn size={13} /></Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-[13px]">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={!pageConfig.isPageless} onChange={e => setPageConfig(c => ({ ...c, isPageless: !e.target.checked }))} className="rounded" /> Mode Pages (kertas)</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={pageConfig.showRuler ?? true} onChange={e => setPageConfig(c => ({ ...c, showRuler: e.target.checked }))} className="rounded" /> Tampilkan ruler</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><Label className="text-[11px]">Watermark (opsional)</Label><Input value={pageConfig.watermark?.text || ""} onChange={e => setPageConfig(c => ({ ...c, watermark: e.target.value ? { text: e.target.value, opacity: 0.08, rotation: -30 } : null }))} placeholder="CONFIDENTIAL / DRAFT" className="h-8 text-[13px] mt-1" /></div>
                <div><Label className="text-[11px]">Header HTML (opsional)</Label><Input value={pageConfig.headerHtml || ""} onChange={e => setPageConfig(c => ({ ...c, headerHtml: e.target.value }))} placeholder="<div>Kop surat</div>" className="h-8 text-[13px] font-mono mt-1" /></div>
              </div>
              <div><Label className="text-[11px]">Footer HTML (opsional)</Label><Input value={pageConfig.footerHtml || ""} onChange={e => setPageConfig(c => ({ ...c, footerHtml: e.target.value }))} placeholder="Footer • halaman" className="h-8 text-[13px] font-mono mt-1" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><Label className="text-[11px]">Nama template</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-[13px] mt-1" /></div>
                <div><Label className="text-[11px]">Deskripsi</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="h-8 text-[13px] mt-1" /></div>
              </div>
              <div className="rounded-[8px] bg-[#f6f5f4] border p-2.5 text-[11px] text-[#6b7280] flex gap-2"><Palette size={13} className="shrink-0 mt-0.5 text-[#0075de]" /> Tips: margin juga bisa digeser langsung dari ruler Word di atas dokumen — hasilnya tersimpan otomatis ke template ini.</div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-4 py-2.5 flex gap-2 justify-end rounded-b-[12px]">
              <Button variant="outline" size="sm" onClick={() => { setPageConfig({ ...DEFAULT_PAGE_CONFIG }); showToast("Pengaturan kertas direset", "info") }}>Reset</Button>
              <Button variant="outline" size="sm" onClick={() => setPagePopupOpen(false)}>Tutup</Button>
              <Button size="sm" className="bg-[#0075de] hover:bg-[#0063be]" onClick={() => { setPagePopupOpen(false); setSaved(false); showToast("Pengaturan kertas diterapkan", "success") }}><Check size={13} /> Terapkan</Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Browse Data picker ===== */}
      {browse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBrowse(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Database size={15} className="text-[#0075de]" />
              <div><div className="font-bold text-sm">Browse Data — {"{{"}{browse.field}{"}}"}</div><div className="text-[11px] text-[#6b7280]">Klik baris untuk isi otomatis semua field, atau klik sel untuk isi field ini saja</div></div>
              <button onClick={() => setBrowse(null)} className="ml-auto w-8 h-8 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={15} /></button>
            </div>
            <div className="px-4 py-2.5 border-b flex flex-wrap gap-2 bg-[#f9fafb]">
              <Select value={browse.table} onChange={e => loadBrowseRows(e.target.value, browse.search)} className="h-8 text-[13px] min-w-[200px]">
                <option value="">-- pilih tabel --</option>
                {globalTables.map((t: any) => <option key={t.name} value={t.name}>{t.displayName} ({t.name})</option>)}
              </Select>
              <div className="relative flex-1 min-w-[180px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                <Input value={browse.search} onChange={e => { const v = e.target.value; setBrowse(b => (b ? { ...b, search: v } : b)); }} onKeyDown={e => { if (e.key === "Enter") loadBrowseRows(browse.table, browse.search) }} placeholder="Cari… (Enter)" className="h-8 text-[13px] pl-8" />
              </div>
              <Button size="sm" variant="outline" className="h-8" onClick={() => loadBrowseRows(browse.table, browse.search)}>Cari</Button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {browse.loading && <div className="text-center text-xs text-[#9ca3af] py-8 animate-pulse">Memuat…</div>}
              {!browse.loading && browse.rows.length === 0 && <div className="text-center text-xs text-[#9ca3af] py-8 border border-dashed rounded">Tidak ada data. Pilih tabel lain atau kosongkan pencarian.</div>}
              {!browse.loading && browse.rows.length > 0 && (
                <div className="overflow-x-auto border rounded-[8px]">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-[#f6f5f4]">{browse.cols.map(c => <th key={c} className="text-left px-2 py-1.5 font-bold border-b whitespace-nowrap">{c}</th>)}<th className="px-2 py-1.5 border-b">Aksi</th></tr></thead>
                    <tbody>
                      {browse.rows.map((r: any) => (
                        <tr key={r.id} className="hover:bg-[#eff6ff]">
                          {browse.cols.map(c => (
                            <td key={c} onClick={() => pickBrowseRow(r, c)} className="px-2 py-1.5 border-b max-w-[160px] truncate cursor-pointer hover:text-[#0075de] hover:underline" title={`Isi ${browse.field} ← ${c}`}>{String(r[c] ?? "-")}</td>
                          ))}
                          <td className="px-2 py-1.5 border-b whitespace-nowrap"><Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={() => pickBrowseRow(r)}>Pakai baris</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
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
