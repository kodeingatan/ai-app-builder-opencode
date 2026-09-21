import { NextRequest, NextResponse } from "next/server"
import { UpdateGlobalTableSchema } from "@/lib/dto/global-tables.dto"
import { GlobalTablesService } from "@/lib/services/global-tables.service"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const row = await GlobalTablesService.findOne(Number(id))
    if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(row)
  } catch (e: any) {
    return NextResponse.json({ message: e.message ?? "Gagal memuat tabel" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateGlobalTableSchema.parse(body)
    const updated = await GlobalTablesService.update(Number(id), parsed as any)
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ message: "Validation failed", errors: e.errors }, { status: 422 })
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const res = await GlobalTablesService.remove(Number(id))
    return NextResponse.json(res)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}
