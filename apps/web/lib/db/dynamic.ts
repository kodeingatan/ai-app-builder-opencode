import prisma from "@/lib/prisma"

/**
 * Helper untuk Dynamic App Tables {slug}_{entity}
 * Prisma tidak bisa memodelkan tabel dinamis di schema.prisma (static),
 * jadi kita pakai raw SQL via prisma.$executeRawUnsafe.
 *
 * Contoh: prompt "buatkan aplikasi kasir" -> slug pos-kasir -> tabel pos_kasir_products
 */

export function toTableName(slug: string, entitySlug: string): string {
  // slug: "pos-kasir" -> "pos_kasir", entitySlug: "products" -> "pos_kasir_products"
  return `${slug.replace(/-/g, "_")}_${entitySlug}`
}

export async function createDynamicTable(
  tableName: string,
  columns: string[] // e.g. ['"id" INTEGER PRIMARY KEY AUTOINCREMENT', '"name" TEXT NOT NULL']
) {
  const cols = columns.join(", ")
  // Use IF NOT EXISTS untuk idempotent
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${tableName}" (${cols})`)
}

export async function dropDynamicTable(tableName: string) {
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tableName}"`)
}

export async function addColumn(tableName: string, columnDef: string) {
  // columnDef: '"barcode" TEXT'
  // Cek apakah kolom sudah ada via PRAGMA table_info
  const info: Array<{ name: string }> = await prisma.$queryRawUnsafe(`PRAGMA table_info("${tableName}")`)
  const exists = info.some((c) => c.name === columnDef.replace(/"/g, "").split(" ")[0])
  if (!exists) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN ${columnDef}`)
  }
}

export async function seedDynamicTable(tableName: string, rows: Record<string, unknown>[]) {
  const countResult: Array<{ count: bigint | number }> = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM "${tableName}"`
  )
  const count = Number(countResult[0]?.count ?? 0)
  if (count > 0) return // idempotent

  for (const row of rows) {
    const keys = Object.keys(row)
    const values = Object.values(row)
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ")
    // For SQLite via libsql, use ? placeholders instead of $N
    const qPlaceholders = keys.map(() => "?").join(", ")
    const cols = keys.map((k) => `"${k}"`).join(", ")
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${tableName}" (${cols}) VALUES (${qPlaceholders})`,
      ...values
    )
  }
}
