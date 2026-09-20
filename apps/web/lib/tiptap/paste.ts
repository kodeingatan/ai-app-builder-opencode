/**
 * Helpers untuk paste dari Word / dokumen lain
 * - cleanWordHtml: hapus mso-*, o:*, class berlebihan
 * - adaptToEditorHtml: mapping ke design system editor (Inter, prose, border #e6e6e6)
 * - keepStyleHtml: sanitasi keep style (allowlist)
 * - plainToHtml: text -> <p>
 */

const ALLOWED_TAGS_KEEP = new Set(['P','H1','H2','H3','H4','H5','H6','SPAN','DIV','STRONG','EM','U','S','A','UL','OL','LI','TABLE','THEAD','TBODY','TR','TD','TH','BLOCKQUOTE','HR','IMG','BR','CODE','PRE'])
const ALLOWED_STYLES_KEEP = new Set(['font-family','font-size','color','background-color','text-align','font-weight','font-style','text-decoration','border','border-color','border-width','border-style','width','height','vertical-align'])
const ALLOWED_STYLES_ADAPT = new Set(['font-size','color','background-color','text-align','font-weight','font-style','text-decoration']) // font-family di-map ke Inter whitelist

const FONT_WHITELIST = new Set(['Inter','Arial','Helvetica','Times New Roman','Georgia','Courier New','Verdana','Tahoma','Trebuchet MS','Comic Sans MS',''])

function stripMsoAttrs(el: Element) {
  for (const attr of Array.from(el.attributes)) {
    const n = attr.name.toLowerCase()
    if (n.startsWith('mso-') || n.startsWith('o:') || n === 'class' || n === 'id') el.removeAttribute(attr.name)
    if (n === 'style') {
      // filter style declarations
      const decls = attr.value.split(';').map(s=>s.trim()).filter(Boolean)
      const kept: string[] = []
      for (const d of decls) {
        const [propRaw, ...valParts] = d.split(':')
        if (!propRaw || !valParts.length) continue
        const prop = propRaw.trim().toLowerCase()
        const val = valParts.join(':').trim()
        if (!val) continue
        // drop mso-*
        if (prop.startsWith('mso-') || prop.startsWith('o:')) continue
        kept.push(`${prop}: ${val}`)
      }
      if (kept.length) el.setAttribute('style', kept.join('; '))
      else el.removeAttribute('style')
    }
  }
}

function sanitizeTree(root: HTMLElement, keepStyles: Set<string>, mapFontFamily: boolean) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  const toRemove: Element[] = []
  // collect first
  let cur: Node | null = root
  // use queue
  const queue: Element[] = [root]
  while (queue.length) {
    const el = queue.pop()!
    stripMsoAttrs(el)
    // tag check
    if (!ALLOWED_TAGS_KEEP.has(el.tagName)) {
      // unwrap: move children out, mark for removal but keep children
      // We'll handle by replacing with its children
      if (el !== root) {
        const parent = el.parentNode as HTMLElement | null
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el)
          toRemove.push(el)
        }
      }
      // still need to process children (already moved)
      continue
    }
    // style filter
    const style = el.getAttribute('style')
    if (style) {
      const decls = style.split(';').map(s=>s.trim()).filter(Boolean)
      const kept: string[] = []
      for (const d of decls) {
        const [propRaw, ...valParts] = d.split(':')
        if (!propRaw || !valParts.length) continue
        const prop = propRaw.trim().toLowerCase()
        const val = valParts.join(':').trim()
        if (!keepStyles.has(prop)) continue
        if (prop === 'font-family' && mapFontFamily) {
          // only keep if in whitelist, else drop (fallback Inter)
          const fam = val.replace(/["']/g,'').split(',')[0].trim()
          const norm = fam.replace(/"/g,'')
          const allowed = Array.from(FONT_WHITELIST).some(f => norm.toLowerCase() === f.toLowerCase().replace(/"/g,'').toLowerCase())
          if (!allowed && fam) continue
          // normalize quotes
          kept.push(`font-family: ${val}`)
        } else if (prop === 'font-size') {
          // clamp 8-48px, keep px only
          const m = val.match(/(\d+(?:\.\d+)?)px/i)
          if (m) {
            const num = Math.max(8, Math.min(48, parseFloat(m[1])))
            kept.push(`font-size: ${num}px`)
          } else if (/^\d+$/.test(val.trim())) {
            const num = Math.max(8, Math.min(48, parseFloat(val.trim())))
            kept.push(`font-size: ${num}px`)
          } else {
            // drop pt etc, keep as is if contains px
            if (val.includes('px')) kept.push(`font-size: ${val}`)
          }
        } else {
          kept.push(`${prop}: ${val}`)
        }
      }
      if (kept.length) el.setAttribute('style', kept.join('; '))
      else el.removeAttribute('style')
    }
    // href keep only http/mailto/#/
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || ''
      if (href && !/^(https?:\/\/|\/|#|mailto:)/i.test(href)) el.removeAttribute('href')
    }
    if (el.tagName === 'IMG') {
      // keep src only if http/data
      const src = el.getAttribute('src') || ''
      if (src && !/^(https?:\/\/|data:|\/)/i.test(src)) el.removeAttribute('src')
      el.removeAttribute('width')
      el.removeAttribute('height')
      // keep style width/height via style already
    }
    for (const child of Array.from(el.children)) queue.push(child as Element)
  }
  for (const el of toRemove) el.remove()
}

export function isWordHtml(html: string): boolean {
  return /mso-|urn:schemas-microsoft|w:WordDocument/i.test(html)
}

export function keepStyleHtml(html: string): string {
  if (!html) return ""
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const body = doc.body
  sanitizeTree(body as unknown as HTMLElement, ALLOWED_STYLES_KEEP, false)
  // Word table border normalization: keep but ensure #e6e6e6 fallback handled later by editor CSS
  return body.innerHTML
}

export function adaptToEditorHtml(html: string): string {
  if (!html) return ""
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const body = doc.body
  // For adapt, map font-family to whitelist (drop unknown), keep font-size but clamp
  sanitizeTree(body as unknown as HTMLElement, ALLOWED_STYLES_ADAPT, true)
  // Table: force width 100%, border-collapse, border #e6e6e6
  body.querySelectorAll('table').forEach(tbl => {
    (tbl as HTMLElement).style.width = '100%'
    ;(tbl as HTMLElement).style.borderCollapse = 'collapse'
    tbl.querySelectorAll('td, th').forEach(cell => {
      const c = cell as HTMLElement
      // normalize border
      if (!c.style.border) c.style.border = '1px solid #e6e6e6'
      if (!c.style.padding) c.style.padding = '6px 10px'
    })
  })
  return body.innerHTML
}

export function plainToHtml(text: string): string {
  if (!text) return "<p></p>"
  const esc = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const paras = esc.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
  if (paras.length === 0) return `<p>${esc.replace(/\n/g,'<br>')}</p>`
  return paras.map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('')
}
