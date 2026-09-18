import { NextRequest, NextResponse } from "next/server"
import { QueryDocumentSchema, CreateDocumentSchema } from "@/lib/dto/surat-platform/documents.dto"
import { DocumentsService } from "@/lib/services/surat-platform/documents.service"

export async function GET(req: NextRequest) {
  const q = QueryDocumentSchema.parse(Object.fromEntries(req.nextUrl.searchParams))
  const result = await DocumentsService.findAll(q)
  return NextResponse.json(result)
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateDocumentSchema.parse(body)
    const created = await DocumentsService.create(data as any)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ message: "Validation failed", errors: e.errors }, { status: 422 })
    if (String(e.message).includes("UNIQUE")) return NextResponse.json({ message: "Document number already exists" }, { status: 409 })
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}
