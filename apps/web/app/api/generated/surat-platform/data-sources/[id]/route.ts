import { NextRequest, NextResponse } from "next/server"
import { UpdateDataSourceSchema } from "@/lib/dto/surat-platform/data-sources.dto"
import { DataSourcesService } from "@/lib/services/surat-platform/data-sources.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await DataSourcesService.findOne(Number(id))
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data = UpdateDataSourceSchema.parse(body)
  const updated = await DataSourcesService.update(Number(id), data)
  return NextResponse.json(updated)
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await DataSourcesService.remove(Number(id))
  return NextResponse.json({ message: "Deleted" })
}
