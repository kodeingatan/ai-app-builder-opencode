import { Node, mergeAttributes } from "@tiptap/core"

export const ConditionNode = Node.create({
  name: 'conditionNode',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      field: { default: 'status', parseHTML: (el: HTMLElement) => el.getAttribute('data-field') || 'status', renderHTML: (attrs: any) => ({ 'data-field': attrs.field }) },
      operator: { default: 'equals', parseHTML: (el: HTMLElement) => el.getAttribute('data-operator') || 'equals', renderHTML: (attrs: any) => ({ 'data-operator': attrs.operator }) },
      value: { default: 'active', parseHTML: (el: HTMLElement) => el.getAttribute('data-value') || 'active', renderHTML: (attrs: any) => ({ 'data-value': attrs.value }) },
    }
  },
  parseHTML() { return [{ tag: 'div[data-condition]' }] },
  renderHTML({ node, HTMLAttributes }: any) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-condition': 'true',
      'data-field': node.attrs.field,
      'data-operator': node.attrs.operator,
      'data-value': node.attrs.value,
      'class': 'my-3 rounded-[10px] border-2 border-dashed border-violet-400 bg-violet-50 p-3 select-none',
      'style': 'border:2px dashed #8b5cf6;background:#f5f3ff;padding:12px;border-radius:10px;margin:12px 0;',
      'contenteditable': 'false',
    }),
      ['div', { 'class': 'flex items-center gap-2 text-[11px] font-bold text-violet-700' }, `IF ${node.attrs.field} ${node.attrs.operator} "${node.attrs.value}"`],
      ['div', { 'class': 'text-[11px] text-violet-800 mt-1' }, `Condition — hanya tampil jika kondisi terpenuhi`]
    ]
  }
})
