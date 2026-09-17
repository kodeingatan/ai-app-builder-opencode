"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, ArrowRight } from 'lucide-react'

export function AiPromptBar({ onGenerate }: { onGenerate: (prompt: string) => void }) {
  const [prompt, setPrompt] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  function handleGenerate() {
    if (!prompt.trim() || prompt.trim().length < 3) return
    setLoading(true)
    onGenerate(prompt.trim())
    setTimeout(() => setLoading(false), 3000)
  }

  return (
    <Card className="max-w-[720px] mx-auto w-full p-6 rounded-[16px] border-[#e6e6e6] shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
      <h2 className="text-[24px] font-bold leading-[1.27] tracking-[-0.25px]">Buat Aplikasi dari 1 Baris</h2>
      <p className="text-[13px] text-[#615d59] mt-1">
        Ketik ide... mis. <span className="font-medium text-[#31302e]">buatkan aplikasi kasir</span> — AI akan langsung paham
      </p>
      <div className="mt-4 flex gap-3 items-center">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ketik ide aplikasi... mis. buatkan aplikasi kasir"
            className="pl-9 h-11"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleGenerate()
              }
            }}
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={prompt.trim().length < 3 || loading}
          className="rounded-full bg-[#0075de] hover:bg-[#0069c4] h-11 px-6"
        >
          {loading ? 'Memproses...' : 'Buat Aplikasi'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[12px] text-[#a39e98] mt-2">Tekan Enter — AI akan langsung paham dan generate. Tidak perlu spec panjang.</p>
    </Card>
  )
}
