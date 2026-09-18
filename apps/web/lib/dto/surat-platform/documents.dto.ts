import { z } from "zod"

export const CreateDocumentSchema = z.object({
  template_id: z.coerce.number().int().nullable().optional(),
  document_number: z.string().min(3).max(100),
  title: z.string().min(3).max(200),
  recipient_name: z.string().max(200).optional().nullable(),
  data_json: z.string().min(2, "Data JSON wajib - gunakan {{}} binding atau JSON"),
  rendered_html: z.string().optional().nullable(),
  status: z.enum(["draft","rendered","published","archived"]).default("draft"),
  issued_at: z.string().optional().nullable(), // ISO date
  notes: z.string().max(1000).optional().nullable(),
})

export const UpdateDocumentSchema = CreateDocumentSchema.partial()

export const QueryDocumentSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional().default("id"),
  sortOrder: z.enum(["asc","desc"]).optional().default("desc"),
  status: z.string().optional(),
  template_id: z.coerce.number().optional(),
})

export const RenderDocumentSchema = z.object({
  templateId: z.coerce.number().int().optional(),
  data: z.record(z.string(), z.any()), // binding data
  schema: z.any().optional(), // optional override schema
})
