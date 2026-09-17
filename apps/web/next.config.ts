import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // TypeORM + better-sqlite3 needs node externals
  serverExternalPackages: ['better-sqlite3', 'bcrypt'],
  experimental: {
    // Allow Server Actions + instrumentation
  },
  eslint: {
    // Let build pass with warnings (fix via next lint in CI)
  }
}

export default nextConfig
