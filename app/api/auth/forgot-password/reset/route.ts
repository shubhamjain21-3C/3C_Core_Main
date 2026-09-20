import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hashPassword, updateUserPasswordByEmail } from '@/lib/store'
import { getSupabaseClient } from '@/lib/supabase'
import { isFullyRegistered } from '@/lib/email-exists'
import { updateCustomerPassword } from '@/lib/users-db'
import { normaliseEmail } from '@/lib/normalise-email'

export const dynamic = 'force-dynamic'

// Step 2 of forgot-password: verify the OTP code via Supabase and set the
// new password on the user (both in-memory store and Supabase public.users
// so the change survives serverless cold starts).

const schema = z.object({
  email:       z.string().email().transform(normaliseEmail),
  otpCode:     z.string().length(6, 'Verification code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, otpCode, newPassword } = schema.parse(body)

    let supabase
    try {
      supabase = getSupabaseClient()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Email verification is not configured.' },
        { status: 500 },
      )
    }

    // Supabase v2 picks a different OTP `type` depending on the user's
    // state (confirmed vs unconfirmed, magic link vs OTP). Try the
    // common email types in order.
    type EmailOtpType = 'email' | 'signup' | 'magiclink' | 'recovery'
    const types: EmailOtpType[] = ['email', 'recovery', 'magiclink', 'signup']
    let verifyError: { message: string } | null = null
    for (const type of types) {
      const res = await supabase.auth.verifyOtp({ email, token: otpCode, type })
      if (!res.error) { verifyError = null; break }
      if (!verifyError) verifyError = res.error
    }

    if (verifyError) {
      const msg = verifyError.message.toLowerCase()
      const friendly =
        msg.includes('expired') ? 'Your verification code has expired. Please request a new one.'
        : msg.includes('invalid') || msg.includes('mismatch') ? 'Incorrect verification code. Please try again.'
        : verifyError.message || 'Verification failed. Please try again.'
      return NextResponse.json({ success: false, message: friendly }, { status: 400 })
    }

    // Discard the Supabase session — we don't use it for portal sessions
    try { await supabase.auth.signOut() } catch { /* ignore */ }

    // Only update if the email belongs to a fully-registered account.
    // We already proved inbox ownership via the OTP — but we still shouldn't
    // create accounts here.
    const hasAccount = await isFullyRegistered(email)
    if (!hasAccount) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists for this email, the password has been updated.',
      })
    }

    const newHash = await hashPassword(newPassword)

    // Persistent — update Supabase public.users.password_hash
    const dbOk = await updateCustomerPassword(email, newHash)
    // In-memory — covers the seeded demo accounts in the same Vercel instance
    updateUserPasswordByEmail(email, newHash)

    if (!dbOk) {
      // We updated the in-memory copy but failed to persist — return a soft
      // success so the user can sign in immediately on this instance, but
      // log the issue.
      console.warn('[forgot-password.reset] password update did not persist to Supabase')
    }

    return NextResponse.json({ success: true, persisted: dbOk })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: err.errors[0]?.message ?? 'Invalid request.' },
        { status: 400 },
      )
    }
    console.error('[forgot-password.reset] error:', err)
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 })
  }
}
