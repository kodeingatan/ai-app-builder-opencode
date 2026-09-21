"use client"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Crop as CropIcon } from "lucide-react"

const RATIOS: { id: string; label: string; v: number | null }[] = [
  { id: "free", label: "Bebas", v: null },
  { id: "1:1", label: "1:1", v: 1 },
  { id: "4:3", label: "4:3", v: 4 / 3 },
  { id: "16:9", label: "16:9", v: 16 / 9 },
]

type Rect = { x: number; y: number; w: number; h: number }

function fitRect(dw: number, dh: number, ratio: number | null): Rect {
  if (!ratio) return { x: 0, y: 0, w: dw, h: dh }
  let w = dw
  let h = w / ratio
  if (h > dh) {
    h = dh
    w = h * ratio
  }
  return { x: (dw - w) / 2, y: (dh - h) / 2, w, h }
}

export default function ImageCropModal({
  src,
  onClose,
  onApply,
  showToast,
}: {
  src: string
  onClose: () => void
  onApply: (dataUrl: string, w: number, h: number) => void
  showToast?: (message: string, type?: "success" | "error" | "info") => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [disp, setDisp] = useState({ w: 0, h: 0 })
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [ratio, setRatio] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const drag = useRef<null | { mode: "draw" | "move" | "resize"; ax: number; ay: number; orig: Rect }>(null)

  const onImgLoad = () => {
    const el = imgRef.current
    if (!el || el.naturalWidth === 0) {
      setFailed(true)
      return
    }
    const dw = el.clientWidth
    const dh = el.clientHeight
    setDisp({ w: dw, h: dh })
    setNat({ w: el.naturalWidth, h: el.naturalHeight })
    setRect({ x: 0, y: 0, w: dw, h: dh })
    setReady(true)
  }

  const pos = (e: React.PointerEvent) => {
    const box = boxRef.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(e.clientX - box.left, box.width)),
      y: Math.max(0, Math.min(e.clientY - box.top, box.height)),
    }
  }

  const nearHandle = (p: { x: number; y: number }) =>
    Math.abs(p.x - (rect.x + rect.w)) < 16 && Math.abs(p.y - (rect.y + rect.h)) < 16

  const insideRect = (p: { x: number; y: number }) =>
    rect.w > 8 && p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h

  const onDown = (e: React.PointerEvent) => {
    if (!ready) return
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    const p = pos(e)
    if (rect.w > 8 && nearHandle(p)) {
      drag.current = { mode: "resize", ax: p.x, ay: p.y, orig: { ...rect } }
    } else if (insideRect(p)) {
      drag.current = { mode: "move", ax: p.x - rect.x, ay: p.y - rect.y, orig: { ...rect } }
    } else {
      drag.current = { mode: "draw", ax: p.x, ay: p.y, orig: { ...rect } }
      setRect({ x: p.x, y: p.y, w: 0, h: 0 })
    }
  }

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || !ready) return
    const p = pos(e)
    const box = { w: disp.w, h: disp.h }
    if (d.mode === "move") {
      const w = d.orig.w
      const h = d.orig.h
      setRect({ x: Math.max(0, Math.min(p.x - d.ax, box.w - w)), y: Math.max(0, Math.min(p.y - d.ay, box.h - h)), w, h })
    } else if (d.mode === "resize") {
      let w = Math.max(10, Math.min(p.x - d.orig.x, box.w - d.orig.x))
      let h = ratio ? w / ratio : Math.max(10, Math.min(p.y - d.orig.y, box.h - d.orig.y))
      if (ratio && d.orig.y + h > box.h) {
        h = box.h - d.orig.y
        w = h * ratio
      }
      setRect({ ...d.orig, w, h })
    } else {
      let x = Math.min(d.ax, p.x)
      let y = Math.min(d.ay, p.y)
      let w = Math.abs(p.x - d.ax)
      let h = Math.abs(p.y - d.ay)
      if (ratio && w > 4) {
        h = w / ratio
        if (y + h > box.h) {
          h = box.h - y
          w = h * ratio
        }
        if (x + w > box.w) {
          w = box.w - x
          h = w / ratio
        }
      }
      setRect({ x, y, w, h })
    }
  }

  const onUp = () => {
    drag.current = null
  }

  const applyRatio = (v: number | null) => {
    setRatio(v)
    if (disp.w > 0) setRect(fitRect(disp.w, disp.h, v))
  }

  const applyCrop = () => {
    const el = imgRef.current
    if (!el || rect.w < 4 || rect.h < 4) {
      showToast?.("Tentukan area crop dulu (drag di atas gambar)", "error")
      return
    }
    try {
      const scale = nat.w / disp.w
      const cw = Math.max(1, Math.round(rect.w * scale))
      const ch = Math.max(1, Math.round(rect.h * scale))
      const canvas = document.createElement("canvas")
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("no ctx")
      ctx.drawImage(el, rect.x * scale, rect.y * scale, cw, ch, 0, 0, cw, ch)
      const dataUrl = canvas.toDataURL("image/png")
      onApply(dataUrl, cw, ch)
    } catch {
      showToast?.("Crop gagal — gambar eksternal tanpa izin CORS, upload dulu sebagai base64", "error")
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-xl border border-[#e6e6e6] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-[13px] flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-[#0075de] text-white flex items-center justify-center"><CropIcon size={14} /></div>
            Crop Gambar
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={14} /></button>
        </div>
        <p className="text-[11px] text-[#6b7280] mb-2">Drag di atas gambar untuk menentukan area • drag dalam kotak untuk geser • tarik kotak kecil di sudut untuk resize.</p>
        <div className="flex justify-center bg-[#111] rounded-[8px] p-3 overflow-auto">
          <div ref={boxRef} className="relative inline-block leading-[0] select-none" style={{ touchAction: "none" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="crop"
              crossOrigin="anonymous"
              draggable={false}
              onLoad={onImgLoad}
              onError={() => setFailed(true)}
              className="max-w-full max-h-[46vh] w-auto block"
            />
            {failed && <div className="text-xs text-red-400 py-6">Gagal memuat gambar.</div>}
            {ready && rect.w > 4 && (
              <div
                className="absolute border-2 border-[#0075de] rounded-[2px]"
                style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)", cursor: "move" }}
              >
                <span className="absolute -right-[7px] -bottom-[7px] w-3.5 h-3.5 bg-[#0075de] border-2 border-white rounded-[3px] cursor-nwse-resize" title="Tarik untuk resize area crop" />
                <span className="absolute left-1 top-1 bg-[#111827] text-white text-[10px] px-1.5 rounded-full leading-4">
                  {Math.round((rect.w / disp.w) * nat.w)}×{Math.round((rect.h / disp.h) * nat.h)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-[#6b7280]">Rasio:</span>
          {RATIOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => applyRatio(r.v)}
              title={r.id === "free" ? "Crop bebas" : `Kunci rasio ${r.label}`}
              className={`h-7 px-2.5 rounded-[6px] text-xs font-medium border transition-colors ${ratio === r.v ? "bg-[#0075de] text-white border-[#0075de]" : "bg-white border-[#e6e6e6] hover:bg-[#f6f5f4]"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>Batal</Button>
          <Button size="sm" onClick={applyCrop} className="bg-[#0075de] hover:bg-[#0063be]"><CropIcon size={13} /> Terapkan Crop</Button>
        </div>
      </div>
    </div>
  )
}
