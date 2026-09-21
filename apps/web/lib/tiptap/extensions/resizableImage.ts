import { ReactNodeViewRenderer } from "@tiptap/react"
import { CustomImage } from "./customImage"
import ResizableImageView from "@/components/editor/ResizableImageView"

// Image dengan drag-resize handles (sudut + sisi).
// Shift + drag sudut = proporsional (lebar & tinggi skala bersama).
export const ResizableImage = CustomImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})
