import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createUser, hashPassword } from '@/lib/store'
import { getSupabaseClient } from '@/lib/supabase'
import { isFullyRegistered } from '@/lib/email-exists'
import { writeCustomerProfile } from '@/lib/users-db'
import { normaliseEmail } from '@/lib/normalise-email'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  firstName:  z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName:   z.string().min(1, 'Last name is required'),
  dob:        z.string().min(1, 'Date of birth is required'),
  email:      z.string().email('Invalid email address').transform(normaliseEmail),
  phone:      z.string().optional(),
  company:    z.string().optional(),
  password:   z.string().min(8, 'Password must be at least 8 characters'),
  portalRole: z.enum(['property_manager', 'landlord', 'tenant', 'student']).optional(),
  otpCode:    z.string().length(6, 'Verification code must be 6 digits'),
  otpMethod:  z.enum(['email', 'phone']),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // ── Verify OTP via Supabase Auth ──────────────────────────────────────────
    let supabase
    try {
      supabase = getSupabaseClient()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Verification service is not configured. Please contact support.' },
        { status: 500 },
      )
    }

    // Supabase v2 uses different `type` values depending on the user's
    // confirmation state:
    //   - 'email' for already-confirmed users
    //   - 'signup' for first-time email confirmation
    //   - 'magiclink' for OTPs generated alongside a magic link
    // Our flow can hit any of these (especially if a prior attempt
    // auto-confirmed the email via a clicked magic link). Try them in
    // order and return the first success. The error message we surface
    // is the FIRST attempt's, because that's the one that most clearly
    // reflects the real cause when none succeed.
    type EmailOtpType = 'email' | 'signup' | 'magiclink'
    const emailOtpTypes: EmailOtpType[] = ['email', 'signup', 'magiclink']
    const attempts: { type: EmailOtpType; msg: string }[] = []

    let verifyError: { message: string; code?: string; status?: number; name?: string } | null = null

    if (data.otpMethod === 'email') {
      for (const type of emailOtpTypes) {
        const res = await supabase.auth.verifyOtp({
          email: data.email,
          token: data.otpCode,
          type,
        })
        if (!res.error) { verifyError = null; break }
        attempts.push({ type, msg: res.error.message })
        if (!verifyError) verifyError = res.error
      }
    } else {
      const res = await supabase.auth.verifyOtp({
        phone: data.phone ?? '',
        token: data.otpCode,
        type:  'sms',
      })
      verifyError = res.error
    }

    if (verifyError) {
      console.error('[register] verifyOtp failed across all types:', { email: data.email, method: data.otpMethod, attempts })
      // Real Supabase message stays in the server log only.
      const msg = verifyError.message.toLowerCase()
      const friendly =
        msg.includes('expired')                          ? 'Your verification code has expired. Please request a new one.'
        : msg.includes('invalid') || msg.includes('mismatch') ? 'Incorrect verification code. Please try again.'
        : msg.includes('rate')                           ? 'Too many attempts. Please wait a minute and try again.'
        : verifyError.message
                        ? `Verification failed: ${verifyError.message}`
                        : 'Verification failed. Please try again.'
      return NextResponse.json(
        { success: false, message: friendly },
        { status: 400 },
      )
    }

    // ── Sign out the Supabase session — we use NextAuth for portal sessions ───
    try {
      await supabase.auth.signOut()
    } catch {
      /* ignore — we just don't want the Supabase session sticking around */
    }

    // Use the STRICT check — we don't want to reject the user against the
    // stub row that our own signInWithOtp just created via the
    // handle_new_user trigger. Only block when a previous registration
    // actually wrote a password_hash or Lastname onto public.users.
    if (await isFullyRegistered(data.email)) {
      return NextResponse.json(
        {
          success: false,
          code:    'EMAIL_EXISTS',
          message: 'An account with this email already exists. Please sign in or reset your password.',
        },
        { status: 409 },
      )
    }

    const fullName     = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ')
    const passwordHash = await hashPassword(data.password)

    // 1) In-memory store — kept for the current process so the same Vercel
    //    instance can serve the auto-signin straight after register.
    createUser({
      name:         fullName,
      email:        data.email,
      passwordHash,
      role:         'customer',
      portalRole:   data.portalRole,
      phone:        data.phone || undefined,
      company:      data.company || undefined,
    })

    // 2) Persistent — write the full profile + password_hash onto
    //    public.users so logins work across serverless instances and
    //    forgot-password can verify the user exists.
    const persistedToDb = await writeCustomerProfile({
      email:        data.email,
      firstName:    data.firstName,
      middleName:   data.middleName,
      lastName:     data.lastName,
      phone:        data.phone,
      company:      data.company,
      passwordHash,
      portalRoleCode: data.portalRole,
    })

    return NextResponse.json({ success: true, persistedToDb })
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Surface the failing field so the form can show the real reason
      // instead of falling back to a generic "Verification failed".
      const first = error.errors[0]
      const field = first?.path?.join('.') ?? 'request'
      const issue = first?.message ?? 'is invalid'
      console.error('[register] schema validation failed:', error.errors)
      return NextResponse.json(
        {
          success: false,
          message: `Could not submit: ${field} ${issue}`,
          errors:  error.errors,
        },
        { status: 400 },
      )
    }
    console.error('[register] Unexpected error:', error)
    return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 })
  }
}
