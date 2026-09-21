import { NextRequest, NextResponse } from "next/server"
import { PersuratanAdministrationsService } from "@/lib/services/persuratan/administrations.service"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await params
  const adminId = Number(id)
  const q = Object.fromEntries(req.nextUrl.searchParams)
  const page = Number(q.page) || 1
  const limit = Number(q.limit) || 20
  const search = (q.search as string) || ""
  // if preview pdf requested?
  if (q.preview === "pdf") {
    // generate pdf of all datas? For now return html
    return NextResponse.json({ message: "preview pdf not yet" })
  }
  const result = await PersuratanAdministrationsService.listDatas(adminId, { page, limit, search })
  // also need to handle search filtering on valuesJson? For now DB search not implemented, just return
  // If search provided, filter in memory
  if (search) {
    const filtered = result.data.filter((r: any) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))
    return NextResponse.json({ ...result, data: filtered, total: filtered.length })
  }
  return NextResponse.json(result)
  } catch(e:any){ return NextResponse.json({message:e.message ?? "Gagal memuat datas", data:[], total:0, page:1, limit:20, totalPages:0},{status:500}) }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await params
  const adminId = Number(id)
  const body = await req.json()
  // body: {name, valuesJson, stepsDataJson}
  // valuesJson and stepsDataJson may be objects, we stringify in service
  const created = await PersuratanAdministrationsService.createData(adminId, {
    name: body.name,
    valuesJson: body.valuesJson,
    stepsDataJson: body.stepsDataJson,
  })
  return NextResponse.json(created, { status: 201 })
  } catch(e:any){ return NextResponse.json({message:e.message ?? "Gagal membuat data"},{status:400}) }
}
