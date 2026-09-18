import fs from "fs"
import path from "path"

const BASE_DIR = path.join(process.cwd(), "docs", "ai-builder", "projects")
const TEMPLATE_FILE = path.join(process.cwd(), "docs", "ai-builder", "templates", "starter.json")

function ensureDir() {
  if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true })
}

export type AiProjectFile = {
  name: string
  slug: string
  initialPrompt: string
  status: "drafting" | "generating" | "ready" | "failed"
  previewUrl?: string
  ownerId?: number | null
  createdAt: string
  updatedAt: string
  prompts: { promptText: string; inferredIntent?: string; version: number; createdAt: string }[]
  generations: { status: string; spec?: string; error?: string; durationMs?: number; createdAt: string; updatedAt: string }[]
  deployments: { env: string; url: string; builtAt: string; createdAt: string }[]
  spec?: { entities: any; pages: any; roles: any; flows?: any }
}

export const AiBuilderFileStore = {
  list(): AiProjectFile[] {
    ensureDir()
    if (!fs.existsSync(BASE_DIR)) return []
    const files = fs.readdirSync(BASE_DIR).filter((f) => f.endsWith(".json") && !f.endsWith(".spec.json") && !f.endsWith(".meta.json"))
    return files.map((f) => {
      try {
        const raw = fs.readFileSync(path.join(BASE_DIR, f), "utf-8")
        return JSON.parse(raw)
      } catch {
        return null
      }
    }).filter(Boolean) as AiProjectFile[]
  },

  get(slug: string): AiProjectFile | null {
    ensureDir()
    const p = path.join(BASE_DIR, `${slug}.json`)
    if (!fs.existsSync(p)) return null
    try {
      return JSON.parse(fs.readFileSync(p, "utf-8"))
    } catch {
      return null
    }
  },

  save(project: AiProjectFile) {
    ensureDir()
    const p = path.join(BASE_DIR, `${project.slug}.json`)
    project.updatedAt = new Date().toISOString()
    fs.writeFileSync(p, JSON.stringify(project, null, 2), "utf-8")
    // also write spec snapshot if exists
    if (project.spec) {
      const specPath = path.join(BASE_DIR, `${project.slug}.spec.json`)
      fs.writeFileSync(specPath, JSON.stringify(project.spec, null, 2), "utf-8")
    }
  },

  remove(slug: string) {
    const p = path.join(BASE_DIR, `${slug}.json`)
    const specP = path.join(BASE_DIR, `${slug}.spec.json`)
    const metaP = path.join(BASE_DIR, `${slug}.meta.json`)
    for (const f of [p, specP, metaP]) if (fs.existsSync(f)) fs.unlinkSync(f)
  },

  count() {
    return this.list().length
  },

  getStarterTemplates() {
    try {
      if (fs.existsSync(TEMPLATE_FILE)) return JSON.parse(fs.readFileSync(TEMPLATE_FILE, "utf-8"))
    } catch {}
    return []
  },
}
