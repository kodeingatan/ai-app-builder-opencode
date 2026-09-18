import "dotenv/config"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "../app/generated/prisma/client"
import * as bcrypt from "bcryptjs"

const url = process.env.DATABASE_URL || "file:./dev.db"
const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding platform RBAC + Builder META...")

  // Hash password P455w0rd!!!
  const hashed = await bcrypt.hash("P455w0rd!!!", 10)

  // ── Roles ──
  const rolesData = [
    { roleName: "Super Admin", description: "Full access" },
    { roleName: "Admin", description: "Admin access" },
    { roleName: "Editor", description: "Editor access" },
    { roleName: "Viewer", description: "Read only" },
    { roleName: "Manager", description: "Manager access" },
    { roleName: "Guest", description: "Guest access" },
  ]

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { roleName: r.roleName },
      update: {},
      create: r,
    })
  }

  const superAdminRole = await prisma.role.findUnique({ where: { roleName: "Super Admin" } })
  const editorRole = await prisma.role.findUnique({ where: { roleName: "Editor" } })
  const viewerRole = await prisma.role.findUnique({ where: { roleName: "Viewer" } })
  const managerRole = await prisma.role.findUnique({ where: { roleName: "Manager" } })
  const guestRole = await prisma.role.findUnique({ where: { roleName: "Guest" } })

  // ── Users (idempotent by email/username) ──
  const usersData = [
    { firstName: "Admin", lastName: "User", username: "admin", email: "admin@admin.com", role: superAdminRole },
    { firstName: "Editor", lastName: "User", username: "editor", email: "editor@example.com", role: editorRole },
    { firstName: "Viewer", lastName: "User", username: "viewer", email: "viewer@example.com", role: viewerRole },
    { firstName: "Manager", lastName: "User", username: "manager", email: "manager@example.com", role: managerRole },
    { firstName: "Guest", lastName: "User", username: "guest", email: "guest@example.com", role: guestRole },
  ]

  for (const u of usersData) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (!existing) {
      const created = await prisma.user.create({
        data: {
          firstName: u.firstName,
          lastName: u.lastName,
          username: u.username,
          email: u.email,
          password: hashed,
        },
      })
      if (u.role) {
        await prisma.userRole.create({
          data: { userId: created.id, roleId: u.role.id },
        })
      }
      console.log(`✅ Created user ${u.username}`)
    } else {
      console.log(`⏭️  User ${u.username} exists`)
    }
  }

  // ── Permissions ──
  const permissionsData = [
    { permissionName: "User Read", description: "Read users", methods: ["GET"], urls: ["/api/users", "/api/users/*"] },
    { permissionName: "User Write", description: "Write users", methods: ["POST", "PUT", "DELETE"], urls: ["/api/users", "/api/users/*"] },
    { permissionName: "Role Read", description: "Read roles", methods: ["GET"], urls: ["/api/roles", "/api/roles/*"] },
    { permissionName: "Role Write", description: "Write roles", methods: ["POST", "PUT", "DELETE"], urls: ["/api/roles", "/api/roles/*"] },
    { permissionName: "Permission Read", description: "Read permissions", methods: ["GET"], urls: ["/api/permissions", "/api/permissions/*"] },
    { permissionName: "Guard Read", description: "Read guards", methods: ["GET"], urls: ["/api/guards", "/api/guards/*"] },
    { permissionName: "ActivityLog Read", description: "Read logs", methods: ["GET"], urls: ["/api/activity-logs", "/api/activity-logs/*"] },
    { permissionName: "Setting Manage", description: "Manage settings", methods: ["GET", "POST", "PUT"], urls: ["/api/settings", "/api/settings/*"] },
    // Builder
    { permissionName: "Builder Generate", description: "Generate app", methods: ["POST"], urls: ["/api/builder/generate", "/api/builder/refine"] },
    { permissionName: "Builder Read", description: "Read builder", methods: ["GET"], urls: ["/api/builder/projects/*", "/api/builder/generations/*", "/api/builder/templates"] },
    { permissionName: "Builder Manage", description: "Manage builder", methods: ["DELETE"], urls: ["/api/builder/projects/*"] },
    { permissionName: "Generated Read", description: "Read generated", methods: ["GET"], urls: ["/api/generated/*/*"] },
    { permissionName: "Generated Write", description: "Write generated", methods: ["POST", "PUT", "DELETE"], urls: ["/api/generated/*/*"] },
  ]

  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { permissionName: p.permissionName },
      update: {},
      create: { permissionName: p.permissionName, description: p.description },
    })
    for (const m of p.methods) {
      const exists = await prisma.permissionMethod.findFirst({ where: { permissionId: perm.id, method: m } })
      if (!exists) await prisma.permissionMethod.create({ data: { permissionId: perm.id, method: m } })
    }
    for (const u of p.urls) {
      const exists = await prisma.permissionUrl.findFirst({ where: { permissionId: perm.id, url: u } })
      if (!exists) await prisma.permissionUrl.create({ data: { permissionId: perm.id, url: u } })
    }
  }

  // Assign all permissions to Super Admin
  if (superAdminRole) {
    const allPerms = await prisma.permission.findMany()
    for (const perm of allPerms) {
      const exists = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      })
      if (!exists) await prisma.rolePermission.create({ data: { roleId: superAdminRole.id, permissionId: perm.id } })
    }
  }

  // ── Guards ──
  const guardsData = [
    { guardName: "Admin Guard", description: "Admin guard", urls: [{ url: "/api/users/*", type: "allow" as const }, { url: "/api/roles/*", type: "allow" as const }] },
    { guardName: "Builder Guard", description: "Builder guard", urls: [{ url: "/api/builder/*", type: "allow" as const }] },
  ]
  for (const g of guardsData) {
    const guard = await prisma.guard.upsert({
      where: { guardName: g.guardName },
      update: {},
      create: { guardName: g.guardName, description: g.description },
    })
    for (const u of g.urls) {
      const exists = await prisma.guardUrl.findFirst({ where: { guardId: guard.id, url: u.url } })
      if (!exists) await prisma.guardUrl.create({ data: { guardId: guard.id, url: u.url, type: u.type } })
    }
    if (superAdminRole) {
      const exists = await prisma.roleGuard.findUnique({ where: { roleId_guardId: { roleId: superAdminRole.id, guardId: guard.id } } })
      if (!exists) await prisma.roleGuard.create({ data: { roleId: superAdminRole.id, guardId: guard.id } })
    }
  }

  // ── Settings ──
  const settings = [
    { key: "app_name", value: "AI App Builder" },
    { key: "login_bg_gradient", value: "linear-gradient(135deg, #0075de 0%, #62aef0 100%)" },
    { key: "builder_default_template", value: "pos-kasir" },
    { key: "ai_inference_provider", value: "stub" },
  ]
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  console.log("✅ Seed completed")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
