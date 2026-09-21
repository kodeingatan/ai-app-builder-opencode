"use client"
import type { Editor } from "@tiptap/core"
import {
  RectangleHorizontal,
  Square,
  BoxSelect,
  Spline,
  AlignVerticalJustifyCenter,
  SendToBack,
  BringToFront,
} from "lucide-react"
import { IMAGE_LAYOUTS, type ImageLayout } from "@/lib/tiptap/extensions/customImage"

const ICONS: Record<ImageLayout, any> = {
  inline: RectangleHorizontal,
  square: Square,
  tight: BoxSelect,
  through: Spline,
  topBottom: AlignVerticalJustifyCenter,
  behind: SendToBack,
  front: BringToFront,
}

const BTN =
  "w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors shrink-0 hover:bg-[#e9eef5] text-[#374151]"
const ACTIVE = "bg-[#0075de] text-white shadow-sm hover:bg-[#0075de]"

// 7 opsi layout gambar ala MS Word — dipakai semua editor konten.
export default function ImageLayoutButtons({ editor }: { editor: Editor | null }) {
  if (!editor) return null
  const cur = ((editor.getAttributes("image") as any)?.layout as ImageLayout) || "inline"
  return (
    <>
      {IMAGE_LAYOUTS.map((m) => {
        const Icon = ICONS[m.id]
        const active = cur === m.id
        return (
          <button
            key={m.id}
            type="button"
            title={`${m.tooltip}`}
            onClick={() => {
              editor.chain().focus().updateAttributes("image", { layout: m.id }).run()
            }}
            className={`${BTN} ${active ? ACTIVE : ""}`}
          >
            <Icon size={14} />
          </button>
        )
      })}
    </>
  )
}
