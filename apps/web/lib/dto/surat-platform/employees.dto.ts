import { z } from "zod"

export const CreateEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  nip: z.string().min(5).max(30),
  position: z.string().min(2).max(100),
  department: z.string().max(100).optional().nullable(),
  status: z.enum(["active","inactive","leave"]).default("active"),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(20).optional().nullable(),
})

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial()

export const QueryEmployeeSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional().default("id"),
  sortOrder: z.enum(["asc","desc"]).optional().default("desc"),
  department: z.string().optional(),
  status: z.string().optional(),
})
