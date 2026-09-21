import prisma from "@/lib/prisma"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

// Server Component — langsung query SQLite via Prisma tanpa API Route
export default async function PrismaDemoPage() {
  let users: { id: number; username: string; email: string; firstName: string; lastName: string; createdAt: Date }[] = []
  let stats = { users: 0, roles: 0, permissions: 0, projects: 0 }

  try {
    users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, firstName: true, lastName: true, createdAt: true },
      take: 20,
      orderBy: { id: "asc" },
    })
  } catch {
    // DB belum di-migrate — fallback kosong agar build tidak crash
    users = []
  }

  // File-based builder projects (ai_* tables sudah dihapus, ganti file di docs/ai-builder/projects/)
  let projects = 0
  try {
    const dir = path.join(process.cwd(), "docs", "ai-builder", "projects")
    if (fs.existsSync(dir)) projects = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !f.endsWith(".spec.json") && !f.endsWith(".meta.json")).length
  } catch {}

  try {
    const [userCount, roleCount, permissionCount] = await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.permission.count(),
    ])
    stats = { users: userCount, roles: roleCount, permissions: permissionCount, projects }
  } catch {
    // DB belum di-migrate (mis. build tanpa dev.db) — tampilkan fallback kosong
    stats = { users: 0, roles: 0, permissions: 0, projects }
  }

  return (
    <main className="p-4 max-w-5xl mx-auto">
      <h1 className="text-lg font-bold mb-2">Prisma SQLite Demo</h1>
      <p className="text-[13px] text-muted-foreground mb-4">
        Server Component langsung memanggil <code>prisma.user.findMany()</code> — tidak perlu API Route. DB: <code>file:./dev.db</code> |{" "}
        <code>prisma/schema.prisma</code> | <code>lib/prisma.ts</code> singleton.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border p-3">
          <div className="text-lg font-bold">{stats.users}</div>
          <div className="text-xs text-muted-foreground">Users</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-lg font-bold">{stats.roles}</div>
          <div className="text-xs text-muted-foreground">Roles</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-lg font-bold">{stats.permissions}</div>
          <div className="text-xs text-muted-foreground">Permissions</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-lg font-bold">{stats.projects}</div>
          <div className="text-xs text-muted-foreground">Projects (file)</div>
        </div>
      </div>

      <h2 className="text-[15px] font-semibold mb-3">Daftar Pengguna</h2>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2.5">ID</th>
              <th className="text-left p-2.5">Username</th>
              <th className="text-left p-2.5">Email</th>
              <th className="text-left p-2.5">Name</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-2.5">{user.id}</td>
                <td className="p-2.5 font-medium">{user.username}</td>
                <td className="p-2.5">{user.email}</td>
                <td className="p-2.5">
                  {user.firstName} {user.lastName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 rounded-lg bg-muted p-3 text-[13px]">
        <div className="font-semibold mb-1">Tips:</div>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>
            Lihat GUI: <code>npx prisma studio</code> → http://localhost:5555
          </li>
          <li>
            Dynamic tables per prompt dibuat via <code>prisma.$executeRawUnsafe(&apos;CREATE TABLE &quot;slug_entity&quot; ...&apos;)</code> — lihat{" "}
            <code>lib/db/dynamic.ts</code>
          </li>
          <li>
            Reset DB: <code>rm dev.db && npx prisma migrate dev --name init && npx tsx prisma/seed.ts</code>
          </li>
        </ul>
      </div>
    </main>
  )
}
