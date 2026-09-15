// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  srcDir: 'app',
  serverDir: 'server',
  typescript: { strict: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: []
  },
  nitro: {
    experimental: { openAPI: true }
  },
  app: {
    head: {
      title: 'AI App Builder — Minimal Prompt → Maximal App',
      meta: [{ name: 'description', content: 'Ketik sedikit, jadi aplikasi. AI App Builder platform.' }],
      link: [{ rel: 'icon', href: '/favicon.svg' }]
    }
  }
})
