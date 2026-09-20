"use client"
import React, { useEffect, useState } from "react"
import { OutlineItem } from "@/lib/editor/model/types"
import { ListTree, ChevronRight } from "lucide-react"

interface EditorOutlineProps {
  editor: any | null
  className?: string
}

export function EditorOutline({ editor, className }: EditorOutlineProps) {
  const [items, setItems] = useState<OutlineItem[]>([])

  const refresh = React.useCallback(() => {
    if (!editor) { setItems([]); return }
    try {
      const out: OutlineItem[] = []
      const doc = editor.state.doc
      doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level as number
          const text = node.textContent?.trim() || `Heading ${level}`
          if (text) out.push({ id: `h-${pos}`, level, text: text.slice(0, 80), pos })
        }
        return true
      })
      setItems(out)
    } catch {
      setItems([])
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    refresh()
    const handler = () => refresh()
    editor.on('update', handler)
    editor.on('selectionUpdate', handler)
    // also transaction
    return () => {
      try { editor.off('update', handler); editor.off('selectionUpdate', handler) } catch {}
    }
  }, [editor, refresh])

  const scrollTo = (pos: number) => {
    if (!editor) return
    try {
      editor.chain().focus().setTextSelection(pos).run()
      // ensure visible
      const dom = editor.view.dom as HTMLElement
      const coords = editor.view.coordsAtPos(pos)
      window.scrollTo({ top: coords.top - 120, behavior: 'smooth' })
    } catch {}
  }

  if (items.length === 0) {
    return (
      <div className={`rounded-[12px] border border-dashed border-[#e6e6e6] bg-[#fafafa] p-4 ${className || ""}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7280] mb-2">
          <ListTree size={14} /> Outline
        </div>
        <p className="text-[11px] text-[#9ca3af] leading-relaxed">
          Belum ada heading. Gunakan <span className="font-mono bg-white border px-1 rounded">H1</span>–<span className="font-mono bg-white border px-1 rounded">H3</span> untuk membuat daftar isi otomatis.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-[12px] border border-[#e6e6e6] bg-white overflow-hidden ${className || ""}`}>
      <div className="px-4 py-3 border-b border-[#e6e6e6] flex items-center gap-2">
        <ListTree size={14} className="text-[#0075de]" />
        <span className="text-xs font-bold tracking-wide uppercase text-[#374151]">Outline</span>
        <span className="ml-auto text-[11px] bg-[#f6f5f4] border border-[#e6e6e6] px-1.5 py-0.5 rounded-full font-mono">{items.length}</span>
      </div>
      <div className="max-h-[320px] overflow-y-auto p-2 space-y-0.5">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => scrollTo(it.pos)}
            className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-[8px] hover:bg-[#f6f5f4] group"
            style={{ paddingLeft: `${8 + (it.level - 1) * 12}px` }}
            title={it.text}
          >
            <ChevronRight size={12} className="text-[#d1d5db] group-hover:text-[#0075de] shrink-0" />
            <span className={`truncate text-xs ${it.level === 1 ? "font-bold text-[#111827]" : it.level === 2 ? "font-semibold text-[#374151]" : "text-[#6b7280]"}`}>
              {it.text}
            </span>
            <span className="ml-auto text-[10px] font-mono text-[#9ca3af] shrink-0">H{it.level}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
