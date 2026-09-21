import { mergeAttributes } from "@tiptap/core"
import Image from "@tiptap/extension-image"
import type { CSSProperties } from "react"

export type ImageLayout = "inline" | "square" | "tight" | "through" | "topBottom" | "behind" | "front"

export const IMAGE_LAYOUTS: { id: ImageLayout; label: string; tooltip: string }[] = [
  { id: "inline", label: "In Line", tooltip: "In Line with Text — gambar sejajar baris teks" },
  { id: "square", label: "Square", tooltip: "Square — teks mengelilingi sisi gambar" },
  { id: "tight", label: "Tight", tooltip: "Tight — teks rapat mengikuti gambar" },
  { id: "through", label: "Through", tooltip: "Through — teks mengisi sisi gambar" },
  { id: "topBottom", label: "Top & Bottom", tooltip: "Top and Bottom — teks di atas & bawah gambar" },
  { id: "behind", label: "Behind", tooltip: "Behind Text — gambar di belakang teks" },
  { id: "front", label: "Front", tooltip: "In Front of Text — gambar di depan teks" },
]

// Gaya <img> per layout (dipakai NodeView + export HTML)
export function imgLayoutStyleObj(layout: ImageLayout): CSSProperties {
  switch (layout) {
    case "square":
      return { float: "left", margin: "8px 12px 8px 0", maxWidth: "50%" }
    case "tight":
      return { float: "left", margin: "3px 8px 3px 0", maxWidth: "50%" }
    case "through":
      return { float: "left", margin: "0 6px 0 0", maxWidth: "50%" }
    case "topBottom":
      return { display: "block", clear: "both", margin: "12px auto" }
    default:
      return { display: "inline-block", verticalAlign: "middle" }
  }
}

function styleObjToCss(style: CSSProperties): string {
  return Object.entries(style)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(";")
}

// Wrapper zero-size untuk behind/front (teks mengalir tembus, gambar di belakang/depan)
export const IMG_BEHIND_WRAP_CSS =
  "position:relative;display:inline-block;width:0;height:0;vertical-align:middle;line-height:0;isolation:isolate;"

function readSize(img: Element): { width: number | null; height: number | null } {
  const el = img as HTMLElement
  const sw = el.style.width ? parseInt(el.style.width) : null
  const sh = el.style.height ? parseInt(el.style.height) : null
  const aw = img.getAttribute("width") ? Number(img.getAttribute("width")) : null
  const ah = img.getAttribute("height") ? Number(img.getAttribute("height")) : null
  return {
    width: sw != null && !isNaN(sw) ? sw : aw,
    height: sh != null && !isNaN(sh) ? sh : ah,
  }
}

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      layout: {
        default: "inline",
        parseHTML: (el: HTMLElement) =>
          (el.getAttribute && (el.getAttribute("data-layout") || el.getAttribute("data-imglayout"))) || "inline",
        renderHTML: (attrs: any) =>
          attrs.layout && attrs.layout !== "inline" ? { "data-layout": attrs.layout } : {},
      },
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
        // Wrapper behind/front: <span data-imglayout><img/></span>
        tag: 'span[data-imglayout]',
        getAttrs: (el: HTMLElement) => {
          const img = el.querySelector('img')
          if (!img) return false
          const binding = img.getAttribute('data-binding')
          const { width, height } = readSize(img)
          const src = img.getAttribute('src') || ''
          return {
            src: src.startsWith('{{') && binding
              ? `https://via.placeholder.com/${width || 200}x${height || 120}?text=${encodeURIComponent(binding)}`
              : src,
            alt: img.getAttribute('alt') || (binding ? `{{${binding}}}` : ''),
            'data-binding': binding,
            width,
            height,
            layout: el.getAttribute('data-imglayout') || 'inline',
          } as any
        }
      },
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
            layout: el.getAttribute('data-layout') || 'inline',
          } as any
        }
      },
      {
        tag: 'img[src]:not([data-binding])',
        getAttrs: (el: HTMLElement) => ({ layout: el.getAttribute('data-layout') || 'inline' } as any),
      }
    ]
  },
  renderHTML({ HTMLAttributes }: any) {
    const binding = HTMLAttributes['data-binding']
    const layout = (HTMLAttributes.layout || 'inline') as ImageLayout
    const { layout: _omit, ...rest } = HTMLAttributes
    const w = rest.width || 200
    const h = rest.height || 120
    const sizeCss = `${rest.width ? `width:${rest.width}px;` : ''}${rest.height ? `height:${rest.height}px;` : ''}max-width:100%;`
    const layoutCss = styleObjToCss(imgLayoutStyleObj(layout))
    if (binding) {
      const imgAttrs = mergeAttributes(rest, {
        src: `{{${binding}}}`,
        alt: `{{${binding}}}`,
        'data-binding': binding,
        style: `width:${w}px; height:${h}px; border:1px dashed #3b82f6; background:#eff6ff; display:inline-block; border-radius:8px; object-fit:cover;${layoutCss}`,
        class: 'rounded-[8px] border border-dashed border-[#3b82f6] bg-[#eff6ff] mx-1 align-middle'
      })
      if (layout === 'behind' || layout === 'front') {
        return ['span', { style: IMG_BEHIND_WRAP_CSS, 'data-imglayout': layout, class: 'tiptap-imgwrap' },
          ['img', mergeAttributes(imgAttrs, { style: `position:absolute;left:0;top:0;z-index:${layout === 'behind' ? -1 : 10};width:${w}px;height:${h}px;` })]]
      }
      return ['img', imgAttrs]
    }
    const imgAttrs = mergeAttributes(rest, {
      class: 'rounded-[8px] max-w-full',
      style: `${sizeCss}${layoutCss}`,
    })
    if (layout === 'behind' || layout === 'front') {
      return ['span', { style: IMG_BEHIND_WRAP_CSS, 'data-imglayout': layout, class: 'tiptap-imgwrap' },
        ['img', mergeAttributes(imgAttrs, { style: `${sizeCss}position:absolute;left:0;top:0;z-index:${layout === 'behind' ? -1 : 10};` })]]
    }
    return ['img', imgAttrs]
  },
})
