import { NextRequest, NextResponse } from "next/server"
import { UpdateTemplateSchema } from "@/lib/dto/surat-platform/templates.dto"
import { TemplatesService } from "@/lib/services/surat-platform/templates.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await TemplatesService.findOne(Number(id))
  if (!item) return NextResponse.json({ message: "Template not found" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data = UpdateTemplateSchema.parse(body)
  const updated = await TemplatesService.update(Number(id), data as any)
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await TemplatesService.remove(Number(id))
  return NextResponse.json({ message: "Deleted" })
}
