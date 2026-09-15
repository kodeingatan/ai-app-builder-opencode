import { defineEventHandler, readBody } from 'h3'
import { GenerateSchema } from '~~/server/dto/ai-builder.dto'
import { AiInferenceService } from '~~/server/services/ai-builder/inference.service'

// Orchestrator stub — full codegen pipeline to be implemented in Task 12-13
// For now: infer + create AiProject stub + return previewUrl

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { prompt } = GenerateSchema.parse(body)

  const intent = await AiInferenceService.infer(prompt)
  const slugBase = AiInferenceService.slugify(prompt, intent.domain)
  const slug = slugBase || 'app-' + Date.now().toString(36)

  // In real implementation: create AiProject + AiPrompt + AiGeneration via TypeORM
  // Here we return inferred spec for immediate frontend use
  return {
    project: {
      name: intent.domainLabel,
      slug,
      initialPrompt: prompt,
      status: 'generating',
      previewUrl: `/generated/${slug}`
    },
    generation: {
      status: 'running',
      spec: intent
    },
    inferredIntent: intent,
    message: `Siap — aku bikinin ${intent.domainLabel} lengkap ya. Ada ${intent.entities.map(e => e.label).join(', ')}. Sudah jadi di /generated/${slug} — bisa langsung dipakai. Mau tambah fitur lain?`,
    previewUrl: `/generated/${slug}`
  }
})
