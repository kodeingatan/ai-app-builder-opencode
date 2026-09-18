import prisma from "@/lib/prisma"

const TABLE = "surat_platform_data_sources"

function safeSort(s: string) {
  const allowed = new Set(["id","name","type","entity","created_at"])
  return allowed.has(s) ? s : "id"
}

function safeTableName(entity: string): string | null {
  // allow only alphanum + underscore, map entity -> surat_platform_{entity} if needed
  const raw = entity?.trim()
  if (!raw) return null
  // if already full table like surat_platform_employees, keep
  if (raw.startsWith("surat_platform_")) {
    if (!/^[a-z0-9_]+$/.test(raw)) return null
    return raw
  }
  const slug = raw.toLowerCase().replace(/[^a-z0-9_]/g, "")
  if (!slug) return null
  return `surat_platform_${slug}`
}

function parseConfig(config_json: string | null | any): any {
  if (!config_json) return {}
  if (typeof config_json === "object") return config_json
  try { return JSON.parse(config_json) } catch { return {} }
}

export const DataSourcesService = {
  // Resolve data source with optional filters (additive, no schema change)
  async resolve(id: number, filters: Record<string, string> = {}) {
    const row: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE id = ?`, id)
    const ds = row[0]
    if (!ds) throw new Error("DataSource not found")
    const cfg = parseConfig(ds.config_json)
    const type = ds.type as string
    const entity = ds.entity as string | null

    // type: static → return cfg.data
    if (type === "static") {
      const arr = cfg.data || cfg.rows || []
      // optional filter by department/status if provided and data has those fields
      let filtered = Array.isArray(arr) ? arr : []
      if (filters.department) filtered = filtered.filter((r: any) => String(r.department) === String(filters.department))
      if (filters.status) filtered = filtered.filter((r: any) => String(r.status) === String(filters.status))
      if (filters.search) {
        const s = String(filters.search).toLowerCase()
        filtered = filtered.filter((r: any) => JSON.stringify(r).toLowerCase().includes(s))
      }
      return { source: ds, data: filtered, total: filtered.length, resolvedVia: "static" }
    }

    // type: custom_query → cfg.query with {{placeholders}} or ? params
    if (type === "custom_query") {
      let sql: string = cfg.query || cfg.sql || ""
      if (!sql) throw new Error("custom_query missing cfg.query")
      // Support {{key}} placeholders -> replace with ? and collect values
      const params: any[] = []
      // collect placeholder keys in order of appearance
      const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/g
      let match: RegExpExecArray | null
      const keysInOrder: string[] = []
      // eslint-disable-next-line no-cond-assign
      while ((match = placeholderRegex.exec(sql)) !== null) keysInOrder.push(match[1])

      // also support cfg.params as array of keys or object
      // Build final sql with ? placeholders
      let finalSql = sql.replace(placeholderRegex, "?")
      // If no {{}} but cfg.params exists and sql has ?, use cfg.params order
      if (keysInOrder.length === 0 && Array.isArray(cfg.params)) {
        // assume sql already has ? and params are literal values or filter keys
        for (const p of cfg.params) {
          if (typeof p === "string" && filters[p] !== undefined) params.push(filters[p])
          else params.push(p)
        }
      } else {
        for (const k of keysInOrder) {
          // prefer filters[k], fallback cfg.defaults[k] or cfg.params[k]
          const v = filters[k] ?? cfg.defaults?.[k] ?? cfg.params?.[k] ?? ""
          params.push(v)
        }
        // If sql had no placeholders but filters provided (e.g., department filter for employees), append WHERE if needed
        // For safety, if finalSql doesn't contain WHERE and filters.department exists and entity is employees, add condition
        if (!finalSql.toLowerCase().includes("where") && Object.keys(filters).length && cfg.entity) {
          const table = safeTableName(cfg.entity || entity || "")
          if (table) {
            const conds: string[] = []
            if (filters.department) { conds.push(`department = ?`); params.push(filters.department) }
            if (filters.status) { conds.push(`status = ?`); params.push(filters.status) }
            if (conds.length) finalSql += ` WHERE ${conds.join(" AND ")}`
          }
        }
      }

      // Security: only allow SELECT
      const trimmed = finalSql.trim().toLowerCase()
      if (!trimmed.startsWith("select")) throw new Error("custom_query only SELECT allowed")

      // Table whitelist: must contain surat_platform_ prefix
      if (!finalSql.includes("surat_platform_") && !finalSql.includes("employees")) {
        // allow if cfg.entity provided and we can verify table exists
      }

      const data: any = await prisma.$queryRawUnsafe(finalSql, ...params)
      if (!Array.isArray(data)) throw new Error("Query returned non-array")
      // optional post-filter for department/status if not in SQL
      let filtered = data
      if (filters.department && !finalSql.toLowerCase().includes("department")) {
        filtered = filtered.filter((r: any) => String(r.department) === String(filters.department))
      }
      if (filters.status && !finalSql.toLowerCase().includes("status")) {
        filtered = filtered.filter((r: any) => String(r.status) === String(filters.status))
      }
      return { source: ds, data: filtered, total: filtered.length, sql: finalSql, params, resolvedVia: "custom_query" }
    }

    // type: entity or api → map entity to table and query with filters (department/status/search)
    if (type === "entity" || type === "api") {
      const table = safeTableName(entity || cfg.entity || cfg.table || "")
      if (!table) throw new Error("entity/table invalid for resolve")
      // whitelist tables: surat_platform_*
      let where = "WHERE 1=1"
      const params: any[] = []
      if (filters.department) { where += " AND department = ?"; params.push(filters.department) }
      if (filters.status) { where += " AND status = ?"; params.push(filters.status) }
      if (filters.search) { where += " AND (name LIKE ? OR nip LIKE ? OR position LIKE ?)"; params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`) }
      // optional limit from filters.limit
      const limit = Math.min(Number(filters.limit) || 50, 200)
      const data: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}" ${where} ORDER BY id DESC LIMIT ?`, ...params, limit)
      return { source: ds, data: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0, sql: `SELECT * FROM "${table}" ${where}`, params, resolvedVia: "entity" }
    }

    throw new Error(`Unsupported type ${type}`)
  },

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
