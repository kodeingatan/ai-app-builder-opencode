import { Extension } from "@tiptap/core"

export const LINE_HEIGHTS = [
  { label: "Tunggal", value: "1" },
  { label: "1,15", value: "1.15" },
  { label: "1,5", value: "1.5" },
  { label: "Ganda", value: "2" },
]

export const SpacingExtension = Extension.create({
  name: "spacing",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.lineHeight || null,
            renderHTML: (attrs: any) => {
              if (!attrs.lineHeight) return {}
              return { style: `line-height: ${attrs.lineHeight}` }
            },
          },
          marginTop: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.marginTop || null,
            renderHTML: (attrs: any) => {
              if (!attrs.marginTop) return {}
              return { style: `margin-top: ${attrs.marginTop}` }
            },
          },
          marginBottom: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.marginBottom || null,
            renderHTML: (attrs: any) => {
              if (!attrs.marginBottom) return {}
              return { style: `margin-bottom: ${attrs.marginBottom}` }
            },
          },
          pageBreakBefore: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.breakBefore || (el.style as any).pageBreakBefore || null,
            renderHTML: (attrs: any) => {
              if (!attrs.pageBreakBefore) return {}
              return { style: `break-before: page; page-break-before: always` }
            },
          },
          keepWithNext: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.pageBreakAfter === "avoid" || (el.style as any).breakAfter === "avoid" ? "avoid" : null,
            renderHTML: (attrs: any) => {
              if (!attrs.keepWithNext) return {}
              return { style: `page-break-after: avoid; break-after: avoid` }
            },
          },
          keepTogether: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.breakInside === "avoid" || (el.style as any).pageBreakInside === "avoid" ? "avoid" : null,
            renderHTML: (attrs: any) => {
              if (!attrs.keepTogether) return {}
              return { style: `break-inside: avoid; page-break-inside: avoid` }
            },
          },
          widowControl: {
            default: true,
            parseHTML: (el: HTMLElement) => {
              const orphans = (el.style as any).orphans
              const widows = (el.style as any).widows
              if (orphans === "2" || widows === "2") return true
              // check data attribute
              if (el.getAttribute("data-widow") === "true") return true
              // default true via CSS, parse as true if not explicitly 1
              // we treat missing as true (active bawaan)
              const hasExplicitOff = el.getAttribute("data-widow") === "false"
              if (hasExplicitOff) return false
              return true
            },
            renderHTML: (attrs: any) => {
              if (attrs.widowControl === false) return { "data-widow": "false", style: "orphans: 1; widows: 1" }
              // default true -> render orphans 2 widows 2
              return { "data-widow": "true", style: "orphans: 2; widows: 2" }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }: any) => {
          // apply to paragraph/heading currently active
          return commands.updateAttributes("paragraph", { lineHeight }) || commands.updateAttributes("heading", { lineHeight })
        },
      unsetLineHeight:
        () =>
        ({ commands }: any) => {
          return commands.updateAttributes("paragraph", { lineHeight: null }) || commands.updateAttributes("heading", { lineHeight: null })
        },
    } as any
  },
})
