import { NextRequest, NextResponse } from "next/server"
import { UpdateDocumentSchema } from "@/lib/dto/surat-platform/documents.dto"
import { DocumentsService } from "@/lib/services/surat-platform/documents.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await DocumentsService.findOne(Number(id))
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data = UpdateDocumentSchema.parse(body)
  const updated = await DocumentsService.update(Number(id), data as any)
  return NextResponse.json(updated)
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await DocumentsService.remove(Number(id))
  return NextResponse.json({ message: "Deleted" })
}
