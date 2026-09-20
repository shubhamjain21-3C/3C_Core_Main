// ── Persistent customer profile helpers — Supabase-backed ───────────────────
// Wraps the `public.users` reads/writes our auth flow needs. The trigger
// `handle_new_user` (migration 020) creates a stub row when Supabase Auth
// creates an auth.users entry (i.e. on signInWithOtp). We then UPDATE that
// row with the form fields collected during registration.

import { createAdminClient } from '@/lib/supabase'
import { normaliseEmail } from '@/lib/normalise-email'

export interface CustomerProfileWrite {
  email:      string
  firstName:  string
  middleName?: string | null
  lastName:   string
  phone?:     string | null
  company?:   string | null
  passwordHash: string
  portalRoleCode?: 'property_manager' | 'landlord' | 'tenant' | 'student'
}

export interface CustomerProfileRow {
  User_id:        string
  Email:          string
  FirstName:      string
  MiddleName:     string | null
  Lastname:       string
  Phone:          string | null
  Company:        string | null
  password_hash:  string | null
  portal_role_id: number | null
  created_at:     string
}

/** Resolve a ref_portal_roles code to id, returns null if not found. */
async function portalRoleIdFromCode(code: string | undefined) {
  if (!code) return null
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('ref_portal_roles')
      .select('id')
      .eq('code', code)
      .maybeSingle() as { data: { id: number } | null }
    return data?.id ?? null
  } catch {
    return null
  }
}

/**
 * Upserts the full customer profile onto `public.users` after OTP
 * verification. Best-effort — logs and resolves false on failure so the
 * register flow doesn't break (the in-memory store is still updated as
 * a fallback for the seeded demo accounts).
 */
export async function writeCustomerProfile(input: CustomerProfileWrite): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const portal_role_id = await portalRoleIdFromCode(input.portalRoleCode)

    // The Supabase trigger created the auth.users row + public.users row
    // when signInWithOtp ran. Update the row by Email (case-insensitive).
    const { error } = await admin
      .from('users')
      .update({
        FirstName:     input.firstName,
        MiddleName:    input.middleName ?? null,
        Lastname:      input.lastName,
        Phone:         input.phone ?? null,
        Company:       input.company ?? null,
        password_hash: input.passwordHash,
        portal_role_id,
      } as never)
      .eq('Email', normaliseEmail(input.email))

    if (error) {
      console.warn('[users-db.writeCustomerProfile] update failed:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[users-db.writeCustomerProfile] threw:', err)
    return false
  }
}

/** Look up a customer's stored credentials + portal role by email. */
export async function findCustomerByEmail(email: string): Promise<CustomerProfileRow | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('users')
      .select('User_id, Email, FirstName, MiddleName, Lastname, Phone, Company, password_hash, portal_role_id, created_at')
      .eq('Email', normaliseEmail(email))
      .limit(1)
      .maybeSingle() as { data: CustomerProfileRow | null, error: { message: string } | null }
    if (error) {
      console.warn('[users-db.findCustomerByEmail] query failed:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('[users-db.findCustomerByEmail] threw:', err)
    return null
  }
}

/** Update only the password hash for a customer (used by forgot-password). */
export async function updateCustomerPassword(email: string, passwordHash: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('users')
      .update({ password_hash: passwordHash } as never)
      .eq('Email', normaliseEmail(email))
    if (error) {
      console.warn('[users-db.updateCustomerPassword] update failed:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[users-db.updateCustomerPassword] threw:', err)
    return false
  }
}

/** Map a portal_role_id back to a code — used to populate NextAuth session. */
export async function portalRoleCodeFromId(id: number | null | undefined): Promise<string | null> {
  if (!id) return null
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('ref_portal_roles')
      .select('code')
      .eq('id', id)
      .maybeSingle() as { data: { code: string } | null }
    return data?.code ?? null
  } catch {
    return null
  }
}
