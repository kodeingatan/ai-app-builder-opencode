// Kompresi gambar sisi klien (canvas) — upload/paste >5MB otomatis
// dikecilkan agar langsung bisa dipakai (base64 yang compatible).

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("read"))
    reader.readAsDataURL(file)
  })
}

function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] || ""
  return Math.round((base64.length * 3) / 4)
}

async function decodeImage(file: File): Promise<{ el: CanvasImageSource; w: number; h: number }> {
  // Jalur utama: createImageBitmap (hormati orientasi EXIF)
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions)
    return { el: bmp, w: bmp.width, h: bmp.height }
  } catch {
    // Fallback: <img> + object URL
    const url = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error("decode"))
        el.src = url
      })
      return { el: img, w: img.naturalWidth, h: img.naturalHeight }
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    }
  }
}

function renderCompressed(
  src: CanvasImageSource,
  sw: number,
  sh: number,
  maxDim: number,
  quality: number,
): { dataUrl: string; w: number; h: number } {
  const scale = Math.min(1, maxDim / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * scale))
  const h = Math.max(1, Math.round(sh * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no ctx")
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(src, 0, 0, w, h)
  return { dataUrl: canvas.toDataURL("image/jpeg", quality), w, h }
}

export async function compressImageFile(
  file: File,
  opts?: { maxBytes?: number },
): Promise<{ dataUrl: string; bytes: number; compressed: boolean; w: number; h: number }> {
  const maxBytes = opts?.maxBytes ?? IMAGE_MAX_BYTES

  // Cukup kecil → langsung base64 tanpa proses
  if (file.size <= maxBytes) {
    const dataUrl = await fileToDataUrl(file)
    return { dataUrl, bytes: dataUrlBytes(dataUrl), compressed: false, w: 0, h: 0 }
  }

  // Kebesaran → decode lalu turunkan bertahap sampai muat / mentok usaha
  const { el, w: sw, h: sh } = await decodeImage(file)
  const attempts = [
    { maxDim: 1920, quality: 0.82 },
    { maxDim: 1600, quality: 0.72 },
    { maxDim: 1280, quality: 0.62 },
  ]
  let last = renderCompressed(el, sw, sh, attempts[0].maxDim, attempts[0].quality)
  for (const a of attempts) {
    last = renderCompressed(el, sw, sh, a.maxDim, a.quality)
    if (dataUrlBytes(last.dataUrl) <= maxBytes) break
  }
  if ("close" in el && typeof (el as ImageBitmap).close === "function") (el as ImageBitmap).close()
  return { dataUrl: last.dataUrl, bytes: dataUrlBytes(last.dataUrl), compressed: true, w: last.w, h: last.h }
}
