<script setup lang="ts">
import { NInput, NButton, NIcon } from 'naive-ui'
import { Sparkles, ArrowRight } from '@vicons/carbon'
import { h, ref } from 'vue'

const emit = defineEmits<{ (e: 'generate', prompt: string): void }>()

const prompt = ref('')
const loading = ref(false)

function handleGenerate() {
  if (!prompt.value.trim() || prompt.value.trim().length < 3) return
  loading.value = true
  emit('generate', prompt.value.trim())
  // parent resets loading via prop/event; timeout fallback
  setTimeout(() => (loading.value = false), 3000)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleGenerate()
  }
}
</script>

<template>
  <div class="bg-white rounded-[16px] border border-[#e6e6e6] p-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)] max-w-[720px] mx-auto w-full">
    <h2 class="text-[24px] font-bold leading-[1.27] tracking-[-0.25px] text-black">
      Buat Aplikasi dari 1 Baris
    </h2>
    <p class="text-[13px] text-[#615d59] mt-1">
      Ketik ide... mis. <span class="font-medium text-[#31302e]">buatkan aplikasi kasir</span> — AI akan langsung paham dan generate
    </p>

    <div class="mt-4 flex gap-3 items-center">
      <NInput
        v-model:value="prompt"
        type="text"
        size="large"
        clearable
        :placeholder="'Ketik ide aplikasi... mis. buatkan aplikasi kasir'"
        class="flex-1"
        @keydown="onKeydown"
      >
        <template #prefix>
          <NIcon :component="Sparkles" />
        </template>
      </NInput>
      <NButton
        type="primary"
        size="large"
        :loading="loading"
        :disabled="prompt.trim().length < 3"
        class="!rounded-full"
        @click="handleGenerate"
      >
        <template #icon>
          <NIcon :component="ArrowRight" />
        </template>
        Buat Aplikasi
      </NButton>
    </div>
    <p class="text-[12px] text-[#a39e98] mt-2">
      Tekan Enter — AI akan langsung paham dan generate. Tidak perlu spec panjang.
    </p>
  </div>
</template>
