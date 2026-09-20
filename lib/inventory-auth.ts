import type { Session } from 'next-auth'
import { createAdminClient } from '@/lib/supabase'
import { isAdmin, sessionUserUuid } from '@/lib/api-auth'

/**
 * Ownership checks for inventory records.
 *
 * Chain: inventory_items.room_id → inventory_rooms."InventoryReport_id"
 *        → inventory_reports."User_Id".
 *
 * Callers must already have a session (see requireSession). These helpers only
 * answer "does this record belong to the caller?".
 *
 * Reports created before ownership was recorded have a null "User_Id" and are
 * therefore owned by nobody: only an admin can touch them.
 */

type AdminClient = ReturnType<typeof createAdminClient>

export type OwnershipVerdict = 'owned' | 'forbidden' | 'not-found' | 'unavailable'

/** Resolve the owner uuid of a report, or a failure reason. */
async function reportOwner(
  admin: AdminClient,
  reportId: string,
): Promise<{ owner: string | null } | { fail: Exclude<OwnershipVerdict, 'owned'> }> {
  try {
    const { data, error } = await admin
      .from('inventory_reports')
      .select('"User_Id"')
      .eq('InventoryReport_id', reportId)
      .maybeSingle() as { data: { User_Id: string | null } | null; error: unknown }

    if (error) {
      console.warn('[inventory-auth] report lookup error')
      return { fail: 'unavailable' }
    }
    if (!data) return { fail: 'not-found' }
    return { owner: data.User_Id }
  } catch (err) {
    console.warn('[inventory-auth] report lookup threw:', err)
    return { fail: 'unavailable' }
  }
}

export async function checkReportAccess(
  admin: AdminClient,
  reportId: string,
  session: Session,
): Promise<OwnershipVerdict> {
  if (isAdmin(session)) return 'owned'
  const result = await reportOwner(admin, reportId)
  if ('fail' in result) return result.fail
  const uuid = sessionUserUuid(session)
  if (!uuid || !result.owner || result.owner !== uuid) return 'forbidden'
  return 'owned'
}

export async function checkRoomAccess(
  admin: AdminClient,
  roomId: string,
  session: Session,
): Promise<OwnershipVerdict> {
  if (isAdmin(session)) return 'owned'
  try {
    const { data, error } = await admin
      .from('inventory_rooms')
      .select('"InventoryReport_id"')
      .eq('InventoryRoom_Id', roomId)
      .maybeSingle() as { data: { InventoryReport_id: string } | null; error: unknown }

    if (error) return 'unavailable'
    if (!data) return 'not-found'
    return checkReportAccess(admin, data.InventoryReport_id, session)
  } catch (err) {
    console.warn('[inventory-auth] room lookup threw:', err)
    return 'unavailable'
  }
}

export async function checkItemAccess(
  admin: AdminClient,
  itemId: string,
  session: Session,
): Promise<OwnershipVerdict> {
  if (isAdmin(session)) return 'owned'
  try {
    const { data, error } = await admin
      .from('inventory_items')
      .select('room_id')
      .eq('InventoryItem_id', itemId)
      .maybeSingle() as { data: { room_id: string } | null; error: unknown }

    if (error) return 'unavailable'
    if (!data) return 'not-found'
    return checkRoomAccess(admin, data.room_id, session)
  } catch (err) {
    console.warn('[inventory-auth] item lookup threw:', err)
    return 'unavailable'
  }
}

/**
 * Storage paths are `<reportId>/<roomId|itemId>/<filename>`. A caller may only
 * delete media under a report they own.
 */
export function reportIdFromStoragePath(path: string): string | null {
  const first = path.split('/')[0]
  return first && first.length > 0 ? first : null
}
