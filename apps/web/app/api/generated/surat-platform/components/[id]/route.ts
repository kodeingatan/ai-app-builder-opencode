import { NextRequest, NextResponse } from "next/server"
import { UpdateComponentSchema } from "@/lib/dto/surat-platform/components.dto"
import { ComponentsService } from "@/lib/services/surat-platform/components.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await ComponentsService.findOne(Number(id))
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data = UpdateComponentSchema.parse(body)
  const updated = await ComponentsService.update(Number(id), data)
  return NextResponse.json(updated)
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await ComponentsService.remove(Number(id))
  return NextResponse.json({ message: "Deleted" })
}
