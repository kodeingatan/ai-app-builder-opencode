import { NextRequest, NextResponse } from "next/server"
import { UpdateEmployeeSchema } from "@/lib/dto/surat-platform/employees.dto"
import { EmployeesService } from "@/lib/services/surat-platform/employees.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await EmployeesService.findOne(Number(id))
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data = UpdateEmployeeSchema.parse(body)
  const updated = await EmployeesService.update(Number(id), data as any)
  return NextResponse.json(updated)
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await EmployeesService.remove(Number(id))
  return NextResponse.json({ message: "Deleted" })
}
