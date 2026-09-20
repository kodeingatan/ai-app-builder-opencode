/**
 * Document Model — Google Docs inspired
 * Document → Blocks → Inline → Marks
 * Persuratan: Template (Page Document) vs Component (Fragment)
 */

export type PaperSize = "A4" | "Letter" | "Legal" | "Custom"
export type Orientation = "portrait" | "landscape"

export interface PageMargins {
  top: number    // mm
  right: number  // mm
  bottom: number // mm
  left: number   // mm
}

export interface WatermarkConfig {
  text: string
  opacity: number // 0-1
  rotation: number // degrees, e.g. -30
  color?: string
}

export interface PageConfig {
  paper: PaperSize
  orientation: Orientation
  margins: PageMargins
  isPageless: boolean
  zoom: number // 50..200
  customWidthMm?: number  // if paper=Custom
  customHeightMm?: number // if paper=Custom
  headerHtml?: string
  footerHtml?: string
  showRuler?: boolean
  watermark?: WatermarkConfig | null
  // future: columns, headerHeight, footerHeight
}

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  paper: "A4",
  orientation: "portrait",
  margins: { top: 25, right: 20, bottom: 20, left: 20 },
  isPageless: false,
  zoom: 90,
  showRuler: true,
  watermark: null,
}

export function parsePageConfig(raw: string | null | undefined): PageConfig {
  if (!raw) return { ...DEFAULT_PAGE_CONFIG }
  try {
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_PAGE_CONFIG,
      ...parsed,
      margins: { ...DEFAULT_PAGE_CONFIG.margins, ...(parsed.margins || {}) },
      watermark: parsed.watermark ?? null,
    }
  } catch {
    return { ...DEFAULT_PAGE_CONFIG }
  }
}

export function getPageDimensionsMm(config: PageConfig): { width: number; height: number } {
  let w: number, h: number
  switch (config.paper) {
    case "A4": w = 210; h = 297; break
    case "Letter": w = 215.9; h = 279.4; break
    case "Legal": w = 215.9; h = 355.6; break
    case "Custom": w = config.customWidthMm ?? 210; h = config.customHeightMm ?? 297; break
    default: w = 210; h = 297
  }
  if (config.orientation === "landscape") {
    const tmp = w; w = h; h = tmp
  }
  return { width: w, height: h }
}

export function getContentWidthMm(config: PageConfig): number {
  const { width } = getPageDimensionsMm(config)
  return width - config.margins.left - config.margins.right
}

// Document outline helpers
export interface OutlineItem {
  id: string
  level: number // 1..6
  text: string
  pos: number // tiptap pos
}

export interface WordCount {
  words: number
  characters: number
  charactersWithoutSpaces: number
  paragraphs: number
  pagesEstimate: number // ~500 words per page
}

export function countWords(text: string): WordCount {
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
  const characters = text.length
  const charactersWithoutSpaces = text.replace(/\s/g, "").length
  const paragraphs = text ? text.split(/\n+/).filter(s => s.trim()).length : 0
  return {
    words,
    characters,
    charactersWithoutSpaces,
    paragraphs,
    pagesEstimate: Math.max(1, Math.ceil(words / 500)),
  }
}
