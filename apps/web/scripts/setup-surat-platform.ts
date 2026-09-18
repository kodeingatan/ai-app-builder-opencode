import "dotenv/config"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "../app/generated/prisma/client"

const url = process.env.DATABASE_URL || "file:./dev.db"
const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

function toTable(slug: string, entity: string) {
  return `${slug.replace(/-/g, "_")}_${entity}`
}

async function main() {
  const slug = "surat-platform"
  const projectName = "Surat Platform - Document Builder"
  const promptText = `Targetnya adalah membuat sistem yang bisa menghasilkan berbagai jenis surat tanpa developer harus membuat template satu per satu. Konsep Document Template → Layout → Component → Data Source → Repeat/Loop → Condition dengan JSON Tree, Repeater, Condition, Binding {{}}`

  console.log("🚀 Setting up Surat Platform project...")

  // Clean existing if exists
  const existing = await prisma.aiProject.findUnique({ where: { slug } })
  if (existing) {
    console.log(`Found existing project ${slug} id=${existing.id}, cleaning...`)
    // Drop dynamic tables
    const tables = [
      toTable(slug, "templates"),
      toTable(slug, "data_sources"),
      toTable(slug, "components"),
      toTable(slug, "documents"),
      toTable(slug, "employees"),
    ]
    for (const t of tables) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${t}"`)
        console.log(`✅ Dropped ${t}`)
      } catch (e) {
        console.warn(`⚠️ Drop ${t} failed`, e)
      }
    }
    // Delete project cascade will handle prompts/generations/schemas
    await prisma.aiProject.delete({ where: { id: existing.id } })
    console.log(`🗑️ Deleted existing project`)
  }

  // Create project
  const project = await prisma.aiProject.create({
    data: {
      name: projectName,
      slug,
      initialPrompt: promptText,
      status: "generating",
      previewUrl: `/generated/${slug}`,
    },
  })
  console.log(`✅ Created project ${project.slug} id=${project.id}`)

  const inferredIntent = {
    domain: "document_platform",
    domainLabel: "Document Builder Platform - Surat",
    entities: [
      { name: "Template", slug: "templates", label: "Template Surat", fields: ["name","code","category","description","version","status","schemaJson"] },
      { name: "DataSource", slug: "data_sources", label: "Data Source", fields: ["name","type","entity","configJson","description"] },
      { name: "Component", slug: "components", label: "Component Registry", fields: ["type","name","category","icon","defaultPropsJson","schemaJson"] },
      { name: "Document", slug: "documents", label: "Document Instance", fields: ["templateId","documentNumber","title","recipientName","dataJson","renderedHtml","status"] },
      { name: "Employee", slug: "employees", label: "Pegawai (Data Binding Demo)", fields: ["name","nip","position","department","status","email"] },
    ],
    pages: [
      { route: `/generated/${slug}`, title: "Dashboard", type: "dashboard" },
      { route: `/generated/${slug}/templates`, title: "Templates", type: "list" },
      { route: `/generated/${slug}/builder`, title: "Template Builder", type: "builder" },
      { route: `/generated/${slug}/data-sources`, title: "Data Sources", type: "list" },
      { route: `/generated/${slug}/components`, title: "Components", type: "list" },
      { route: `/generated/${slug}/documents`, title: "Documents", type: "list" },
      { route: `/generated/${slug}/employees`, title: "Employees", type: "list" },
      { route: `/generated/${slug}/preview`, title: "Preview & Render", type: "preview" },
    ],
    roles: [
      { name: "Admin", permissions: ["*"] },
      { name: "Editor", permissions: ["Template:read","Template:write","Document:read","Document:write"] },
      { name: "Viewer", permissions: ["Template:read","Document:read"] },
    ],
    flows: ["Template Builder Drag&Drop", "Binding Data {{}}", "Repeater Loop", "Condition IF/ELSE", "Render Engine → HTML/PDF"],
  }

  const prompt = await prisma.aiPrompt.create({
    data: {
      projectId: project.id,
      promptText,
      inferredIntent: JSON.stringify(inferredIntent),
      version: 1,
    },
  })
  console.log(`✅ Created prompt v${prompt.version}`)

  const generation = await prisma.aiGeneration.create({
    data: {
      projectId: project.id,
      promptId: prompt.id,
      status: "running",
      spec: JSON.stringify(inferredIntent),
    },
  })
  console.log(`✅ Created generation id=${generation.id} running`)

  // Create schema
  const schema = await prisma.aiAppSchema.create({
    data: {
      generationId: generation.id,
      entities: JSON.stringify(inferredIntent.entities),
      pages: JSON.stringify(inferredIntent.pages),
      roles: JSON.stringify(inferredIntent.roles),
      flows: JSON.stringify(inferredIntent.flows),
    },
  })

  // DataModels
  const dataModels = [
    {
      name: "Template",
      slug: "templates",
      fields: JSON.stringify([
        { name: "name", type: "string", required: true, label: "Nama Template" },
        { name: "code", type: "string", required: true, unique: true, label: "Kode" },
        { name: "category", type: "enum", required: true, enumValues: ["surat_keputusan","surat_tugas","surat_undangan","surat_keterangan","perjalanan_dinas","berita_acara","nota_dinas","sertifikat","formulir","laporan"], label: "Kategori" },
        { name: "description", type: "text", required: false, label: "Deskripsi" },
        { name: "version", type: "integer", required: true, default: 1, label: "Versi" },
        { name: "status", type: "enum", required: true, enumValues: ["draft","published","archived"], label: "Status" },
        { name: "schema_json", type: "text", required: true, label: "Schema JSON Tree" },
        { name: "preview_html", type: "text", required: false, label: "Preview HTML" },
      ]),
      relations: null,
      indexes: JSON.stringify(["code","category","status"]),
    },
    {
      name: "DataSource",
      slug: "data_sources",
      fields: JSON.stringify([
        { name: "name", type: "string", required: true },
        { name: "type", type: "enum", required: true, enumValues: ["entity","api","custom_query","static"] },
        { name: "entity", type: "string", required: false },
        { name: "config_json", type: "text", required: false },
        { name: "description", type: "text", required: false },
      ]),
      relations: null,
      indexes: JSON.stringify(["type"]),
    },
    {
      name: "Component",
      slug: "components",
      fields: JSON.stringify([
        { name: "type", type: "string", required: true, label: "Tipe Component" },
        { name: "name", type: "string", required: true },
        { name: "category", type: "enum", required: true, enumValues: ["basic","layout","data","dynamic","branding"] },
        { name: "icon", type: "string", required: false },
        { name: "default_props_json", type: "text", required: false },
        { name: "schema_json", type: "text", required: false },
        { name: "is_system", type: "boolean", required: false },
      ]),
      relations: null,
      indexes: JSON.stringify(["type","category"]),
    },
    {
      name: "Document",
      slug: "documents",
      fields: JSON.stringify([
        { name: "template_id", type: "integer", required: false, label: "Template ID" },
        { name: "document_number", type: "string", required: true, unique: true },
        { name: "title", type: "string", required: true },
        { name: "recipient_name", type: "string", required: false },
        { name: "data_json", type: "text", required: true },
        { name: "rendered_html", type: "text", required: false },
        { name: "status", type: "enum", required: true, enumValues: ["draft","rendered","published","archived"] },
        { name: "issued_at", type: "datetime", required: false },
        { name: "notes", type: "text", required: false },
      ]),
      relations: JSON.stringify([{ type: "ManyToOne", target: "Template", field: "template_id", onDelete: "SET NULL" }]),
      indexes: JSON.stringify(["template_id","status"]),
    },
    {
      name: "Employee",
      slug: "employees",
      fields: JSON.stringify([
        { name: "name", type: "string", required: true },
        { name: "nip", type: "string", required: true, unique: true },
        { name: "position", type: "string", required: true },
        { name: "department", type: "string", required: false },
        { name: "status", type: "enum", required: true, enumValues: ["active","inactive","leave"] },
        { name: "email", type: "string", required: false },
        { name: "phone", type: "string", required: false },
      ]),
      relations: null,
      indexes: JSON.stringify(["nip","department","status"]),
    },
  ]

  for (const dm of dataModels) {
    await prisma.aiDataModel.create({ data: { schemaId: schema.id, ...dm } })
    console.log(`✅ Created data model ${dm.slug}`)
  }

  // Pages
  for (const p of inferredIntent.pages) {
    await prisma.aiPage.create({
      data: {
        schemaId: schema.id,
        route: p.route,
        title: p.title,
        type: p.type,
        componentTree: JSON.stringify({ root: "PageShell", children: ["DataTable"] }),
      },
    })
  }
  console.log(`✅ Created ${inferredIntent.pages.length} pages`)

  // ComponentSpecs
  const specs = [
    { name: "TemplateTable", type: "DataTable", props: JSON.stringify({ entity: "templates", columns: ["name","code","category","status"] }) },
    { name: "DocumentTable", type: "DataTable", props: JSON.stringify({ entity: "documents" }) },
    { name: "BuilderCanvas", type: "Builder", props: JSON.stringify({ layout: "3-column", features: ["dragdrop","repeater","condition","binding"] }) },
    { name: "RendererEngine", type: "Renderer", props: JSON.stringify({ supports: ["loop","condition","binding","nested"] }) },
  ]
  for (const s of specs) {
    await prisma.aiComponentSpec.create({ data: { schemaId: schema.id, ...s } })
  }

  console.log("---- Creating dynamic tables ----")
  // Create dynamic tables
  const tables: Record<string, string[]> = {
    [toTable(slug, "templates")]: [
      `"id" INTEGER PRIMARY KEY AUTOINCREMENT`,
      `"name" TEXT NOT NULL`,
      `"code" TEXT NOT NULL UNIQUE`,
      `"category" TEXT NOT NULL DEFAULT 'surat_keputusan'`,
      `"description" TEXT`,
      `"version" INTEGER DEFAULT 1`,
      `"status" TEXT NOT NULL DEFAULT 'draft'`,
      `"schema_json" TEXT NOT NULL`,
      `"preview_html" TEXT`,
      `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`,
      `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`,
    ],
    [toTable(slug, "data_sources")]: [
      `"id" INTEGER PRIMARY KEY AUTOINCREMENT`,
      `"name" TEXT NOT NULL`,
      `"type" TEXT NOT NULL`,
      `"entity" TEXT`,
      `"config_json" TEXT`,
      `"description" TEXT`,
      `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`,
      `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`,
    ],
    [toTable(slug, "components")]: [
      `"id" INTEGER PRIMARY KEY AUTOINCREMENT`,
      `"type" TEXT NOT NULL`,
      `"name" TEXT NOT NULL`,
      `"category" TEXT NOT NULL`,
      `"icon" TEXT`,
      `"default_props_json" TEXT`,
      `"schema_json" TEXT`,
      `"is_system" INTEGER DEFAULT 0`,
      `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`,
      `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`,
    ],
    [toTable(slug, "documents")]: [
      `"id" INTEGER PRIMARY KEY AUTOINCREMENT`,
      `"template_id" INTEGER`,
      `"document_number" TEXT NOT NULL UNIQUE`,
      `"title" TEXT NOT NULL`,
      `"recipient_name" TEXT`,
      `"data_json" TEXT NOT NULL`,
      `"rendered_html" TEXT`,
      `"status" TEXT NOT NULL DEFAULT 'draft'`,
      `"issued_at" DATETIME`,
      `"notes" TEXT`,
      `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`,
      `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`,
    ],
    [toTable(slug, "employees")]: [
      `"id" INTEGER PRIMARY KEY AUTOINCREMENT`,
      `"name" TEXT NOT NULL`,
      `"nip" TEXT NOT NULL UNIQUE`,
      `"position" TEXT NOT NULL`,
      `"department" TEXT`,
      `"status" TEXT NOT NULL DEFAULT 'active'`,
      `"email" TEXT`,
      `"phone" TEXT`,
      `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`,
      `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`,
    ],
  }

  for (const [table, cols] of Object.entries(tables)) {
    const colsStr = cols.join(", ")
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${table}" (${colsStr})`)
    console.log(`✅ Created table ${table}`)
  }

  // Seed data via direct SQL
  console.log("---- Seeding ----")
  // Templates seed
  const templatesTable = toTable(slug, "templates")
  const countT: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${templatesTable}"`)
  if (Number(countT[0].count) === 0) {
    const sampleSchema = JSON.stringify({
      type: "document",
      children: [
        { type: "header", props: { height: "80px" }, children: [
          { type: "image", props: { src: "{{office.logo}}", width: 60, height: 60 } },
          { type: "text", props: { content: "{{office.name}}", fontSize: 16, fontWeight: "bold", align: "center" } },
          { type: "text", props: { content: "{{office.address}}", fontSize: 9, align: "center", color: "#666" } },
          { type: "divider", props: { height: 2, color: "#000" } }
        ]},
        { type: "text", props: { content: "{{letter.number}}", align: "center", fontSize: 10 } },
        { type: "heading", props: { content: "{{letter.title}}", align: "center", fontSize: 14, fontWeight: "bold", transform: "uppercase" } },
        { type: "paragraph", props: { content: "Menimbang bahwa {{letter.consideration}}", fontSize: 11, align: "justify" } },
        { type: "repeater", props: { source: "employees", item: "employee", label: "Daftar Pegawai" }, children: [
          { type: "text", props: { content: "{{index}}. {{employee.name}}", fontWeight: "bold", fontSize: 11 } },
          { type: "text", props: { content: "NIP : {{employee.nip}}", fontSize: 10, indent: 12 } },
          { type: "text", props: { content: "Jabatan : {{employee.position}} — {{employee.department}}", fontSize: 10, indent: 12 } },
          { type: "condition", props: { field: "employee.status", operator: "equals", value: "active" }, children: [
            { type: "text", props: { content: "Status: Aktif", fontSize: 9, color: "#16a34a" } }
          ]},
          { type: "divider", props: { height: 1, color: "#e5e7eb", margin: 8 } }
        ]},
        { type: "signature", props: { name: "{{signer.name}}", position: "{{signer.position}}", nip: "{{signer.nip}}", align: "right" } },
        { type: "footer", props: {}, children: [
          { type: "text", props: { content: "Dokumen ini dicetak pada {{current_date}} | {{office.name}}", fontSize: 8, align: "center", color: "#999" } },
          { type: "qrcode", props: { value: "{{document.qrValue}}", size: 60, align: "right" } }
        ]}
      ]
    })
    const templatesSeed = [
      { name: "Surat Keputusan Pengangkatan", code: "SK-001", category: "surat_keputusan", description: "Template SK pengangkatan pegawai dengan kop surat, loop daftar pegawai, dan tanda tangan", version: 1, status: "published", schema_json: sampleSchema, preview_html: "" },
      { name: "Surat Tugas Perjalanan Dinas", code: "ST-002", category: "surat_tugas", description: "Surat tugas dengan nested loop: pegawai → daftar perjalanan (tujuan, tanggal, kegiatan)", version: 2, status: "published", schema_json: JSON.stringify({
        type: "document",
        children: [
          { type: "header", children: [{ type: "text", props: { content: "{{office.name}}", align: "center", fontWeight: "bold" }}] },
          { type: "heading", props: { content: "SURAT TUGAS", align: "center" } },
          { type: "text", props: { content: "Nomor: {{letter.number}}" } },
          { type: "repeater", props: { source: "employees", item: "employee" }, children: [
            { type: "text", props: { content: "Nama: {{employee.name}} ({{employee.nip}})" } },
            { type: "repeater", props: { source: "employee.trips", item: "trip" }, children: [
              { type: "text", props: { content: "- {{trip.destination}} pada {{trip.date}} — {{trip.purpose}}" } }
            ]}
          ]},
          { type: "signature", props: { name: "{{signer.name}}", position: "Kepala Kantor" } }
        ]
      }), preview_html: "" },
      { name: "Surat Undangan Rapat", code: "UND-003", category: "surat_undangan", description: "Undangan dengan condition: if letter.type == internal tampilkan header internal", version: 1, status: "published", schema_json: JSON.stringify({
        type: "document",
        children: [
          { type: "header", children: [{ type: "text", props: { content: "KOP SURAT UNDANGAN" }}] },
          { type: "heading", props: { content: "UNDANGAN", align: "center" } },
          { type: "condition", props: { field: "letter.type", operator: "equals", value: "internal" }, children: [
            { type: "text", props: { content: "Sifat: Internal — Harap tidak disebarluaskan", color: "#dc2626" } }
          ]},
          { type: "text", props: { content: "Kepada Yth. {{recipient.name}} di {{recipient.location}}" } },
          { type: "paragraph", props: { content: "Dengan hormat, mengundang Bapak/Ibu pada {{letter.event_date}} bertempat di {{letter.location}}" } },
          { type: "table", props: { source: "agenda", columns: ["waktu","agenda","pic"] } }
        ]
      }), preview_html: "" },
      { name: "Sertifikat Penghargaan", code: "SERT-004", category: "sertifikat", description: "Sertifikat dengan QR code verifikasi dan tanda tangan digital", version: 1, status: "draft", schema_json: JSON.stringify({
        type: "document",
        children: [
          { type: "image", props: { src: "{{office.logo}}", width: 80, align: "center" } },
          { type: "heading", props: { content: "SERTIFIKAT", align: "center", fontSize: 20 } },
          { type: "text", props: { content: "Diberikan kepada:", align: "center" } },
          { type: "heading", props: { content: "{{recipient.name}}", align: "center", fontSize: 16 } },
          { type: "paragraph", props: { content: "Atas prestasi {{achievement}}", align: "center" } },
          { type: "qrcode", props: { value: "{{certificate.qr}}", align: "center", size: 80 } },
          { type: "signature", props: { name: "{{signer.name}}", position: "{{signer.position}}" } }
        ]
      }), preview_html: "" },
      { name: "Berita Acara Serah Terima", code: "BAST-005", category: "berita_acara", description: "BAST dengan tabel barang dinamis + loop + signature dual", version: 1, status: "published", schema_json: JSON.stringify({
        type: "document",
        children: [
          { type: "heading", props: { content: "BERITA ACARA SERAH TERIMA", align: "center" } },
          { type: "text", props: { content: "Nomor: {{letter.number}} | Tanggal: {{letter.date}}" } },
          { type: "table", props: { source: "items", columns: ["no","nama_barang","qty","kondisi"] } },
          { type: "repeater", props: { source: "signatories", item: "signer" }, children: [
            { type: "signature", props: { name: "{{signer.name}}", position: "{{signer.role}}" } }
          ]}
        ]
      }), preview_html: "" },
    ]
    for (const t of templatesSeed) {
      await prisma.$executeRawUnsafe(`INSERT INTO "${templatesTable}" ("name","code","category","description","version","status","schema_json","preview_html") VALUES (?,?,?,?,?,?,?,?)`, t.name, t.code, t.category, t.description, t.version, t.status, t.schema_json, t.preview_html)
    }
    console.log(`✅ Seeded ${templatesSeed.length} templates`)
  }

  // Data sources
  const dsTable = toTable(slug, "data_sources")
  const countDS: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${dsTable}"`)
  if (Number(countDS[0].count) === 0) {
    const dsSeed = [
      { name: "Employee", type: "entity", entity: "employees", config_json: JSON.stringify({ fields: ["name","nip","position","department"], bindingPrefix: "employee", loopExample: "{{#each employees}} {{name}} {{/each}}" }), description: "Data pegawai untuk loop repeater" },
      { name: "Office", type: "static", entity: "office", config_json: JSON.stringify({ fields: ["name","address","logo","phone"], example: { name: "Kantor Gubernur Aceh", address: "Jl. T. Nyak Arief No. 219", logo: "/logo.png" } }), description: "Kop surat & footer" },
      { name: "Letter", type: "entity", entity: "letter", config_json: JSON.stringify({ fields: ["number","title","subject","date","consideration"], binding: "{{letter.number}}" }), description: "Metadata surat" },
      { name: "Recipient", type: "entity", entity: "recipient", config_json: JSON.stringify({ fields: ["name","location","email"] }), description: "Penerima surat" },
      { name: "Department", type: "entity", entity: "departments", config_json: JSON.stringify({ fields: ["name","code"] }), description: "Unit kerja" },
      { name: "Custom Query - Active Employees", type: "custom_query", entity: "employees", config_json: JSON.stringify({ sql: "SELECT * FROM surat_platform_employees WHERE status='active'", description: "Hanya pegawai aktif untuk condition demo" }), description: "Query custom filter" },
    ]
    for (const d of dsSeed) {
      await prisma.$executeRawUnsafe(`INSERT INTO "${dsTable}" ("name","type","entity","config_json","description") VALUES (?,?,?,?,?)`, d.name, d.type, d.entity, d.config_json, d.description)
    }
    console.log(`✅ Seeded ${dsSeed.length} data sources`)
  }

  // Components
  const compTable = toTable(slug, "components")
  const countC: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${compTable}"`)
  if (Number(countC[0].count) === 0) {
    const comps = [
      { type: "text", name: "Text", category: "basic", icon: "Type", default_props_json: JSON.stringify({ content: "Text", fontSize: 11, align: "left" }), schema_json: JSON.stringify({ type: "text", props: { content: "string" } }), is_system: 1 },
      { type: "heading", name: "Heading", category: "basic", icon: "Heading1", default_props_json: JSON.stringify({ content: "Judul Surat", fontSize: 14, fontWeight: "bold", align: "center" }), schema_json: JSON.stringify({ type: "heading" }), is_system: 1 },
      { type: "paragraph", name: "Paragraph", category: "basic", icon: "Pilcrow", default_props_json: JSON.stringify({ content: "Menimbang bahwa...", fontSize: 11, align: "justify" }), schema_json: JSON.stringify({ type: "paragraph" }), is_system: 1 },
      { type: "image", name: "Image / Logo", category: "basic", icon: "Image", default_props_json: JSON.stringify({ src: "{{office.logo}}", width: 60 }), schema_json: JSON.stringify({ type: "image" }), is_system: 1 },
      { type: "table", name: "Table", category: "data", icon: "Table", default_props_json: JSON.stringify({ source: "items", columns: ["no","name","qty"] }), schema_json: JSON.stringify({ type: "table" }), is_system: 1 },
      { type: "signature", name: "Signature", category: "branding", icon: "PenTool", default_props_json: JSON.stringify({ name: "{{signer.name}}", position: "{{signer.position}}", nip: "{{signer.nip}}" }), schema_json: JSON.stringify({ type: "signature" }), is_system: 1 },
      { type: "divider", name: "Divider", category: "layout", icon: "Minus", default_props_json: JSON.stringify({ height: 1, color: "#e5e7eb" }), schema_json: JSON.stringify({ type: "divider" }), is_system: 1 },
      { type: "qrcode", name: "QR Code", category: "dynamic", icon: "QrCode", default_props_json: JSON.stringify({ value: "{{document.qr}}", size: 60 }), schema_json: JSON.stringify({ type: "qrcode" }), is_system: 1 },
      { type: "date", name: "Date", category: "dynamic", icon: "Calendar", default_props_json: JSON.stringify({ source: "letter.date", format: "DD MMMM YYYY" }), schema_json: JSON.stringify({ type: "date" }), is_system: 1 },
      { type: "repeater", name: "Repeater / Loop", category: "dynamic", icon: "Repeat", default_props_json: JSON.stringify({ source: "employees", item: "employee", label: "Loop" }), schema_json: JSON.stringify({ type: "repeater", props: { source: "employees", item: "employee" }, children: [] }), is_system: 1 },
      { type: "condition", name: "Condition / IF", category: "dynamic", icon: "GitBranch", default_props_json: JSON.stringify({ field: "employee.status", operator: "equals", value: "active" }), schema_json: JSON.stringify({ type: "condition" }), is_system: 1 },
      { type: "kop_surat", name: "Kop Surat", category: "branding", icon: "Building2", default_props_json: JSON.stringify({ office: "{{office.name}}", address: "{{office.address}}" }), schema_json: JSON.stringify({ type: "kop_surat" }), is_system: 1 },
    ]
    for (const c of comps) {
      await prisma.$executeRawUnsafe(`INSERT INTO "${compTable}" ("type","name","category","icon","default_props_json","schema_json","is_system") VALUES (?,?,?,?,?,?,?)`, c.type, c.name, c.category, c.icon, c.default_props_json, c.schema_json, c.is_system)
    }
    console.log(`✅ Seeded ${comps.length} components`)
  }

  // Employees
  const empTable = toTable(slug, "employees")
  const countE: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${empTable}"`)
  if (Number(countE[0].count) === 0) {
    const emps = [
      { name: "Afdal", nip: "199001012015031001", position: "Programmer", department: "Bidang TI", status: "active", email: "afdal@kantor.go.id", phone: "081234567890" },
      { name: "Budi Santoso", nip: "198512122010011002", position: "Analis Kebijakan", department: "Bagian Hukum", status: "active", email: "budi@kantor.go.id", phone: "081234567891" },
      { name: "Citra Dewi", nip: "199205152018022001", position: "Staff Administrasi", department: "Sekretariat", status: "active", email: "citra@kantor.go.id", phone: "081234567892" },
      { name: "Dedi Hermawan", nip: "198803102009031003", position: "Kepala Bidang", department: "Keuangan", status: "active", email: "dedi@kantor.go.id", phone: "081234567893" },
      { name: "Eka Putri", nip: "199308212019032002", position: "Arsiparis", department: "Umum", status: "leave", email: "eka@kantor.go.id", phone: "081234567894" },
      { name: "Fajar Nugroho", nip: "198705072011011004", position: "Pranata Komputer", department: "Bidang TI", status: "active", email: "fajar@kantor.go.id", phone: "081234567895" },
      { name: "Gita Maharani", nip: "199111202016022003", position: "Bendahara", department: "Keuangan", status: "inactive", email: "gita@kantor.go.id", phone: "081234567896" },
    ]
    for (const e of emps) {
      await prisma.$executeRawUnsafe(`INSERT INTO "${empTable}" ("name","nip","position","department","status","email","phone") VALUES (?,?,?,?,?,?,?)`, e.name, e.nip, e.position, e.department, e.status, e.email, e.phone)
    }
    console.log(`✅ Seeded ${emps.length} employees`)
  }

  // Documents
  const docTable = toTable(slug, "documents")
  const countD: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${docTable}"`)
  if (Number(countD[0].count) === 0) {
    const docs = [
      { template_id: 1, document_number: "800/001/SK/VI/2026", title: "SK Pengangkatan Tim IT 2026", recipient_name: "Tim Teknologi Informasi", data_json: JSON.stringify({ letter: { number: "800/001/SK/VI/2026", title: "SURAT KEPUTUSAN", consideration: "perlu dibentuk tim IT untuk mendukung digitalisasi" }, employees: [{ name: "Afdal", nip: "199001012015031001", position: "Programmer", department: "Bidang TI", status: "active" }, { name: "Budi Santoso", nip: "198512122010011002", position: "Analis", department: "Bagian Hukum", status: "active" }], office: { name: "PEMERINTAH PROVINSI ACEH", address: "Jl. T. Nyak Arief No.219 Banda Aceh", logo: "" }, signer: { name: "Drs. H. Ahmad Yani, M.Si", position: "Kepala Dinas", nip: "196501011990031001" }, current_date: "18 September 2026" }), rendered_html: "", status: "published", issued_at: "2026-06-15 08:00:00", notes: "Dokumen demo loop + condition" },
      { template_id: 2, document_number: "094/002/ST/VII/2026", title: "Surat Tugas Perjalanan Dinas", recipient_name: "Afdal - Perjalanan ke Medan", data_json: JSON.stringify({ letter: { number: "094/002/ST/VII/2026" }, employees: [{ name: "Afdal", nip: "199001012015031001", trips: [{ destination: "Banda Aceh", date: "2026-08-20", purpose: "Rapat Koordinasi" }, { destination: "Medan", date: "2026-08-22", purpose: "Workshop TI" }] }], signer: { name: "Dedi Hermawan", position: "Kepala Bidang" } }), rendered_html: "", status: "draft", issued_at: "2026-07-10 09:00:00", notes: "Demo nested loop employee.trips" },
      { template_id: 3, document_number: "005/003/UND/VIII/2026", title: "Undangan Rapat Evaluasi", recipient_name: "Seluruh Kepala Bidang", data_json: JSON.stringify({ letter: { type: "internal", event_date: "20 Agustus 2026", location: "Aula Kantor Gubernur", number: "005/003/UND/VIII/2026" }, recipient: { name: "Kepala Bidang TI", location: "Ruang Rapat Lantai 2" }, agenda: [{ waktu: "09:00", agenda: "Pembukaan", pic: "Sekda" }, { waktu: "10:00", agenda: "Paparan Capaian", pic: "Kabid TI" }] }), rendered_html: "", status: "published", issued_at: "2026-08-15 07:30:00", notes: "Demo condition letter.type" },
    ]
    for (const d of docs) {
      await prisma.$executeRawUnsafe(`INSERT INTO "${docTable}" ("template_id","document_number","title","recipient_name","data_json","rendered_html","status","issued_at","notes") VALUES (?,?,?,?,?,?,?,?,?)`, d.template_id, d.document_number, d.title, d.recipient_name, d.data_json, d.rendered_html, d.status, d.issued_at, d.notes)
    }
    console.log(`✅ Seeded ${docs.length} documents`)
  }

  // Update generation to success and project to ready
  await prisma.aiGeneration.update({ where: { id: generation.id }, data: { status: "success", durationMs: 3200 } })
  await prisma.aiProject.update({ where: { id: project.id }, data: { status: "ready" } })
  await prisma.aiDeployment.create({
    data: {
      projectId: project.id,
      env: "preview",
      url: `/generated/${slug}`,
      builtAt: new Date(),
    },
  })
  console.log(`✅ Project ${slug} ready at /generated/${slug}`)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
