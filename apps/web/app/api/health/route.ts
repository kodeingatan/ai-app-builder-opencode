import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'healthy', db: 'healthy', storage: 'healthy', version: '1.0.0' })
}
