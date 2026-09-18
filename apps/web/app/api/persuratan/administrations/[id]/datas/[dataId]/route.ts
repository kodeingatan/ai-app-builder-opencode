import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const TABLE = "persuratan_datas"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string; dataId: string }> }) {
  const { dataId } = await params
  const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE id=?`, Number(dataId))
  if (!rows[0]) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(rows[0])
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; dataId: string }> }) {
  const { dataId } = await params
  const body = await req.json()
  const sets: string[] = []
  const vals: any[] = []
  if (body.name !== undefined) { sets.push(`name=?`); vals.push(body.name) }
  if (body.valuesJson !== undefined) { sets.push(`valuesJson=?`); vals.push(typeof body.valuesJson === "string" ? body.valuesJson : JSON.stringify(body.valuesJson)) }
  if (body.stepsDataJson !== undefined) { sets.push(`stepsDataJson=?`); vals.push(typeof body.stepsDataJson === "string" ? body.stepsDataJson : JSON.stringify(body.stepsDataJson)) }
  if (!sets.length) return NextResponse.json({ message: "No fields" }, { status: 400 })
  sets.push(`updatedAt=CURRENT_TIMESTAMP`)
  await prisma.$executeRawUnsafe(`UPDATE "${TABLE}" SET ${sets.join(",")} WHERE id=?`, ...vals, Number(dataId))
  const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE id=?`, Number(dataId))
  return NextResponse.json(rows[0])
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; dataId: string }> }) {
  const { dataId } = await params
  await prisma.$executeRawUnsafe(`DELETE FROM "${TABLE}" WHERE id=?`, Number(dataId))
  return NextResponse.json({ id: Number(dataId) })
}
