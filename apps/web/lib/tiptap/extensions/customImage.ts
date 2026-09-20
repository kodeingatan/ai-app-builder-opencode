import { mergeAttributes } from "@tiptap/core"
import Image from "@tiptap/extension-image"

export const CustomImage = Image.extend({
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
