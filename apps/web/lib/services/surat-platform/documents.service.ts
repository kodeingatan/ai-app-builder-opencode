import prisma from "@/lib/prisma"

const TABLE = "surat_platform_documents"

function safeSort(s: string) {
  const allowed = new Set(["id","document_number","title","status","created_at","issued_at","template_id"])
  return allowed.has(s) ? s : "id"
}

export const DocumentsService = {
  async findAll(query: any) {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)
    const offset = (page - 1) * limit
    const sortBy = safeSort(query.sortBy ?? "id")
    const sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC"
    const search = query.search?.trim()
    const status = query.status
    const template_id = query.template_id

    let where = "WHERE 1=1"
    const params: any[] = []
    if (search) {
      where += ` AND (document_number LIKE ? OR title LIKE ? OR recipient_name LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (status) { where += ` AND status = ?`; params.push(status) }
    if (template_id) { where += ` AND template_id = ?`; params.push(template_id) }

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
    const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE document_number = ? ORDER BY id DESC LIMIT 1`, data.document_number)
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
