/**
 * Document Rendering Engine
 * Mendukung: Document Template → Layout → Component → Data Source → Repeat/Loop → Condition
 * Tree disimpan sebagai JSON: { type, props, children }
 * Binding: {{employee.name}} , {{office.name}}, {{index}}, {{current_date}}, {{item.xxx}}
 * Repeater: { type: "repeater", props: { source: "employees", item: "employee" }, children: [...] }
 * Condition: { type: "condition", props: { field: "employee.status", operator: "equals", value: "active" }, children: [...] }
 */

export type TreeNode = {
  type: string
  props?: Record<string, any>
  children?: TreeNode[]
}

function getValueByPath(data: any, path: string, context: any): any {
  // Support "item.xxx" or direct path; context has priority
  if (path === "current_date") {
    return new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
  }
  if (path === "index" && context["index"] !== undefined) return context["index"]
  // try context first, then data
  const tryGet = (obj: any, p: string) => {
    const parts = p.split(".")
    let cur = obj
    for (const part of parts) {
      if (cur == null) return undefined
      cur = cur[part]
    }
    return cur
  }
  let val = tryGet(context, path)
  if (val !== undefined) return val
  val = tryGet(data, path)
  if (val !== undefined) return val
  // also try with item prefix stripped
  if (path.startsWith("item.")) {
    const sub = path.slice(5)
    val = tryGet(context["item"] ?? context[context["__itemName"]] ?? {}, sub)
    if (val !== undefined) return val
  }
  return undefined
}

function interpolateString(str: string, data: any, context: any): string {
  if (typeof str !== "string") return str
  return str.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, rawPath) => {
    const path = rawPath.trim()
    // handle helpers like {{#each}} not needed here
    if (path.startsWith("#") || path.startsWith("/")) return ""
    const val = getValueByPath(data, path, context)
    if (val === undefined || val === null) return ""
    if (typeof val === "object") return JSON.stringify(val)
    return String(val)
  })
}

function interpolateProps(props: Record<string, any> | undefined, data: any, context: any): Record<string, any> {
  if (!props) return {}
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === "string") out[k] = interpolateString(v, data, context)
    else out[k] = v
  }
  return out
}

