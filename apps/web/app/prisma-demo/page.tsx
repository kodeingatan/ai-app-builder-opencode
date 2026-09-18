import prisma from "@/lib/prisma"

// Server Component — langsung query SQLite via Prisma tanpa API Route
export default async function PrismaDemoPage() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, firstName: true, lastName: true, createdAt: true },
    take: 20,
    orderBy: { id: "asc" },
  })

  const stats = {
    users: await prisma.user.count(),
    roles: await prisma.role.count(),
    permissions: await prisma.permission.count(),
    projects: await prisma.aiProject.count(),
  }

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Prisma SQLite Demo</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Server Component langsung memanggil <code>prisma.user.findMany()</code> — tidak perlu API Route. DB: <code>file:./dev.db</code> |{" "}
        <code>prisma/schema.prisma</code> | <code>lib/prisma.ts</code> singleton.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.users}</div>
          <div className="text-xs text-muted-foreground">Users</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.roles}</div>
          <div className="text-xs text-muted-foreground">Roles</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.permissions}</div>
          <div className="text-xs text-muted-foreground">Permissions</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.projects}</div>
          <div className="text-xs text-muted-foreground">AiProjects</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Daftar Pengguna</h2>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Name</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.id}</td>
                <td className="p-3 font-medium">{user.username}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">
                  {user.firstName} {user.lastName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-lg bg-muted p-4 text-sm">
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
