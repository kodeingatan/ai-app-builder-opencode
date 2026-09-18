import { NextRequest, NextResponse } from "next/server"
import { renderDocumentTree } from "@/lib/renderer/engine"
import { TemplatesService } from "@/lib/services/surat-platform/templates.service"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ExportSchema = z.object({
  templateId: z.coerce.number().int().optional(),
  schema: z.any().optional(),
  data: z.record(z.string(), z.any()),
  filename: z.string().optional(),
  format: z.enum(["A4", "Letter", "A3", "A5"]).optional(),
  landscape: z.boolean().optional(),
  margin: z.object({
    top: z.string().optional(),
    bottom: z.string().optional(),
    left: z.string().optional(),
    right: z.string().optional(),
  }).optional(),
})

// helper: wrap html in printable document
function wrapHtml(bodyHtml: string, title: string = "Document") {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { margin:0; padding:0; background:#f6f5f4; font-family: Inter, system-ui, -apple-system, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 12mm; }
  @media print { body { background: white; } }
  a { color: #0075de; }
</style>
</head>
<body>
${bodyHtml}
<script>window.print && window.print()</script>
</body>
</html>`
}

async function htmlToPdfBuffer(html: string, opts: { format?: string; landscape?: boolean; margin?: any }): Promise<Buffer> {
  // Try puppeteer-core with system chrome, fallback to puppeteer if available
  let puppeteer: any = null
  let launchOpts: any = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  }
  try {
    // prefer puppeteer-core
    const pc = await import("puppeteer-core")
    puppeteer = pc.default ?? pc
    const candidates = [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      process.env.CHROME_PATH,
    ].filter(Boolean) as string[]
    // find first existing executable
    const fs = await import("fs")
    let exe: string | undefined
    for (const p of candidates) {
      try { if (fs.existsSync(p)) { exe = p; break } } catch {}
    }
    if (exe) launchOpts.executablePath = exe
    else {
      // try to let puppeteer-core find it via channel
      launchOpts.channel = "chrome"
    }
  } catch (e:any) {
    throw new Error("PDF engine not available (puppeteer-core missing): " + e.message)
  }

  const browser = await puppeteer.launch(launchOpts)
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 })
    // emulate print
    await page.emulateMediaType("print")
    const pdf = await page.pdf({
      format: (opts.format as any) || "A4",
      landscape: !!opts.landscape,
      printBackground: true,
      margin: opts.margin || { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
      displayHeaderFooter: false,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close().catch(() => {})
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ExportSchema.parse(body)
    const { templateId, schema, data, filename, format, landscape, margin } = parsed

    let tree: any = schema
    let title = "Document"
    if (!tree && templateId) {
      const tpl = await TemplatesService.findOne(templateId)
      if (!tpl) return NextResponse.json({ message: "Template not found" }, { status: 404 })
      try { tree = JSON.parse(tpl.schema_json); title = tpl.name } catch { return NextResponse.json({ message: "Invalid template schema" }, { status: 400 }) }
    }
    if (!tree) return NextResponse.json({ message: "schema or templateId required" }, { status: 422 })

    const innerHtml = renderDocumentTree(tree, data)
    const fullHtml = wrapHtml(innerHtml, title)

    // Try server-side PDF via puppeteer, fallback to HTML if fails
    try {
      const pdfBuffer = await htmlToPdfBuffer(fullHtml, { format, landscape, margin })
      const safeName = (filename || title || "document").replace(/[^a-zA-Z0-9-_]/g, "_") + ".pdf"
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeName}"`,
          "Content-Length": String(pdfBuffer.length),
          "Cache-Control": "no-store",
        },
      })
    } catch (e: any) {
      // fallback: return HTML with 500 + hint, but also include html for client to print
      console.error("PDF generation failed, fallback to HTML", e?.message)
      return NextResponse.json(
        { message: "PDF engine failed, fallback HTML provided", error: e?.message, html: fullHtml },
        { status: 500 }
      )
    }
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ message: "Validation failed", errors: e.errors }, { status: 422 })
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const templateId = req.nextUrl.searchParams.get("templateId")
  const wantsPdf = req.nextUrl.searchParams.get("pdf") === "1" || req.headers.get("accept")?.includes("application/pdf")
  if (!templateId) return NextResponse.json({ message: "templateId required (or POST with schema)" }, { status: 422 })
  const tpl = await TemplatesService.findOne(Number(templateId))
  if (!tpl) return NextResponse.json({ message: "Template not found" }, { status: 404 })

  const demoData: any = {
    letter: { number: "800/001/SK/VI/2026", title: "SURAT KEPUTUSAN", consideration: "perlu dibentuk tim" },
    office: { name: "PEMERINTAH PROVINSI ACEH", address: "Jl. T. Nyak Arief No.219 Banda Aceh", logo: "" },
    signer: { name: "Drs. H. Ahmad Yani, M.Si", position: "Kepala Dinas", nip: "196501011990031001" },
    employees: [
      { name: "Afdal", nip: "199001012015031001", position: "Programmer", department: "Bidang TI", status: "active" },
      { name: "Budi Santoso", nip: "198512122010011002", position: "Analis", department: "Hukum", status: "active" },
      { name: "Citra Dewi", nip: "199205152018022001", position: "Staff", department: "Sekretariat", status: "active" },
    ],
    current_date: new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric"}),
    document: { qrValue: "https://verifikasi.kantor.go.id/800-001" },
    departments: [{ name: "Bidang TI" }, { name: "Hukum" }],
  }

  try {
    const tree = JSON.parse(tpl.schema_json)
    const innerHtml = renderDocumentTree(tree, demoData)
    const fullHtml = wrapHtml(innerHtml, tpl.name)

    if (wantsPdf) {
      try {
        const pdfBuffer = await htmlToPdfBuffer(fullHtml, { format: "A4" })
        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${tpl.code}.pdf"`,
          },
        })
      } catch (e: any) {
        return NextResponse.json({ message: "PDF failed", error: e.message }, { status: 500 })
      }
    }

    return new NextResponse(fullHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
