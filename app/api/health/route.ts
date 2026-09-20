import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Unauthenticated liveness probe.
 *
 * Deliberately returns no error detail: it says whether the database answered,
 * never why it did not. Always HTTP 200 so uptime checks distinguish "the app
 * is up but the DB is down" from "the app is down".
 */
export async function GET() {
  let db: 'ok' | 'unavailable' = 'unavailable'

  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('ref_portal_roles')
      .select('id')
      .limit(1)
    if (!error) db = 'ok'
    else console.warn('[health] db check failed:', error.message)
  } catch (err) {
    console.warn('[health] db unreachable:', err)
  }

  return NextResponse.json(
    {
      status: 'ok',
      db,
      region: process.env.VERCEL_REGION ?? null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
