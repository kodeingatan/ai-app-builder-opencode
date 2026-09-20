import { Node, mergeAttributes } from "@tiptap/core"

export const RepeaterNode = Node.create({
  name: 'repeaterNode',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      source: { default: 'employees', parseHTML: (el: HTMLElement) => el.getAttribute('data-source') || 'employees', renderHTML: (attrs: any) => ({ 'data-source': attrs.source }) },
      item: { default: 'item', parseHTML: (el: HTMLElement) => el.getAttribute('data-item') || 'item', renderHTML: (attrs: any) => ({ 'data-item': attrs.item }) },
      label: { default: null }
    }
  },
  parseHTML() { return [{ tag: 'div[data-repeater]' }] },
  renderHTML({ node, HTMLAttributes }: any) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-repeater': 'true',
      'data-source': node.attrs.source,
      'data-item': node.attrs.item,
      'class': 'my-3 rounded-[10px] border-2 border-dashed border-amber-400 bg-amber-50 p-3 select-none',
      'style': 'border:2px dashed #f59e0b;background:#fffbeb;padding:12px;border-radius:10px;margin:12px 0;',
      'contenteditable': 'false',
    }),
      ['div', { 'class': 'flex items-center gap-2 text-[11px] font-bold text-amber-700' }, `REPEATER: for ${node.attrs.item} in ${node.attrs.source}`],
      ['div', { 'class': 'text-[11px] text-amber-800 mt-1' }, `Loop — akan diulang untuk setiap baris ${node.attrs.source}`]
    ]
  }
})
