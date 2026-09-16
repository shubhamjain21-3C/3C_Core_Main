import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase'
import { normaliseEmail } from '@/lib/normalise-email'

export const dynamic = 'force-dynamic'

// ── Step 1 of admin login: verify password and send the email OTP ───────────
// On success we send a 6-digit code via Supabase Auth. The 2nd step
// (verifying the code) is handled by the NextAuth `admin-login` provider.

const schema = z.object({
  email:    z.string().email().transform(normaliseEmail),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = schema.parse(body)

    const adminEmail    = process.env.PORTAL_ADMIN_EMAIL    || 'admin@3ccore.com'
    const adminPassword = process.env.PORTAL_ADMIN_PASSWORD || ''

    // Generic failure message — don't leak which field is wrong
    if (
      !adminPassword ||
      email.toLowerCase() !== adminEmail.toLowerCase() ||
      password !== adminPassword
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 },
      )
    }

    let supabase
    try {
      supabase = getSupabaseClient()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Email verification is not configured. Please contact support.' },
        { status: 500 },
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://3ccore.com'
    const { error } = await supabase.auth.signInWithOtp({
      email: adminEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${siteUrl}/portal/admin/dashboard`,
      },
    })

    if (error) {
      const isRateLimit = /rate|too many|seconds/i.test(error.message)
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to send verification email.' },
        { status: isRateLimit ? 429 : 502 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 })
    }
    console.error('[admin.start-login] error:', err)
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 })
  }
}
