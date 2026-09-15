<script setup lang="ts">
import AiPromptBar from '~/components/builder/AiPromptBar.vue'
import { useMessage } from 'naive-ui'

definePageMeta({ middleware: 'auth' })

const message = useMessage()
const router = useRouter()
const aiBuilder = useAiBuilder()

async function onGenerate(prompt: string) {
  try {
    const res: any = await aiBuilder.generate(prompt)
    message.success(res.message || 'Generate dimulai — preparing preview...')
    // In full implementation: poll generation status then redirect to /builder/${slug} or /generated/${slug}
    setTimeout(() => router.push(res.previewUrl || `/builder/${res.project.slug}`), 800)
  } catch (e: any) {
    message.error(e?.data?.message || e?.message || 'Gagal generate')
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f6f5f4] p-8">
    <div class="max-w-[960px] mx-auto">
      <AiPromptBar @generate="onGenerate" />

      <!-- Template Gallery stub -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[720px] mx-auto">
        <div v-for="t in [
          { name: 'Kasir POS', prompt: 'buatkan aplikasi kasir', icon: '🛒' },
          { name: 'CRM Klinik', prompt: 'buatkan CRM untuk klinik', icon: '🏥' },
          { name: 'Todo Share', prompt: 'todo app dengan fitur share', icon: '✅' }
        ]" :key="t.name" class="bg-white rounded-[12px] border border-[#e6e6e6] p-4 hover:shadow-[0_4px_18px_rgba(0,0,0,0.04)] cursor-pointer transition" @click="onGenerate(t.prompt)">
          <div class="text-[20px]">{{ t.icon }}</div>
          <div class="font-semibold mt-2">{{ t.name }}</div>
          <div class="text-[13px] text-[#615d59] mt-1">{{ t.prompt }}</div>
          <div class="text-[11px] font-semibold tracking-[0.05em] uppercase text-[#0075de] mt-3">Gunakan Template →</div>
        </div>
      </div>

      <!-- Project Library placeholder -->
      <div class="mt-8 max-w-[720px] mx-auto">
        <h3 class="font-semibold text-[16px]">Library</h3>
        <p class="text-[13px] text-[#615d59]">
          Project yang sudah di-generate akan muncul di sini. Endpoint: <code>GET /api/builder/projects</code>
        </p>
      </div>
    </div>
  </div>
</template>
