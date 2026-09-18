import { z } from "zod"

export const CreateComponentSchema = z.object({
  type: z.string().min(2).max(50), // text, heading, repeater, condition, etc
  name: z.string().min(2).max(100),
  category: z.enum(["basic","layout","data","dynamic","branding"]),
  icon: z.string().max(50).optional().nullable(),
  default_props_json: z.string().optional().nullable(),
  schema_json: z.string().optional().nullable(),
  is_system: z.coerce.number().int().min(0).max(1).optional().default(0),
})

export const UpdateComponentSchema = CreateComponentSchema.partial()

export const QueryComponentSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional().default("id"),
  sortOrder: z.enum(["asc","desc"]).optional().default("desc"),
  category: z.string().optional(),
  type: z.string().optional(),
})
