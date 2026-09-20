"use client"
import { useEffect, useState, useRef } from "react"
import { Check, Rows3, SlidersHorizontal, ChevronDown, FileText } from "lucide-react"

type Props = {
  editor: any
  tick?: number
}

export default function SpacingDropdown({ editor }: Props) {
  const [open, setOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customLineHeight, setCustomLineHeight] = useState("1.5")
  const [customBefore, setCustomBefore] = useState("0")
  const [customAfter, setCustomAfter] = useState("8")
  const [, forceUpdate] = useState({})
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return
    const handler = () => forceUpdate({})
    editor.on('transaction', handler)
    editor.on('selectionUpdate', handler)
    return () => {
      editor.off('transaction', handler)
      editor.off('selectionUpdate', handler)
    }
  }, [editor])

  const getAttrs = () => {
    if (!editor) return {}
    const p = editor.getAttributes('paragraph') as any
    const h = editor.getAttributes('heading') as any
    const cur = editor.isActive('heading') ? h : p
    return cur || p || h || {}
  }

  const attrs = getAttrs()
  const lineHeight = attrs.lineHeight || "1"
  const marginTop = attrs.marginTop || ""
  const marginBottom = attrs.marginBottom || ""
  const keepWithNext = !!attrs.keepWithNext
  const keepTogether = !!attrs.keepTogether
  const widowControl = attrs.widowControl !== false // default true
  const pageBreakBefore = !!attrs.pageBreakBefore

  const isSpacingBefore = marginTop && marginTop !== "0px" && marginTop !== "0"
  const isSpacingAfter = marginBottom && marginBottom !== "0px" && marginBottom !== "0"

  // outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setCustomOpen(false) } }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onEsc) }
  }, [open])

  const setLineHeight = (v: string) => {
    if (!editor) return
    // apply to paragraph and heading (both)
    editor.chain().focus().updateAttributes('paragraph', { lineHeight: v === "1" ? null : v }).updateAttributes('heading', { lineHeight: v === "1" ? null : v }).run()
  }

  const toggleBefore = () => {
    const newVal = isSpacingBefore ? null : "12px"
    editor.chain().focus().updateAttributes('paragraph', { marginTop: newVal }).updateAttributes('heading', { marginTop: newVal }).run()
  }
  const toggleAfter = () => {
    const newVal = isSpacingAfter ? null : "12px"
    editor.chain().focus().updateAttributes('paragraph', { marginBottom: newVal }).updateAttributes('heading', { marginBottom: newVal }).run()
  }

  const applyCustom = () => {
    const lh = customLineHeight.trim() || "1"
    const before = customBefore.trim() === "0" || customBefore.trim() === "" ? null : `${parseInt(customBefore, 10)}px`
    const after = customAfter.trim() === "0" || customAfter.trim() === "" ? null : `${parseInt(customAfter, 10)}px`
    editor.chain().focus().updateAttributes('paragraph', { lineHeight: lh === "1" ? null : lh, marginTop: before, marginBottom: after }).updateAttributes('heading', { lineHeight: lh === "1" ? null : lh, marginTop: before, marginBottom: after }).run()
    setCustomOpen(false)
    setOpen(false)
  }

  const toggleKeepWithNext = () => {
    const v = !keepWithNext ? "avoid" : null
    editor.chain().focus().updateAttributes('paragraph', { keepWithNext: v }).updateAttributes('heading', { keepWithNext: v }).run()
  }
  const toggleKeepTogether = () => {
    const v = !keepTogether ? "avoid" : null
    editor.chain().focus().updateAttributes('paragraph', { keepTogether: v }).updateAttributes('heading', { keepTogether: v }).run()
  }
  const toggleWidow = () => {
    const v = !widowControl
    editor.chain().focus().updateAttributes('paragraph', { widowControl: v }).updateAttributes('heading', { widowControl: v }).run()
  }
  const togglePageBreak = () => {
    const v = !pageBreakBefore ? "page" : null
    editor.chain().focus().updateAttributes('paragraph', { pageBreakBefore: v }).updateAttributes('heading', { pageBreakBefore: v }).run()
  }

  // label for button
  const lineLabel = lineHeight === "1" ? "Tunggal" : lineHeight === "1.15" ? "1,15" : lineHeight === "1.5" ? "1,5" : lineHeight === "2" ? "Ganda" : `${lineHeight}`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`h-7 px-2.5 rounded-[6px] border flex items-center gap-1.5 text-xs font-medium transition-colors ${open ? "bg-[#0075de] text-white border-[#0075de] shadow-sm" : "bg-white border-[#e6e6e6] hover:bg-[#f6f5f4] text-[#374151]"}`}
        title="Pengaturan Jarak Baris & Paragraf"
      >
        <Rows3 size={13} />
        <span className="hidden sm:inline">Jarak</span>
        <span className="hidden lg:inline text-[11px] font-normal text-[#6b7280] bg-[#f6f5f4] px-1 py-0.5 rounded ml-1 group-[.bg-[#0075de]]:bg-white/20">{lineLabel}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[320px] bg-white border border-[#e6e6e6] rounded-[12px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
          {/* Kelompok 1 */}
          <div className="p-2">
            <div className="px-2 py-1.5 flex items-center gap-1.5">
              <Rows3 size={12} className="text-[#0075de]" />
              <span className="text-[11px] font-bold tracking-wide text-[#111] uppercase">Jarak Antar Baris</span>
              <span className="text-[11px] text-[#9ca3af]">• di dalam paragraf</span>
            </div>
            <div className="space-y-0.5">
              {[
                { label: "Tunggal", value: "1", desc: "1.0 — rapat" },
                { label: "1,15", value: "1.15", desc: "1.15 — longgar" },
                { label: "1,5", value: "1.5", desc: "1.5 — dokumen resmi" },
                { label: "Ganda", value: "2", desc: "2.0 — lebar" },
              ].map(opt => {
                const active = lineHeight === opt.value || (lineHeight === "1" && opt.value === "1" && !attrs.lineHeight)
                // for default, lineHeight null should count as Tunggal
                const isActive = opt.value === "1" ? (lineHeight === "1" || !attrs.lineHeight) : lineHeight === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setLineHeight(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-colors ${isActive ? "bg-[#0075de] text-white shadow-sm" : "hover:bg-[#f6f5f4] text-[#374151]"}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-[#f6f5f4] text-[#6b7280]"}`}>{opt.value === "1" ? "1" : opt.value.replace(".", ",")}</span>
                      <span className="font-medium">{opt.label}</span>
                      <span className={`text-[11px] ${isActive ? "text-white/70" : "text-[#9ca3af]"}`}>— {opt.desc}</span>
                    </span>
                    {isActive && <Check size={14} className="text-white" />}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="h-px bg-[#e6e6e6] mx-2" />
          {/* Kelompok 2 */}
          <div className="p-2">
            <div className="px-2 py-1.5 flex items-center gap-1.5">
              <SlidersHorizontal size={12} className="text-[#0075de]" />
              <span className="text-[11px] font-bold tracking-wide text-[#111] uppercase">Jarak Antar Paragraf</span>
              <span className="text-[11px] text-[#9ca3af]">• luar paragraf</span>
            </div>
            <div className="space-y-0.5">
              <button onClick={toggleBefore} className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-colors ${isSpacingBefore ? "bg-[#0075de] text-white shadow-sm" : "hover:bg-[#f6f5f4] text-[#374151]"}`}>
                <span>Tambahkan spasi sebelum paragraf</span>
                {isSpacingBefore && <Check size={14} />}
              </button>
              <button onClick={toggleAfter} className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-colors ${isSpacingAfter ? "bg-[#0075de] text-white shadow-sm" : "hover:bg-[#f6f5f4] text-[#374151]"}`}>
                <span>Tambahkan spasi sesudah paragraf</span>
                {isSpacingAfter && <Check size={14} />}
              </button>
              <button onClick={() => setCustomOpen(!customOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-colors ${customOpen ? "bg-[#111827] text-white" : "hover:bg-[#f6f5f4] text-[#374151] border border-dashed border-[#e6e6e6]"}`}>
                <span className="flex items-center gap-1.5"><SlidersHorizontal size={12} /> Spasi kustom</span>
                <ChevronDown size={12} className={`${customOpen ? "rotate-180" : ""} transition-transform`} />
              </button>
              {customOpen && (
                <div className="mx-1 mt-1 p-3 rounded-[10px] border border-[#e6e6e6] bg-[#fafafa] space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#374151]">Jarak baris</label>
                      <select value={customLineHeight} onChange={e=>setCustomLineHeight(e.target.value)} className="mt-1 w-full h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-2 bg-white">
                        <option value="1">Tunggal (1)</option><option value="1.15">1,15</option><option value="1.5">1,5</option><option value="2">Ganda (2)</option><option value="1.2">1,2</option><option value="1.8">1,8</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#374151]">Sebelum (px)</label>
                      <input type="number" value={customBefore} onChange={e=>setCustomBefore(e.target.value)} className="mt-1 w-full h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-2 bg-white" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#374151]">Sesudah (px)</label>
                      <input type="number" value={customAfter} onChange={e=>setCustomAfter(e.target.value)} className="mt-1 w-full h-7 text-xs border border-[#e6e6e6] rounded-[6px] px-2 bg-white" placeholder="8" />
                    </div>
                  </div>
                  <button onClick={applyCustom} className="w-full h-7 rounded-[6px] bg-[#0075de] text-white text-xs font-medium hover:bg-[#0063be]">Terapkan Kustom</button>
                </div>
              )}
            </div>
          </div>
          <div className="h-px bg-[#e6e6e6] mx-2" />
          {/* Kelompok 3 */}
          <div className="p-2">
            <div className="px-2 py-1.5 flex items-center gap-1.5">
              <FileText size={12} className="text-[#0075de]" />
              <span className="text-[11px] font-bold tracking-wide text-[#111] uppercase">Aturan Halaman</span>
            </div>
            <div className="space-y-0.5">
              <button onClick={toggleKeepWithNext} className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-colors ${keepWithNext ? "bg-[#0075de] text-white shadow-sm" : "hover:bg-[#f6f5f4] text-[#374151]"}`}>
                <span>Satukan dengan berikutnya</span>
                {keepWithNext && <Check size={14} />}
              </button>
              <button onClick={toggleKeepTogether} className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-colors ${keepTogether ? "bg-[#0075de] text-white shadow-sm" : "hover:bg-[#f6f5f4] text-[#374151]"}`}>
                <span>Satukan baris</span>
                {keepTogether && <Check size={14} />}
              </button>
              <button onClick={toggleWidow} className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-colors ${widowControl ? "bg-[#0075de] text-white shadow-sm" : "hover:bg-[#f6f5f4] text-[#374151] border border-amber-200 bg-amber-50"}`}>
                <span>Cegah baris tunggal</span>
                {widowControl ? <Check size={14} /> : <span className="text-[11px] text-amber-700">Off</span>}
              </button>
              <button onClick={togglePageBreak} className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-colors ${pageBreakBefore ? "bg-[#111827] text-white shadow-sm" : "hover:bg-[#f6f5f4] text-[#374151] border border-dashed border-[#e6e6e6]"}`}>
                <span>Tambahkan batas halaman sebelum</span>
                {pageBreakBefore && <Check size={14} />}
              </button>
            </div>
          </div>
          <div className="px-3 py-2 bg-[#f9fafb] border-t border-[#e6e6e6] text-[11px] text-[#6b7280] flex items-center gap-1.5">
            <FileText size={11} /> Urutan tidak boleh diubah • garis pemisah wajib • centang = aktif
          </div>
        </div>
      )}
    </div>
  )
}
