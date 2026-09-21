"use client"
import React from "react"
import { PageConfig, getPageDimensionsMm } from "@/lib/editor/model/types"

interface EditorCanvasProps {
  children: React.ReactNode
  // Template mode: with paper
  pageConfig?: PageConfig | null
  // Component mode: no paper, continuous
  variant?: "page" | "continuous"
  className?: string
}

export function EditorCanvas({ children, pageConfig, variant = "page", className }: EditorCanvasProps) {
  // Continuous (Component) — no paper, no shadow page
  if (variant === "continuous" || !pageConfig || pageConfig.isPageless) {
    return (
      <div className={`bg-white rounded-[8px] border border-[#e6e6e6] overflow-hidden ${className || ""}`}>
        <div className="min-h-[240px] bg-white">
          {children}
        </div>
      </div>
    )
  }

  // Pages mode (Template) — A4 canvas with shadow
  const { width, height } = getPageDimensionsMm(pageConfig)
  // Convert mm to px approximation for preview: 96dpi => 3.78 px per mm
  const widthPx = Math.round(width * 3.78)
  // content width = page width - margins
  const contentWidthMm = width - pageConfig.margins.left - pageConfig.margins.right
  const contentWidthPx = Math.round(contentWidthMm * 3.78)
  const zoom = pageConfig.zoom ?? 90

  return (
    <div
      className={`rounded-[8px] border border-[#e6e6e6] overflow-auto p-3 flex justify-center ${className || ""}`}
      style={{ background: "#e8ecef" }}
    >
      <div
        className="shrink-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.12)] rounded-[4px] overflow-hidden flex flex-col"
        style={{
          width: `${widthPx}px`,
          minHeight: `${Math.round(height * 3.78)}px`,
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top center",
          // adjust container height for zoom
          marginBottom: zoom !== 100 ? `${(zoom - 100) * 2}px` : undefined,
        }}
      >
        {/* Page inner with margins */}
        <div
          className="flex-1 bg-white relative"
          style={{
            paddingTop: `${pageConfig.margins.top * 3.78}px`,
            paddingRight: `${pageConfig.margins.right * 3.78}px`,
            paddingBottom: `${pageConfig.margins.bottom * 3.78}px`,
            paddingLeft: `${pageConfig.margins.left * 3.78}px`,
            // watermark
            ...(pageConfig.watermark?.text
              ? {
                  backgroundImage: `none`,
                }
              : {}),
          }}
        >
          {/* Watermark behind content */}
          {pageConfig.watermark?.text && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
              style={{
                opacity: pageConfig.watermark.opacity ?? 0.08,
                transform: `rotate(${pageConfig.watermark.rotation ?? -30}deg)`,
              }}
            >
              <div
                className="font-black tracking-[0.2em] uppercase whitespace-nowrap"
                style={{
                  fontSize: `${Math.max(32, contentWidthPx / 8)}px`,
                  color: pageConfig.watermark.color || "#111",
                }}
              >
                {pageConfig.watermark.text}
              </div>
            </div>
          )}

          {/* Header (if set) */}
          {pageConfig.headerHtml && (
            <div
              className="border-b border-[#e5e7eb] pb-2 mb-2 text-[10px] text-[#6b7280] text-center leading-relaxed"
              dangerouslySetInnerHTML={{ __html: pageConfig.headerHtml }}
            />
          )}

          {/* Main content */}
          <div className="relative z-[1]">{children}</div>

          {/* Footer (if set) */}
          {pageConfig.footerHtml && (
            <div
              className="border-t border-[#e5e7eb] pt-2 mt-3 text-[10px] text-[#6b7280] text-center leading-relaxed"
              dangerouslySetInnerHTML={{ __html: pageConfig.footerHtml }}
            />
          )}

          {/* Page number placeholder */}
          <div className="absolute bottom-2 right-4 text-[9px] text-[#9ca3af] font-mono">
            1 / 1
          </div>
        </div>
      </div>
    </div>
  )
}

export function EditorCanvasContinuous({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <EditorCanvas variant="continuous" className={className}>
      {children}
    </EditorCanvas>
  )
}
