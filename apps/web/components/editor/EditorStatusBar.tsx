"use client"
import React, { useMemo } from "react"
import { WordCount, countWords } from "@/lib/editor/model/types"
import { FileText, Save, ZoomIn, ZoomOut } from "lucide-react"

interface EditorStatusBarProps {
  editor: any | null
  pageConfig?: { zoom?: number } | null
  variant?: "page" | "continuous"
  saved?: boolean // true = Saved, false = Saving...
  onZoomChange?: (z: number) => void
  wordCountOverride?: WordCount | null // if provided, use instead of editor text
}

export function EditorStatusBar({ editor, pageConfig, variant = "page", saved = true, onZoomChange, wordCountOverride }: EditorStatusBarProps) {
  const wc: WordCount | null = useMemo(() => {
    if (wordCountOverride) return wordCountOverride
    if (!editor) return null
    try {
      const text: string = editor.getText ? editor.getText() : ""
      return countWords(text)
    } catch {
      return null
    }
  }, [editor, wordCountOverride])

  const zoom = pageConfig?.zoom ?? 90

  return (
    <div className="h-7 bg-white border border-[#e6e6e6] rounded-[8px] px-2.5 flex items-center justify-between text-[11px] text-[#6b7280] gap-1.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="inline-flex items-center gap-1.5">
          <FileText size={12} className="text-[#9ca3af]" />
          {wc ? (
            <>
              <span className="font-medium text-[#374151]">{wc.words} kata</span>
              <span className="hidden sm:inline">· {wc.characters} karakter</span>
              <span className="hidden md:inline">· {wc.paragraphs} paragraf</span>
              {variant === "page" && <span className="hidden lg:inline">· ~{wc.pagesEstimate} hal</span>}
            </>
          ) : (
            <span>—</span>
          )}
        </span>
        <span className={`hidden sm:inline-flex items-center gap-1 ${saved ? "text-emerald-600" : "text-amber-600"}`}>
          <Save size={12} />
          {saved ? "Tersimpan" : "Menyimpan..."}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {variant === "page" && onZoomChange && (
          <div className="flex items-center gap-1 bg-[#f6f5f4] rounded-full p-0.5 border border-[#e6e6e6]">
            <button
              onClick={() => onZoomChange(Math.max(50, zoom - 10))}
              className="w-6 h-6 rounded-full hover:bg-white border border-transparent hover:border-[#e6e6e6] flex items-center justify-center"
              title="Zoom out (Ctrl -)"
            >
              <ZoomOut size={12} />
            </button>
            <span className="text-[11px] font-mono font-semibold min-w-[40px] text-center">{zoom}%</span>
            <button
              onClick={() => onZoomChange(Math.min(200, zoom + 10))}
              className="w-6 h-6 rounded-full hover:bg-white border border-transparent hover:border-[#e6e6e6] flex items-center justify-center"
              title="Zoom in (Ctrl +)"
            >
              <ZoomIn size={12} />
            </button>
          </div>
        )}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${variant === "continuous" ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-[#f6f5f4] border-[#e6e6e6] text-[#6b7280]"}`}>
          {variant === "continuous" ? "Fragment · tanpa kertas" : pageConfig ? `${zoom}%` : "—"}
        </span>
      </div>
    </div>
  )
}
