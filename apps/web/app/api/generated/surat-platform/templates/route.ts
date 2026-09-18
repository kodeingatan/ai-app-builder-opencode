import { NextRequest, NextResponse } from "next/server"
import { QueryTemplateSchema, CreateTemplateSchema } from "@/lib/dto/surat-platform/templates.dto"
import { TemplatesService } from "@/lib/services/surat-platform/templates.service"

export async function GET(req: NextRequest) {
  try {
    const query = QueryTemplateSchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const result = await TemplatesService.findAll(query)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateTemplateSchema.parse(body)
    const created = await TemplatesService.create(data as any)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ message: "Validation failed", errors: e.errors }, { status: 422 })
    if (String(e.message).includes("UNIQUE")) return NextResponse.json({ message: "Code already exists" }, { status: 409 })
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}
