"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
import { TextStyle } from "@tiptap/extension-text-style"
import FontFamily from "@tiptap/extension-font-family"
import { SpacingExtension } from "@/lib/tiptap/spacing"
import SpacingDropdown from "@/components/common/SpacingDropdown"
import TableToolbar from "@/components/common/TableToolbar"
import { Node, mergeAttributes, Extension } from "@tiptap/core"
import { PageBreak, Footnote, HeaderNode, FooterNode, PAGE_FORMATS } from "@/lib/tiptap/docx"
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table as TableIcon, Link2, Image as ImageIcon, Undo, Redo, Quote, Heading1, Heading2, Heading3,
  Minus, Eraser, X, Plus, Sparkles, Eye, Boxes, Trash2, Copy, Info, FileText, Settings2, LayoutTemplate, MousePointer2,
  Palette, Pipette, Rows3, Columns3, Trash, Combine, Split, ArrowUp, ArrowDown, MinusSquare, PaintBucket, Grid3x3, Type, Highlighter,
  Square, PanelLeft, PanelRight, Columns2, PanelTop, PanelBottom, Frame, Maximize2, MoveVertical, MoveHorizontal, GripVertical, ChevronDown, ChevronUp, SlidersHorizontal, Brush, Layers, Ruler, ZoomIn, ZoomOut, Download, Settings, Check
} from "lucide-react"
import PasteChoicePopup from "@/components/common/PasteChoicePopup"
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

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: any) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ commands }: any) => {
        return commands.setMark('textStyle', { fontSize })
      },
      unsetFontSize: () => ({ commands }: any) => {
        return commands.setMark('textStyle', { fontSize: null }).removeEmptyTextStyle()
      },
    } as any
  },
})

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

// Helpers for border position rendering
function buildBorderPositionStyle(attrs: any): string {
  const pos = attrs.borderPosition
  if (!pos || pos === 'all') return ''
  const color = attrs.borderColor || '#e6e6e6'
  const width = attrs.borderWidth || '1px'
  const style = attrs.borderStyle || 'solid'
  const bw = `${width} ${style} ${color}`
  // For collapsed tables, hiding a side = border-style hidden/none for that side
  switch (pos) {
    case 'none': return 'border: none !important; border-style: hidden !important'
    case 'left': return `border-left: ${bw}; border-top: none !important; border-right: none !important; border-bottom: none !important`
    case 'right': return `border-right: ${bw}; border-top: none !important; border-left: none !important; border-bottom: none !important`
    case 'leftRight': return `border-left: ${bw}; border-right: ${bw}; border-top: none !important; border-bottom: none !important`
    case 'top': return `border-top: ${bw}; border-left: none !important; border-right: none !important; border-bottom: none !important`
    case 'bottom': return `border-bottom: ${bw}; border-top: none !important; border-left: none !important; border-right: none !important`
    case 'topBottom': return `border-top: ${bw}; border-bottom: ${bw}; border-left: none !important; border-right: none !important`
    case 'topLeft': return `border-top: ${bw}; border-left: ${bw}; border-right: none !important; border-bottom: none !important`
    case 'topRight': return `border-top: ${bw}; border-right: ${bw}; border-left: none !important; border-bottom: none !important`
    case 'bottomLeft': return `border-bottom: ${bw}; border-left: ${bw}; border-top: none !important; border-right: none !important`
    case 'bottomRight': return `border-bottom: ${bw}; border-right: ${bw}; border-top: none !important; border-left: none !important`
    case 'leftTopBottom': return `border-left: ${bw}; border-top: ${bw}; border-bottom: ${bw}; border-right: none !important`
    case 'rightTopBottom': return `border-right: ${bw}; border-top: ${bw}; border-bottom: ${bw}; border-left: none !important`
    case 'leftRightTop': return `border-left: ${bw}; border-right: ${bw}; border-top: ${bw}; border-bottom: none !important`
    case 'leftRightBottom': return `border-left: ${bw}; border-right: ${bw}; border-bottom: ${bw}; border-top: none !important`
    case 'outer': return `border: ${bw}` // outer handled via per-cell edge logic; fallback is all
    default: return ''
  }
}

// --- Custom Table Cell with background, verticalAlign, borders, height ---
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
        renderHTML: (attrs: any) => {
          // When borderPosition controls sides, suppress individual color to avoid conflict — borderPosition will render it
          if (attrs.borderPosition && attrs.borderPosition !== 'all') return { 'data-border-color': attrs.borderColor } as any
          return attrs.borderColor ? { 'data-border-color': attrs.borderColor, style: `border-color: ${attrs.borderColor}` } : {}
        }
      },
      borderWidth: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.borderWidth || el.getAttribute('data-border-width') || null,
        renderHTML: (attrs: any) => {
          if (attrs.borderPosition && attrs.borderPosition !== 'all') return attrs.borderWidth ? { 'data-border-width': attrs.borderWidth } as any : {}
          return attrs.borderWidth ? { 'data-border-width': attrs.borderWidth, style: `border-width: ${attrs.borderWidth}` } : {}
        }
      },
      borderStyle: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.borderStyle || el.getAttribute('data-border-style') || null,
        renderHTML: (attrs: any) => {
          if (attrs.borderPosition && attrs.borderPosition !== 'all') return attrs.borderStyle ? { 'data-border-style': attrs.borderStyle } as any : {}
          return attrs.borderStyle ? { 'data-border-style': attrs.borderStyle, style: `border-style: ${attrs.borderStyle}` } : {}
        }
      },
      borderPosition: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-border-position') || null,
        renderHTML: (attrs: any) => {
          if (!attrs.borderPosition) return {}
          const style = buildBorderPositionStyle(attrs)
          if (!style) return { 'data-border-position': attrs.borderPosition }
          return { 'data-border-position': attrs.borderPosition, style }
        }
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.height || el.getAttribute('data-height') || null,
        renderHTML: (attrs: any) => attrs.height ? { 'data-height': attrs.height, style: `height: ${attrs.height}` } : {}
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
        renderHTML: (attrs: any) => {
          if (attrs.borderPosition && attrs.borderPosition !== 'all') return { 'data-border-color': attrs.borderColor } as any
          return attrs.borderColor ? { 'data-border-color': attrs.borderColor, style: `border-color: ${attrs.borderColor}` } : {}
        }
      },
      borderWidth: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.borderWidth || el.getAttribute('data-border-width') || null,
        renderHTML: (attrs: any) => {
          if (attrs.borderPosition && attrs.borderPosition !== 'all') return attrs.borderWidth ? { 'data-border-width': attrs.borderWidth } as any : {}
          return attrs.borderWidth ? { 'data-border-width': attrs.borderWidth, style: `border-width: ${attrs.borderWidth}` } : {}
        }
      },
      borderStyle: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.borderStyle || el.getAttribute('data-border-style') || null,
        renderHTML: (attrs: any) => {
          if (attrs.borderPosition && attrs.borderPosition !== 'all') return attrs.borderStyle ? { 'data-border-style': attrs.borderStyle } as any : {}
          return attrs.borderStyle ? { 'data-border-style': attrs.borderStyle, style: `border-style: ${attrs.borderStyle}` } : {}
        }
      },
      borderPosition: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-border-position') || null,
        renderHTML: (attrs: any) => {
          if (!attrs.borderPosition) return {}
          const style = buildBorderPositionStyle(attrs)
          if (!style) return { 'data-border-position': attrs.borderPosition }
          return { 'data-border-position': attrs.borderPosition, style }
        }
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.height || el.getAttribute('data-height') || null,
        renderHTML: (attrs: any) => attrs.height ? { 'data-height': attrs.height, style: `height: ${attrs.height}` } : {}
      },
    }
  }
})

const CustomTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.height || el.getAttribute('data-row-height') || null,
        renderHTML: (attrs: any) => attrs.height ? { 'data-row-height': attrs.height, style: `height: ${attrs.height}` } : {}
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
  const [borderColor, setBorderColor] = useState('#e6e6e6')
  const [borderWidth, setBorderWidth] = useState('1px')
  const [borderStyle, setBorderStyle] = useState('solid')
  const [fontFamily, setFontFamily] = useState('')
  const [fontSize, setFontSize] = useState('')
  const [cellHeight, setCellHeight] = useState('')
  const [rowHeight, setRowHeight] = useState('')
  const [editorHeight, setEditorHeight] = useState(380)
  const [tableOpsCollapsed, setTableOpsCollapsed] = useState(false)
  const [activeToolbarTab, setActiveToolbarTab] = useState<'main'|'table'>('main')
  const [pageSize, setPageSize] = useState<'A4'|'Letter'|'A5'|'A3'>('A4')
  const [zoom, setZoom] = useState(90)
  const [showRuler, setShowRuler] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [headerHtml, setHeaderHtml] = useState("")
  const [footerHtml, setFooterHtml] = useState("")
  const [showHeaderEdit, setShowHeaderEdit] = useState(false)
  const [showFooterEdit, setShowFooterEdit] = useState(false)
  const [headerDraft, setHeaderDraft] = useState("")
  const [footerDraft, setFooterDraft] = useState("")
  const [margins, setMargins] = useState({ top: 20, bottom: 20, left: 25, right: 25 })
  const [pageGap, setPageGap] = useState(20)
  const [background, setBackground] = useState("#ffffff")
  const [pageCount, setPageCount] = useState(1)
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
      FontSize,
      SpacingExtension,
      PageBreak,
      Footnote,
      HeaderNode,
      FooterNode,
      TextAlign.configure({ types: ['heading','paragraph'] }),
      Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false, HTMLAttributes: { class: 'text-[#0075de] underline underline-offset-2 cursor-pointer' } }),
      CustomImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true, handleWidth: 8, lastColumnResizable:true, allowTableNodeSelection:true }),
      CustomTableRow,
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

  // Sync font family/size from selection
  useEffect(()=>{
    if (!editor) return
    const attrs = editor.getAttributes('textStyle') as any
    setFontFamily(attrs.fontFamily || '')
    setFontSize(attrs.fontSize || '')
  }, [tick, editor])

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

  // Docx pagination & header/footer
  useEffect(()=>{
    if (!editor) return
    const el = document.querySelector('.tiptap') as HTMLElement | null
    if (!el) return
    const fmt = PAGE_FORMATS[pageSize] || PAGE_FORMATS.A4
    const usable = fmt.height - margins.top*3.78 - margins.bottom*3.78
    const h = el.scrollHeight || 600
    const cnt = Math.max(1, Math.ceil(h / Math.max(400, usable)))
    setPageCount(cnt)
  }, [tick, pageSize, margins, editorHeight])
  useEffect(()=>{ setHeaderDraft(headerHtml||"") }, [headerHtml])
  useEffect(()=>{
    if (!editor) return
    const isTable = editor.isActive('table')
    if (isTable && activeToolbarTab !== 'table') setActiveToolbarTab('table')
    else if (!isTable && activeToolbarTab === 'table') setActiveToolbarTab('main')
  }, [tick, editor, activeToolbarTab])
  useEffect(()=>{ setFooterDraft(footerHtml||"") }, [footerHtml])

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
              {/* Toolbar - Redesigned: lebih rapi, berlabel, grouping jelas */}
              <div className="sticky top-0 z-10 bg-gradient-to-b from-[#fcfcfc] to-[#f9fafb] border-y border-[#e6e6e6]">
                {/* Top row - main formatting */}
                <div className="p-2.5 flex flex-wrap items-center gap-1.5">
                  {/* Group: History */}
                  <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                    <span className="hidden xl:flex items-center px-2 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Riwayat</span>
                    <button type="button" title="Undo (Ctrl+Z)" onClick={()=>editor.chain().focus().undo().run()} disabled={!can(()=>editor.can().chain().focus().undo().run())} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30 transition-colors"><Undo size={14}/></button>
                    <button type="button" title="Redo (Ctrl+Y)" onClick={()=>editor.chain().focus().redo().run()} disabled={!can(()=>editor.can().chain().focus().redo().run())} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center disabled:opacity-30 transition-colors"><Redo size={14}/></button>
                  </div>
                  {/* Group: Text style */}
                  <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                    <span className="hidden xl:flex items-center px-1 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Format</span>
                    <button type="button" title="Bold (Ctrl+B)" onClick={()=>editor.chain().focus().toggleBold().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isActive('bold') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Bold size={14}/></button>
                    <button type="button" title="Italic (Ctrl+I)" onClick={()=>editor.chain().focus().toggleItalic().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isActive('italic') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Italic size={14}/></button>
                    <button type="button" title="Underline (Ctrl+U)" onClick={()=>editor.chain().focus().toggleUnderline().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isActive('underline') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><UnderlineIcon size={14}/></button>
                    <button type="button" title="Strikethrough" onClick={()=>editor.chain().focus().toggleStrike().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isActive('strike') ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Strikethrough size={14}/></button>
                    <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center"/>
                    <button type="button" title="Clear formatting" onClick={()=>editor.chain().focus().unsetAllMarks().clearNodes().run()} className="w-8 h-8 rounded-[8px] hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center text-[#6b7280] transition-colors"><Eraser size={14}/></button>
                  </div>
                  {/* Group: Font Family & Size */}
                  <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] items-center">
                    <span className="hidden xl:flex items-center px-1 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase">Font</span>
                    <select value={fontFamily} onChange={e=>{ const v=e.target.value; setFontFamily(v); if(v) (editor.chain().focus() as any).setFontFamily(v).run(); else (editor.chain().focus() as any).unsetFontFamily().run() }} className="h-8 text-xs border-0 bg-transparent pr-1 focus:ring-0 focus:outline-none cursor-pointer max-w-[110px]" title="Font Family">
                      {FONT_FAMILIES.map(f=> <option key={f.label} value={f.value} style={{fontFamily: f.value || undefined}}>{f.label}</option>)}
                    </select>
                    <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center"/>
                    <select value={fontSize} onChange={e=>{ const v=e.target.value; setFontSize(v); if(v) (editor.chain().focus() as any).setFontSize(v).run(); else (editor.chain().focus() as any).unsetFontSize().run() }} className="h-8 text-xs border-0 bg-transparent pr-1 focus:ring-0 focus:outline-none cursor-pointer w-[68px]" title="Font Size">
                      {FONT_SIZES.map(f=> <option key={f.label} value={f.value}>{f.label}{f.value ? ` (${f.value})` : ''}</option>)}
                    </select>
                  </div>
                  {/* Group: Headings */}
                  <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] items-center">
                    <div className="hidden lg:flex items-center gap-1.5 px-2 border-r border-[#e6e6e6] mr-1">
                      <Type size={12} className="text-[#6b7280]"/>
                      <select value={getHeadingLevel()} onChange={e=>{
                        const v=e.target.value
                        if(v==='p') editor.chain().focus().setParagraph().run()
                        else editor.chain().focus().toggleHeading({level: Number(v) as any}).run()
                      }} className="h-8 text-xs font-medium border-0 bg-transparent pr-2 focus:ring-0 focus:outline-none cursor-pointer">
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
                      }} className="h-8 text-xs border-0 bg-transparent px-1 focus:ring-0 focus:outline-none">
                        <option value="p">P</option>
                        <option value="1">H1</option>
                        <option value="2">H2</option>
                        <option value="3">H3</option>
                      </select>
                    </div>
                    <button type="button" title="Heading 1" onClick={()=>editor.chain().focus().toggleHeading({level:1}).run()} className={`hidden sm:flex px-2 h-8 rounded-[8px] items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${isActive('heading',{level:1}) ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading1 size={12}/> H1</button>
                    <button type="button" title="Heading 2" onClick={()=>editor.chain().focus().toggleHeading({level:2}).run()} className={`hidden sm:flex px-2 h-8 rounded-[8px] items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${isActive('heading',{level:2}) ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading2 size={12}/> H2</button>
                    <button type="button" title="Heading 3" onClick={()=>editor.chain().focus().toggleHeading({level:3}).run()} className={`hidden md:flex px-2 h-8 rounded-[8px] items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${isActive('heading',{level:3}) ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Heading3 size={12}/> H3</button>
                    <div className="w-px h-6 bg-[#e6e6e6] mx-1 self-center hidden sm:block"/>
                    <button type="button" title="Blockquote" onClick={()=>editor.chain().focus().toggleBlockquote().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isActive('blockquote') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Quote size={14}/></button>
                  </div>
                  {/* Group: Align */}
                  <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                    <button type="button" title="Align left" onClick={()=>editor.chain().focus().setTextAlign('left').run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isAlignActive('left') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignLeft size={14}/></button>
                    <button type="button" title="Align center" onClick={()=>editor.chain().focus().setTextAlign('center').run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isAlignActive('center') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignCenter size={14}/></button>
                    <button type="button" title="Align right" onClick={()=>editor.chain().focus().setTextAlign('right').run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isAlignActive('right') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignRight size={14}/></button>
                    <button type="button" title="Justify" onClick={()=>editor.chain().focus().setTextAlign('justify').run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isAlignActive('justify') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#6b7280]'}`}><AlignJustify size={14}/></button>
                  </div>
                  {/* Group: Lists */}
                  <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                    <button type="button" title="Bullet list" onClick={()=> editor.chain().focus().toggleBulletList().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isActive('bulletList') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><List size={14}/></button>
                    <button type="button" title="Ordered list" onClick={()=> editor.chain().focus().toggleOrderedList().run()} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isActive('orderedList') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><ListOrdered size={14}/></button>
                    <div className="w-px h-5 bg-[#e6e6e6] mx-1 self-center"/>
                    <button type="button" title="Kurangi indent" onClick={()=> editor.chain().focus().liftListItem('listItem').run()} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280] text-[11px] font-mono">←</button>
                    <button type="button" title="Tambah indent" onClick={()=> editor.chain().focus().sinkListItem('listItem').run()} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280] text-[11px] font-mono">→</button>
                  </div>
                    <SpacingDropdown editor={editor} tick={tick} />
                  {/* Group: Insert */}
                  <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                    <button type="button" title="Insert table 3x3" onClick={()=>{editor.chain().focus().insertTable({rows:3, cols:3, withHeaderRow:true}).run(); showToast('Tabel 3×3 ditambahkan','success')}} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#374151]"><TableIcon size={14}/></button>
                    <button type="button" title="Atur link (modal)" onClick={openLinkModal} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${isActive('link') ? 'bg-[#0075de] text-white shadow-sm' : 'hover:bg-[#f6f5f4] text-[#374151]'}`}><Link2 size={14}/></button>
                    <button type="button" title="Sisipkan gambar (modal)" onClick={openImageModal} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#374151]"><ImageIcon size={14}/></button>
                    <button type="button" title="Garis horizontal" onClick={()=>editor.chain().focus().setHorizontalRule().run()} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><Minus size={14}/></button>
                  </div>
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                      <button type="button" title="Sisipkan batas halaman (Page Break)" onClick={() => (editor?.chain().focus() as any).setPageBreak().run()} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><span className="text-[11px] font-mono">↵</span></button>
                      <button type="button" title="Footnote" onClick={() => (editor?.chain().focus() as any).insertContent({ type: 'footnote', attrs: { content: 'Catatan kaki', number: 1 } }).run()} className="w-8 h-8 rounded-[8px] hover:bg-amber-50 flex items-center justify-center text-amber-600"><span className="text-[11px]">¹</span></button>
                      <button type="button" title="Edit Header" onClick={() => setShowHeaderEdit(true)} className="w-8 h-8 rounded-[8px] hover:bg-[#f6f5f4] flex items-center justify-center text-[#0075de]"><FileText size={12} /></button>
                      <button type="button" title="Edit Footer" onClick={() => setShowFooterEdit(true)} className="w-8 h-8 rounded-[8px] hover:bg-emerald-50 flex items-center justify-center text-emerald-600"><Layers size={12} /></button>
                    </div>
                    <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                      <select value={pageSize} onChange={e => setPageSize(e.target.value as any)} className="h-8 text-xs border-0 bg-transparent pr-1 cursor-pointer"><option value="A4">A4</option><option value="Letter">Letter</option><option value="A5">A5</option><option value="A3">A3</option></select>
                      <span className="w-px h-4 bg-[#e6e6e6] mx-1 self-center" />
                      <button onClick={() => setShowRuler(!showRuler)} className={`px-2 h-7 rounded text-xs flex items-center gap-1 ${showRuler ? "bg-[#0075de] text-white" : "hover:bg-[#f6f5f4] text-[#6b7280]"}`}><Ruler size={12} /> Ruler</button>
                      <span className="w-px h-4 bg-[#e6e6e6] mx-1 self-center" />
                      <button onClick={() => setZoom(Math.max(40, zoom - 10))} className="w-7 h-8 rounded hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><ZoomOut size={12} /></button>
                      <span className="text-xs font-mono w-10 text-center">{zoom}%</span>
                      <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="w-7 h-8 rounded hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><ZoomIn size={12} /></button>
                      <button onClick={() => setZoom(100)} className="px-1.5 h-8 rounded hover:bg-[#f6f5f4] text-[11px] text-[#6b7280]"><Maximize2 size={12} /></button>
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
              {/* Tabs Dokumen / Tabel — table ops di toolbar tab baru */}
              <div className="flex items-center gap-1 bg-[#f6f5f4] px-2 py-1.5 border border-[#e6e6e6] border-t-0 rounded-b-[12px] mb-2">
                <button type="button" onClick={()=>setActiveToolbarTab('main')} className={`px-3 py-1.5 rounded-[8px] text-xs font-medium flex items-center gap-1.5 transition-colors ${activeToolbarTab==='main' ? 'bg-white shadow border border-[#e6e6e6] text-[#0075de]' : 'text-[#6b7280] hover:text-[#111] hover:bg-white'}`}>
                  <FileText size={12}/> Dokumen
                </button>
                {editor?.isActive('table') && (
                  <button type="button" onClick={()=>setActiveToolbarTab('table')} className={`px-3 py-1.5 rounded-[8px] text-xs font-medium flex items-center gap-1.5 transition-colors ${activeToolbarTab==='table' ? 'bg-[#0075de] text-white shadow' : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'}`}>
                    <Grid3x3 size={12}/> Tabel <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">AKTIF</span>
                  </button>
                )}
                <span className="ml-auto text-[11px] text-[#9ca3af] hidden sm:flex">Klik tabel untuk tab Tabel</span>
              </div>
              {activeToolbarTab === 'table' && editor?.isActive('table') && (
                <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-2 mb-4 shadow-sm">
                  <TableToolbar editor={editor} cellBg={cellBg} setCellBg={setCellBg} borderColor={borderColor} setBorderColor={setBorderColor} borderWidth={borderWidth} setBorderWidth={setBorderWidth} borderStyle={borderStyle} setBorderStyle={setBorderStyle} cellHeight={cellHeight} setCellHeight={setCellHeight} rowHeight={rowHeight} setRowHeight={setRowHeight} applyBorderPreset={applyBorderPreset} applyCellHeight={applyCellHeight} applyRowHeight={applyRowHeight} handleRowDragMouseDown={typeof handleRowDragMouseDown !== 'undefined' ? handleRowDragMouseDown : undefined} />
                </div>
              )}

              {/* Editor area - paper like, resizable */}
              {showSettings && (
                <div className="border border-[#e6e6e6] border-t-0 bg-white p-4 grid md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div className="text-xs font-bold flex items-center gap-1.5"><Settings size={12} className="text-[#0075de]" /> Page Format</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-[11px]">Page size</Label><select value={pageSize} onChange={e => setPageSize(e.target.value as any)} className="w-full h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-2 bg-white"><option value="A4">A4</option><option value="A5">A5</option><option value="A3">A3</option><option value="Letter">Letter</option></select></div>
                      <div><Label className="text-[11px]">Orientation</Label><select value="portrait" onChange={() => {}} className="w-full h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-2 bg-white"><option>Portrait</option><option>Landscape</option></select></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div><Label className="text-[11px]">Top</Label><Input value={margins.top} onChange={(e: any) => setMargins({ ...margins, top: Number(e.target.value) || 0 })} className="h-7 text-xs" type="number" /></div>
                      <div><Label className="text-[11px]">Bottom</Label><Input value={margins.bottom} onChange={(e: any) => setMargins({ ...margins, bottom: Number(e.target.value) || 0 })} className="h-7 text-xs" type="number" /></div>
                      <div><Label className="text-[11px]">Left</Label><Input value={margins.left} onChange={(e: any) => setMargins({ ...margins, left: Number(e.target.value) || 0 })} className="h-7 text-xs" type="number" /></div>
                      <div><Label className="text-[11px]">Right</Label><Input value={margins.right} onChange={(e: any) => setMargins({ ...margins, right: Number(e.target.value) || 0 })} className="h-7 text-xs" type="number" /></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1"><Label className="text-[11px]">Page gap (px)</Label><Input value={pageGap} onChange={(e: any) => setPageGap(Number(e.target.value) || 20)} className="h-7 text-xs" /></div>
                      <div className="flex-1"><Label className="text-[11px]">Background</Label><div className="flex gap-1 mt-1"><input type="color" value={background} onChange={(e: any) => setBackground(e.target.value)} className="w-7 h-7 rounded" /><span className="text-[11px] font-mono">{background}</span></div></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-bold flex items-center gap-1.5"><FileText size={12} className="text-[#0075de]" /> Header & Footer</div>
                    <div><Label className="text-[11px]">Header (double-click page header)</Label><Textarea value={headerHtml} onChange={(e: any) => setHeaderHtml(e.target.value)} placeholder="Header HTML — gunakan {page} {total}" className="min-h-[60px] text-xs font-mono" /></div>
                    <div><Label className="text-[11px]">Footer</Label><Textarea value={footerHtml} onChange={(e: any) => setFooterHtml(e.target.value)} placeholder="Footer HTML — {page} of {total}" className="min-h-[60px] text-xs font-mono" /></div>
                    <div className="flex gap-1 flex-wrap"><Badge variant="secondary" className="text-[11px]">Different first page</Badge><Badge variant="secondary" className="text-[11px]">Odd/even</Badge><Badge variant="secondary" className="text-[11px]">{pageCount} pages</Badge></div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-bold flex items-center gap-1.5"><Layers size={12} className="text-[#0075de]" /> Export & Collaboration</div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => { const html = editor.getHTML(); const w = window.open("", "_blank"); if (w) { w.document.write(`<html><head><title>${form.name}</title></head><body>${html}</body></html>`); w.document.close(); w.print() } }}><Download size={14} /> Export DOCX</Button>
                      <Button size="sm" variant="outline" onClick={() => { const html = editor.getHTML(); const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); w.print() } }}><FileText size={14} /> Export PDF</Button>
                    </div>
                    <div className="text-[11px] text-[#6b7280]">Collaboration mock — header/footer/footnotes ikut sync. Dark/light ready.</div>
                  </div>
                </div>
              )}
              <div
                ref={editorContainerRef}
                onContextMenu={handleContextMenu}
                className="relative bg-[#f6f5f4] p-3 sm:p-4"
              >
                {showRuler && (
                  <div className="bg-[#f3f4f6] border border-[#e6e6e6] border-b-0 rounded-t-[10px] h-6 flex items-center px-4 overflow-hidden select-none">
                    <div className="flex-1 flex items-end h-full max-w-[794px] mx-auto relative">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <span className="text-[7px] text-[#9ca3af] font-mono">{i}</span>
                          <div className="w-px h-2 bg-[#d1d5db] mt-0.5" />
                        </div>
                      ))}
                      <div className="absolute left-0 right-0 top-0 h-px bg-[#0075de]/30" />
                    </div>
                  </div>
                )}
                <div className="bg-[#e8ecef] p-4 md:p-6 flex flex-col items-center gap-6 overflow-auto" style={{ background, minHeight: 520 }} >
                  {Array.from({ length: pageCount }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white shadow-[0_2px_16px_rgba(0,0,0,0.12)] flex flex-col relative"
                      style={{
                        width: (PAGE_FORMATS[pageSize] || PAGE_FORMATS.A4).width,
                        minHeight: (PAGE_FORMATS[pageSize] || PAGE_FORMATS.A4).height - 40,
                        paddingTop: margins.top * 3.78,
                        paddingBottom: margins.bottom * 3.78,
                        paddingLeft: margins.left * 3.78,
                        paddingRight: margins.right * 3.78,
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "top center",
                        marginBottom: pageGap,
                      }}
                    >
                      <div onDoubleClick={() => setShowHeaderEdit(true)} className="absolute top-0 left-0 right-0 h-[36px] border-b border-dashed border-[#0075de]/20 bg-[#0075de]/[0.02] flex items-center justify-between px-4 text-[10px] text-[#0075de] cursor-pointer hover:bg-[#0075de]/10">
                        <span className="font-mono flex items-center gap-1"><FileText size={10} /> HEADER {idx === 0 ? "(First)" : ""} — double-click</span>
                        <span className="font-mono" dangerouslySetInnerHTML={{ __html: headerHtml.replace("{page}", String(idx + 1)).replace("{total}", String(pageCount)) || "<span style='color:#9ca3af'>Header kosong</span>" }} />
                      </div>
                      <div className="absolute -top-6 left-0 right-0 flex justify-center">
                        <span className="bg-white border border-[#e6e6e6] rounded-full px-2 py-0.5 text-[10px] font-mono text-[#6b7280] shadow-sm">Page {idx + 1} of {pageCount}</span>
                      </div>
                      <div className="flex-1 pt-8 pb-8">
                        {idx === 0 ? (
                          <EditorContent editor={editor} className="min-h-[400px] [&_.tiptap]:min-h-[360px] [&_.tiptap]:p-2 focus-within:ring-2 focus-within:ring-[#0075de]/10" />
                        ) : (
                          <div className="tiptap prose prose-sm max-w-none p-2 text-[14px] opacity-60">
                            <div className="border-2 border-dashed border-[#e6e6e6] rounded-[8px] p-6 text-center text-[#9ca3af] text-xs">Page {idx + 1} — overflow dari page 1. Sisipkan Page Break untuk paksa pindah halaman.</div>
                          </div>
                        )}
                      </div>
                      <div onDoubleClick={() => setShowFooterEdit(true)} className="absolute bottom-0 left-0 right-0 h-[32px] border-t border-dashed border-emerald-200 bg-emerald-50/50 flex items-center justify-between px-4 text-[10px] text-emerald-700 cursor-pointer hover:bg-emerald-50">
                        <span className="font-mono flex items-center gap-1"><Layers size={10} /> FOOTER — double-click</span>
                        <span className="font-mono" dangerouslySetInnerHTML={{ __html: footerHtml.replace("{page}", String(idx + 1)).replace("{total}", String(pageCount)) || "<span style='color:#9ca3af'>Footer kosong</span>" }} />
                      </div>
                      <div className="absolute bottom-[32px] left-0 right-0 h-6 border-t border-amber-200 bg-amber-50/30 flex items-center px-4 text-[10px] text-amber-700">Footnotes — area di atas footer (auto-number)</div>
                    </div>
                  ))}
                </div>
                <div onMouseDown={handleEditorGripMouseDown} className="h-7 bg-[#f9fafb] hover:bg-[#eff6ff] border border-t-0 border-[#e6e6e6] rounded-b-[10px] flex items-center justify-center gap-2 cursor-ns-resize select-none group">
                  <div className="w-8 h-1 rounded-full bg-[#d1d5db] group-hover:bg-[#0075de]" />
                  <span className="text-[11px] font-medium text-[#6b7280] group-hover:text-[#0075de] hidden sm:inline">Tarik untuk atur tinggi</span>
                  <MoveVertical size={12} className="text-[#9ca3af] group-hover:text-[#0075de]" />
                </div>
                <div className="absolute bottom-10 right-4 hidden lg:flex items-center gap-1.5 bg-[#111827] text-white rounded-full px-3 py-1.5 text-[11px] shadow-lg">
                  <MousePointer2 size={12} className="text-white"/> Klik kanan untuk tambah data terikat
                </div>
              </div>

              {/* Table Operations — Redesigned Beautiful & Easy */}
              {editor && editor.isActive('table') && (
                <div className="border-t border-[#e6e6e6] bg-gradient-to-b from-white to-[#fcfcfc]">
                  {/* Header bar */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e6e6e6]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-[#0075de] text-white flex items-center justify-center shadow-sm"><Grid3x3 size={16}/></div>
                      <div>
                        <div className="text-[13px] font-bold text-[#111] flex items-center gap-2">
                          Operasi Tabel
                          <span className="px-2 py-0.5 rounded-full bg-[#eff6ff] border border-[#dbeafe] text-[#0075de] text-[10px] font-bold tracking-wide">AKTIF</span>
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-normal text-[#6b7280]"><MoveHorizontal size={11}/> drag tepi kolom • <MoveVertical size={11}/> drag bawah baris</span>
                        </div>
                        <div className="text-[11px] text-[#6b7280]">Atur baris, kolom, gabung cell, style & ukuran dengan mudah</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={()=> setTableOpsCollapsed(!tableOpsCollapsed)} className="w-8 h-8 rounded-full bg-white border border-[#e6e6e6] hover:bg-[#f6f5f4] flex items-center justify-center transition-colors" title={tableOpsCollapsed ? "Buka panel" : "Tutup panel"}>
                        {tableOpsCollapsed ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
                      </button>
                    </div>
                  </div>

                  {!tableOpsCollapsed && (
                    <div className="p-4 space-y-4">
                      {/* Row 1: Struktur Baris & Kolom */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Baris */}
                        <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-[8px] bg-[#eff6ff] border border-[#dbeafe] text-[#0075de] flex items-center justify-center"><Rows3 size={13}/></div>
                            <span className="text-xs font-bold text-[#111]">Baris</span>
                            <Badge variant="secondary" className="ml-auto text-[10px]">Rows</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button type="button" onClick={()=>{editor.chain().focus().addRowBefore().run(); showToast('Baris ditambahkan di atas','success')}} className="h-8 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] hover:border-[#0075de]/20 flex items-center justify-center gap-1"><Plus size={11}/> Sebelum</button>
                            <button type="button" onClick={()=>{editor.chain().focus().addRowAfter().run(); showToast('Baris ditambahkan di bawah','success')}} className="h-8 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] hover:border-[#0075de]/20 flex items-center justify-center gap-1"><Plus size={11}/> Sesudah</button>
                            <button type="button" onClick={()=>{editor.chain().focus().deleteRow().run(); showToast('Baris dihapus','info')}} className="h-8 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-[8px] hover:bg-red-100 flex items-center justify-center gap-1"><Trash size={11}/> Hapus</button>
                          </div>
                          {/* Row height quick */}
                          <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-[#374151] flex items-center gap-1"><MoveVertical size={11}/> Tinggi Baris</span>
                            <input value={rowHeight} onChange={e=>setRowHeight(e.target.value)} placeholder="48px" className="flex-1 h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-2 bg-white" />
                            <button type="button" onClick={applyRowHeight} className="h-7 px-3 text-xs font-medium bg-[#111827] text-white rounded-[6px] hover:bg-black">Set</button>
                            <button type="button" onMouseDown={handleRowDragMouseDown} className="h-7 w-7 rounded-[6px] border border-[#e6e6e6] bg-white hover:bg-[#f6f5f4] flex items-center justify-center cursor-row-resize" title="Drag untuk ubah tinggi baris terpilih (row-resize)"><GripVertical size={12}/></button>
                          </div>
                        </div>
                        {/* Kolom */}
                        <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-[8px] bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center"><Columns3 size={13}/></div>
                            <span className="text-xs font-bold text-[#111]">Kolom</span>
                            <Badge variant="secondary" className="ml-auto text-[10px]">Columns</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button type="button" onClick={()=>{editor.chain().focus().addColumnBefore().run(); showToast('Kolom ditambahkan di kiri','success')}} className="h-8 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center justify-center gap-1"><Plus size={11}/> Kiri</button>
                            <button type="button" onClick={()=>{editor.chain().focus().addColumnAfter().run(); showToast('Kolom ditambahkan di kanan','success')}} className="h-8 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center justify-center gap-1"><Plus size={11}/> Kanan</button>
                            <button type="button" onClick={()=>{editor.chain().focus().deleteColumn().run(); showToast('Kolom dihapus','info')}} className="h-8 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-[8px] hover:bg-red-100 flex items-center justify-center gap-1"><Trash size={11}/> Hapus</button>
                          </div>
                          <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                            <MoveHorizontal size={11} className="text-[#0075de]"/> Drag handle di tepi kolom (biru, cursor <span className="font-mono bg-white border px-1 rounded">col-resize</span>) untuk ubah lebar
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Aksi Tabel */}
                      <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-[8px] bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center"><Layers size={13}/></div>
                          <span className="text-xs font-bold text-[#111]">Aksi Tabel</span>
                          <span className="text-[11px] text-[#6b7280] hidden sm:inline">— pilih cell lalu eksekusi</span>
                          <button type="button" onClick={()=>{editor.chain().focus().deleteTable().run(); showToast('Tabel dihapus','info')}} className="ml-auto h-7 px-3 text-xs font-medium bg-red-600 text-white rounded-[8px] hover:bg-red-700 flex items-center gap-1.5"><Trash2 size={12}/> Hapus Tabel</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button type="button" onClick={()=>{editor.chain().focus().mergeCells().run(); showToast('Cell digabung','success')}} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center gap-1.5"><Combine size={12}/> Gabung Cell</button>
                          <button type="button" onClick={()=>{editor.chain().focus().splitCell().run(); showToast('Cell dipecah','success')}} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center gap-1.5"><Split size={12}/> Pecah Cell</button>
                          <button type="button" onClick={()=>{try{ (editor.chain().focus() as any).selectParentNode().run(); (editor.chain().focus() as any).selectParentNode().run(); showToast('Tabel dipilih — drag untuk seleksi beberapa cell','info')}catch{ showToast('Gunakan drag untuk seleksi cell','info')}}} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Pilih Tabel</button>
                          <div className="w-px h-6 bg-[#e6e6e6] self-center mx-1"/>
                          <button type="button" onClick={()=>{editor.chain().focus().toggleHeaderRow().run(); showToast('Header baris toggled','success')}} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Header Baris</button>
                          <button type="button" onClick={()=>{editor.chain().focus().toggleHeaderColumn().run(); showToast('Header kolom toggled','success')}} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Header Kolom</button>
                          <button type="button" onClick={()=>{editor.chain().focus().toggleHeaderCell().run(); showToast('Header cell toggled','success')}} className="h-8 px-3 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Header Cell</button>
                        </div>
                      </div>

                      {/* Row 3: Gaya Cell + Border + Ukuran */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {/* Cell style: BG + Align + Height */}
                        <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)] space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-[8px] bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center"><Brush size={13}/></div>
                            <span className="text-xs font-bold text-[#111]">Gaya Cell</span>
                            <Badge variant="outline" className="ml-auto text-[10px]">Cell</Badge>
                          </div>
                          {/* BG */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 border border-[#e6e6e6] rounded-[8px] px-2 py-1.5 bg-[#f9fafb] flex-1">
                              <PaintBucket size={12} className="text-[#6b7280] shrink-0"/>
                              <span className="text-[11px] font-medium">BG</span>
                              <input type="color" value={cellBg} onChange={e=>setCellBg(e.target.value)} className="w-7 h-7 p-0 border-0 rounded-[6px] overflow-hidden cursor-pointer" title="Pilih warna background" />
                              <span className="text-[11px] font-mono text-[#6b7280] hidden sm:inline">{cellBg}</span>
                              <button type="button" onClick={()=>{editor.chain().focus().setCellAttribute('backgroundColor', cellBg).run(); showToast(`Background: ${cellBg}`,'success')}} className="ml-auto h-6 px-2.5 text-xs font-medium bg-[#0075de] text-white rounded-[6px] hover:bg-[#0063be]">Terapkan</button>
                              <button type="button" onClick={()=>{editor.chain().focus().setCellAttribute('backgroundColor', null).run(); showToast('Background dihapus','info')}} className="h-6 px-2 text-xs border border-[#e6e6e6] rounded-[6px] bg-white hover:bg-[#f6f5f4]">Hapus</button>
                            </div>
                          </div>
                          {/* Align + Height */}
                          <div className="grid grid-cols-2 gap-2">
                            <select onChange={e=>{const v=e.target.value; if(v) {editor.chain().focus().setCellAttribute('verticalAlign', v).run(); showToast(`Vertical: ${v}`,'success')}}} defaultValue="" className="h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white">
                              <option value="" disabled>Align Vertical</option>
                              <option value="top">Top</option>
                              <option value="middle">Middle</option>
                              <option value="bottom">Bottom</option>
                            </select>
                            <div className="flex gap-1">
                              <input value={cellHeight} onChange={e=>setCellHeight(e.target.value)} placeholder="Tinggi cell 40px" className="flex-1 h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white" />
                              <button type="button" onClick={applyCellHeight} className="h-8 px-3 text-xs font-medium bg-[#111827] text-white rounded-[8px] hover:bg-black">Set</button>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#6b7280] flex gap-1.5"><Info size={11} className="mt-0.5 shrink-0"/> Pilih cell dulu, lalu atur BG / align / tinggi. Tinggi bisa <span className="font-mono bg-[#f6f5f4] px-1 rounded">40px</span> atau kosongkan untuk auto.</p>
                        </div>

                        {/* Border controls */}
                        <div className="bg-white border border-[#e6e6e6] rounded-[12px] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)] space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-[8px] bg-[#f5f3ff] border border-violet-100 text-violet-600 flex items-center justify-center"><Palette size={13}/></div>
                            <span className="text-xs font-bold text-[#111]">Border Cell</span>
                            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">7 posisi</span>
                          </div>
                          {/* Color + Width + Style in one row */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center gap-1.5 border border-[#e6e6e6] rounded-[8px] px-2 py-1.5 bg-white">
                              <Grid3x3 size={12} className="text-[#6b7280] shrink-0"/>
                              <input type="color" value={borderColor} onChange={e=>setBorderColor(e.target.value)} className="w-6 h-6 p-0 border-0 rounded-[6px] cursor-pointer" title="Border color" />
                              <span className="text-[11px] font-medium hidden sm:inline">Warna</span>
                            </div>
                            <select value={borderWidth} onChange={e=>setBorderWidth(e.target.value)} className="h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white">
                              <option value="1px">1px</option>
                              <option value="2px">2px</option>
                              <option value="3px">3px</option>
                              <option value="4px">4px</option>
                            </select>
                            <select value={borderStyle} onChange={e=>setBorderStyle(e.target.value)} className="h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white">
                              <option value="solid">Solid</option>
                              <option value="dashed">Dashed</option>
                              <option value="dotted">Dotted</option>
                              <option value="double">Double</option>
                              <option value="hidden">Hidden</option>
                            </select>
                          </div>
                          {/* Preset grid 7 options */}
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                            {[
                              { id:'none', label:'Tanpa', icon: Square, desc:'None' },
                              { id:'left', label:'Kiri', icon: PanelLeft, desc:'Left' },
                              { id:'right', label:'Kanan', icon: PanelRight, desc:'Right' },
                              { id:'leftRight', label:'Kiri+Kanan', icon: Columns2, desc:'L+R' },
                              { id:'top', label:'Atas', icon: PanelTop, desc:'Top' },
                              { id:'bottom', label:'Bawah', icon: PanelBottom, desc:'Bottom' },
                              { id:'outer', label:'Luar', icon: Frame, desc:'Outer' },
                            ].map(p => (
                              <button key={p.id} type="button" onClick={()=>applyBorderPreset(p.id)} className="flex flex-col items-center gap-1 p-2 rounded-[10px] border border-[#e6e6e6] bg-white hover:border-[#0075de] hover:bg-[#eff6ff] hover:text-[#0075de] group transition-colors">
                                <p.icon size={16} className="text-[#6b7280] group-hover:text-[#0075de]"/>
                                <span className="text-[10px] font-semibold leading-none">{p.label}</span>
                                <span className="text-[9px] text-[#9ca3af] leading-none hidden sm:block">{p.desc}</span>
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <button type="button" onClick={()=>applyBorderPreset('all')} className="flex-1 h-8 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-[#f9fafb] hover:bg-white flex items-center justify-center gap-1"><Grid3x3 size={12}/> Semua sisi</button>
                            <button type="button" onClick={()=>applyBorderPreset('none')} className="h-7 px-3 text-xs border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200">Hapus Border</button>
                          </div>
                          <p className="text-[11px] text-[#6b7280]">Pilih warna → width → style → klik preset posisi. <b>Outer</b> = hanya tepi luar tabel (interior tanpa garis).</p>
                        </div>
                      </div>

                      {/* Hint */}
                      <div className="flex items-start gap-2 bg-[#eff6ff] border border-[#dbeafe] rounded-[10px] px-3 py-2.5 text-[11px] text-[#1e40af]">
                        <Info size={14} className="mt-0.5 shrink-0 text-[#0075de]"/>
                        <span><b>Tips resize:</b> Arahkan kursor ke <b>garis tepi kolom</b> (muncul garis biru, cursor <span className="font-mono bg-white border px-1 rounded">col-resize ↔</span>) lalu drag. Untuk <b>tinggi baris</b>, isi <span className="font-mono">48px</span> lalu Set, atau klik <GripVertical size={10} className="inline"/> drag bawah baris (cursor <span className="font-mono bg-white border px-1 rounded">row-resize ↕</span>). Seleksi beberapa cell → <b>Gabung</b>.</span>
                      </div>
                    </div>
                  )}
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
                    {/* Preview 1:1 dengan EditorContent - class & style identik */}
                    <div className="tiptap prose prose-sm max-w-none p-6 min-h-[280px] leading-relaxed text-[14px] text-[#111827] prose-p:my-2 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-blockquote:border-l-4 prose-blockquote:border-[#e5e7eb] prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-[#0075de] prose-strong:font-bold prose-ul:list-disc prose-ol:list-decimal prose-li:my-1 prose-table:border-collapse prose-th:bg-[#f9fafb] prose-th:p-2 prose-th:border prose-td:p-2 prose-td:border prose-img:rounded-lg focus:outline-none" dangerouslySetInnerHTML={{__html: previewHtml || "<p class='text-[#9ca3af] italic'>Preview kosong — ketik di editor</p>"}} />
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
                <div className="tiptap prose prose-sm max-w-none p-6 min-h-[180px] leading-relaxed text-[14px] text-[#111827] prose-p:my-2 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-blockquote:border-l-4 prose-blockquote:border-[#e5e7eb] prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-[#0075de] prose-strong:font-bold prose-ul:list-disc prose-ol:list-decimal prose-li:my-1 prose-table:border-collapse prose-th:bg-[#f9fafb] prose-th:p-2 prose-th:border prose-td:p-2 prose-td:border prose-img:rounded-lg focus:outline-none" dangerouslySetInnerHTML={{__html: previewHtml || "<p class='text-[#9ca3af] italic'>Preview kosong</p>"}} />
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
            className="fixed bg-white border border-[#e6e6e6] rounded-[12px] shadow-2xl w-[360px] max-h-[85vh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95"
            style={{left, top}}
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
        )
      })()}

      {/* Header/Footer edit modals — DOCX clone */}
      {showHeaderEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHeaderEdit(false)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-lg shadow-xl p-5 border border-[#e6e6e6]">
            <div className="font-bold text-sm mb-3 flex items-center gap-2"><FileText size={14} className="text-[#0075de]" /> Edit Header</div>
            <Textarea value={headerDraft} onChange={(e: any) => setHeaderDraft(e.target.value)} placeholder="Header HTML — gunakan {page} {total}" className="min-h-[100px] font-mono text-xs" />
            <div className="flex justify-end gap-2 mt-3"><Button variant="outline" size="sm" onClick={() => setShowHeaderEdit(false)}>Batal</Button><Button size="sm" onClick={() => { setHeaderHtml(headerDraft); setShowHeaderEdit(false) }}><Check size={14} /> Simpan</Button></div>
          </div>
        </div>
      )}
      {showFooterEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFooterEdit(false)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-lg shadow-xl p-5 border border-[#e6e6e6]">
            <div className="font-bold text-sm mb-3 flex items-center gap-2"><Layers size={14} className="text-emerald-600" /> Edit Footer</div>
            <Textarea value={footerDraft} onChange={(e: any) => setFooterDraft(e.target.value)} placeholder="Footer HTML — {page} of {total}" className="min-h-[100px] font-mono text-xs" />
            <div className="flex justify-end gap-2 mt-3"><Button variant="outline" size="sm" onClick={() => setShowFooterEdit(false)}>Batal</Button><Button size="sm" onClick={() => { setFooterHtml(footerDraft); setShowFooterEdit(false) }}><Check size={14} /> Simpan</Button></div>
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
