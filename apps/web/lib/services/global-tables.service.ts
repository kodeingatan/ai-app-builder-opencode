import prisma from "@/lib/prisma"
import { computeOperationColumns } from "@/lib/renderer/operationEngine"

const META_TABLE = "global_tables"
const META_COL = "global_columns"

function toSafeIdent(name: string) {
  return name.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
}
function dynTableName(name: string) {
  const safe = toSafeIdent(name)
  return `dyn_${safe}`
}

function mapColumnTypeToSql(col: any): string {
  // Store type mapping for physical table
  // We keep optionsJson as separate meta, physical column type simple
  switch (col.type) {
    case "number":
      return "REAL"
    case "date":
    case "datetime":
    case "time":
    case "image":
    case "select":
    case "select_multiple":
    case "select_table":
    case "select_table_multiple":
    case "text":
    case "richtext":
    case "hidden_operation_text":
    case "readonly_operation_text":
    default:
      return "TEXT"
  }
}

function buildOptionsJson(col: any): string | null {
  const opts: any = {}
  if (col.format) opts.format = col.format
  if (col.options) opts.options = col.options
  if (col.relationTable) opts.relationTable = col.relationTable
  if (col.displayFields) opts.displayFields = col.displayFields
  if (col.valueField) opts.valueField = col.valueField
  if (col.isCurrency) opts.isCurrency = col.isCurrency
  if (col.expression) opts.expression = col.expression
  // Also keep raw for debugging
  return Object.keys(opts).length ? JSON.stringify(opts) : null
}

