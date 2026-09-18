import { z } from "zod"

export const CreateDataSourceSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(["entity","api","custom_query","static"]),
  entity: z.string().max(100).optional().nullable(),
  config_json: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
})

export const UpdateDataSourceSchema = CreateDataSourceSchema.partial()

export const QueryDataSourceSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional().default("id"),
  sortOrder: z.enum(["asc","desc"]).optional().default("desc"),
  type: z.string().optional(),
})

export type CreateDataSourceInput = z.infer<typeof CreateDataSourceSchema>
export type UpdateDataSourceInput = z.infer<typeof UpdateDataSourceSchema>
