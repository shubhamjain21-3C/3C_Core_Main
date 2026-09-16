import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const VALID_TABLES = new Set([
  'ref_portal_roles','ref_property_types','ref_property_status',
  'ref_tenancy_status','ref_furnished_types','ref_letting_status',
  'ref_report_types','ref_report_status','ref_condition_levels',
  'ref_room_types','ref_item_types','ref_entity_types',
  'ref_media_types','ref_service_types','ref_service_status','ref_chat_roles',
  'ref_maintenance_types',
])

export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get('table') ?? ''

  if (!VALID_TABLES.has(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (err) {
    console.error('[lookups] Supabase not configured:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  const { data, error } = await admin
    .from(table as never)
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    console.error('[lookups] query failed:', error.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  })
}
