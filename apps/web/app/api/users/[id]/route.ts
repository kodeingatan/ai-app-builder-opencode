import { NextRequest, NextResponse } from "next/server"
import { UsersService } from "@/lib/services/users.service"
import { UpdateUserSchema } from "@/lib/dto/users.dto"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await UsersService.findOne(Number(id))
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data = UpdateUserSchema.parse(body)
  const user = await UsersService.update(Number(id), data)
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await UsersService.remove(Number(id))
  return NextResponse.json({ message: "Deleted" })
}
