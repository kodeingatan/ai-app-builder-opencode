import { NextRequest, NextResponse } from "next/server"
import { QueryComponentSchema, CreateComponentSchema } from "@/lib/dto/surat-platform/components.dto"
import { ComponentsService } from "@/lib/services/surat-platform/components.service"

export async function GET(req: NextRequest) {
  const q = QueryComponentSchema.parse(Object.fromEntries(req.nextUrl.searchParams))
  const result = await ComponentsService.findAll(q)
  return NextResponse.json(result)
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateComponentSchema.parse(body)
    const created = await ComponentsService.create(data)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ message: "Validation failed", errors: e.errors }, { status: 422 })
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}
