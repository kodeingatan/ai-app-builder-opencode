import { Extension } from "@tiptap/core"

export const FontSize = Extension.create({
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
