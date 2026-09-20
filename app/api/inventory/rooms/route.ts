import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { lookupId } from '@/lib/lookups'
import { randomUUID } from 'crypto'
import { requireSession, badRequest, forbidden, serverError } from '@/lib/api-auth'
import { checkReportAccess, checkRoomAccess } from '@/lib/inventory-auth'

export const dynamic = 'force-dynamic'

// ── POST: create or upsert a room ──────────────────────────────────────────
const upsertSchema = z.object({
  reportId:        z.string().uuid(),
  roomId:          z.string().uuid().optional(), // present = update
  roomName:        z.string().min(1).max(200),
  roomTypeCode:    z.string().max(50).optional(),
  conditionCode:   z.string().max(50).optional(),
  notes:           z.string().max(20000).optional(),
  sortOrder:       z.number().int().optional(),
})

export async function POST(req: Request) {
  const auth = await requireSession()
  if ('response' in auth) return auth.response
  const { session } = auth

  try {
    const body = await req.json()
    const data = upsertSchema.parse(body)

    const [roomTypeId, conditionId] = await Promise.all([
      data.roomTypeCode  ? lookupId('ref_room_types',       data.roomTypeCode).catch(() => null) : Promise.resolve(null),
      data.conditionCode ? lookupId('ref_condition_levels', data.conditionCode).catch(() => null) : Promise.resolve(null),
    ])

    const roomId = data.roomId ?? randomUUID()

    let admin
    try {
      admin = createAdminClient()
    } catch {
      return NextResponse.json({ success: true, roomId, dbSaved: false })
    }

    // The room must hang off a report the caller owns.
    const verdict = await checkReportAccess(admin, data.reportId, session)
    if (verdict === 'forbidden' || verdict === 'not-found') return forbidden()
    if (verdict === 'unavailable') {
      return NextResponse.json({ success: true, roomId, dbSaved: false })
    }
    // Updating an existing room: it must also belong to the caller.
    if (data.roomId) {
      const roomVerdict = await checkRoomAccess(admin, data.roomId, session)
      if (roomVerdict === 'forbidden') return forbidden()
    }

    let dbSaved = false
    const payload = {
      InventoryRoom_Id:   roomId,
      InventoryReport_id: data.reportId,
      room_name:          data.roomName,
      room_type_id:       roomTypeId,
      condition_id:       conditionId,
      clerk_notes:        data.notes ?? null,
      sort_order:         data.sortOrder ?? 0,
    }
    const { error } = await admin
      .from('inventory_rooms')
      .upsert(payload as never, { onConflict: 'InventoryRoom_Id' })
    if (!error) dbSaved = true
    else console.warn('[inventory.rooms] upsert error:', error.message)

    return NextResponse.json({ success: true, roomId, dbSaved })
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest()
    return serverError('inventory.rooms', err)
  }
}

// ── DELETE: remove a room ───────────────────────────────────────────────────
const deleteSchema = z.object({ roomId: z.string().uuid() })

export async function DELETE(req: Request) {
  const auth = await requireSession()
  if ('response' in auth) return auth.response
  const { session } = auth

  try {
    const body = await req.json()
    const { roomId } = deleteSchema.parse(body)

    let admin
    try {
      admin = createAdminClient()
    } catch {
      return NextResponse.json({ success: true, dbSaved: false })
    }

    const verdict = await checkRoomAccess(admin, roomId, session)
    if (verdict === 'forbidden' || verdict === 'not-found') return forbidden()
    if (verdict === 'unavailable') {
      return NextResponse.json({ success: true, dbSaved: false })
    }

    const { error } = await admin
      .from('inventory_rooms')
      .delete()
      .eq('InventoryRoom_Id', roomId)
    if (error) console.warn('[inventory.rooms DELETE] error:', error.message)

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest()
    return serverError('inventory.rooms DELETE', err)
  }
}
