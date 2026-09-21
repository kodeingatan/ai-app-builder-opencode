"use client"
import { useRef, useState } from "react"
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { imgLayoutStyleObj, type ImageLayout } from "@/lib/tiptap/extensions/customImage"

type Handle = "nw" | "ne" | "sw" | "se" | "e" | "s"

const HANDLE_STYLE: Record<Handle, React.CSSProperties> = {
  nw: { left: -6, top: -6, cursor: "nwse-resize" },
  ne: { right: -6, top: -6, cursor: "nesw-resize" },
  sw: { left: -6, bottom: -6, cursor: "nesw-resize" },
  se: { right: -6, bottom: -6, cursor: "nwse-resize" },
  e: { right: -5, top: "50%", marginTop: -6, cursor: "ew-resize" },
  s: { left: "50%", marginLeft: -6, bottom: -5, cursor: "ns-resize" },
}

const HANDLE_TITLES: Record<Handle, string> = {
  nw: "Tarik sudut untuk resize • tahan Shift = proporsional",
  ne: "Tarik sudut untuk resize • tahan Shift = proporsional",
  sw: "Tarik sudut untuk resize • tahan Shift = proporsional",
  se: "Tarik sudut untuk resize • tahan Shift = proporsional",
  e: "Tarik untuk atur lebar gambar",
  s: "Tarik untuk atur tinggi gambar",
}

export default function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const liveRef = useRef<{ w: number; h: number } | null>(null)
  const [live, setLive] = useState<{ w: number; h: number } | null>(null)

  const w: number | null = live?.w ?? (typeof node.attrs.width === "number" ? node.attrs.width : null)
  const h: number | null = live?.h ?? (typeof node.attrs.height === "number" ? node.attrs.height : null)
  const binding = node.attrs["data-binding"] as string | null
  const layout = (node.attrs.layout || "inline") as ImageLayout
  const overlay = layout === "behind" || layout === "front"

  const onHandleDown = (handle: Handle) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const el = imgRef.current
    const startW = w ?? el?.clientWidth ?? 300
    const startH = h ?? el?.clientHeight ?? Math.round(startW * 0.6)
    const startX = e.clientX
    const startY = e.clientY
    document.body.style.cursor = HANDLE_STYLE[handle].cursor as string
    document.body.style.userSelect = "none"

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let nw = startW
      let nh = startH
      const proportional = ev.shiftKey
      if (handle === "e") {
        nw = startW + dx
      } else if (handle === "s") {
        nh = startH + dy
      } else {
        const sx = handle === "nw" || handle === "sw" ? -1 : 1
        const sy = handle === "nw" || handle === "ne" ? -1 : 1
        const dw = dx * sx
        const dh = dy * sy
        if (proportional) {
          const k = Math.max((startW + dw) / startW, (startH + dh) / startH)
          nw = startW * k
          nh = startH * k
        } else {
          nw = startW + dw
          nh = startH + dh
        }
      }
      nw = Math.max(24, Math.min(1600, Math.round(nw)))
      nh = Math.max(24, Math.min(1600, Math.round(nh)))
      liveRef.current = { w: nw, h: nh }
      setLive({ w: nw, h: nh })
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      if (liveRef.current) updateAttributes({ width: liveRef.current.w, height: liveRef.current.h })
      liveRef.current = null
      setLive(null)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const handles = selected ? (
    <>
      {(Object.keys(HANDLE_STYLE) as Handle[]).map((hd) => (
        <span
          key={hd}
          onPointerDown={onHandleDown(hd)}
          title={HANDLE_TITLES[hd]}
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            background: "#0075de",
            border: "2px solid #fff",
            borderRadius: 3,
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            touchAction: "none",
            zIndex: 20,
            ...HANDLE_STYLE[hd],
          }}
        />
      ))}
      {w != null && h != null && (
        <span
          style={{
            position: "absolute",
            left: 4,
            top: -22,
            background: "#111827",
            color: "#fff",
            fontSize: 10,
            padding: "1px 6px",
            borderRadius: 999,
            lineHeight: "16px",
            whiteSpace: "nowrap",
            zIndex: 20,
          }}
        >
          {w}×{h}px
        </span>
      )}
    </>
  ) : null

  const imgStyle: React.CSSProperties = {
    display: "block",
    borderRadius: 8,
    userSelect: "none",
    maxWidth: "100%",
    width: w ? `${w}px` : undefined,
    height: h ? `${h}px` : "auto",
    ...(binding ? { border: "1px dashed #3b82f6", background: "#eff6ff" } : {}),
    ...(selected ? { outline: "2px solid #0075de", outlineOffset: 1 } : {}),
  }

  // Behind/Front: zero-size anchor — teks mengalir tembus, gambar absolute di belakang/depan
  if (overlay) {
    return (
      <NodeViewWrapper
        as="span"
        className="resizable-image"
        style={{ position: "relative", display: "inline-block", width: 0, height: 0, verticalAlign: "middle", lineHeight: 0, isolation: "isolate" }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: w ? `${w}px` : "auto",
            height: h ? `${h}px` : "auto",
            zIndex: layout === "behind" ? -1 : 10,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={node.attrs.src} alt={node.attrs.alt} draggable={false} style={imgStyle} />
          {handles}
        </span>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      as="span"
      className="resizable-image"
      style={{ position: "relative", display: "inline-block", maxWidth: "100%", lineHeight: 0, verticalAlign: "middle" }}
      title={selected ? "Gambar terpilih — tarik handle untuk resize" : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt}
        draggable={false}
        style={{ ...imgStyle, ...imgLayoutStyleObj(layout) }}
      />
      {handles}
    </NodeViewWrapper>
  )
}
