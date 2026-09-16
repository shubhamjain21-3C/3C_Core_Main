import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { lookupId } from '@/lib/lookups'
import { randomUUID } from 'crypto'
import { requireSession, badRequest, forbidden, serverError } from '@/lib/api-auth'
import { checkItemAccess, checkRoomAccess } from '@/lib/inventory-auth'

export const dynamic = 'force-dynamic'

// ── POST: create or upsert an item under a room ─────────────────────────────
const upsertSchema = z.object({
  itemId:         z.string().uuid().optional(),
  roomId:         z.string().uuid(),
  itemTypeCode:   z.string().max(50).optional(),
  itemLabel:      z.string().max(200).optional(),
  quantity:       z.number().int().min(1).max(999).default(1),
  conditionCode:  z.string().max(50).optional(),
  notes:          z.string().max(20000).optional(),
  sortOrder:      z.number().int().optional(),
})

export async function POST(req: Request) {
  const auth = await requireSession()
  if ('response' in auth) return auth.response
  const { session } = auth

  try {
    const body = await req.json()
    const data = upsertSchema.parse(body)

    const [itemTypeId, conditionId] = await Promise.all([
      data.itemTypeCode  ? lookupId('ref_item_types',       data.itemTypeCode).catch(() => null) : Promise.resolve(null),
      data.conditionCode ? lookupId('ref_condition_levels', data.conditionCode).catch(() => null) : Promise.resolve(null),
    ])

    const itemId = data.itemId ?? randomUUID()

    let admin
    try {
      admin = createAdminClient()
    } catch {
      return NextResponse.json({ success: true, itemId, dbSaved: false })
    }

    const verdict = await checkRoomAccess(admin, data.roomId, session)
    if (verdict === 'forbidden' || verdict === 'not-found') return forbidden()
    if (verdict === 'unavailable') {
      return NextResponse.json({ success: true, itemId, dbSaved: false })
    }
    if (data.itemId) {
      const itemVerdict = await checkItemAccess(admin, data.itemId, session)
      if (itemVerdict === 'forbidden') return forbidden()
    }

    let dbSaved = false
    const payload = {
      InventoryItem_id: itemId,
      room_id:          data.roomId,
      item_type_id:     itemTypeId,
      item_label:       data.itemLabel ?? null,
      quantity:         data.quantity,
      condition_id:     conditionId,
      clerk_notes:      data.notes ?? null,
      sort_order:       data.sortOrder ?? 0,
    }
    const { error } = await admin
      .from('inventory_items')
      .upsert(payload as never, { onConflict: 'InventoryItem_id' })
    if (!error) dbSaved = true
    else console.warn('[inventory.items] upsert error:', error.message)

    return NextResponse.json({ success: true, itemId, dbSaved })
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest()
    return serverError('inventory.items', err)
  }
}

const deleteSchema = z.object({ itemId: z.string().uuid() })

export async function DELETE(req: Request) {
  const auth = await requireSession()
  if ('response' in auth) return auth.response
  const { session } = auth

  try {
    const body = await req.json()
    const { itemId } = deleteSchema.parse(body)

    let admin
    try {
      admin = createAdminClient()
    } catch {
      return NextResponse.json({ success: true, dbSaved: false })
    }

    const verdict = await checkItemAccess(admin, itemId, session)
    if (verdict === 'forbidden' || verdict === 'not-found') return forbidden()
    if (verdict === 'unavailable') {
      return NextResponse.json({ success: true, dbSaved: false })
    }

    const { error } = await admin
      .from('inventory_items')
      .delete()
      .eq('InventoryItem_id', itemId)
    if (error) console.warn('[inventory.items DELETE] error:', error.message)

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest()
    return serverError('inventory.items DELETE', err)
  }
}
