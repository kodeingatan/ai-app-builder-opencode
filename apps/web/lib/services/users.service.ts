import prisma from "@/lib/prisma"

export type QueryInput = {
  page?: number
  limit?: number
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export const UsersService = {
  async findAll(query: QueryInput) {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)
    const skip = (page - 1) * limit
    const search = query.search?.trim()
    const sortBy = query.sortBy ?? "id"
    const sortOrder = query.sortOrder ?? "desc"

    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { username: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
          ],
        }
      : undefined

    // Whitelist sortBy to prevent injection
    const allowedSort = new Set(["id", "email", "username", "createdAt"])
    const safeSortBy = allowedSort.has(sortBy) ? sortBy : "id"
    const orderBy = { [safeSortBy]: sortOrder } as Record<string, "asc" | "desc">

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async findOne(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  async create(data: { firstName: string; lastName: string; username: string; email: string; password: string }) {
    // password harus sudah di-hash bcrypt di caller
    return prisma.user.create({
      data,
      select: { id: true, username: true, email: true },
    })
  },

  async update(id: number, data: Partial<{ firstName: string; lastName: string; email: string }>) {
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true },
    })
  },

  async remove(id: number) {
    return prisma.user.delete({ where: { id } })
  },
}