export const GlobalTablesService = {
  async findAll(query: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)
    const offset = (page - 1) * limit
    const allowedSort = new Set(["id", "name", "displayName", "status", "createdAt"])
    const sortBy = allowedSort.has(query.sortBy ?? "") ? query.sortBy! : "id"
    const sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC"
    const search = query.search?.trim()
    let where = "WHERE 1=1"
    const params: any[] = []
    if (search) {
      where += ` AND (name LIKE ? OR displayName LIKE ? OR description LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    const count: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM "${META_TABLE}" ${where}`, ...params)
    const total = Number(count[0]?.total ?? 0)
    // Need to map sortBy to actual column name (camelCase)
    const sortColMap: Record<string, string> = { id: "id", name: "name", displayName: "displayName", status: "status", createdAt: "createdAt" }
    const sortCol = sortColMap[sortBy] || "id"
    const data: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${META_TABLE}" ${where} ORDER BY "${sortCol}" ${sortOrder} LIMIT ? OFFSET ?`, ...params, limit, offset)
    // Attach columns count
    for (const row of data) {
      const cols: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM "${META_COL}" WHERE tableId = ?`, row.id)
      row._columnCount = Number(cols[0]?.cnt ?? 0)
      // Also get dynamic table row count if exists
      try {
        const dyn = dynTableName(row.name)
        const c: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM "${dyn}"`)
        row._rowCount = Number(c[0]?.cnt ?? 0)
      } catch {
        row._rowCount = 0
      }
    }
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async findOne(id: number) {
    const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${META_TABLE}" WHERE id = ?`, id)
    const table = rows[0] ?? null
    if (!table) return null
    const cols: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${META_COL}" WHERE tableId = ? ORDER BY orderIndex ASC, id ASC`, id)
    return { ...table, columns: cols }
  },

  async findByName(name: string) {
    const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${META_TABLE}" WHERE name = ?`, name)
    const table = rows[0] ?? null
    if (!table) return null
    const cols: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${META_COL}" WHERE tableId = ? ORDER BY orderIndex ASC, id ASC`, table.id)
    return { ...table, columns: cols }
  },

  async create(input: { name: string; displayName: string; description?: string | null; status?: string; columns: any[] }) {
    const safeName = toSafeIdent(input.name)
    if (!safeName) throw new Error("Nama tabel tidak valid")
    // Check duplicate
    const existing: any = await prisma.$queryRawUnsafe(`SELECT id FROM "${META_TABLE}" WHERE name = ?`, safeName)
    if (existing.length) throw new Error("Nama tabel sudah ada")

    // Validate columns unique names
    const colNames = new Set<string>()
    for (const c of input.columns) {
      const cn = toSafeIdent(c.name)
      if (!cn) throw new Error(`Nama kolom tidak valid: ${c.name}`)
      if (colNames.has(cn)) throw new Error(`Duplikat nama kolom: ${cn}`)
      colNames.add(cn)
    }

    // Insert meta table
    await prisma.$executeRawUnsafe(`INSERT INTO "${META_TABLE}" (name, displayName, description, status, updatedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`, safeName, input.displayName, input.description ?? null, input.status ?? "active")
    const metaRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${META_TABLE}" WHERE name = ?`, safeName)
    const meta = metaRows[0]
    const tableId = meta.id

    // Insert columns meta
    for (let i = 0; i < input.columns.length; i++) {
      const c = input.columns[i]
      const cn = toSafeIdent(c.name)
      const opts = buildOptionsJson(c)
      await prisma.$executeRawUnsafe(
        `INSERT INTO "${META_COL}" (tableId, name, displayName, type, optionsJson, defaultValue, isRequired, isOrderable, isSearchable, orderIndex, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        tableId,
        cn,
        c.displayName,
        c.type,
        opts,
        c.defaultValue ?? null,
        c.isRequired ? 1 : 0,
        c.isOrderable ? 1 : 0,
        c.isSearchable ? 1 : 0,
        c.orderIndex ?? i
      )
    }

    // Create physical dynamic table
    const dyn = dynTableName(safeName)
    // Build columns SQL
    const colDefs = input.columns.map((c) => {
      const cn = toSafeIdent(c.name)
      const sqlType = mapColumnTypeToSql(c)
      // No NOT NULL yet, we handle required at app layer, keep nullable for flexibility
      return `"${cn}" ${sqlType}`
    })
    // Always have id primary key, createdAt, updatedAt
    const createSql = `CREATE TABLE IF NOT EXISTS "${dyn}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, ${colDefs.join(", ")}, "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP)`
    await prisma.$executeRawUnsafe(createSql)

    // Create indexes for searchable and orderable columns
    for (const c of input.columns) {
      if (c.isSearchable || c.isOrderable) {
        const cn = toSafeIdent(c.name)
        try {
          await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_${dyn}_${cn}" ON "${dyn}"("${cn}")`)
        } catch {}
      }
    }

    return this.findOne(tableId)
  },

  async update(id: number, input: { displayName?: string; description?: string | null; status?: string; columns?: any[] }) {
    const existing = await this.findOne(id)
    if (!existing) throw new Error("Tabel tidak ditemukan")

    // Update meta
    const sets: string[] = []
    const vals: any[] = []
    if (input.displayName !== undefined) { sets.push(`displayName = ?`); vals.push(input.displayName) }
    if (input.description !== undefined) { sets.push(`description = ?`); vals.push(input.description) }
    if (input.status !== undefined) { sets.push(`status = ?`); vals.push(input.status) }
    if (sets.length) {
      sets.push(`updatedAt = CURRENT_TIMESTAMP`)
      await prisma.$executeRawUnsafe(`UPDATE "${META_TABLE}" SET ${sets.join(", ")} WHERE id = ?`, ...vals, id)
    }

    if (input.columns) {
      // Additive only: we will not drop columns, only add new or update existing.
      // For simplicity, we support full replace via: delete missing? But spec says dapat ditambahkan sesuai kebutuhan, so additive.
      // We will sync: for each input column, upsert.
      const existingCols: any[] = existing.columns
      const existingMap = new Map(existingCols.map((c) => [c.name, c]))

      const dyn = dynTableName(existing.name)
      // Get existing physical columns via PRAGMA
      let physicalCols: Set<string> = new Set()
      try {
        const pragma: any = await prisma.$queryRawUnsafe(`PRAGMA table_info("${dyn}")`)
        for (const row of pragma) physicalCols.add(row.name)
      } catch {}

      for (let i = 0; i < input.columns.length; i++) {
        const c = input.columns[i]
        const cn = toSafeIdent(c.name)
        const opts = buildOptionsJson(c)
        const existingCol = existingMap.get(cn)
        if (existingCol) {
          // Update meta
          await prisma.$executeRawUnsafe(
            `UPDATE "${META_COL}" SET displayName = ?, type = ?, optionsJson = ?, defaultValue = ?, isRequired = ?, isOrderable = ?, isSearchable = ?, orderIndex = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
            c.displayName,
            c.type,
            opts,
            c.defaultValue ?? null,
            c.isRequired ? 1 : 0,
            c.isOrderable ? 1 : 0,
            c.isSearchable ? 1 : 0,
            c.orderIndex ?? i,
            existingCol.id
          )
          // If type changed, we could alter column type? SQLite limited. Skip.
        } else {
          // Insert new column meta
          await prisma.$executeRawUnsafe(
            `INSERT INTO "${META_COL}" (tableId, name, displayName, type, optionsJson, defaultValue, isRequired, isOrderable, isSearchable, orderIndex, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            id,
            cn,
            c.displayName,
            c.type,
            opts,
            c.defaultValue ?? null,
            c.isRequired ? 1 : 0,
            c.isOrderable ? 1 : 0,
            c.isSearchable ? 1 : 0,
            c.orderIndex ?? i
          )
          // Add physical column if not exists
          if (!physicalCols.has(cn)) {
            const sqlType = mapColumnTypeToSql(c)
            await prisma.$executeRawUnsafe(`ALTER TABLE "${dyn}" ADD COLUMN "${cn}" ${sqlType}`)
            if (c.isSearchable || c.isOrderable) {
              try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_${dyn}_${cn}" ON "${dyn}"("${cn}")`) } catch {}
            }
          }
        }
      }
      // Note: we do not delete columns that are removed from input to avoid data loss (additive)
    }

    return this.findOne(id)
  },

  async remove(id: number) {
    const existing = await this.findOne(id)
    if (!existing) throw new Error("Tabel tidak ditemukan")
    const dyn = dynTableName(existing.name)
    // Drop physical table
    try { await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${dyn}"`) } catch {}
    // Delete meta (cascade will delete columns)
    await prisma.$executeRawUnsafe(`DELETE FROM "${META_TABLE}" WHERE id = ?`, id)
    return { id }
  },

  // Dynamic data helpers
  async listData(tableName: string, query: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc"; filters?: Record<string, any> }) {
    const safeName = toSafeIdent(tableName)
    const meta = await this.findByName(safeName)
    if (!meta) throw new Error("Tabel tidak ditemukan")
    const dyn = dynTableName(safeName)
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)
    const offset = (page - 1) * limit
    const sortBy = query.sortBy && meta.columns.some((c: any) => c.name === query.sortBy && c.isOrderable) ? query.sortBy : "id"
    const sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC"
    const search = query.search?.trim()

    let where = "WHERE 1=1"
    const params: any[] = []

    // Searching: only columns with isSearchable
    const searchableCols = meta.columns.filter((c: any) => c.isSearchable).map((c: any) => c.name)
    if (search && searchableCols.length) {
      const ors = searchableCols.map((cn: string) => `"${cn}" LIKE ?`).join(" OR ")
      where += ` AND (${ors})`
      for (let i = 0; i < searchableCols.length; i++) params.push(`%${search}%`)
    } else if (search) {
      // fallback to all text-like columns if none marked searchable? spec says searching berdasarkan input column yang di check searching, so if none, no search
    }

    // Additional filters from query.filters (e.g., ?department=...)
    if (query.filters) {
      for (const [k, v] of Object.entries(query.filters)) {
        if (meta.columns.some((c: any) => c.name === k)) {
          where += ` AND "${k}" = ?`
          params.push(v)
        }
      }
    }

    // Count
    const count: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM "${dyn}" ${where}`, ...params)
    const total = Number(count[0]?.total ?? 0)
    const data: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${dyn}" ${where} ORDER BY "${sortBy}" ${sortOrder} LIMIT ? OFFSET ?`, ...params, limit, offset)

    // Post-process for display: format dates, currency, operation fields already stored, but we can compute display
    // For select_table relation, we may need to resolve display? That's handled at UI via separate fetch, not here.

    return { data, total, page, limit, totalPages: Math.ceil(total / limit), columns: meta.columns }
  },

  async createData(tableName: string, input: Record<string, any>) {
    const safeName = toSafeIdent(tableName)
    const meta = await this.findByName(safeName)
    if (!meta) throw new Error("Tabel tidak ditemukan")
    const dyn = dynTableName(safeName)

    // Validate required, apply defaults, compute operations
    const row: Record<string, any> = {}
    for (const col of meta.columns as any[]) {
      const cn = col.name
      let val = input[cn]

      // Apply default if undefined
      if ((val === undefined || val === null || val === "") && col.defaultValue) {
        val = col.defaultValue
      }

      // Validate required
      if (col.isRequired && (val === undefined || val === null || val === "")) {
        // For operation types, they are auto-filled, so skip required check if they will be computed
        if (col.type !== "hidden_operation_text" && col.type !== "readonly_operation_text") {
          throw new Error(`Field ${col.displayName} wajib diisi`)
        }
      }

      // Type handling
      if (col.type === "select_multiple" || col.type === "select_table_multiple") {
        if (Array.isArray(val)) val = JSON.stringify(val)
        else if (typeof val === "string" && val.startsWith("[")) { /* keep */ } else if (val !== undefined) val = JSON.stringify([val])
      } else if (col.type === "number") {
        if (val !== undefined && val !== null && val !== "") {
          const num = Number(String(val).replace(/[^0-9.-]/g, ""))
          if (isNaN(num)) throw new Error(`Field ${col.displayName} harus angka`)
          val = num
        }
      } else if (col.type === "image") {
        // expect string url/path
        if (val && typeof val !== "string") throw new Error(`Field ${col.displayName} harus string image path`)
      }

      // For operation types, we will compute later, skip direct input if hidden
      if (col.type === "hidden_operation_text" || col.type === "readonly_operation_text") {
        // Don't take direct input for hidden, will compute; for readonly, also compute (UI shows disabled)
        // But if input provides value for readonly, we still compute to override
        continue
      }

      if (val !== undefined) row[cn] = val
    }

    // Compute operation columns
    const computed = computeOperationColumns(meta.columns as any, { ...row, ...input })
    for (const col of meta.columns as any[]) {
      if (col.type === "hidden_operation_text" || col.type === "readonly_operation_text") {
        row[col.name] = computed[col.name] ?? ""
      }
    }

    // Validate hidden/readonly not required check again? They are auto-filled, so if still empty and required, error
    for (const col of meta.columns as any[]) {
      if ((col.type === "hidden_operation_text" || col.type === "readonly_operation_text") && col.isRequired) {
        if (!row[col.name]) throw new Error(`Field ${col.displayName} gagal dihitung`)
      }
    }

    // Insert
    const cols = Object.keys(row)
    if (cols.length === 0) throw new Error("Tidak ada data untuk disimpan")
    const placeholders = cols.map(() => "?").join(", ")
    const colList = cols.map((c) => `"${c}"`).join(", ")
    const vals = cols.map((c) => row[c])
    await prisma.$executeRawUnsafe(`INSERT INTO "${dyn}" (${colList}) VALUES (${placeholders})`, ...vals)
    const last: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${dyn}" ORDER BY id DESC LIMIT 1`)
    return last[0]
  },

  async updateData(tableName: string, id: number, input: Record<string, any>) {
    const safeName = toSafeIdent(tableName)
    const meta = await this.findByName(safeName)
    if (!meta) throw new Error("Tabel tidak ditemukan")
    const dyn = dynTableName(safeName)

    // Fetch existing row for operation compute (needs all column values)
    const existingRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${dyn}" WHERE id = ?`, id)
    if (!existingRows.length) throw new Error("Data tidak ditemukan")
    const existing = existingRows[0]

    const merged = { ...existing, ...input }
    // Compute operations with merged values
    const computed = computeOperationColumns(meta.columns as any, merged)

    const updates: Record<string, any> = {}
    for (const col of meta.columns as any[]) {
      const cn = col.name
      if (col.type === "hidden_operation_text" || col.type === "readonly_operation_text") {
        updates[cn] = computed[cn] ?? ""
      } else if (cn in input) {
        let val = input[cn]
        if (col.type === "select_multiple" || col.type === "select_table_multiple") {
          if (Array.isArray(val)) val = JSON.stringify(val)
          else if (val !== undefined && typeof val !== "string") val = String(val)
        } else if (col.type === "number" && val !== "" && val !== null && val !== undefined) {
          const num = Number(String(val).replace(/[^0-9.-]/g, ""))
          if (isNaN(num)) throw new Error(`Field ${col.displayName} harus angka`)
          val = num
        }
        updates[cn] = val
      }
    }

    // Validate required for updates that are provided
    for (const col of meta.columns as any[]) {
      if (col.isRequired && col.type !== "hidden_operation_text" && col.type !== "readonly_operation_text") {
        const v = updates[col.name] ?? existing[col.name]
        if (v === undefined || v === null || v === "") throw new Error(`Field ${col.displayName} wajib diisi`)
      }
    }

    if (!Object.keys(updates).length) return existing

    const sets = Object.keys(updates).map((k) => `"${k}" = ?`).join(", ")
    const vals = Object.values(updates)
    await prisma.$executeRawUnsafe(`UPDATE "${dyn}" SET ${sets}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?`, ...vals, id)
    const updated: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${dyn}" WHERE id = ?`, id)
    return updated[0]
  },

  async deleteData(tableName: string, id: number) {
    const safeName = toSafeIdent(tableName)
    const dyn = dynTableName(safeName)
    await prisma.$executeRawUnsafe(`DELETE FROM "${dyn}" WHERE id = ?`, id)
    return { id }
  },

  async getDataOne(tableName: string, id: number) {
    const safeName = toSafeIdent(tableName)
    const dyn = dynTableName(safeName)
    const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${dyn}" WHERE id = ?`, id)
    return rows[0] ?? null
  },
}
