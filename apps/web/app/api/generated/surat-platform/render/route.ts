import { NextRequest, NextResponse } from "next/server"
import { renderDocumentTree } from "@/lib/renderer/engine"
import { TemplatesService } from "@/lib/services/surat-platform/templates.service"
import { z } from "zod"

const RenderSchema = z.object({
  templateId: z.coerce.number().int().optional(),
  schema: z.any().optional(),
  data: z.record(z.string(), z.any()),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { templateId, schema, data } = RenderSchema.parse(body)

    let tree: any = schema
    if (!tree && templateId) {
      const tpl = await TemplatesService.findOne(templateId)
      if (!tpl) return NextResponse.json({ message: "Template not found" }, { status: 404 })
      try {
        tree = JSON.parse(tpl.schema_json)
      } catch {
        return NextResponse.json({ message: "Invalid template schema JSON" }, { status: 400 })
      }
    }
    if (!tree) return NextResponse.json({ message: "schema or templateId required" }, { status: 422 })

    const html = renderDocumentTree(tree, data)

    return NextResponse.json({ html, data, tree })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ message: "Validation failed", errors: e.errors }, { status: 422 })
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

// GET preview with query params for quick test
export async function GET(req: NextRequest) {
  const templateId = req.nextUrl.searchParams.get("templateId")
  if (!templateId) return NextResponse.json({ message: "templateId required" }, { status: 422 })
  const tpl = await TemplatesService.findOne(Number(templateId))
  if (!tpl) return NextResponse.json({ message: "Template not found" }, { status: 404 })

  // demo data - could fetch employees
  const demoData = {
    letter: { number: "800/001/SK/VI/2026", title: "SURAT KEPUTUSAN", consideration: "perlu dibentuk tim" },
    office: { name: "PEMERINTAH PROVINSI ACEH", address: "Jl. T. Nyak Arief No.219", logo: "" },
    signer: { name: "Drs. H. Ahmad Yani, M.Si", position: "Kepala Dinas", nip: "196501011990031001" },
    employees: [
      { name: "Afdal", nip: "199001012015031001", position: "Programmer", department: "Bidang TI", status: "active" },
      { name: "Budi", nip: "198512122010011002", position: "Analis", department: "Hukum", status: "active" },
    ],
    current_date: new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric"}),
    document: { qrValue: "https://verifikasi.kantor.go.id/800-001" }
  }

  try {
    const tree = JSON.parse(tpl.schema_json)
    const html = renderDocumentTree(tree, demoData)
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
