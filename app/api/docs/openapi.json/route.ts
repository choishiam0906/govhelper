import { NextResponse } from 'next/server'
import { openApiSpec } from '@/lib/openapi/spec'

/**
 * OpenAPI 3.0.3 JSON 스펙 제공
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  })
}
