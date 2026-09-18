import { z } from "zod"

// 13 tipe kolom sesuai spec
export const GlobalColumnTypeEnum = z.enum([
  "text",
  "richtext",
  "date",
  "datetime",
  "time",
  "image",
  "select",
  "select_multiple",
  "select_table",
  "select_table_multiple",
  "number",
  "hidden_operation_text",
  "readonly_operation_text",
])

export const ColumnOptionSchema = z.object({
  name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "nama column harus snake_case, mulai huruf/underscore"),
  displayName: z.string().min(1),
  type: GlobalColumnTypeEnum,
  // optionsJson per type
  options: z.any().optional(), // for select options [{value,label}]
  // type-specific extra stored in optionsJson
  format: z.string().optional(), // date/datetime/time format m-d-Y etc
  relationTable: z.string().optional(), // select_table
  displayFields: z.array(z.string()).optional(), // select_table display
  valueField: z.string().optional(),
  isCurrency: z.boolean().optional(), // number
  expression: z.string().optional(), // hidden/readonly operation
  defaultValue: z.string().optional().nullable(),
  isRequired: z.boolean().optional(),
  isOrderable: z.boolean().optional(),
  isSearchable: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
})

export const CreateGlobalTableSchema = z.object({
  name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "nama tabel snake_case"),
  displayName: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "archived"]).optional(),
  columns: z.array(ColumnOptionSchema).min(1),
})

export const UpdateGlobalTableSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "archived"]).optional(),
  columns: z.array(ColumnOptionSchema).optional(), // full replace if provided, additive via orderIndex
})

export const QueryGlobalTableSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

// For dynamic data per table
export const QueryDynSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  // filters for searching columns that are isSearchable
})
