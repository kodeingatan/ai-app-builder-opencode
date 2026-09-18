import { NextRequest, NextResponse } from "next/server"
import { QueryDataSourceSchema, CreateDataSourceSchema } from "@/lib/dto/surat-platform/data-sources.dto"
import { DataSourcesService } from "@/lib/services/surat-platform/data-sources.service"

export async function GET(req: NextRequest) {
  const query = QueryDataSourceSchema.parse(Object.fromEntries(req.nextUrl.searchParams))
  const result = await DataSourcesService.findAll(query)
  return NextResponse.json(result)
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateDataSourceSchema.parse(body)
    const created = await DataSourcesService.create(data)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ message: "Validation failed", errors: e.errors }, { status: 422 })
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}
