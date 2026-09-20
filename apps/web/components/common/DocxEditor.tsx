"use client"
import { useEffect, useState, useRef } from "react"
import { EditorContent } from "@tiptap/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Sparkles, Eye, Download, Printer, Settings, Palette, Layers, Copy, Check, X, Maximize2, Ruler, ZoomIn, ZoomOut, Type, Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Table as TableIcon, Link2, Image as ImageIcon, Quote, Heading1, Heading2, Heading3, Minus, Eraser, MoveVertical, Grid3x3, Rows3, Trash, Combine, Split, PaintBucket, Brush, Columns3, Square, PanelLeft, PanelRight, Columns2, PanelTop, PanelBottom, Frame, MoveHorizontal, GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PAGE_FORMATS } from "@/lib/tiptap/docx"
import SpacingDropdown from "@/components/common/SpacingDropdown"
import TableToolbar from "@/components/common/TableToolbar"

type DocxEditorProps = {
  editor: any
  tick?: number
  // page settings
  pageSize: string
  setPageSize: (v: string) => void
  zoom: number
  setZoom: (v: number) => void
  showRuler: boolean
  setShowRuler: (v: boolean) => void
  // header/footer
  headerHtml?: string
  setHeaderHtml?: (v: string) => void
  footerHtml?: string
  setFooterHtml?: (v: string) => void
  // preview
  previewHtml?: string
  onExportDocx?: () => void
  onExportPdf?: () => void
  // existing toolbar helpers
  getHeadingLevel?: () => string
  isActive?: (name: any, attrs?: any) => boolean
  isAlignActive?: (align: string) => boolean
  can?: (cb: () => boolean) => boolean
  openLinkModal?: () => void
  openImageModal?: () => void
  // spacing etc already via SpacingDropdown
  editorHeight: number
  onGripMouseDown: (e: React.MouseEvent) => void
  // table ops
  showTableOps?: boolean
  // slot for custom left/right
  title?: string
  description?: string
  // font
  fontFamily?: string
  setFontFamily?: (v: string) => void
  fontSize?: string
  setFontSize?: (v: string) => void
}

