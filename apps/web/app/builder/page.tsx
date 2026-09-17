"use client"
import { AiPromptBar } from '@/components/builder/AiPromptBar'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAiBuilder } from '@/hooks/useAiBuilder'

const templates = [
  { name: 'Kasir POS', prompt: 'buatkan aplikasi kasir', icon: '🛒' },
  { name: 'CRM Klinik', prompt: 'buatkan CRM untuk klinik', icon: '🏥' },
  { name: 'Todo Share', prompt: 'todo app dengan fitur share', icon: '✅' }
]

export default function BuilderPage() {
  const router = useRouter()
  const { generate } = useAiBuilder()

  async function onGenerate(prompt: string) {
    try {
      const res: any = await generate(prompt)
      toast.success(res.message || 'Generate dimulai')
      setTimeout(() => router.push(res.previewUrl || `/builder/${res.project.slug}`), 600)
    } catch (e: any) {
      toast.error(e.message || 'Gagal generate')
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f5f4] p-8">
      <div className="max-w-[960px] mx-auto">
        <AiPromptBar onGenerate={onGenerate} />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[720px] mx-auto">
          {templates.map(t => (
            <div
              key={t.name}
              onClick={() => onGenerate(t.prompt)}
              className="bg-card rounded-xl border p-4 hover:shadow-md cursor-pointer transition"
            >
              <div className="text-xl">{t.icon}</div>
              <div className="font-semibold mt-2">{t.name}</div>
              <div className="text-sm text-muted-foreground mt-1">{t.prompt}</div>
              <div className="text-xs font-semibold tracking-wide uppercase text-primary mt-3">Gunakan Template →</div>
            </div>
          ))}
        </div>
        <div className="mt-8 max-w-[720px] mx-auto">
          <h3 className="font-semibold">Library</h3>
          <p className="text-sm text-muted-foreground">Project yang sudah di-generate akan muncul di sini. Endpoint: <code>GET /api/builder/projects</code></p>
        </div>
      </div>
    </div>
  )
}
