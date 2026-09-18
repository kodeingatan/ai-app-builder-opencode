import { NextRequest, NextResponse } from "next/server"
import { GlobalTablesService } from "@/lib/services/global-tables.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await params
    const query = Object.fromEntries(req.nextUrl.searchParams)
    const page = query.page ? Number(query.page) : undefined
    const limit = query.limit ? Number(query.limit) : undefined
    const search = query.search as string | undefined
    const sortBy = query.sortBy as string | undefined
    const sortOrder = query.sortOrder as "asc" | "desc" | undefined
    // Collect filters for searchable columns? Any query param that matches column name
    const filters: Record<string, any> = {}
    for (const [k, v] of Object.entries(query)) {
      if (!["page", "limit", "search", "sortBy", "sortOrder"].includes(k)) filters[k] = v
    }
    const result = await GlobalTablesService.listData(table, { page, limit, search, sortBy, sortOrder, filters })
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await params
    const body = await req.json()
    const created = await GlobalTablesService.createData(table, body)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}
