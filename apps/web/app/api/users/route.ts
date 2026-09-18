import { NextRequest, NextResponse } from "next/server"
import { QuerySchema, CreateUserSchema } from "@/lib/dto/users.dto"
import { UsersService } from "@/lib/services/users.service"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  const query = QuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
  const result = await UsersService.findAll(query)
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const data = CreateUserSchema.parse(body)
  const hashed = await bcrypt.hash(data.password, 10)
  const user = await UsersService.create({ ...data, password: hashed })
  return NextResponse.json(user, { status: 201 })
}
