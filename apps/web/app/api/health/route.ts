import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    const users = await prisma.user.count()
    return NextResponse.json({ status: "ok", db: "connected", users })
  } catch (e) {
    return NextResponse.json({ status: "error", message: (e as Error).message }, { status: 500 })
  }
}
