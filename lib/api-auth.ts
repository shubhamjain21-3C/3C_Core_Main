import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Session helpers for API routes.
 *
 * middleware.ts only protects /portal/* pages, so every API route that reads or
 * writes customer data, touches storage, or calls a paid API must call one of
 * these itself — before creating a service-role Supabase client.
 *
 * Usage:
 *   const auth = await requireSession()
 *   if ('response' in auth) return auth.response
 *   const { session } = auth
 */

export type AuthResult =
  | { session: Session }
  | { response: NextResponse }

const UNAUTHORISED = { error: 'Authentication required.' }
const FORBIDDEN    = { error: 'You do not have access to this resource.' }

/** Returns the signed-in session, or a 401 response to hand straight back. */
export async function requireSession(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { response: NextResponse.json(UNAUTHORISED, { status: 401 }) }
  }
  return { session }
}

/** Returns the signed-in admin session, or a 401/403 response. */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireSession()
  if ('response' in auth) return auth
  if (auth.session.user.role !== 'admin') {
    return { response: NextResponse.json(FORBIDDEN, { status: 403 }) }
  }
  return auth
}

export function isAdmin(session: Session): boolean {
  return session.user.role === 'admin'
}

/** 403 for a record that exists but belongs to someone else. */
export function forbidden(): NextResponse {
  return NextResponse.json(FORBIDDEN, { status: 403 })
}

/** Generic 400 — never echo Zod or provider detail to the browser. */
export function badRequest(message = 'Invalid request.'): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

/** Generic 500 — log the real error server-side, return nothing useful. */
export function serverError(context: string, err: unknown): NextResponse {
  console.error(`[${context}]`, err)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Session user ids are Supabase UUIDs for registered customers, but plain
 * strings ('admin', demo ids) otherwise. Only the UUID form can be written to
 * a uuid column.
 */
export function sessionUserUuid(session: Session): string | null {
  const id = session.user?.id
  return id && UUID_RE.test(id) ? id : null
}
