import { z } from "zod"

export const CreateTemplateSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(50).regex(/^[A-Z0-9\-\/]+$/i, "Kode hanya huruf, angka, - dan /"),
  category: z.enum(["surat_keputusan","surat_tugas","surat_undangan","surat_keterangan","perjalanan_dinas","berita_acara","nota_dinas","sertifikat","formulir","laporan"]).default("surat_keputusan"),
  description: z.string().max(1000).optional().nullable(),
  version: z.coerce.number().int().min(1).default(1),
  status: z.enum(["draft","published","archived"]).default("draft"),
  schema_json: z.string().min(2, "Schema JSON wajib"), // JSON string tree
  preview_html: z.string().optional().nullable(),
})

export const UpdateTemplateSchema = CreateTemplateSchema.partial()

export const QueryTemplateSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().optional().default("id"),
  sortOrder: z.enum(["asc","desc"]).optional().default("desc"),
  category: z.string().optional(),
  status: z.string().optional(),
})

export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>
export type QueryTemplateInput = z.infer<typeof QueryTemplateSchema>
