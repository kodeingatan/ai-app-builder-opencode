import prisma from "@/lib/prisma"

const TABLE = "surat_platform_templates"

function toSafeSort(sortBy: string) {
  const allowed = new Set(["id","name","code","category","status","created_at","updated_at","version"])
  return allowed.has(sortBy) ? sortBy : "id"
}

export const TemplatesService = {
  async findAll(query: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: "asc"|"desc"; category?: string; status?: string }) {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)
    const offset = (page - 1) * limit
    const sortBy = toSafeSort(query.sortBy ?? "id")
    const sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC"
    const search = query.search?.trim()
    const category = query.category
    const status = query.status

    let where = "WHERE 1=1"
    const params: any[] = []
    let paramIdx = 1
    const addParam = (v: any) => { params.push(v); return `?` }

    if (search) {
      where += ` AND (name LIKE ${addParam(`%${search}%`)} OR code LIKE ${addParam(`%${search}%`)} OR description LIKE ${addParam(`%${search}%`)})`
    }
    if (category) {
      where += ` AND category = ${addParam(category)}`
    }
    if (status) {
      where += ` AND status = ${addParam(status)}`
    }

    const countResult: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM "${TABLE}" ${where}`, ...params)
    const total = Number(countResult[0]?.total ?? 0)

    const data: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" ${where} ORDER BY "${sortBy}" ${sortOrder} LIMIT ? OFFSET ?`, ...params, limit, offset)

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async findOne(id: number) {
    const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE id = ? LIMIT 1`, id)
    return rows[0] ?? null
  },

  async create(data: { name: string; code: string; category: string; description?: string | null; version?: number; status?: string; schema_json: string; preview_html?: string | null }) {
    const cols = Object.keys(data).map(k => `"${k}"`).join(", ")
    const placeholders = Object.keys(data).map(() => "?").join(", ")
    const values = Object.values(data)
    await prisma.$executeRawUnsafe(`INSERT INTO "${TABLE}" (${cols}) VALUES (${placeholders})`, ...values)
    const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE code = ? ORDER BY id DESC LIMIT 1`, data.code)
    return rows[0]
  },

  async update(id: number, data: Record<string, any>) {
    if (Object.keys(data).length === 0) return this.findOne(id)
    const sets = Object.keys(data).map(k => `"${k}" = ?`).join(", ")
    const values = Object.values(data)
    await prisma.$executeRawUnsafe(`UPDATE "${TABLE}" SET ${sets}, "updated_at" = CURRENT_TIMESTAMP WHERE id = ?`, ...values, id)
    return this.findOne(id)
  },

  async remove(id: number) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${TABLE}" WHERE id = ?`, id)
    return { id }
  },
}
