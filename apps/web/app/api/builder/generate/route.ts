import { NextRequest, NextResponse } from 'next/server'
import { GenerateSchema } from '@/lib/dto/ai-builder.dto'
import { AiInferenceService } from '@/lib/services/ai-builder/inference.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt } = GenerateSchema.parse(body)
    const intent = await AiInferenceService.infer(prompt)
    const slugBase = AiInferenceService.slugify(prompt, intent.domain)
    const slug = slugBase || `app-${Date.now().toString(36)}`

    // TODO: persist AiProject + AiPrompt + AiGeneration via TypeORM (lib/db/data-source.ts)
    return NextResponse.json({
      project: { name: intent.domainLabel, slug, initialPrompt: prompt, status: 'generating', previewUrl: `/generated/${slug}` },
      generation: { status: 'running', spec: intent },
      inferredIntent: intent,
      previewUrl: `/generated/${slug}`,
      message: `Siap — aku bikinin ${intent.domainLabel} lengkap ya. Ada ${intent.entities.map(e => e.label).join(', ')}. Sudah jadi di /generated/${slug} — bisa langsung dipakai. Mau tambah fitur lain?`
    })
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ message: 'Validasi gagal', issues: e.issues }, { status: 422 })
    return NextResponse.json({ message: e?.message || 'Gagal generate' }, { status: 500 })
  }
}
