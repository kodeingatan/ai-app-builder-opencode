"use client"

export function useAiBuilder() {
  async function apiFetch(url: string, opts: RequestInit = {}) {
    const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } })
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || 'Request failed')
    }
    return res.json()
  }

  function generate(prompt: string) {
    return apiFetch('/api/builder/generate', { method: 'POST', body: JSON.stringify({ prompt }) })
  }
  function refine(slug: string, prompt: string) {
    return apiFetch('/api/builder/refine', { method: 'POST', body: JSON.stringify({ slug, prompt }) })
  }
  function listProjects(query: Record<string, any> = {}) {
    const qs = new URLSearchParams(query).toString()
    return apiFetch(`/api/builder/projects${qs ? '?' + qs : ''}`)
  }
  function getProject(slug: string) {
    return apiFetch(`/api/builder/projects/${slug}`)
  }
  function preview(slug: string) {
    return apiFetch(`/api/builder/preview/${slug}`, { method: 'POST' })
  }
  function templates() {
    return apiFetch('/api/builder/templates')
  }

  return { generate, refine, listProjects, getProject, preview, templates }
}
