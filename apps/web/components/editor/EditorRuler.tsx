"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PageConfig, getPageDimensionsMm } from "@/lib/editor/model/types"

interface EditorRulerProps {
  pageConfig: PageConfig
  onMarginsChange?: (m: { left: number; right: number }) => void
  editor?: any | null
  tick?: number
  className?: string
}

type TabStop = { id: number; mm: number; align: "left" | "center" | "right" }

const PX_PER_MM = 3.78

function parseCssToMm(v: string | null | undefined): number {
  if (!v) return 0
  const s = String(v).trim()
  if (s.endsWith("px")) return parseFloat(s) / PX_PER_MM
  if (s.endsWith("mm")) return parseFloat(s)
  if (s.endsWith("cm")) return parseFloat(s) * 10
  if (s.endsWith("pt")) return (parseFloat(s) * 25.4) / 72
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n / PX_PER_MM
}

/**
 * Word-like horizontal ruler:
 * - drag left/right margin edges (gray zones) to change page margins
 * - drag first-line indent (top triangle), left indent (bottom triangle+square),
 *   right indent (right triangle) to change current paragraph indent
 * - click on ruler to add tab stop (cycles L > C > R), right-click marker to remove
 */
export function EditorRuler({ pageConfig, onMarginsChange, editor, tick, className }: EditorRulerProps) {
  const { width } = getPageDimensionsMm(pageConfig)
  const zoom = pageConfig.zoom ?? 90
  const scale = zoom / 100
  const widthPx = Math.round(width * PX_PER_MM * scale)
  const leftPx = pageConfig.margins.left * PX_PER_MM * scale
  const rightPx = pageConfig.margins.right * PX_PER_MM * scale

  const barRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<null | { kind: "margin-left" | "margin-right" | "first" | "left" | "right"; startX: number; orig: number }>(null)
  const [tabStops, setTabStops] = useState<TabStop[]>([])
  const [tabMode, setTabMode] = useState<"left" | "center" | "right">("left")
  const idRef = useRef(1)

  // current paragraph indent (mm)
  const paraIndent = useMemo(() => {
    if (!editor) return { first: 0, left: 0, right: 0 }
    try {
      const attrs = editor.isActive("heading")
        ? (editor.getAttributes("heading") as any)
        : (editor.getAttributes("paragraph") as any)
      return {
        first: parseCssToMm(attrs?.textIndent),
        left: parseCssToMm(attrs?.marginLeft),
        right: parseCssToMm(attrs?.marginRight),
      }
    } catch {
      return { first: 0, left: 0, right: 0 }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, tick])

  const mmToPx = useCallback((mm: number) => mm * PX_PER_MM * scale, [scale])

  const applyParaIndent = useCallback(
    (patch: { textIndent?: string | null; marginLeft?: string | null; marginRight?: string | null }) => {
      if (!editor) return
      try {
        const chain: any = editor.chain().focus()
        if (patch.textIndent !== undefined) chain.updateAttributes("paragraph", { textIndent: patch.textIndent }).updateAttributes("heading", { textIndent: patch.textIndent })
        if (patch.marginLeft !== undefined) chain.updateAttributes("paragraph", { marginLeft: patch.marginLeft }).updateAttributes("heading", { marginLeft: patch.marginLeft })
        if (patch.marginRight !== undefined) chain.updateAttributes("paragraph", { marginRight: patch.marginRight }).updateAttributes("heading", { marginRight: patch.marginRight })
        chain.run()
      } catch {}
    },
    [editor]
  )

  const pxToMm = useCallback(
    (clientX: number) => {
      const bar = barRef.current
      if (!bar) return 0
      const rect = bar.getBoundingClientRect()
      return (clientX - rect.left) / (PX_PER_MM * scale)
    },
    [scale]
  )

  const onPointerDownHandle = (kind: NonNullable<typeof drag>["kind"], e: React.PointerEvent, origMm: number) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    setDrag({ kind, startX: e.clientX, orig: origMm })
  }

  useEffect(() => {
    if (!drag) return
    const onMove = (ev: PointerEvent) => {
      const bar = barRef.current
      if (!bar) return
      const rect = bar.getBoundingClientRect()
      const mmPerPx = 1 / (PX_PER_MM * scale)
      const dMm = (ev.clientX - drag.startX) * mmPerPx
      if (drag.kind === "margin-left") {
        const maxLeft = width - pageConfig.margins.right - 20
        const next = Math.round(Math.min(Math.max(0, drag.orig + dMm), maxLeft) * 2) / 2
        onMarginsChange?.({ left: next, right: pageConfig.margins.right })
      } else if (drag.kind === "margin-right") {
        const maxRight = width - pageConfig.margins.left - 20
        // dragging left edge of right zone: moving left increases right margin
        const next = Math.round(Math.min(Math.max(0, drag.orig - dMm), maxRight) * 2) / 2
        onMarginsChange?.({ left: pageConfig.margins.left, right: next })
      } else if (drag.kind === "first") {
        const rel = Math.round((drag.orig + dMm) * 2) / 2
        const clamped = Math.max(-20, Math.min(60, rel))
        applyParaIndent({ textIndent: clamped === 0 ? null : `${clamped}mm` })
      } else if (drag.kind === "left") {
        const rel = Math.round((drag.orig + dMm) * 2) / 2
        const clamped = Math.max(0, Math.min(80, rel))
        applyParaIndent({ marginLeft: clamped === 0 ? null : `${clamped}mm` })
      } else if (drag.kind === "right") {
        // right indent marker positioned from right edge; dragging left increases indent
        const rel = Math.round((drag.orig - dMm) * 2) / 2
        const clamped = Math.max(0, Math.min(80, rel))
        applyParaIndent({ marginRight: clamped === 0 ? null : `${clamped}mm` })
      }
    }
    const onUp = () => setDrag(null)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp, { once: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [drag, scale, width, pageConfig.margins, onMarginsChange, applyParaIndent])

  const handleBarClick = (e: React.MouseEvent) => {
    if (drag) return
    if ((e.target as HTMLElement).closest("[data-ruler-handle]")) return
    if ((e.target as HTMLElement).closest("[data-tab-marker]")) return
    const mm = pxToMm(e.clientX)
    // ignore clicks inside margin gray zones for tab creation (Word allows, but keep content zone)
    if (mm < pageConfig.margins.left + 1 || mm > width - pageConfig.margins.right - 1) return
    const id = idRef.current++
    setTabStops((prev) => [...prev, { id, mm: Math.round(mm * 2) / 2, align: tabMode }].sort((a, b) => a.mm - b.mm))
    setTabMode((m) => (m === "left" ? "center" : m === "center" ? "right" : "left"))
  }

  const removeTab = (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTabStops((prev) => prev.filter((t) => t.id !== id))
  }

  // ticks: minor every 5mm, major every 10mm with cm label
  const ticks = useMemo(() => {
    const arr: number[] = []
    for (let mm = 0; mm <= Math.ceil(width); mm += 5) arr.push(mm)
    return arr
  }, [width])

  const contentLeftPx = leftPx
  // marker X positions (px from bar left)
  const firstX = contentLeftPx + mmToPx(paraIndent.left + paraIndent.first)
  const leftX = contentLeftPx + mmToPx(paraIndent.left)
  const rightX = widthPx - rightPx - mmToPx(paraIndent.right)

  if (pageConfig.isPageless || pageConfig.showRuler === false) return null

  return (
    <div className={`flex justify-center ${className || ""}`}>
      <div className="flex items-stretch gap-2 w-full justify-center">
        {/* tab type switcher like Word's top-left box */}
        <button
          type="button"
          title="Jenis tab berikutnya — klik ruler untuk menambah tab stop. Klik kanan marker untuk hapus."
          onClick={() => setTabMode((m) => (m === "left" ? "center" : m === "center" ? "right" : "left"))}
          className="w-6 h-6 shrink-0 self-center rounded border border-[#e6e6e6] bg-white hover:bg-[#f6f5f4] grid place-items-center text-[11px] font-bold text-[#374151]"
        >
          {tabMode === "left" ? "L" : tabMode === "center" ? "┴" : "┘"}
        </button>
        <div
          ref={barRef}
          onClick={handleBarClick}
          className={`relative h-7 bg-white border border-[#e6e6e6] rounded-[8px] overflow-visible select-none cursor-text ${drag ? "cursor-ew-resize" : ""}`}
          style={{ width: `${widthPx}px`, maxWidth: "100%" }}
          title="Ruler Word — drag tepi abu-abu untuk margin, drag segitiga untuk indent, klik untuk tambah tab stop"
        >
          {/* margin zones */}
          <div className="absolute inset-y-0 left-0 bg-[#eef0f2] border-r border-[#d7dce0] rounded-l-[8px]" style={{ width: `${leftPx}px` }} />
          <div className="absolute inset-y-0 right-0 bg-[#eef0f2] border-l border-[#d7dce0] rounded-r-[8px]" style={{ width: `${rightPx}px` }} />

          {/* margin drag handles */}
          <div
            data-ruler-handle
            onPointerDown={(e) => onPointerDownHandle("margin-left", e, pageConfig.margins.left)}
            className="absolute inset-y-0 z-20 w-2.5 cursor-ew-resize group flex items-center justify-center"
            style={{ left: `${Math.max(0, leftPx - 5)}px` }}
            title={`Margin kiri ${pageConfig.margins.left}mm — drag untuk ubah`}
          >
            <div className="w-[3px] h-4 rounded-full bg-[#9ca3af] group-hover:bg-[#0075de] transition-colors" />
          </div>
          <div
            data-ruler-handle
            onPointerDown={(e) => onPointerDownHandle("margin-right", e, pageConfig.margins.right)}
            className="absolute inset-y-0 z-20 w-2.5 cursor-ew-resize group flex items-center justify-center"
            style={{ right: `${Math.max(0, rightPx - 5)}px` }}
            title={`Margin kanan ${pageConfig.margins.right}mm — drag untuk ubah`}
          >
            <div className="w-[3px] h-4 rounded-full bg-[#9ca3af] group-hover:bg-[#0075de] transition-colors" />
          </div>

          {/* ticks */}
          <div className="absolute inset-x-0 bottom-0 h-full pointer-events-none">
            {ticks.map((mm) => {
              const x = mmToPx(mm)
              if (x > widthPx - 2) return null
              const isCm = mm % 10 === 0
              const isMajorCm = mm % 20 === 0
              return (
                <div key={mm} className="absolute bottom-0 flex flex-col items-center" style={{ left: `${x}px` }}>
                  <div className={`bg-[#9ca3af] ${isCm ? "h-2.5 w-[1px]" : "h-1.5 w-[1px] opacity-60"}`} />
                  {isMajorCm && mm > 0 && (
                    <span className="text-[8px] font-mono text-[#6b7280] leading-none mt-0.5 -ml-1">{mm / 10}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* tab stops */}
          {tabStops.map((t) => (
            <div
              key={t.id}
              data-tab-marker
              onContextMenu={(e) => removeTab(t.id, e)}
              onDoubleClick={(e) => removeTab(t.id, e as any)}
              className="absolute bottom-0.5 z-10 text-[10px] leading-none text-[#0075de] font-bold cursor-pointer hover:text-red-600"
              style={{ left: `${mmToPx(t.mm) - 4}px` }}
              title={`Tab ${t.align} @ ${t.mm}mm — double-click / klik kanan untuk hapus`}
            >
              {t.align === "left" ? "L" : t.align === "center" ? "┴" : "┘"}
            </div>
          ))}

          {/* indent markers — Word style triangles */}
          {/* first-line (top, pointing down) */}
          <div
            data-ruler-handle
            onPointerDown={(e) => onPointerDownHandle("first", e, paraIndent.first)}
            className="absolute top-0 z-30 -translate-x-1/2 cursor-ew-resize group"
            style={{ left: `${firstX}px` }}
            title={`First-line indent ${paraIndent.first}mm — drag`}
          >
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#f59e0b] group-hover:border-t-[#0075de] drop-shadow-sm" />
          </div>
          {/* left indent (bottom, pointing up + square) */}
          <div
            data-ruler-handle
            onPointerDown={(e) => onPointerDownHandle("left", e, paraIndent.left)}
            className="absolute bottom-0 z-30 -translate-x-1/2 cursor-ew-resize group flex flex-col items-center"
            style={{ left: `${leftX}px` }}
            title={`Left indent ${paraIndent.left}mm — drag`}
          >
            <div className="w-[9px] h-[7px] bg-[#6b7280] group-hover:bg-[#0075de] rounded-[1px] border border-white shadow-sm" />
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#6b7280] group-hover:border-b-[#0075de]" />
          </div>
          {/* right indent */}
          <div
            data-ruler-handle
            onPointerDown={(e) => onPointerDownHandle("right", e, paraIndent.right)}
            className="absolute bottom-0 z-30 translate-x-1/2 cursor-ew-resize group flex flex-col items-center"
            style={{ left: `${rightX}px` }}
            title={`Right indent ${paraIndent.right}mm — drag`}
          >
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#6b7280] group-hover:border-b-[#0075de] rotate-0" />
            <div className="w-[9px] h-[7px] bg-[#6b7280] group-hover:bg-[#0075de] rounded-[1px] border border-white shadow-sm" />
          </div>

          {/* center info while dragging */}
          {drag && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 bg-[#111827] text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none">
              {drag.kind === "margin-left" && `Kiri ${pageConfig.margins.left}mm`}
              {drag.kind === "margin-right" && `Kanan ${pageConfig.margins.right}mm`}
              {drag.kind === "first" && `First-line ${paraIndent.first}mm`}
              {drag.kind === "left" && `Kiri-paragraf ${paraIndent.left}mm`}
              {drag.kind === "right" && `Kanan-paragraf ${paraIndent.right}mm`}
            </div>
          )}
        </div>
        {tabStops.length > 0 && (
          <button
            type="button"
            onClick={() => setTabStops([])}
            className="shrink-0 self-center text-[10px] text-[#9ca3af] hover:text-red-600 underline underline-offset-2"
            title="Hapus semua tab stop"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
