import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"

export function buildBorderPositionStyle(attrs: any): string {
  const pos = attrs.borderPosition
  if (!pos || pos === 'all') return ''
  const color = attrs.borderColor || '#e6e6e6'
  const width = attrs.borderWidth || '1px'
  const style = attrs.borderStyle || 'solid'
  const bw = `${width} ${style} ${color}`
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
    case 'outer': return `border: ${bw}`
    default: return ''
  }
}

export const CustomTableCell = TableCell.extend({
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

export const CustomTableHeader = TableHeader.extend({
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

export const CustomTableRow = TableRow.extend({
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
