import { findUserByEmail } from '@/lib/store'
import { createAdminClient } from '@/lib/supabase'
import { normaliseEmail } from '@/lib/normalise-email'

// ── Email existence checks ──────────────────────────────────────────────────
// Two flavours:
//
//   emailExists()        — broad "have we ever seen this email?" — true even
//                          if Supabase has only the trigger-created stub row.
//                          Used by forgot-password to decide whether to send.
//
//   isFullyRegistered()  — strict "did the user finish the registration form?"
//                          — true only when public.users has password_hash
//                          OR Lastname populated (post-form-submit fields).
//                          Used by register flow so it doesn't reject itself
//                          after its own signInWithOtp creates the stub row.
//
// In-memory `lib/store` is checked first to catch the demo/seeded accounts
// (Shubham/Irfan/Adamya × roles) that never went through Supabase Auth.

interface UsersRow {
  Email:         string
  password_hash: string | null
  Lastname:      string | null
}

async function fetchPublicUsersRow(email: string): Promise<UsersRow | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('users')
      .select('Email, password_hash, Lastname')
      .eq('Email', normaliseEmail(email))
      .limit(1)
      .maybeSingle() as { data: UsersRow | null, error: { message: string } | null }
    if (error) {
      console.warn('[email-exists] Supabase check failed:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('[email-exists] Supabase admin unavailable:', err)
    return null
  }
}

/** Returns true if ANY trace of this email exists (in-memory or Supabase). */
export async function emailExists(email: string): Promise<boolean> {
  if (!email) return false
  if (findUserByEmail(email)) return true
  const row = await fetchPublicUsersRow(email)
  return !!row
}

/**
 * Returns true only if the email belongs to a customer who has completed
 * the registration form (their Lastname or password_hash is populated).
 * A user mid-registration — for whom Supabase has only auto-created a stub
 * row with an empty Lastname / null password_hash via the
 * handle_new_user trigger — will return FALSE so they can finish signup.
 */
export async function isFullyRegistered(email: string): Promise<boolean> {
  if (!email) return false
  if (findUserByEmail(email)) return true
  const row = await fetchPublicUsersRow(email)
  if (!row) return false
  return !!(row.password_hash && row.password_hash.length > 0)
    || !!(row.Lastname && row.Lastname.trim().length > 0)
}
