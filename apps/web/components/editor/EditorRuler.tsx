"use client"
import React from "react"
import { PageConfig, getPageDimensionsMm } from "@/lib/editor/model/types"

interface EditorRulerProps {
  pageConfig: PageConfig
  className?: string
}

export function EditorRuler({ pageConfig, className }: EditorRulerProps) {
  if (pageConfig.isPageless || pageConfig.showRuler === false) return null

  const { width } = getPageDimensionsMm(pageConfig)
  const widthPx = Math.round(width * 3.78)
  const leftPx = Math.round(pageConfig.margins.left * 3.78)
  const rightPx = Math.round(pageConfig.margins.right * 3.78)
  const contentWidthPx = widthPx - leftPx - rightPx
  const zoom = pageConfig.zoom ?? 90
  const scaledWidth = Math.round(widthPx * (zoom / 100))

  // Ticks every 10mm (approx 37.8px)
  const ticks: number[] = []
  for (let mm = 0; mm <= width; mm += 10) ticks.push(mm)

  return (
    <div
      className={`h-6 bg-white border border-[#e6e6e6] rounded-[8px] overflow-hidden flex items-center relative select-none ${className || ""}`}
      style={{ width: `${scaledWidth}px`, maxWidth: "100%", margin: "0 auto" }}
      title={`Ruler — ${width}mm, margin ${pageConfig.margins.left} / ${pageConfig.margins.right} mm`}
    >
      <div className="absolute inset-y-0 left-0 bg-[#f6f5f4] border-r border-[#e6e6e6]" style={{ width: `${leftPx * (zoom/100)}px` }} />
      <div className="absolute inset-y-0 right-0 bg-[#f6f5f4] border-l border-[#e6e6e6]" style={{ width: `${rightPx * (zoom/100)}px` }} />

      <div className="absolute inset-0 flex items-end px-1">
        {ticks.map((mm) => {
          const isMajor = mm % 50 === 0
          const x = Math.round(mm * 3.78 * (zoom / 100))
          if (x > scaledWidth - 2) return null
          return (
            <div
              key={mm}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${x}px` }}
            >
              <div className={`bg-[#9ca3af] ${isMajor ? "h-3 w-[1px]" : "h-1.5 w-[1px]"}`} />
              {isMajor && (
                <span className="text-[8px] font-mono text-[#6b7280] leading-none mt-0.5 -ml-2">{mm}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[10px] font-medium text-[#9ca3af] bg-white/80 px-1.5 py-0.5 rounded">
          {pageConfig.paper} {pageConfig.orientation} · {width}×{getPageDimensionsMm(pageConfig).height}mm · {zoom}%
        </span>
      </div>
    </div>
  )
}
