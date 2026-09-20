import { Node, mergeAttributes } from "@tiptap/core"

export const ComponentBinding = Node.create({
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
