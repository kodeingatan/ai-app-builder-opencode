"use client"
import { Palette, Brush, FileText, X, Info, Clipboard } from "lucide-react"

type PasteChoice = 'keep' | 'adapt' | 'plain'

export default function PasteChoicePopup({
  open,
  coords,
  onChoose,
  onClose,
}: {
  open: boolean
  coords: { x: number; y: number } | null
  onChoose: (choice: PasteChoice) => void
  onClose: () => void
}) {
  if (!open || !coords) return null
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const W = 320
  const H = 200
  let left = coords.x + 12
  let top = coords.y + 12
  if (left + W + 12 > vw) left = vw - W - 12
  if (left < 12) left = 12
  if (top + H + 12 > vh) top = coords.y - H - 12
  if (top < 12) top = 12

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="fixed bg-white border border-[#e6e6e6] rounded-[8px] shadow-2xl w-[300px] overflow-hidden animate-in fade-in zoom-in-95"
        style={{ left, top }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-2.5 py-2 border-b border-[#f0f0f0] flex items-center justify-between bg-[#fcfcfc]">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#0075de] text-white flex items-center justify-center"><Clipboard size={12} /></div>
            <div>
              <div className="text-[13px] font-bold leading-none">Paste Terdeteksi</div>
              <div className="text-[11px] text-[#6b7280]">Dari Word / dokumen — pilih gaya</div>
            </div>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-[#f6f5f4] flex items-center justify-center"><X size={13} /></button>
        </div>
        <div className="p-2.5 space-y-1.5">
          <button
            onClick={() => onChoose('keep')}
            className="w-full flex items-start gap-1.5 p-2 rounded-[8px] border border-[#e6e6e6] bg-white hover:border-[#0075de] hover:bg-[#eff6ff] text-left group transition-colors"
          >
            <div className="w-7 h-7 rounded-[8px] bg-[#f6f5f4] group-hover:bg-white border border-[#e6e6e6] flex items-center justify-center shrink-0"><Palette size={13} className="text-[#0075de]" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold">Tetap gunakan style dari hasil copy</div>
              <div className="text-[11px] text-[#6b7280] leading-snug">Font, warna, ukuran & border tabel tetap seperti Word</div>
            </div>
          </button>
          <button
            onClick={() => onChoose('adapt')}
            className="w-full flex items-start gap-1.5 p-2 rounded-[8px] border-2 border-[#0075de] bg-[#eff6ff] text-left shadow-sm"
          >
            <div className="w-7 h-7 rounded-[8px] bg-[#0075de] text-white flex items-center justify-center shrink-0"><Brush size={13} /></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#0075de]">Sesuaikan dengan editor sekarang</div>
              <div className="text-[11px] text-[#1e40af] leading-snug">Font jadi Inter, tabel border #e6e6e6, struktur tetap</div>
              <span className="text-[10px] bg-[#0075de] text-white px-1.5 py-0.5 rounded-full mt-1 inline-block">Default</span>
            </div>
          </button>
          <button
            onClick={() => onChoose('plain')}
            className="w-full flex items-start gap-1.5 p-2 rounded-[8px] border border-[#e6e6e6] bg-white hover:border-[#e6e6e6] hover:bg-[#f9fafb] text-left group transition-colors"
          >
            <div className="w-7 h-7 rounded-[8px] bg-white border border-[#e6e6e6] flex items-center justify-center shrink-0"><FileText size={13} className="text-[#6b7280]" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold">Copy hanya text saja</div>
              <div className="text-[11px] text-[#6b7280] leading-snug">Tanpa style — jadi paragraf biasa</div>
            </div>
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-[#6b7280] bg-[#f9fafb] border border-[#e6e6e6] rounded-[8px] px-2 py-1.5">
            <Info size={12} className="shrink-0 text-[#6b7280]" />
            <span>Popup hilang otomatis 5 detik. Tekan <span className="font-mono bg-white border px-1 rounded">Esc</span> untuk tutup.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
