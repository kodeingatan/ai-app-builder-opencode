"use client"
import React, { useEffect, useState } from "react"
import { Search, X, ChevronUp, ChevronDown, Replace } from "lucide-react"

interface FindBarProps {
  editor: any | null
  open: boolean
  onClose: () => void
}

export function FindBar({ editor, open, onClose }: FindBarProps) {
  const [query, setQuery] = useState("")
  const [replace, setReplace] = useState("")
  const [matchCount, setMatchCount] = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)

  // Simple text search via editor.getText()
  const computeMatches = React.useCallback(() => {
    if (!editor || !query) { setMatchCount(0); setCurrentIdx(0); return }
    try {
      const text: string = editor.getText()
      const lower = text.toLowerCase()
      const q = query.toLowerCase()
      let count = 0
      let idx = 0
      while ((idx = lower.indexOf(q, idx)) !== -1) { count++; idx += q.length }
      setMatchCount(count)
    } catch {
      setMatchCount(0)
    }
  }, [editor, query])

  useEffect(() => { computeMatches() }, [computeMatches])

  const handleFind = (dir: 1 | -1) => {
    if (!editor || !query) return
    try {
      const text: string = editor.getText()
      const lower = text.toLowerCase()
      const q = query.toLowerCase()
      // get current cursor pos approx via text offset
      const from = editor.state.selection.from
      // We map doc pos to text offset roughly via getText length up to from
      // Simpler: use doc.textBetween
      const full = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\n")
      const lowerFull = full.toLowerCase()
      let nextIdx = -1
      if (dir === 1) {
        // find next after current
        // estimate offset
        const before = editor.state.doc.textBetween(0, from, "\n", "\n").length
        nextIdx = lowerFull.indexOf(q, before + 1)
        if (nextIdx === -1) nextIdx = lowerFull.indexOf(q, 0) // wrap
      } else {
        const before = editor.state.doc.textBetween(0, from, "\n", "\n").length
        nextIdx = lowerFull.lastIndexOf(q, Math.max(0, before - 1))
        if (nextIdx === -1) nextIdx = lowerFull.lastIndexOf(q)
      }
      if (nextIdx === -1) return
      // convert text offset to doc pos: iterate
      let pos = 0
      let textOffset = 0
      let foundPos = 1
      editor.state.doc.descendants((node: any, p: number) => {
        if (node.isText) {
          const t = node.text as string
          if (textOffset <= nextIdx && nextIdx < textOffset + t.length) {
            foundPos = p + (nextIdx - textOffset) + 1
            return false
          }
          textOffset += t.length
        } else if (node.type.name === 'paragraph' || node.type.name === 'heading') {
          // account for newline
          if (textOffset < lowerFull.length && lowerFull[textOffset] === "\n") {
            // newline between blocks
          }
        }
        return true
      })
      editor.chain().focus().setTextSelection({ from: foundPos, to: foundPos + query.length } as any).run()
      // update current idx approx
      const allIdx: number[] = []
      let i = 0
      while ((i = lowerFull.indexOf(q, i)) !== -1) { allIdx.push(i); i += q.length }
      const cur = allIdx.indexOf(nextIdx)
      setCurrentIdx(cur >= 0 ? cur + 1 : 1)
    } catch {}
  }

  const handleReplaceOne = () => {
    if (!editor || !query) return
    try {
      const { from, to } = editor.state.selection
      const selected = editor.state.doc.textBetween(from, to, "", "")
      if (selected.toLowerCase() === query.toLowerCase()) {
        editor.chain().focus().insertContent(replace).run()
      }
      handleFind(1)
    } catch {}
  }

  const handleReplaceAll = () => {
    if (!editor || !query) return
    try {
      const docText: string = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\n")
      // Use prosemirror transform: simple replace via HTML?
      // Fallback: getHTML and string replace (preserves marks partially via HTML)
      const html: string = editor.getHTML()
      // Escape query for plain HTML text replace — but we do simple case
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(escaped, 'gi')
      const newHtml = html.replace(re, replace)
      editor.commands.setContent(newHtml)
    } catch {}
  }

  if (!open) return null

  return (
    <div className="bg-white border border-[#e6e6e6] rounded-[10px] shadow-sm p-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[8px] px-2.5 py-1.5">
          <Search size={14} className="text-[#9ca3af] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFind(1) }}
            placeholder="Find (Ctrl+F)"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-[#9ca3af]"
            autoFocus
          />
          {query && (
            <span className="text-[11px] font-mono text-[#6b7280] bg-white border px-1.5 py-0.5 rounded-full shrink-0">
              {matchCount ? `${currentIdx || 1}/${matchCount}` : "0"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => handleFind(-1)} className="w-7 h-7 grid place-items-center rounded hover:bg-[#f6f5f4] border border-[#e6e6e6]" title="Previous (Shift+Enter)">
            <ChevronUp size={14} />
          </button>
          <button onClick={() => handleFind(1)} className="w-7 h-7 grid place-items-center rounded hover:bg-[#f6f5f4] border border-[#e6e6e6]" title="Next (Enter)">
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[8px] px-2.5 py-1.5">
          <Replace size={14} className="text-[#9ca3af] shrink-0" />
          <input
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="Replace (Ctrl+H)"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-[#9ca3af]"
            onKeyDown={(e) => { if (e.key === 'Enter') handleReplaceOne() }}
          />
        </div>
        <button onClick={handleReplaceOne} className="px-3 py-1.5 rounded-[8px] bg-white border border-[#e6e6e6] text-xs font-semibold hover:bg-[#f6f5f4]">Replace</button>
        <button onClick={handleReplaceAll} className="px-3 py-1.5 rounded-[8px] bg-[#0075de] text-white text-xs font-semibold hover:bg-[#0066c4]">All</button>
        <button onClick={onClose} className="w-7 h-7 grid place-items-center rounded hover:bg-[#f6f5f4]">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

// Inline Replace icon fallback if lucide doesn't have Replace
function ReplaceIcon(props: any) {
  return <Search {...props} />
}
