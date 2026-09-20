"use client"
import { Badge } from "@/components/ui/badge"
import { Grid3x3, Rows3, Columns3, Trash, Combine, Split, PaintBucket, Brush, Palette, Square, PanelLeft, PanelRight, Columns2, PanelTop, PanelBottom, Frame, MoveVertical, MoveHorizontal, GripVertical, Layers } from "lucide-react"

type Props = {
  editor: any
  cellBg: string
  setCellBg: (v: string) => void
  borderColor: string
  setBorderColor: (v: string) => void
  borderWidth: string
  setBorderWidth: (v: string) => void
  borderStyle: string
  setBorderStyle: (v: string) => void
  cellHeight: string
  setCellHeight: (v: string) => void
  rowHeight: string
  setRowHeight: (v: string) => void
  applyBorderPreset: (preset: string) => void
  applyCellHeight: () => void
  applyRowHeight: () => void
  handleRowDragMouseDown?: (e: React.MouseEvent) => void
}

export default function TableToolbar({
  editor,
  cellBg,
  setCellBg,
  borderColor,
  setBorderColor,
  borderWidth,
  setBorderWidth,
  borderStyle,
  setBorderStyle,
  cellHeight,
  setCellHeight,
  rowHeight,
  setRowHeight,
  applyBorderPreset,
  applyCellHeight,
  applyRowHeight,
  handleRowDragMouseDown,
}: Props) {
  if (!editor) return null
  return (
    <div className="sticky top-0 z-10 bg-white border-y border-[#e6e6e6] p-2 flex flex-wrap items-center gap-1.5">
      {/* Baris */}
      <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] items-center">
        <span className="hidden xl:flex items-center gap-1 px-2 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase"><Rows3 size={12} /> Baris</span>
        <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="h-8 px-2.5 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">+ Sebelum</button>
        <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="h-8 px-2.5 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">+ Sesudah</button>
        <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="h-8 px-2.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-[8px] hover:bg-red-100 flex items-center gap-1"><Trash size={11} /> Hapus</button>
        <div className="w-px h-6 bg-[#e6e6e6] mx-1" />
        <span className="text-[11px] font-semibold text-[#374151] flex items-center gap-1"><MoveVertical size={11} /> Tinggi</span>
        <input value={rowHeight} onChange={e => setRowHeight(e.target.value)} placeholder="48px" className="w-16 h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white" />
        <button type="button" onClick={applyRowHeight} className="h-8 px-2.5 text-xs font-medium bg-[#111827] text-white rounded-[8px] hover:bg-black">Set</button>
        {handleRowDragMouseDown && <button type="button" onMouseDown={handleRowDragMouseDown} className="w-8 h-8 rounded-[8px] border border-[#e6e6e6] bg-white hover:bg-[#f6f5f4] flex items-center justify-center cursor-row-resize" title="Drag tinggi baris"><GripVertical size={12} /></button>}
      </div>

      {/* Kolom */}
      <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] items-center">
        <span className="hidden xl:flex items-center gap-1 px-2 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase"><Columns3 size={12} /> Kolom</span>
        <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="h-8 px-2.5 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">+ Kiri</button>
        <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="h-8 px-2.5 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">+ Kanan</button>
        <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="h-8 px-2.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-[8px] hover:bg-red-100 flex items-center gap-1"><Trash size={11} /> Hapus</button>
        <span className="hidden lg:flex items-center gap-1 text-[11px] text-[#6b7280] ml-1"><MoveHorizontal size={11} className="text-[#0075de]" /> drag tepi</span>
      </div>

      {/* Tabel */}
      <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] items-center flex-wrap">
        <span className="hidden xl:flex items-center gap-1 px-2 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase"><Layers size={12} /> Tabel</span>
        <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="h-8 px-2.5 text-xs font-medium bg-red-600 text-white rounded-[8px] hover:bg-red-700 flex items-center gap-1"><Trash size={12} /> Hapus</button>
        <button type="button" onClick={() => editor.chain().focus().mergeCells().run()} className="h-8 px-2.5 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center gap-1"><Combine size={12} /> Gabung</button>
        <button type="button" onClick={() => editor.chain().focus().splitCell().run()} className="h-8 px-2.5 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4] flex items-center gap-1"><Split size={12} /> Pecah</button>
        <button type="button" onClick={() => { try { (editor.chain().focus() as any).selectParentNode().run(); (editor.chain().focus() as any).selectParentNode().run() } catch {} }} className="h-8 px-2.5 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Pilih</button>
        <div className="w-px h-6 bg-[#e6e6e6] mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeaderRow().run()} className="h-8 px-2 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Header Baris</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeaderColumn().run()} className="h-8 px-2 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Header Kolom</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeaderCell().run()} className="h-8 px-2 text-xs font-medium border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]">Header Cell</button>
      </div>

      {/* Cell */}
      <div className="flex gap-1 bg-white border border-[#e6e6e6] rounded-[12px] p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] items-center flex-wrap">
        <span className="hidden xl:flex items-center gap-1 px-2 text-[10px] font-semibold tracking-wide text-[#9ca3af] uppercase"><Brush size={12} /> Cell</span>
        <div className="flex items-center gap-1 border border-[#e6e6e6] rounded-[8px] px-2 py-1 bg-[#f9fafb] h-8">
          <PaintBucket size={12} className="text-[#6b7280] shrink-0" />
          <input type="color" value={cellBg} onChange={e => setCellBg(e.target.value)} className="w-6 h-6 p-0 border-0 rounded-[6px] cursor-pointer" title="Background" />
          <button type="button" onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', cellBg).run()} className="h-6 px-2 text-xs font-medium bg-[#0075de] text-white rounded-[6px] hover:bg-[#0063be]">BG</button>
          <button type="button" onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', null).run()} className="h-6 px-1.5 text-xs border border-[#e6e6e6] rounded-[6px] bg-white hover:bg-[#f6f5f4]">×</button>
        </div>
        <select onChange={e => { const v = e.target.value; if (v) editor.chain().focus().setCellAttribute('verticalAlign', v).run() }} defaultValue="" className="h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white">
          <option value="" disabled>Align V</option><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option>
        </select>
        <div className="flex gap-1">
          <input value={cellHeight} onChange={e => setCellHeight(e.target.value)} placeholder="Tinggi 40px" className="w-20 h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white" />
          <button type="button" onClick={applyCellHeight} className="h-8 px-2 text-xs font-medium bg-[#111827] text-white rounded-[8px] hover:bg-black">Set</button>
        </div>
        <div className="w-px h-6 bg-[#e6e6e6] mx-1" />
        <div className="flex items-center gap-1 border border-[#e6e6e6] rounded-[8px] px-2 py-1 bg-white h-8">
          <Grid3x3 size={12} className="text-[#6b7280] shrink-0" /><input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-6 h-6 p-0 border-0 rounded-[6px] cursor-pointer" title="Border color" />
        </div>
        <select value={borderWidth} onChange={e => setBorderWidth(e.target.value)} className="h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white"><option value="1px">1px</option><option value="2px">2px</option><option value="3px">3px</option><option value="4px">4px</option></select>
        <select value={borderStyle} onChange={e => setBorderStyle(e.target.value)} className="h-8 text-xs border border-[#e6e6e6] rounded-[8px] px-2 bg-white"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option><option value="hidden">Hidden</option></select>
        <div className="flex gap-1">
          {[
            { id: 'none', label: 'Tanpa', icon: Square },
            { id: 'left', label: 'Kiri', icon: PanelLeft },
            { id: 'right', label: 'Kanan', icon: PanelRight },
            { id: 'all', label: 'Semua', icon: Grid3x3 },
            { id: 'outer', label: 'Luar', icon: Frame },
          ].map(p => (
            <button key={p.id} type="button" onClick={() => applyBorderPreset(p.id)} className="w-8 h-8 rounded-[8px] border border-[#e6e6e6] bg-white hover:border-[#0075de] hover:bg-[#eff6ff] hover:text-[#0075de] flex items-center justify-center" title={p.label}><p.icon size={14} /></button>
          ))}
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => applyBorderPreset('leftRight')} className="h-8 px-2 text-xs border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]" title="Kiri+Kanan"><Columns2 size={12} /></button>
          <button type="button" onClick={() => applyBorderPreset('top')} className="h-8 px-2 text-xs border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]" title="Atas"><PanelTop size={12} /></button>
          <button type="button" onClick={() => applyBorderPreset('bottom')} className="h-8 px-2 text-xs border border-[#e6e6e6] rounded-[8px] bg-white hover:bg-[#f6f5f4]" title="Bawah"><PanelBottom size={12} /></button>
        </div>
      </div>
    </div>
  )
}
