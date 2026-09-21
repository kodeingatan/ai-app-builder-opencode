"use client"
import { useEffect, useRef, useState } from "react"
import { Table as TableIcon } from "lucide-react"

const MAX_COLS = 10
const MAX_ROWS = 8

// Pemilih ukuran tabel ala MS Word: arahkan pointer ke grid,
// klik untuk sisipkan (tanpa header otomatis) + tombol Default.
export default function TableGridPicker({
  onPick,
  onClose,
}: {
  onPick: (rows: number, cols: number) => void
  onClose: () => void
}) {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("pointerdown", onDown)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-30 bg-white border border-[#e6e6e6] rounded-[8px] shadow-xl p-2.5 w-max">
      <div className="text-[11px] font-semibold text-[#374151] mb-1.5 flex items-center gap-1.5">
        <TableIcon size={12} className="text-[#0075de]" /> Sisipkan Tabel
        {hover && <span className="ml-auto font-mono text-[#0075de] pl-3">{hover.c} × {hover.r}</span>}
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 18px)` }} onMouseLeave={() => setHover(null)}>
        {Array.from({ length: MAX_ROWS * MAX_COLS }, (_, i) => {
          const r = Math.floor(i / MAX_COLS) + 1
          const c = (i % MAX_COLS) + 1
          const active = hover != null && r <= hover.r && c <= hover.c
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover({ r, c })}
              onFocus={() => setHover({ r, c })}
              onClick={() => onPick(r, c)}
              title={`Tabel ${c} kolom × ${r} baris (tanpa header)`}
              className={`w-[18px] h-[18px] rounded-[3px] border transition-colors ${active ? "bg-[#0075de] border-[#0075de]" : "bg-white border-[#d1d5db] hover:border-[#0075de]"}`}
            />
          )
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-[#f0f0f0] flex items-center justify-between gap-2">
        <span className="text-[10px] text-[#9ca3af]">Tanpa header otomatis</span>
        <button
          type="button"
          onClick={() => onPick(3, 3)}
          title="Default: tabel 3 baris × 3 kolom tanpa header"
          className="h-6 px-2.5 rounded-[6px] text-[11px] font-medium bg-[#f6f5f4] hover:bg-[#0075de] hover:text-white transition-colors"
        >
          Default 3×3
        </button>
      </div>
    </div>
  )
}
