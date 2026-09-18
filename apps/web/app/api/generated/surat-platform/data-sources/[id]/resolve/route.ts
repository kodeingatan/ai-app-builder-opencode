import { NextRequest, NextResponse } from "next/server"
import { DataSourcesService } from "@/lib/services/surat-platform/data-sources.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const numId = Number(id)
    if (!numId) return NextResponse.json({ message: "Invalid id" }, { status: 400 })
    const filters: Record<string, string> = {}
    for (const [k, v] of req.nextUrl.searchParams.entries()) {
      if (["department", "status", "search", "limit"].includes(k)) filters[k] = v
      else if (k.startsWith("filter_")) filters[k.slice(7)] = v
      else filters[k] = v
    }
    const result = await DataSourcesService.resolve(numId, filters)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const numId = Number(id)
    if (!numId) return NextResponse.json({ message: "Invalid id" }, { status: 400 })
    const body = await req.json().catch(() => ({}))
    const filters: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) {
      if (v != null) filters[k] = String(v)
    }
    // also merge query params
    for (const [k, v] of req.nextUrl.searchParams.entries()) {
      if (!filters[k]) filters[k] = v
    }
    const result = await DataSourcesService.resolve(numId, filters)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}
