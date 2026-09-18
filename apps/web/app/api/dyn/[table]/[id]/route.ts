import { NextRequest, NextResponse } from "next/server"
import { GlobalTablesService } from "@/lib/services/global-tables.service"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ table: string; id: string }> }) {
  const { table, id } = await params
  const row = await GlobalTablesService.getDataOne(table, Number(id))
  if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(row)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ table: string; id: string }> }) {
  try {
    const { table, id } = await params
    const body = await req.json()
    const updated = await GlobalTablesService.updateData(table, Number(id), body)
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ table: string; id: string }> }) {
  const { table, id } = await params
  await GlobalTablesService.deleteData(table, Number(id))
  return NextResponse.json({ id: Number(id) })
}
