import prisma from "@/lib/prisma"

const TABLE = "surat_platform_data_sources"

function safeSort(s: string) {
  const allowed = new Set(["id","name","type","entity","created_at"])
  return allowed.has(s) ? s : "id"
}

export const DataSourcesService = {
  async findAll(query: any) {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)
    const offset = (page - 1) * limit
    const sortBy = safeSort(query.sortBy ?? "id")
    const sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC"
    const search = query.search?.trim()
    const type = query.type

    let where = "WHERE 1=1"
    const params: any[] = []
    if (search) {
      where += ` AND (name LIKE ? OR entity LIKE ? OR description LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (type) {
      where += ` AND type = ?`
      params.push(type)
    }

    const count: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM "${TABLE}" ${where}`, ...params)
    const total = Number(count[0]?.total ?? 0)
    const data: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" ${where} ORDER BY "${sortBy}" ${sortOrder} LIMIT ? OFFSET ?`, ...params, limit, offset)
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },
  async findOne(id: number) {
    const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE id = ?`, id)
    return rows[0] ?? null
  },
  async create(data: any) {
    const cols = Object.keys(data).map(k => `"${k}"`).join(", ")
    const placeholders = Object.keys(data).map(() => "?").join(", ")
    await prisma.$executeRawUnsafe(`INSERT INTO "${TABLE}" (${cols}) VALUES (${placeholders})`, ...Object.values(data))
    const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" ORDER BY id DESC LIMIT 1`)
    return rows[0]
  },
  async update(id: number, data: any) {
    if (!Object.keys(data).length) return this.findOne(id)
    const sets = Object.keys(data).map(k => `"${k}" = ?`).join(", ")
    await prisma.$executeRawUnsafe(`UPDATE "${TABLE}" SET ${sets}, "updated_at" = CURRENT_TIMESTAMP WHERE id = ?`, ...Object.values(data), id)
    return this.findOne(id)
  },
  async remove(id: number) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${TABLE}" WHERE id = ?`, id)
    return { id }
  },
}
