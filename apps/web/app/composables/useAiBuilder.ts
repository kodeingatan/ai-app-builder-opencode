export function useAiBuilder() {
  const api = useApi()

  async function generate(prompt: string) {
    const { data } = await api.post('/api/builder/generate', { prompt })
    return data
  }

  async function refine(slug: string, prompt: string) {
    const { data } = await api.post('/api/builder/refine', { slug, prompt })
    return data
  }

  async function listProjects(query: any = {}) {
    const { data } = await api.get('/api/builder/projects', { params: query })
    return data
  }

  async function getProject(slug: string) {
    const { data } = await api.get(`/api/builder/projects/${slug}`)
    return data
  }

  async function preview(slug: string) {
    const { data } = await api.post(`/api/builder/preview/${slug}`)
    return data
  }

  async function templates() {
    const { data } = await api.get('/api/builder/templates')
    return data
  }

  return { generate, refine, listProjects, getProject, preview, templates }
}
