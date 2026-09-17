import { z } from 'zod'

export const GenerateSchema = z.object({
  prompt: z.string().min(3, 'Prompt minimal 3 karakter').max(500, 'Maks 500 karakter'),
  templateSlug: z.string().optional()
})
export type GenerateInput = z.infer<typeof GenerateSchema>

export const RefineSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalid'),
  prompt: z.string().min(3).max(500)
})
export type RefineInput = z.infer<typeof RefineSchema>

export const QueryProjectsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['drafting', 'generating', 'ready', 'failed']).optional(),
  sortBy: z.string().default('updatedAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC')
})