function evaluateCondition(props: any, data: any, context: any): boolean {
  const field = props.field as string
  const operator = (props.operator as string) || "equals"
  const expected = props.value
  const actual = getValueByPath(data, field, context)
  const actualStr = actual == null ? "" : String(actual)
  const expectedStr = expected == null ? "" : String(expected)
  switch (operator) {
    case "equals": return actualStr === expectedStr
    case "not_equals": return actualStr !== expectedStr
    case "contains": return actualStr.includes(expectedStr)
    case "not_contains": return !actualStr.includes(expectedStr)
    case "exists": return actual !== undefined && actual !== null && actualStr !== ""
    case "not_exists": return actual === undefined || actual === null || actualStr === ""
    case "gt": return Number(actual) > Number(expected)
    case "lt": return Number(actual) < Number(expected)
    case "gte": return Number(actual) >= Number(expected)
    case "lte": return Number(actual) <= Number(expected)
    default: return actualStr === expectedStr
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function renderNodeToHtml(node: TreeNode, data: any, context: any = {}): string {
  const type = node.type
  const props = interpolateProps(node.props, data, context)
  const childrenHtml = (node.children || []).map(c => renderNodeToHtml(c, data, context)).join("")

  switch (type) {
    case "document":
      return `<div style="font-family:Inter,Arial,sans-serif; max-width:800px; margin:0 auto; background:white; color:#111; line-height:1.5; padding:24px;">${childrenHtml}</div>`
    case "header":
      return `<header style="border-bottom: 2px solid #111; padding-bottom:12px; margin-bottom:16px; text-align:center;">${childrenHtml}</header>`
    case "footer":
      return `<footer style="border-top:1px solid #e5e7eb; margin-top:24px; padding-top:12px; font-size:9px; color:#6b7280;">${childrenHtml}</footer>`
    case "section":
      return `<section style="margin:12px 0;">${childrenHtml}</section>`
    case "heading":
      { 
        const size = props.fontSize || 14
        const weight = props.fontWeight || "bold"
        const align = props.align || "left"
        const transform = props.transform === "uppercase" ? "uppercase" : "none"
        const color = props.color || "#111"
        return `<h2 style="font-size:${size}px; font-weight:${weight}; text-align:${align}; text-transform:${transform}; color:${color}; margin:8px 0; letter-spacing:0.02em;">${escapeHtml(props.content || "")}</h2>`
      }
    case "text":
      {
        const size = props.fontSize || 11
        const weight = props.fontWeight || "normal"
        const align = props.align || "left"
        const color = props.color || "#1f2937"
        const indent = props.indent ? `margin-left:${props.indent}px;` : ""
        return `<div style="font-size:${size}px; font-weight:${weight}; text-align:${align}; color:${color}; ${indent} margin:4px 0;">${escapeHtml(props.content || "")}</div>`
      }
    case "paragraph":
      {
        const size = props.fontSize || 11
        const align = props.align || "justify"
        return `<p style="font-size:${size}px; text-align:${align}; margin:8px 0; color:#1f2937;">${escapeHtml(props.content || "")}</p>`
      }
    case "image":
      {
        const w = props.width || 60
        const h = props.height || 60
        const src = props.src || ""
        if (!src || src.includes("{{") ) return `<div style="width:${w}px; height:${h}px; background:#f3f4f6; border:1px dashed #d1d5db; display:inline-flex; align-items:center; justify-content:center; font-size:8px; color:#9ca3af;">LOGO</div>`
        return `<img src="${escapeHtml(src)}" style="width:${w}px; height:${h}px; object-fit:contain; display:inline-block;" alt="logo" />`
      }
    case "divider":
      {
        const h = props.height || 1
        const color = props.color || "#e5e7eb"
        const m = props.margin || 8
        return `<hr style="border:none; border-top:${h}px solid ${color}; margin:${m}px 0;" />`
      }
    case "signature":
      {
        const align = props.align || "right"
        const name = props.name || "{{signer.name}}"
        const position = props.position || ""
        const nip = props.nip || ""
        return `<div style="text-align:${align}; margin-top:24px; font-size:11px; line-height:1.4;">
          <div>Hormat kami,</div>
          <div style="height:60px;"></div>
          <div style="font-weight:700; text-decoration:underline;">${escapeHtml(name)}</div>
          ${position ? `<div style="color:#4b5563;">${escapeHtml(position)}</div>` : ""}
          ${nip ? `<div style="font-size:10px; color:#6b7280;">NIP. ${escapeHtml(nip)}</div>` : ""}
        </div>`
      }
    case "qrcode":
      {
        const size = props.size || 60
        const val = props.value || ""
        const align = props.align || "right"
        // Placeholder QR - use div with border
        return `<div style="text-align:${align}; margin:12px 0;">
          <div style="display:inline-block; width:${size}px; height:${size}px; border:1px solid #111; background:repeating-linear-gradient(45deg,#f3f4f6 0 4px, white 4px 8px); position:relative;">
            <div style="position:absolute; inset:4px; border:2px solid #111; display:flex; align-items:center; justify-content:center; font-size:7px; font-weight:700;">QR</div>
          </div>
          <div style="font-size:7px; color:#6b7280; margin-top:4px; max-width:${size}px; word-break:break-all;">${escapeHtml(val).slice(0,60)}</div>
        </div>`
      }
    case "barcode":
      {
        const val = String(props.value || props.content || props.text || "").trim() || "123456789012"
        const format = props.format || "CODE128"
        const width = Number(props.width) || 220
        const height = Number(props.height) || 56
        const displayValue = props.displayValue !== false && props.displayValue !== "false"
        const align = props.align || "center"
        const lineColor = props.lineColor || "#111"
        const background = props.background || "#fff"
        const textSize = Number(props.fontSize) || 10
        // Generate pseudo-barcode SVG deterministically from value hash
        // Each char → 7 bars pattern based on charCode bits
        const chars = val.split("")
        const totalBars = Math.max(chars.length * 7, 24)
        const barUnit = width / totalBars
        let x = 0
        let bars = ""
        // start guard
        bars += `<rect x="${x}" y="0" width="${barUnit*1.2}" height="${height}" fill="${lineColor}" />`
        x += barUnit*1.2 + barUnit*0.6
        for (let i = 0; i < chars.length; i++) {
          const code = chars[i].charCodeAt(0)
          for (let b = 0; b < 7; b++) {
            const bit = (code >> (b % 4)) & 1
            const w = bit ? barUnit*1.3 : barUnit*0.6
            const isBar = (code + b) % 3 !== 0 // ~2/3 bars
            if (isBar) bars += `<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${height}" fill="${lineColor}" />`
            x += w + barUnit*0.3
            if (x > width - 6) break
          }
          if (x > width - 6) break
          // inter-char gap
          x += barUnit*0.7
        }
        // end guard
        if (x < width - 2) bars += `<rect x="${(width - barUnit*1.2).toFixed(2)}" y="0" width="${barUnit*1.2}" height="${height}" fill="${lineColor}" />`
        const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:${background}; display:inline-block;"><rect width="${width}" height="${height}" fill="${background}" />${bars}</svg>`
        return `<div style="text-align:${align}; margin:12px 0;">
          <div style="display:inline-block; border:1px solid #e5e7eb; padding:8px 10px; background:${background}; border-radius:6px;">
            ${svg}
            ${displayValue ? `<div style="font-family:monospace; font-size:${textSize}px; letter-spacing:${format==='CODE39' ? '3px' : '1px'}; text-align:center; margin-top:6px; color:#111; font-weight:600;">*${escapeHtml(val)}*</div>` : ""}
            ${format ? `<div style="font-size:7px; color:#6b7280; text-align:center; margin-top:2px; text-transform:uppercase; letter-spacing:0.06em;">${escapeHtml(format)}</div>` : ""}
          </div>
        </div>`
      }
    case "table":
      {
        const source = props.source
        const columns: string[] = props.columns || []
        const rows: any[] = getValueByPath(data, source, context) || []
        if (!Array.isArray(rows) || rows.length === 0) {
          return `<div style="border:1px dashed #d1d5db; padding:12px; text-align:center; font-size:11px; color:#9ca3af; margin:12px 0;">Table: ${escapeHtml(source)} — no data</div>`
        }
        const header = columns.map(c => `<th style="border:1px solid #d1d5db; padding:6px 8px; background:#f9fafb; font-size:10px; text-align:left; font-weight:700;">${escapeHtml(c)}</th>`).join("")
        const body = rows.map((row: any, idx: number) => {
          const cells = columns.map(col => {
            if (col === "no") return `<td style="border:1px solid #e5e7eb; padding:6px 8px; font-size:10px;">${idx+1}</td>`
            const v = row[col] ?? row[col.toLowerCase()] ?? ""
            return `<td style="border:1px solid #e5e7eb; padding:6px 8px; font-size:10px;">${escapeHtml(String(v))}</td>`
          }).join("")
          return `<tr>${cells}</tr>`
        }).join("")
        return `<table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:10px;"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`
      }
    case "repeater":
      {
        const source = props.source as string
        const itemName = (props.item as string) || "item"
        const arr = getValueByPath(data, source, context)
        const list: any[] = Array.isArray(arr) ? arr : []
        if (list.length === 0) {
          return `<div style="border:1px dashed #fbbf24; background:#fffbeb; padding:8px; font-size:10px; color:#92400e; margin:8px 0;">Repeater "${escapeHtml(source)}" — empty (0 items)</div>`
        }
        return list.map((item, idx) => {
          const childContext = { ...context, [itemName]: item, item, index: idx+1, __itemName: itemName }
          // support nested source like employee.trips via context resolution - already handled
          const inner = (node.children || []).map(c => renderNodeToHtml(c, data, childContext)).join("")
          return `<div style="margin:6px 0; padding:8px; border-left:2px solid #e5e7eb; background:#fafafa;">${inner}</div>`
        }).join("")
      }
    case "condition":
      {
        const pass = evaluateCondition(node.props || {}, data, context)
        if (!pass) {
          // optionally render else branch if provided as prop elseChildren (not in current spec)
          return `<!-- condition false: ${escapeHtml(JSON.stringify(node.props))} -->`
        }
        return childrenHtml
      }
    case "kop_surat":
      {
        return `<div style="text-align:center; border-bottom:3px double #111; padding-bottom:12px; margin-bottom:16px;">
          <div style="font-size:14px; font-weight:800; letter-spacing:0.05em;">${escapeHtml(props.office || props.content || "KOP SURAT")}</div>
          <div style="font-size:10px; color:#4b5563;">${escapeHtml(props.address || "")}</div>
        </div>`
      }
    case "date":
      {
        const src = props.source || "current_date"
        const val = getValueByPath(data, src, context) || new Date().toISOString()
        const d = new Date(val)
        const formatted = isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric"})
        return `<div style="font-size:10px; color:#374151;">${escapeHtml(formatted)}</div>`
      }
    case "page_break":
      return `<div style="page-break-after:always; border-top:1px dashed #d1d5db; margin:16px 0;"></div>`
    default:
      // generic container
      return `<div style="margin:4px 0;">${props.content ? escapeHtml(interpolateString(props.content, data, context)) : ""}${childrenHtml}</div>`
  }
}

export function renderDocumentTree(tree: TreeNode | any, data: any): string {
  // tree may be stringified JSON or object with children
  let root: TreeNode
  if (typeof tree === "string") {
    try { root = JSON.parse(tree) } catch { return `<div style="color:red; padding:16px;">Invalid JSON schema</div>` }
  } else {
    root = tree
  }
  // normalize: if root has children array at top level
  if (!root.type) {
    // wrap
    root = { type: "document", children: Array.isArray(root) ? root : [root] }
  }
  return renderNodeToHtml(root, data, {})
}

export function validateTree(tree: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!tree) errors.push("Tree empty")
  else if (typeof tree === "string") {
    try { JSON.parse(tree) } catch { errors.push("Invalid JSON") }
  }
  return { valid: errors.length === 0, errors }
}
