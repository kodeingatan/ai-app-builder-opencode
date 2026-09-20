import { Node, mergeAttributes } from "@tiptap/core"

export const InlineBinding = Node.create({
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
