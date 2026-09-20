import { Node, mergeAttributes, Extension } from "@tiptap/core"

// Page break — manual break like Word (consumes page, caret after)
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  parseHTML() { return [{ tag: 'div[data-page-break]' }, { tag: 'div[style*="page-break-after"]' }] },
  renderHTML({ HTMLAttributes }: any) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-page-break': 'true',
      class: 'page-break relative my-6 border-t-2 border-dashed border-[#93c5fd] bg-[#eff6ff] h-6 flex items-center justify-center select-none',
      style: 'break-before: page; page-break-before: always; border-top: 2px dashed #93c5fd; background:#eff6ff; height:24px; display:flex; align-items:center; justify-content:center; margin:16px 0;',
    }), ['span', { class: 'text-[10px] font-bold tracking-widest text-[#0075de] bg-white border border-[#93c5fd] px-2 py-0.5 rounded-full' }, 'PAGE BREAK']]
  },
  addCommands() {
    return {
      setPageBreak: () => ({ chain }: any) => chain().insertContent({ type: this.name }).run(),
    } as any
  },
})

// Footnote — inline reference + per-page footnote area (simplified: atom block)
export const Footnote = Node.create({
  name: "footnote",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      content: { default: "Catatan kaki", parseHTML: (el: HTMLElement) => el.getAttribute('data-footnote') || el.textContent || "Catatan kaki", renderHTML: (attrs: any) => ({ 'data-footnote': attrs.content }) },
      number: { default: 1 },
    }
  },
  parseHTML() { return [{ tag: 'div[data-footnote]' }] },
  renderHTML({ node, HTMLAttributes }: any) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-footnote': node.attrs.content,
      class: 'footnote my-3 border-l-4 border-amber-400 bg-amber-50 p-3 rounded-[8px] select-none',
      style: 'border-left:4px solid #f59e0b; background:#fffbeb; padding:12px; border-radius:8px; margin:12px 0;',
    }),
      ['div', { class: 'text-[11px] font-bold text-amber-700 flex items-center gap-1' }, `Footnote ${node.attrs.number || 1} — ${node.attrs.content}`],
      ['div', { class: 'text-[11px] text-amber-800 mt-1' }, 'Akan dirender di atas footer halaman — klik untuk edit']
    ]
  },
})

// Header / Footer editable overlay — stored as separate JSON, rendered as Node placeholder
export const HeaderNode = Node.create({
  name: "docxHeader",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      content: { default: "", parseHTML: (el: HTMLElement) => el.innerHTML || "", renderHTML: (attrs: any) => ({}) },
      variant: { default: "default", parseHTML: (el: HTMLElement) => el.getAttribute('data-variant') || "default", renderHTML: (attrs: any) => ({ 'data-variant': attrs.variant }) },
    }
  },
  parseHTML() { return [{ tag: 'div[data-docx-header]' }] },
  renderHTML({ node }: any) {
    return ['div', { 'data-docx-header': 'true', 'data-variant': node.attrs.variant, class: 'docx-header border-2 border-dashed border-[#0075de]/30 bg-[#0075de]/5 p-3 rounded-[8px] my-2', style: 'border:2px dashed rgba(0,117,222,0.3); background:rgba(0,117,222,0.05); padding:12px; border-radius:8px; margin:12px 0;' },
      ['div', { class: 'text-[11px] font-bold text-[#0075de]' }, `HEADER — ${node.attrs.variant}`],
      ['div', { class: 'prose prose-sm max-w-none text-xs', innerHTML: node.attrs.content || '<em style="color:#9ca3af">Header kosong — double-click untuk edit</em>' }]
    ]
  },
})

export const FooterNode = Node.create({
  name: "docxFooter",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      content: { default: "", parseHTML: (el: HTMLElement) => el.innerHTML || "", renderHTML: (attrs: any) => ({}) },
      variant: { default: "default", parseHTML: (el: HTMLElement) => el.getAttribute('data-variant') || "default", renderHTML: (attrs: any) => ({ 'data-variant': attrs.variant }) },
    }
  },
  parseHTML() { return [{ tag: 'div[data-docx-footer]' }] },
  renderHTML({ node }: any) {
    return ['div', { 'data-docx-footer': 'true', 'data-variant': node.attrs.variant, class: 'docx-footer border-2 border-dashed border-emerald-300 bg-emerald-50 p-3 rounded-[8px] my-2', style: 'border:2px dashed #6ee7b7; background:#ecfdf5; padding:12px; border-radius:8px; margin:12px 0;' },
      ['div', { class: 'text-[11px] font-bold text-emerald-700' }, `FOOTER — ${node.attrs.variant} {page} / {total}`],
      ['div', { class: 'prose prose-sm max-w-none text-xs', innerHTML: node.attrs.content || '<em style="color:#9ca3af">Footer kosong — double-click untuk edit</em>' }]
    ]
  },
})

// Document settings extension — stores page format/margins as global attrs on doc
export const DocxSettings = Extension.create({
  name: "docxSettings",
  addOptions() {
    return {
      pageSize: "A4",
      orientation: "portrait",
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
      pageGap: 20,
      background: "#ffffff",
    }
  },
})

// Helper to get page dimensions
export const PAGE_FORMATS: Record<string, { width: number; height: number; label: string }> = {
  A4: { width: 794, height: 1123, label: "A4 (210×297 mm)" },
  A5: { width: 560, height: 794, label: "A5 (148×210 mm)" },
  A3: { width: 1123, height: 1587, label: "A3 (297×420 mm)" },
  Letter: { width: 816, height: 1056, label: "Letter (8.5×11 in)" },
  Legal: { width: 816, height: 1344, label: "Legal (8.5×14 in)" },
  Tabloid: { width: 1056, height: 1632, label: "Tabloid (11×17 in)" },
}
