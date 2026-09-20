import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase'
import { isFullyRegistered } from '@/lib/email-exists'
import { normaliseEmail } from '@/lib/normalise-email'

export const dynamic = 'force-dynamic'

// Step 1 of forgot-password: send a Supabase email OTP to the user. We
// intentionally return the same success payload whether or not the email
// is registered, so attackers can't probe for valid accounts.

const schema = z.object({
  email: z.string().email().transform(normaliseEmail),
})

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  return local.slice(0, 2) + '***@' + domain
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    // Only send the reset OTP to a fully-registered account (one with a
    // password_hash or Lastname populated — i.e. not just a mid-flow stub).
    const hasAccount = await isFullyRegistered(email)

    // Generic success response — don't reveal whether the email is registered.
    const responseOk = NextResponse.json({ success: true, masked: maskEmail(email) })

    if (!hasAccount) return responseOk

    let supabase
    try {
      supabase = getSupabaseClient()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Email verification is not configured.' },
        { status: 500 },
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://3ccore.com'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${siteUrl}/portal/forgot-password`,
      },
    })

    if (error) {
      const isRateLimit = /rate|too many|seconds/i.test(error.message)
      // Bubble rate limits up to the UI so the user knows to wait
      if (isRateLimit) {
        return NextResponse.json(
          { success: false, message: 'Too many attempts. Please wait a minute and try again.' },
          { status: 429 },
        )
      }
      console.error('[forgot-password.start] Supabase error:', error.message)
      // Otherwise still return success to avoid leaking info
      return responseOk
    }

    return responseOk
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Invalid email.' }, { status: 400 })
    }
    console.error('[forgot-password.start] error:', err)
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 })
  }
}
