import { NextRequest, NextResponse } from "next/server"
import { CreateGlobalTableSchema, QueryGlobalTableSchema } from "@/lib/dto/global-tables.dto"
import { GlobalTablesService } from "@/lib/services/global-tables.service"

export async function GET(req: NextRequest) {
  try {
    const query = QueryGlobalTableSchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const result = await GlobalTablesService.findAll(query)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateGlobalTableSchema.parse(body)
    const created = await GlobalTablesService.create(parsed as any)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ message: "Validation failed", errors: e.errors }, { status: 422 })
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}
