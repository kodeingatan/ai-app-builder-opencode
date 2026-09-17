// Next.js instrumentation hook — runs on server boot
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getDataSource } = await import('@/lib/db/data-source')
    const { seedDatabase } = await import('@/lib/db/seed')
    try {
      await getDataSource()
      await seedDatabase()
    } catch (e) {
      console.error('[instrumentation] DB init failed', e)
    }
  }
}
