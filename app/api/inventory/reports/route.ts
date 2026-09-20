import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { lookupId } from '@/lib/lookups'
import { randomUUID } from 'crypto'
import { requireSession, sessionUserUuid, badRequest, forbidden, serverError } from '@/lib/api-auth'
import { checkReportAccess } from '@/lib/inventory-auth'

export const dynamic = 'force-dynamic'

// ── POST: create a new draft report ─────────────────────────────────────────
//
// Requires a session: this writes a customer record with the service-role key.
// Guests use the DIY wizard entirely in the browser and never reach this route.

const createSchema = z.object({
  reportTypeCode: z.string().min(1),         // ref_report_types.code
  propertyId:     z.string().uuid().optional(),
  inspectionDate: z.string().min(1),
  inspectorName:  z.string().min(1).max(200),
  // Optional address fields when the user is capturing a new property
  addressLine1:   z.string().max(200).optional(),
  addressLine2:   z.string().max(200).optional(),
  city:           z.string().max(100).optional(),
  postcode:       z.string().max(20).optional(),
})

export async function POST(req: Request) {
  const auth = await requireSession()
  if ('response' in auth) return auth.response
  const { session } = auth

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // Resolve lookup ids
    let reportTypeId: number | null = null
    let statusId:     number | null = null
    try {
      reportTypeId = await lookupId('ref_report_types',  data.reportTypeCode)
      statusId     = await lookupId('ref_report_status', 'draft')
    } catch { /* tolerate offline */ }

    let reportId: string = randomUUID()
    let dbSaved  = false
    let warning: string | null = null

    try {
      const admin = createAdminClient()
      const payload = {
        property_id:        data.propertyId ?? null,
        report_type_id:     reportTypeId,
        // Ownership: only set when the session id is a real Supabase uuid.
        User_Id:            sessionUserUuid(session),
        status_id:          statusId,
        ai_generated:       false,
        clerk_notes:        data.inspectorName
          ? `Inspector: ${data.inspectorName}`
          : null,
      }
      // Supabase JS strict-types don't always pick this row shape up cleanly
      // for tables with case-sensitive PostgreSQL columns; cast to never.
      const { data: row, error } = await admin
        .from('inventory_reports')
        .insert(payload as never)
        .select('"InventoryReport_id"')
        .single()

      if (error) {
        console.warn('[inventory.reports] insert failed:', error.message)
        warning = 'Report not persisted to database — continuing offline.'
      } else if (row) {
        reportId = (row as { InventoryReport_id: string }).InventoryReport_id
        dbSaved = true
      }
    } catch (err) {
      console.warn('[inventory.reports] Supabase unavailable:', err)
      warning = 'Report not persisted to database — continuing offline.'
    }

    return NextResponse.json({ success: true, reportId, dbSaved, warning })
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest()
    return serverError('inventory.reports', err)
  }
}

// ── PATCH: autosave draft / update fields ───────────────────────────────────
const patchSchema = z.object({
  reportId:   z.string().uuid(),
  statusCode: z.string().max(50).optional(),   // e.g. 'pending_review'
  aiSummary:  z.string().max(20000).optional(),
  pdfUrl:     z.string().max(2000).optional(),
  notes:      z.string().max(20000).optional(),
})

export async function PATCH(req: Request) {
  const auth = await requireSession()
  if ('response' in auth) return auth.response
  const { session } = auth

  try {
    const body = await req.json()
    const data = patchSchema.parse(body)

    const update: Record<string, unknown> = {}
    if (data.aiSummary !== undefined) update.ai_summary = data.aiSummary
    if (data.pdfUrl    !== undefined) update.pdf_url    = data.pdfUrl
    if (data.notes     !== undefined) update.clerk_notes = data.notes
    if (data.statusCode) {
      const statusId = await lookupId('ref_report_status', data.statusCode).catch(() => null)
      if (statusId) update.status_id = statusId
    }

    let admin
    try {
      admin = createAdminClient()
    } catch {
      return NextResponse.json({ success: true, dbSaved: false, warning: 'Persistence skipped' })
    }

    const verdict = await checkReportAccess(admin, data.reportId, session)
    if (verdict === 'forbidden' || verdict === 'not-found') return forbidden()
    if (verdict === 'unavailable') {
      return NextResponse.json({ success: true, dbSaved: false, warning: 'Persistence skipped' })
    }

    const { error } = await admin
      .from('inventory_reports')
      .update(update as never)
      .eq('InventoryReport_id', data.reportId)
    if (error) {
      console.warn('[inventory.reports PATCH] update error:', error.message)
      return NextResponse.json({ success: false, dbSaved: false })
    }
    return NextResponse.json({ success: true, dbSaved: true })
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest()
    return serverError('inventory.reports PATCH', err)
  }
}
