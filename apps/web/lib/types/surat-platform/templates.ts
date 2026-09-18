export interface SuratTemplate {
  id: number
  name: string
  code: string
  category: string
  description: string | null
  version: number
  status: string
  schema_json: string
  preview_html: string | null
  created_at: string
  updated_at: string
}

export interface DataSource {
  id: number
  name: string
  type: string
  entity: string | null
  config_json: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface ComponentDef {
  id: number
  type: string
  name: string
  category: string
  icon: string | null
  default_props_json: string | null
  schema_json: string | null
  is_system: number
  created_at: string
  updated_at: string
}

export interface SuratDocument {
  id: number
  template_id: number | null
  document_number: string
  title: string
  recipient_name: string | null
  data_json: string
  rendered_html: string | null
  status: string
  issued_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Employee {
  id: number
  name: string
  nip: string
  position: string
  department: string | null
  status: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

// JSON Tree types
export type NodeType = "document" | "header" | "footer" | "section" | "text" | "heading" | "paragraph" | "image" | "table" | "signature" | "divider" | "qrcode" | "date" | "repeater" | "condition" | "kop_surat"

export interface TreeNode {
  type: NodeType | string
  props?: Record<string, any>
  children?: TreeNode[]
}

export interface ConditionProps {
  field: string // e.g. employee.status
  operator: "equals" | "not_equals" | "contains" | "exists" | "gt" | "lt"
  value: string
}

export interface RepeaterProps {
  source: string // e.g. employees or employee.trips
  item: string // e.g. employee
  label?: string
}
