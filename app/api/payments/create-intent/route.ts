import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { requireSession, badRequest, serverError } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * Payments are built but NOT live.
 *
 * Two gates before Stripe is ever touched:
 *   1. PAYMENTS_ENABLED must be exactly 'true' (unset everywhere today).
 *   2. The caller must have a session.
 *
 * The charge amount is resolved server-side from SERVICE_PRICES_PENCE. The
 * `amount` field in the request body is ignored — a client must never be able
 * to choose what it pays.
 */

const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === 'true'

/**
 * Server-side price list, in pence. Deliberately empty: 3C Core has not
 * published fixed online prices, so there is nothing to charge yet. Populate
 * only with prices signed off by the director, then set PAYMENTS_ENABLED.
 */
const SERVICE_PRICES_PENCE: Record<string, number> = {}

const schema = z.object({
  serviceType: z.string().min(1).max(100),
  bookingId:   z.string().max(100).optional(),
  // `amount` and `userId` may still be sent by older clients. They are parsed
  // and discarded — never used to build the PaymentIntent.
  amount:      z.number().optional(),
  userId:      z.string().optional(),
})

export async function POST(req: Request) {
  if (!PAYMENTS_ENABLED) {
    return NextResponse.json({ error: 'Payments are not available yet.' }, { status: 503 })
  }

  const auth = await requireSession()
  if ('response' in auth) return auth.response
  const { session } = auth

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[payments] PAYMENTS_ENABLED is true but STRIPE_SECRET_KEY is missing')
      return NextResponse.json({ error: 'Payments are not available yet.' }, { status: 503 })
    }

    const body = await req.json()
    const { serviceType, bookingId } = schema.parse(body)

    const amountPence = SERVICE_PRICES_PENCE[serviceType]
    if (!amountPence || amountPence <= 0) {
      return badRequest('That service cannot be paid for online.')
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountPence,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      metadata: {
        service_type: serviceType,
        user_id:      session.user.id,
        booking_id:   bookingId ?? '',
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest()
    return serverError('payments.create-intent', err)
  }
}
