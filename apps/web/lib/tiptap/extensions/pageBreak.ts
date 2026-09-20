import { Node, mergeAttributes } from "@tiptap/core"

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {}
  },
  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }]
  },
  renderHTML({ HTMLAttributes }: any) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'page-break',
      'class': 'page-break my-4 border-t-2 border-dashed border-[#0075de] relative bg-[#eff6ff] h-2 flex items-center justify-center select-none',
      'style': 'border-top:2px dashed #0075de; background:#eff6ff; height:8px; margin:16px 0; page-break-after:always; break-after:page; position:relative; display:flex; align-items:center; justify-content:center;'
    }),
      ['span', { 'class': 'bg-white border border-[#0075de] text-[#0075de] text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full uppercase', 'style': 'background:white; border:1px solid #0075de; color:#0075de; font-size:10px; font-weight:700; letter-spacing:0.1em; padding:2px 8px; border-radius:9999px; text-transform:uppercase;' }, 'Page Break']
    ]
  },
  addCommands() {
    return {
      setPageBreak: () => ({ commands }: any) => commands.insertContent({ type: this.name }),
    } as any
  },
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => (this.editor.commands as any).setPageBreak(),
      'Ctrl-Enter': () => (this.editor.commands as any).setPageBreak(),
    }
  },
})
