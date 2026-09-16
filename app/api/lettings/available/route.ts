import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export interface AvailableListing {
  letting_id:         string
  property_id:        string
  address_line1:      string
  address_line2:      string | null
  city:               string
  postcode:           string
  bedrooms:           number
  bathrooms:          number
  asking_rent:        number | null
  available_from:     string | null
  description:        string | null
  min_tenancy_months: number | null
  property_type:      string | null
  furnished:          string | null
}

interface LettingRow {
  Letting_Id: string
  property_id: string
  asking_rent: number | null
  available_from: string | null
  description: string | null
  min_tenancy_months: number | null
  furnished_id: number | null
  properties: {
    Property_Id: string
    address_line1: string
    address_line2: string | null
    city: string
    postcode: string
    bedrooms: number
    bathrooms: number
    property_type_id: number | null
    ref_property_types: { label: string } | null
  } | null
  ref_furnished_types: { label: string } | null
}

export async function GET() {
  try {
    const admin = createAdminClient()

    // letting_status code "available" = visible to renters; everything else hidden.
    const { data: statusRow } = await admin
      .from('ref_letting_status')
      .select('id')
      .eq('code', 'available')
      .maybeSingle() as { data: { id: number } | null }

    let query = admin
      .from('property_lettings')
      .select(`
        Letting_Id,
        property_id,
        asking_rent,
        available_from,
        description,
        min_tenancy_months,
        furnished_id,
        properties (
          Property_Id, address_line1, address_line2, city, postcode, bedrooms, bathrooms, property_type_id,
          ref_property_types ( label )
        ),
        ref_furnished_types ( label )
      `)
      .order('created_at', { ascending: false })
      .limit(60)

    if (statusRow?.id) query = query.eq('status_id', statusRow.id)

    const { data, error } = await query
    if (error) {
      console.warn('[lettings] Supabase error:', error.message)
      return NextResponse.json({ listings: [], source: 'unavailable' })
    }

    const rows = (data ?? []) as unknown as LettingRow[]
    const listings: AvailableListing[] = rows
      .filter(r => r.properties)
      .map(r => ({
        letting_id:         r.Letting_Id,
        property_id:        r.property_id,
        address_line1:      r.properties!.address_line1,
        address_line2:      r.properties!.address_line2,
        city:               r.properties!.city,
        postcode:           r.properties!.postcode,
        bedrooms:           r.properties!.bedrooms,
        bathrooms:          r.properties!.bathrooms,
        asking_rent:        r.asking_rent,
        available_from:     r.available_from,
        description:        r.description,
        min_tenancy_months: r.min_tenancy_months,
        property_type:      r.properties!.ref_property_types?.label ?? null,
        furnished:          r.ref_furnished_types?.label ?? null,
      }))

    return NextResponse.json({ listings, source: 'db' })
  } catch (err) {
    console.warn('[lettings] Listings unavailable:', err)
    return NextResponse.json({ listings: [], source: 'unavailable' })
  }
}