const FONT_FAMILIES = [
  { label: "Default (Inter)", value: "" },
  { label: "Inter", value: "Inter" },
  { label: "Arimo", value: "Arimo" },
  { label: "Arial", value: "Arial" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Times New Roman", value: '"Times New Roman"' },
  { label: "Tinos", value: "Tinos" },
  { label: "Georgia", value: "Georgia" },
  { label: "Merriweather", value: "Merriweather" },
  { label: "Lora", value: "Lora" },
  { label: "Source Sans 3", value: '"Source Sans 3"' },
  { label: "Source Serif 4", value: '"Source Serif 4"' },
  { label: "Courier New", value: '"Courier New"' },
  { label: "JetBrains Mono", value: '"JetBrains Mono"' },
  { label: "Roboto Mono", value: '"Roboto Mono"' },
  { label: "Comic Neue", value: '"Comic Neue"' },
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

export default function DocxEditor({
  editor,
  tick,
  pageSize,
  setPageSize,
  zoom,
  setZoom,
  showRuler,
  setShowRuler,
  headerHtml,
  setHeaderHtml,
  footerHtml,
  setFooterHtml,
  previewHtml,
  onExportDocx,
  onExportPdf,
  getHeadingLevel,
  isActive,
  isAlignActive,
  can,
  openLinkModal,
  openImageModal,
  editorHeight,
  onGripMouseDown,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  title,
  description,
}: DocxEditorProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showHeaderEdit, setShowHeaderEdit] = useState(false)
  const [showFooterEdit, setShowFooterEdit] = useState(false)
  const [margins, setMargins] = useState({ top: 20, bottom: 20, left: 25, right: 25 })
  const [pageGap, setPageGap] = useState(20)
  const [background, setBackground] = useState("#ffffff")
  const [pageCount, setPageCount] = useState(1)
  const [cellBg, setCellBg] = useState('#ffffff')
  const [borderColor, setBorderColor] = useState('#e6e6e6')
  const [borderWidth, setBorderWidth] = useState('1px')
  const [borderStyle, setBorderStyle] = useState('solid')
  const [cellHeight, setCellHeight] = useState('')
  const [rowHeight, setRowHeight] = useState('')
  const [tableOpsCollapsed, setTableOpsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'main'|'table'>('main')
  const paperRef = useRef<HTMLDivElement>(null)
  const [headerDraft, setHeaderDraft] = useState(headerHtml || "")
  const [footerDraft, setFooterDraft] = useState(footerHtml || "")
  const isActiveFn = isActive || (() => false)
  const isAlignActiveFn = isAlignActive || (() => false)
  const canFn = can || (() => true)
  const getHeadingLevelFn = getHeadingLevel || (() => "p")

  useEffect(() => {
    setHeaderDraft(headerHtml || "")
    setFooterDraft(footerHtml || "")
  }, [headerHtml, footerHtml])

  // estimate page count from editor content height
  useEffect(() => {
    if (!editor) return
    const el = document.querySelector('.tiptap') as HTMLElement | null
    if (!el) return
    const pageH = PAGE_FORMATS[pageSize]?.height || 1123
    const usable = pageH - margins.top * 3.78 - margins.bottom * 3.78 // mm to px approx 3.78
    const h = el.scrollHeight || 600
    const cnt = Math.max(1, Math.ceil(h / Math.max(400, usable)))
    setPageCount(cnt)
  }, [pageSize, margins, editorHeight])
  // pageCount via ResizeObserver (see Component)

  const format = PAGE_FORMATS[pageSize] || PAGE_FORMATS.A4

  const toolbarFontFamily = fontFamily || ""
  const toolbarFontSize = fontSize || ""

  // Table ops helpers (keep existing functionality)
  const applyBorderPreset = (preset: string) => {
    if (!editor) return
    editor.chain().focus().setCellAttribute('borderColor', borderColor).setCellAttribute('borderWidth', borderWidth).setCellAttribute('borderStyle', borderStyle).run()
    if (preset === 'outer') { applyOuterBorder(); return }
    if (preset === 'all') { editor.chain().focus().setCellAttribute('borderPosition', null).run(); return }
    editor.chain().focus().setCellAttribute('borderPosition', preset).run()
  }
  const applyOuterBorder = () => {
    if (!editor) return
    try {
      const domTable = editor.view.dom.querySelector('table')
      if (!domTable) { editor.chain().focus().setCellAttribute('borderPosition', null).run(); return }
      const domRows = domTable.querySelectorAll('tr')
      const rowCount = domRows.length
      if (rowCount === 0) return
      const firstRowCells = domRows[0].querySelectorAll('td, th').length
      const isSingleRow = rowCount === 1
      const isSingleCol = firstRowCells === 1
      const { state } = editor.view
      let tr2 = state.tr
      let any = false
      domRows.forEach((trEl: any, ri: any) => {
        const cells = trEl.querySelectorAll('td, th')
        const colCount = cells.length
        cells.forEach((cellEl: any, ci: any) => {
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
      if (any) editor.view.dispatch(tr2)
    } catch {}
  }
  const applyCellHeight = () => {
    if (!editor) return
    const h = cellHeight.trim()
    if (!h) { editor.chain().focus().setCellAttribute('height', null).run(); return }
    const val = /^\d+$/.test(h) ? `${h}px` : h
    editor.chain().focus().setCellAttribute('height', val).run()
  }
  const applyRowHeight = () => {
    if (!editor) return
    const h = rowHeight.trim()
    if (!h) { try { (editor.chain().focus() as any).updateAttributes('tableRow', { height: null }).run() } catch {} editor.chain().focus().setCellAttribute('height', null).run(); return }
    const val = /^\d+$/.test(h) ? `${h}px` : h
    try { (editor.chain().focus() as any).updateAttributes('tableRow', { height: val }).run() } catch { editor.chain().focus().setCellAttribute('height', val).run() }
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
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'row-resize'
  }

  return (
    <div className="w-full">
      {/* Toolbar Word-like */}
      <div className="sticky top-0 z-20 bg-white border border-[#e6e6e6] rounded-t-[12px] overflow-hidden">
        <div className="bg-[#f9fafb] border-b border-[#e6e6e6] px-3 py-2 flex flex-wrap items-center gap-1.5">
          {/* History */}
          <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <span className="hidden xl:flex items-center px-2 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Riwayat</span>
            <button type="button" title="Undo (Ctrl+Z)" onClick={() => editor?.chain().focus().undo().run()} disabled={!canFn(() => editor?.can().chain().focus().undo().run())} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg></button>
            <button type="button" title="Redo (Ctrl+Y)" onClick={() => editor?.chain().focus().redo().run()} disabled={!canFn(() => editor?.can().chain().focus().redo().run())} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg></button>
          </div>

          {/* Format */}
          <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <span className="hidden xl:flex items-center px-1 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Format</span>
            <button type="button" title="Bold (Ctrl+B)" onClick={() => editor?.chain().focus().toggleBold().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isActiveFn('bold') ? 'bg-[#111827] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Bold size={14} /></button>
            <button type="button" title="Italic (Ctrl+I)" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isActiveFn('italic') ? 'bg-[#111827] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Italic size={14} /></button>
            <button type="button" title="Underline (Ctrl+U)" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isActiveFn('underline') ? 'bg-[#111827] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><UnderlineIcon size={14} /></button>
            <button type="button" title="Strikethrough" onClick={() => editor?.chain().focus().toggleStrike().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isActiveFn('strike') ? 'bg-[#111827] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Strikethrough size={14} /></button>
            <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center" />
            <button type="button" title="Clear formatting" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} className="w-8 h-8 rounded-[8px] hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center text-[#6b7280]"><Eraser size={14} /></button>
          </div>

          {/* Font Family & Size */}
          <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] items-center">
            <span className="hidden xl:flex items-center px-1 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Font</span>
            <select value={toolbarFontFamily} onChange={e => { const v = e.target.value; setFontFamily?.(v); if (v) (editor?.chain().focus() as any).setFontFamily(v).run(); else (editor?.chain().focus() as any).unsetFontFamily().run() }} className="h-8 text-xs border-0 bg-transparent pr-1 cursor-pointer max-w-[110px]" title="Font Family">
              {FONT_FAMILIES.map(f => <option key={f.label} value={f.value} style={{ fontFamily: f.value || undefined }}>{f.label}</option>)}
            </select>
            <div className="w-px h-6 bg-[#e6e6e6] mx-1" />
            <select value={toolbarFontSize} onChange={e => { const v = e.target.value; setFontSize?.(v); if (v) (editor?.chain().focus() as any).setFontSize(v).run(); else (editor?.chain().focus() as any).unsetFontSize().run() }} className="h-8 text-xs border-0 bg-transparent pr-1 cursor-pointer w-[68px]" title="Font Size">
              {FONT_SIZES.map(f => <option key={f.label} value={f.value}>{f.label}{f.value ? ` (${f.value})` : ''}</option>)}
            </select>
          </div>

          {/* Headings */}
          <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] items-center">
            <div className="hidden lg:flex items-center gap-1.5 px-2 border-r border-[#e6e6e6] mr-1">
              <Type size={12} className="text-[#6b7280]" />
              <select value={getHeadingLevelFn()} onChange={e => { const v = e.target.value; if (v === 'p') editor?.chain().focus().setParagraph().run(); else editor?.chain().focus().toggleHeading({ level: Number(v) as any }).run() }} className="h-8 text-xs font-medium border-0 bg-transparent pr-2 cursor-pointer">
                <option value="p">Paragraf</option><option value="1">Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">H4</option><option value="5">H5</option><option value="6">H6</option>
              </select>
            </div>
            <button type="button" title="Heading 1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`hidden sm:flex px-2 h-8 rounded-[8px] items-center justify-center gap-0.5 text-[11px] font-bold ${isActiveFn('heading', { level: 1 }) ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading1 size={12} /> H1</button>
            <button type="button" title="Heading 2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`hidden sm:flex px-2 h-8 rounded-[8px] items-center justify-center gap-0.5 text-[11px] font-bold ${isActiveFn('heading', { level: 2 }) ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading2 size={12} /> H2</button>
            <button type="button" title="Heading 3" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`hidden md:flex px-2 h-8 rounded-[8px] items-center justify-center gap-0.5 text-[11px] font-bold ${isActiveFn('heading', { level: 3 }) ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading3 size={12} /> H3</button>
            <button type="button" title="Blockquote" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isActiveFn('blockquote') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Quote size={14} /></button>
          </div>

          {/* Align */}
          <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <button type="button" title="Align left" onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isAlignActiveFn('left') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignLeft size={14} /></button>
            <button type="button" title="Align center" onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isAlignActiveFn('center') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignCenter size={14} /></button>
            <button type="button" title="Align right" onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isAlignActiveFn('right') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignRight size={14} /></button>
            <button type="button" title="Justify" onClick={() => editor?.chain().focus().setTextAlign('justify').run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isAlignActiveFn('justify') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignJustify size={14} /></button>
          </div>

          {/* List */}
          <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <button type="button" title="Bullet list" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isActiveFn('bulletList') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><List size={14} /></button>
            <button type="button" title="Ordered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isActiveFn('orderedList') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><ListOrdered size={14} /></button>
          </div>

          {/* Spacing */}
          <SpacingDropdown editor={editor} tick={tick} />

          {/* Table/Link/Image etc */}
          <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <button type="button" title="Insert table 3x3" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#374151]"><TableIcon size={14} /></button>
            <button type="button" title="Atur link" onClick={() => openLinkModal?.()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${isActiveFn('link') ? 'bg-[#0075de] text-white' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Link2 size={14} /></button>
            <button type="button" title="Sisipkan gambar" onClick={() => openImageModal?.()} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#374151]"><ImageIcon size={14} /></button>
            <button type="button" title="Sisipkan batas halaman (Page Break)" onClick={() => (editor?.chain().focus() as any).setPageBreak().run()} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><span className="text-[11px] font-mono">↵</span></button>
            <button type="button" title="Footnote" onClick={() => (editor?.chain().focus() as any).insertContent({ type: 'footnote', attrs: { content: 'Catatan kaki' } }).run()} className="w-8 h-8 rounded-[8px] hover:bg-amber-50 flex items-center justify-center text-amber-600"><span className="text-[11px]">¹</span></button>
          </div>

          {/* PageSize/Ruler/Zoom */}
          <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ml-auto">
            <select value={pageSize} onChange={e => setPageSize(e.target.value)} className="h-8 text-xs border-0 bg-transparent pr-1 cursor-pointer"><option value="A4">A4</option><option value="Letter">Letter</option><option value="A5">A5</option><option value="A3">A3</option></select>
            <span className="w-px h-4 bg-[#e6e6e6] mx-1 self-center" />
            <button onClick={() => setShowRuler(!showRuler)} className={`px-2 h-7 rounded text-xs flex items-center gap-1 ${showRuler ? "bg-[#0075de] text-white" : "hover:bg-[#f6f5f4] text-[#6b7280]"}`}><Ruler size={12} /> Ruler</button>
            <span className="w-px h-4 bg-[#e6e6e6] mx-1 self-center" />
            <button onClick={() => setZoom(Math.max(40, zoom - 10))} className="w-7 h-8 rounded hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><ZoomOut size={12} /></button>
            <span className="text-xs font-mono w-10 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="w-7 h-8 rounded hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><ZoomIn size={12} /></button>
            <button onClick={() => setZoom(100)} className="px-1.5 h-8 rounded hover:bg-[#f6f5f4] text-[11px] text-[#6b7280]"><Maximize2 size={12} /></button>
            <button onClick={() => setShowSettings(!showSettings)} className={`w-7 h-7 rounded flex items-center justify-center ${showSettings ? 'bg-[#111827] text-white' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`} title="Document settings"><Settings size={14} /></button>
          </div>
        </div>

        {/* Hint bar */}
        <div className="px-3 py-1.5 bg-[#f6f5f4]/70 border-t border-[#e6e6e6]/60 flex items-center gap-2 text-[11px] text-[#6b7280]">
          <Sparkles size={11} className="text-[#0075de] shrink-0" />
          <span className="hidden sm:inline">Heading H1–H6, tabel pagination-safe, header/footer, footnotes, page breaks — klik kanan untuk binding, double-click header/footer untuk edit</span>
        </div>
      </div>
      {/* Tabs Dokumen / Tabel */}
      <div className="flex items-center gap-1 bg-[#f6f5f4] px-2 py-1.5 border border-[#e6e6e6] border-t-0 rounded-b-[12px] mb-2 mx-0">
        <button type="button" onClick={()=>setActiveTab('main')} className={`px-3 py-1.5 rounded-[8px] text-xs font-medium flex items-center gap-1.5 transition-colors ${activeTab==='main' ? 'bg-white shadow border border-[#e6e6e6] text-[#0075de]' : 'text-[#6b7280] hover:text-[#111] hover:bg-white'}`}>
          <FileText size={12}/> Dokumen
        </button>
        {editor?.isActive('table') && (
          <button type="button" onClick={()=>setActiveTab('table')} className={`px-3 py-1.5 rounded-[8px] text-xs font-medium flex items-center gap-1.5 transition-colors ${activeTab==='table' ? 'bg-[#0075de] text-white shadow' : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'}`}>
            <Grid3x3 size={12}/> Tabel <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">AKTIF</span>
          </button>
        )}
        <span className="ml-auto text-[11px] text-[#9ca3af] hidden sm:flex">Tabel operasi di tab Tabel</span>
      </div>
      {activeTab === 'table' && editor?.isActive('table') && (
        <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-2 mb-4 shadow-sm">
          <TableToolbar editor={editor} cellBg={cellBg} setCellBg={setCellBg} borderColor={borderColor} setBorderColor={setBorderColor} borderWidth={borderWidth} setBorderWidth={setBorderWidth} borderStyle={borderStyle} setBorderStyle={setBorderStyle} cellHeight={cellHeight} setCellHeight={setCellHeight} rowHeight={rowHeight} setRowHeight={setRowHeight} applyBorderPreset={applyBorderPreset} applyCellHeight={applyCellHeight} applyRowHeight={applyRowHeight} handleRowDragMouseDown={typeof handleRowDragMouseDown !== 'undefined' ? handleRowDragMouseDown : undefined} />
        </div>
      )}

      {/* Ruler */}
      {showRuler && (
        <div className="bg-[#f3f4f6] border-x border-b border-[#e6e6e6] h-6 flex items-center px-4 overflow-hidden select-none">
          <div className="flex-1 flex items-end h-full max-w-[794px] mx-auto relative">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <span className="text-[7px] text-[#9ca3af] font-mono">{i}</span>
                <div className="w-px h-2 bg-[#d1d5db] mt-0.5" />
                <div className="flex gap-px mt-0.5">
                  {Array.from({ length: 4 }).map((__, j) => <div key={j} className={`w-px ${j === 2 ? "h-1.5 bg-[#9ca3af]" : "h-1 bg-[#e5e7eb]"}`} />)}
                </div>
              </div>
            ))}
            <div className="absolute left-0 right-0 top-0 h-px bg-[#0075de]/30" />
          </div>
        </div>
      )}

      {/* Document Settings Sidebar (collapsible) */}
      {showSettings && (
        <div className="border border-[#e6e6e6] rounded-b-[12px] bg-white p-4 grid md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <div className="text-xs font-bold flex items-center gap-1.5"><Settings size={12} className="text-[#0075de]" /> Page Format</div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[11px]">Page size</Label><Select value={pageSize} onChange={e => setPageSize(e.target.value)}><option value="A4">A4</option><option value="A5">A5</option><option value="A3">A3</option><option value="Letter">Letter</option><option value="Legal">Legal</option></Select></div>
              <div><Label className="text-[11px]">Orientation</Label><Select value="portrait" onChange={() => {}}><option>Portrait</option><option>Landscape</option></Select></div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div><Label className="text-[11px]">Top</Label><Input value={margins.top} onChange={e => setMargins({ ...margins, top: Number(e.target.value) || 0 })} className="h-7 text-xs" type="number" /></div>
              <div><Label className="text-[11px]">Bottom</Label><Input value={margins.bottom} onChange={e => setMargins({ ...margins, bottom: Number(e.target.value) || 0 })} className="h-7 text-xs" type="number" /></div>
              <div><Label className="text-[11px]">Left</Label><Input value={margins.left} onChange={e => setMargins({ ...margins, left: Number(e.target.value) || 0 })} className="h-7 text-xs" type="number" /></div>
              <div><Label className="text-[11px]">Right</Label><Input value={margins.right} onChange={e => setMargins({ ...margins, right: Number(e.target.value) || 0 })} className="h-7 text-xs" type="number" /></div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1"><Label className="text-[11px]">Page gap (px)</Label><Input value={pageGap} onChange={e => setPageGap(Number(e.target.value) || 20)} className="h-7 text-xs" /></div>
              <div className="flex-1"><Label className="text-[11px]">Background</Label><div className="flex gap-1 mt-1"><input type="color" value={background} onChange={e => setBackground(e.target.value)} className="w-7 h-7 rounded" /><span className="text-[11px] font-mono">{background}</span></div></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-bold flex items-center gap-1.5"><FileText size={12} className="text-[#0075de]" /> Header & Footer</div>
            <div><Label className="text-[11px]">Header (double-click page header to edit)</Label><Textarea value={headerHtml || ""} onChange={e => setHeaderHtml?.(e.target.value)} placeholder="Header HTML — gunakan {page} {total}" className="min-h-[60px] text-xs font-mono" /></div>
            <div><Label className="text-[11px]">Footer</Label><Textarea value={footerHtml || ""} onChange={e => setFooterHtml?.(e.target.value)} placeholder="Footer HTML — {page} of {total}" className="min-h-[60px] text-xs font-mono" /></div>
            <div className="flex gap-1 flex-wrap">
              <Badge variant="secondary" className="text-[11px]">Different first page</Badge><Badge variant="secondary" className="text-[11px]">Odd/even</Badge><Badge variant="secondary" className="text-[11px]">{pageCount} pages</Badge>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-bold flex items-center gap-1.5"><Layers size={12} className="text-[#0075de]" /> Export & Collaboration</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onExportDocx}><Download size={14} /> Export DOCX</Button>
              <Button size="sm" variant="outline" onClick={onExportPdf}><FileText size={14} /> Export PDF</Button>
            </div>
            <div className="text-[11px] text-[#6b7280]">Collaboration: presence (mock) — header/footer/footnotes ikut sync. Dark/light ready.</div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(editor?.getHTML() || "")}><Copy size={12} /> Copy HTML</Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer size={12} /> Print</Button>
            </div>
          </div>
        </div>
      )}

      {/* Paper paginated area */}
      <div className="bg-[#e8ecef] p-4 md:p-6 flex flex-col items-center gap-6 overflow-auto" style={{ background, minHeight: 520 }}>
        {/* Pages */}
        {Array.from({ length: pageCount }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white shadow-[0_2px_16px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.08)] flex flex-col relative"
            style={{
              width: format.width,
              minHeight: format.height - 40,
              paddingTop: margins.top * 3.78,
              paddingBottom: margins.bottom * 3.78,
              paddingLeft: margins.left * 3.78,
              paddingRight: margins.right * 3.78,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              marginBottom: pageGap,
            }}
          >
            {/* Header overlay */}
            <div onDoubleClick={() => setShowHeaderEdit(true)} className="absolute top-0 left-0 right-0 h-[40px] border-b border-dashed border-[#0075de]/20 bg-[#0075de]/[0.02] flex items-center justify-between px-4 text-[10px] text-[#0075de] cursor-pointer hover:bg-[#0075de]/10">
              <span className="font-mono flex items-center gap-1"><FileText size={10} /> HEADER {idx === 0 ? "(First)" : ""} — double-click to edit</span>
              <span className="font-mono">{headerHtml ? <span dangerouslySetInnerHTML={{ __html: headerHtml.replace("{page}", String(idx + 1)).replace("{total}", String(pageCount)) }} /> : <span className="text-[#9ca3af]">Header kosong</span>}</span>
            </div>
            {/* Page number top */}
            <div className="absolute -top-6 left-0 right-0 flex justify-center">
              <span className="bg-white border border-[#e6e6e6] rounded-full px-2 py-0.5 text-[10px] font-mono text-[#6b7280] shadow-sm">Page {idx + 1} of {pageCount}</span>
            </div>
            {/* Content: only first page holds editor, other pages are preview clones */}
            <div className="flex-1 pt-10 pb-10">
              {idx === 0 ? (
                <EditorContent editor={editor} className="min-h-[400px] [&_.tiptap]:min-h-[360px] [&_.tiptap]:p-2" />
              ) : (
                <div className="tiptap prose prose-sm max-w-none p-2 text-[14px] text-[#111827] opacity-60">
                  <div className="border-2 border-dashed border-[#e6e6e6] rounded-[8px] p-6 text-center text-[#9ca3af] text-xs">
                    Page {idx + 1} — overflow dari page 1 (pagination visual). Konten panjang akan otomatis mengalir. Sisipkan <code className="bg-white border px-1 rounded">Page Break</code> untuk paksa pindah halaman.
                  </div>
                </div>
              )}
            </div>
            {/* Footer overlay */}
            <div onDoubleClick={() => setShowFooterEdit(true)} className="absolute bottom-0 left-0 right-0 h-[36px] border-t border-dashed border-emerald-200 bg-emerald-50/50 flex items-center justify-between px-4 text-[10px] text-emerald-700 cursor-pointer hover:bg-emerald-50">
              <span className="font-mono flex items-center gap-1"><Layers size={10} /> FOOTER — double-click</span>
              <span className="font-mono">{footerHtml ? <span dangerouslySetInnerHTML={{ __html: footerHtml.replace("{page}", String(idx + 1)).replace("{total}", String(pageCount)) }} /> : <span className="text-[#9ca3af]">Footer kosong</span>}</span>
            </div>
            {/* Footnote area */}
            <div className="absolute bottom-[36px] left-0 right-0 h-6 border-t border-amber-200 bg-amber-50/30 flex items-center px-4 text-[10px] text-amber-700">
              Footnotes — area di atas footer (auto-number)
            </div>
          </div>
        ))}
      </div>

      {/* Table Ops — keep all existing table functionality (border 7 presets, height, row/col) */}
      {editor && editor.isActive('table') && (
        <div className="border-t border-x border-[#e6e6e6] bg-gradient-to-b from-white to-[#fcfcfc]">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e6e6e6]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#0075de] text-white flex items-center justify-center shadow-sm"><Grid3x3 size={16} /></div>
              <div><div className="text-[13px] font-bold text-[#111] flex items-center gap-2">Operasi Tabel <span className="px-2 py-0.5 rounded-full bg-[#eff6ff] border border-[#dbeafe] text-[#0075de] text-[10px] font-bold">AKTIF</span></div><div className="text-[11px] text-[#6b7280]">Atur baris, kolom, gabung cell, border & ukuran</div></div>
            </div>
            <button type="button" onClick={() => setTableOpsCollapsed(!tableOpsCollapsed)} className="w-8 h-8 rounded-full bg-white border border-[#e6e6e6] hover:bg-[#f6f5f4] flex items-center justify-center">{tableOpsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button>
          </div>
          {!tableOpsCollapsed && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-[8px] bg-[#eff6ff] border border-[#dbeafe] text-[#0075de] flex items-center justify-center"><Rows3 size={13} /></div><span className="text-xs font-bold text-[#111]">Baris</span></div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="h-8 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center justify-center gap-1">+ Sebelum</button>
                    <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="h-8 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center justify-center gap-1">+ Sesudah</button>
                    <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="h-8 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-[8px] hover:bg-red-100 flex items-center justify-center gap-1"><Trash size={11} /> Hapus</button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#374151] flex items-center gap-1"><MoveVertical size={11} /> Tinggi Baris</span>
                    <input value={rowHeight} onChange={e => setRowHeight(e.target.value)} placeholder="48px" className="flex-1 h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-2 bg-white" />
                    <button type="button" onClick={applyRowHeight} className="h-7 px-3 text-xs font-medium bg-[#111827] text-white rounded-[6px] hover:bg-black">Set</button>
                    <button type="button" onMouseDown={handleRowDragMouseDown} className="h-7 w-7 rounded-[6px] border border-[#e6e6e6] bg-white hover:bg-[#f6f5f4] flex items-center justify-center cursor-row-resize" title="Drag untuk ubah tinggi baris"><GripVertical size={12} /></button>
                  </div>
                </div>
                <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-[8px] bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center"><Columns3 size={13} /></div><span className="text-xs font-bold text-[#111]">Kolom</span></div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="h-8 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center justify-center gap-1">+ Kiri</button>
                    <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="h-8 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center justify-center gap-1">+ Kanan</button>
                    <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="h-8 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-[8px] hover:bg-red-100 flex items-center justify-center gap-1"><Trash size={11} /> Hapus</button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center gap-1.5 text-[11px] text-[#6b7280]"><MoveHorizontal size={11} className="text-[#0075de]" /> Drag handle di tepi kolom (biru, cursor col-resize) untuk ubah lebar</div>
                </div>
              </div>
              <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-[8px] bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center"><Layers size={13} /></div><span className="text-xs font-bold text-[#111]">Aksi Tabel</span><button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="ml-auto h-7 px-3 text-xs font-medium bg-red-600 text-white rounded-[8px] hover:bg-red-700 flex items-center gap-1.5"><Trash size={12} /> Hapus Tabel</button></div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => editor.chain().focus().mergeCells().run()} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center gap-1.5"><Combine size={12} /> Gabung Cell</button>
                  <button type="button" onClick={() => editor.chain().focus().splitCell().run()} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center gap-1.5"><Split size={12} /> Pecah Cell</button>
                  <button type="button" onClick={() => { try { (editor.chain().focus() as any).selectParentNode().run(); (editor.chain().focus() as any).selectParentNode().run() } catch {} }} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Pilih Tabel</button>
                  <div className="w-px h-6 bg-[#e6e6e6] self-center mx-1" />
                  <button type="button" onClick={() => editor.chain().focus().toggleHeaderRow().run()} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Header Baris</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeaderColumn().run()} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Header Kolom</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeaderCell().run()} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Header Cell</button>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)] space-y-3">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-[8px] bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center"><Brush size={13} /></div><span className="text-xs font-bold text-[#111]">Gaya Cell</span></div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 border border-[#e6e6e6] rounded-[8px] px-2 py-1.5 bg-[#f9fafb] flex-1">
                      <PaintBucket size={12} className="text-[#6b7280] shrink-0" /><span className="text-[11px] font-medium">BG</span>
                      <input type="color" value={cellBg} onChange={e => setCellBg(e.target.value)} className="w-7 h-7 p-0 border-0 rounded-[6px] overflow-hidden cursor-pointer" />
                      <button type="button" onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', cellBg).run()} className="ml-auto h-6 px-2.5 text-xs font-medium bg-[#0075de] text-white rounded-[6px] hover:bg-[#0063be]">Terapkan</button>
                      <button type="button" onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', null).run()} className="h-6 px-2 text-xs border border-[#e6e6e6] rounded-[6px] bg-white hover:bg-[#f6f5f4]">Hapus</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select onChange={e => { const v = e.target.value; if (v) editor.chain().focus().setCellAttribute('verticalAlign', v).run() }} defaultValue="" className="h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white"><option value="" disabled>Align Vertical</option><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select>
                    <div className="flex gap-1"><input value={cellHeight} onChange={e => setCellHeight(e.target.value)} placeholder="Tinggi cell 40px" className="flex-1 h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white" /><button type="button" onClick={applyCellHeight} className="h-8 px-3 text-xs font-medium bg-[#111827] text-white rounded-[8px] hover:bg-black">Set</button></div>
                  </div>
                </div>
                <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)] space-y-3">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-[8px] bg-[#f5f3ff] border border-violet-100 text-violet-600 flex items-center justify-center"><Palette size={13} /></div><span className="text-xs font-bold text-[#111]">Border Cell</span><span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">7 posisi</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-1.5 border border-[#e6e6e6] rounded-[8px] px-2 py-1.5 bg-white"><Grid3x3 size={12} className="text-[#6b7280] shrink-0" /><input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-6 h-6 p-0 border-0 rounded-[6px] cursor-pointer" /></div>
                    <select value={borderWidth} onChange={e => setBorderWidth(e.target.value)} className="h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white"><option value="1px">1px</option><option value="2px">2px</option><option value="3px">3px</option><option value="4px">4px</option></select>
                    <select value={borderStyle} onChange={e => setBorderStyle(e.target.value)} className="h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option><option value="hidden">Hidden</option></select>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {[
                      { id: 'none', label: 'Tanpa', icon: Square }, { id: 'left', label: 'Kiri', icon: PanelLeft }, { id: 'right', label: 'Kanan', icon: PanelRight }, { id: 'leftRight', label: 'Kiri+Kanan', icon: Columns2 },
                      { id: 'top', label: 'Atas', icon: PanelTop }, { id: 'bottom', label: 'Bawah', icon: PanelBottom }, { id: 'outer', label: 'Luar', icon: Frame },
                    ].map(p => (
                      <button key={p.id} type="button" onClick={() => applyBorderPreset(p.id)} className="flex flex-col items-center gap-1 p-2 rounded-[10px] border border-[#e6e6e6] bg-white hover:border-[#0075de] hover:bg-[#eff6ff] hover:text-[#0075de] group transition-colors">
                        <p.icon size={16} className="text-[#6b7280] group-hover:text-[#0075de]" /><span className="text-[10px] font-semibold leading-none">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => applyBorderPreset('all')} className="flex-1 h-8 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-[#f9fafb] hover:bg-white flex items-center justify-center gap-1"><Grid3x3 size={12} /> Semua sisi</button>
                    <button type="button" onClick={() => applyBorderPreset('none')} className="h-7 px-3 text-xs border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200">Hapus Border</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header/Footer edit modals */}
      {showHeaderEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHeaderEdit(false)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-lg shadow-xl p-5 border border-[#e6e6e6]">
            <div className="font-bold text-sm mb-3 flex items-center gap-2"><FileText size={14} className="text-[#0075de]" /> Edit Header</div>
            <Textarea value={headerDraft} onChange={e => setHeaderDraft(e.target.value)} placeholder="Header HTML — gunakan {page} {total}" className="min-h-[100px] font-mono text-xs" />
            <div className="flex justify-end gap-2 mt-3"><Button variant="outline" size="sm" onClick={() => setShowHeaderEdit(false)}>Batal</Button><Button size="sm" onClick={() => { setHeaderHtml?.(headerDraft); setShowHeaderEdit(false) }}><Check size={14} /> Simpan</Button></div>
          </div>
        </div>
      )}
      {showFooterEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFooterEdit(false)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-lg shadow-xl p-5 border border-[#e6e6e6]">
            <div className="font-bold text-sm mb-3 flex items-center gap-2"><Layers size={14} className="text-emerald-600" /> Edit Footer</div>
            <Textarea value={footerDraft} onChange={e => setFooterDraft(e.target.value)} placeholder="Footer HTML — {page} of {total}" className="min-h-[100px] font-mono text-xs" />
            <div className="flex justify-end gap-2 mt-3"><Button variant="outline" size="sm" onClick={() => setShowFooterEdit(false)}>Batal</Button><Button size="sm" onClick={() => { setFooterHtml?.(footerDraft); setShowFooterEdit(false) }}><Check size={14} /> Simpan</Button></div>
          </div>
        </div>
      )}

      {/* Grip & Page info */}
      <div className="h-7 bg-[#f9fafb] border border-[#e6e6e6] rounded-b-[12px] flex items-center justify-between px-4 text-[11px] text-[#6b7280]">
        <span className="flex items-center gap-1.5"><MoveVertical size={12} /> Drag bawah untuk perbesar • {pageCount} pages • {format.label}</span>
        <span className="flex items-center gap-2">
          <span className="hidden sm:inline">{pageSize} • {zoom}%</span>
          <span className="w-px h-3 bg-[#e6e6e6] hidden sm:block" />
          <span className="flex items-center gap-1 cursor-pointer" onMouseDown={onGripMouseDown}><Maximize2 size={11} /> Grip</span>
        </span>
      </div>

      {/* Live preview toggle */}
      {previewHtml && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Eye size={14} className="text-[#0075de]" /> Live Word Preview (Conversion)</CardTitle>
            <div className="text-[11px] text-[#6b7280]">Side-by-side PDF preview — refresh on demand, DOCX/PDF export via Conversion API (mock)</div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-[12px] bg-white overflow-hidden shadow-sm">
              <div className="h-8 bg-[#f6f5f4] border-b flex items-center px-3 gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="ml-2 text-[11px] text-[#6b7280] font-mono">preview — paginated</span>
              </div>
              <div className="p-4 max-h-[520px] overflow-auto bg-[#e5e7eb]"><div className="bg-white shadow-lg rounded-[4px] p-6 min-h-[300px] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} /></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
