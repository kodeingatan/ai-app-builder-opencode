import { z } from "zod"

export const GenerateSchema = z.object({
  prompt: z.string().min(3).max(500),
})

export const RefineSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  prompt: z.string().min(3).max(500),
})

export const FieldDefSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "text", "integer", "decimal", "boolean", "date", "datetime", "enum", "relation"]),
  required: z.boolean().default(true),
  unique: z.boolean().default(false),
  enumValues: z.array(z.string()).nullable().optional(),
})

export const RelationDefSchema = z.object({
  type: z.enum(["ManyToOne", "OneToMany"]),
  target: z.string().min(1),
  field: z.string().min(1),
  onDelete: z.enum(["CASCADE", "SET NULL", "RESTRICT"]).default("SET NULL"),
})
