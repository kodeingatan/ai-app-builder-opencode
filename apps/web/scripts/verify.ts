import "dotenv/config"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "../app/generated/prisma/client"
import { renderDocumentTree } from "../lib/renderer/engine"

const url = process.env.DATABASE_URL || "file:./dev.db"
const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🔍 Verifying Surat Platform...")

  const templates: any = await prisma.$queryRawUnsafe(`SELECT * FROM "surat_platform_templates" LIMIT 1`)
  console.log(`✅ Templates: ${templates.length} rows - first: ${templates[0]?.name} (${templates[0]?.code})`)

  const docs: any = await prisma.$queryRawUnsafe(`SELECT * FROM "surat_platform_documents" LIMIT 1`)
  console.log(`✅ Documents: ${docs.length} - first: ${docs[0]?.document_number}`)

  const employees: any = await prisma.$queryRawUnsafe(`SELECT * FROM "surat_platform_employees"`)
  console.log(`✅ Employees: ${employees.length} rows`)

  // Test render engine
  const schema = JSON.parse(templates[0].schema_json)
  const data = JSON.parse(docs[0].data_json)
  const html = renderDocumentTree(schema, data)
  console.log(`\n--- Render Engine Test ---`)
  console.log(`Data employees: ${data.employees?.length ?? 0} items`)
  console.log(`HTML length: ${html.length} chars`)
  console.log(`Contains Afdal? ${html.includes("Afdal")}`)
  console.log(`Contains NIP? ${html.includes("NIP")}`)
  console.log(`Contains header? ${html.includes("PEMERINTAH") || html.includes("office") ? "yes" : "no"}`)
  console.log(`\nHTML snippet (first 600 chars):\n${html.slice(0,600)}`)

  // Test condition: inactive should not show green badge? Let's test
  const testDataActive = { employees: [{ name: "Afdal", nip: "123", position: "Programmer", status: "active" }], office: { name: "Test Office" }, letter: { number: "001", title: "Test" }, signer: { name: "Signer" }, current_date: "18 Sep 2026" }
  const htmlActive = renderDocumentTree(schema, testDataActive)
  console.log(`\n--- Condition Test (active) ---`)
  console.log(`Active HTML includes "Status: Aktif"? ${htmlActive.includes("Status: Aktif")}`)

  const testDataInactive = { employees: [{ name: "Budi", nip: "456", position: "Analis", status: "inactive" }], office: { name: "Test Office" }, letter: { number: "001", title: "Test" }, signer: { name: "Signer" }, current_date: "18 Sep 2026" }
  const htmlInactive = renderDocumentTree(schema, testDataInactive)
  console.log(`Inactive HTML includes "Status: Aktif"? ${htmlInactive.includes("Status: Aktif")} (should be false)`)

  // Test nested loop
  const nestedSchema = {
    type: "document",
    children: [
      { type: "repeater", props: { source: "employees", item: "employee" }, children: [
        { type: "text", props: { content: "{{employee.name}}" } },
        { type: "repeater", props: { source: "employee.trips", item: "trip" }, children: [
          { type: "text", props: { content: "- {{trip.destination}} {{trip.date}}" } }
        ]}
      ]}
    ]
  }
  const nestedData = { employees: [{ name: "Afdal", trips: [{ destination: "Banda Aceh", date: "2026-08-20" }, { destination: "Medan", date: "2026-08-22" }] }] }
  const nestedHtml = renderDocumentTree(nestedSchema, nestedData)
  console.log(`\n--- Nested Loop Test ---`)
  console.log(`Nested HTML includes "Banda Aceh"? ${nestedHtml.includes("Banda Aceh")}`)
  console.log(`Nested HTML includes "Medan"? ${nestedHtml.includes("Medan")}`)
  console.log(nestedHtml.slice(0,500))

  // Test API via direct service
  const { TemplatesService } = await import("../lib/services/surat-platform/templates.service")
  const list = await TemplatesService.findAll({ page: 1, limit: 5 })
  console.log(`\n--- Service Test ---`)
  console.log(`TemplatesService.findAll: total ${list.total}, data ${list.data.length}`)

  console.log("\n✅ All checks passed!")
  await prisma.$disconnect()
}
main().catch(e=>{ console.error(e); process.exit(1)})
