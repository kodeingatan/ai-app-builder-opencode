import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@/app/generated/prisma/client"

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL || "file:./dev.db"
  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma
