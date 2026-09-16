import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase'
import { lookupId, lookupLabel } from '@/lib/lookups'
import { escapeHtml } from '@/lib/escape-html'

export const dynamic = 'force-dynamic'

const schema = z.object({
  serviceCode:     z.enum(['inventory','maintenance','midterm','dispute','deposit','letting']),
  portalRole:      z.string().optional(),
  fullName:        z.string().min(2, 'Full name is required'),
  email:           z.string().email('Valid email is required'),
  phone:           z.string().optional(),
  maintenanceType: z.string().optional(),
  summary:         z.string().min(5, 'Please describe what you need'),
  serviceDate:     z.string().min(1, 'Service date is required'),
  callBackTime:    z.string().min(1, 'Call-back time is required'),
})

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')
const SERVICE_LABEL_FALLBACK: Record<string, string> = {
  inventory:   'Inventory Management',
  maintenance: 'Maintenance & Cleaning',
  midterm:     'Midterm Property Inspection',
  dispute:     'Dispute Resolution',
  deposit:     'Deposit Negotiation',
  letting:     'Letting Services',
}

function bookingEmailHtml(args: {
  serviceLabel: string
  fullName: string
  email: string
  phone?: string
  portalRoleLabel?: string
  maintenanceLabel?: string
  summary: string
  serviceDate: string
  callBackTime: string
}) {
  // Every value here comes from a public form — escape before interpolating.
  const row = (k: string, v?: string) => v
    ? `<tr><td style="padding:6px 0;color:#8B3A2A;width:160px;font-size:12px;">${escapeHtml(k)}</td><td style="padding:6px 0;color:#2C1F14;font-size:13px;">${escapeHtml(v)}</td></tr>`
    : ''
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#FFF8EE;color:#2C1F14;padding:32px;border-radius:14px;border:1.5px solid rgba(212,134,10,0.35);">
      <p style="color:#D4860A;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 8px;">3C Core Booking</p>
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;">New ${escapeHtml(args.serviceLabel)} Request</h2>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid rgba(212,134,10,0.2);padding-top:8px;">
        ${row('Service', args.serviceLabel)}
        ${row('Maintenance Type', args.maintenanceLabel)}
        ${row('Role', args.portalRoleLabel)}
        ${row('Name', args.fullName)}
        ${row('Email', args.email)}
        ${row('Phone', args.phone)}
        ${row('Service Date', args.serviceDate)}
        ${row('Call-back Time', args.callBackTime)}
      </table>
      <h3 style="margin:18px 0 6px;color:#D4860A;font-size:14px;">Summary / Description</h3>
      <p style="margin:0;color:#2C1F14;line-height:1.6;font-size:13px;white-space:pre-wrap;">${escapeHtml(args.summary)}</p>
      <hr style="border:none;border-top:1px solid rgba(212,134,10,0.2);margin:20px 0;"/>
      <p style="color:rgba(139,58,42,0.7);font-size:11px;margin:0;">Submitted via 3ccore.com — service booking form</p>
    </div>
  `
}

export async function POST(request: Request) {
  try {
    const body  = await request.json()
    const input = schema.parse(body)

    if (input.serviceCode === 'maintenance' && !input.maintenanceType) {
      return NextResponse.json(
        { success: false, message: 'Please select a maintenance type.' },
        { status: 400 },
      )
    }

    // ── Resolve lookup ids ────────────────────────────────────────────────────
    let serviceTypeId: number | null = null
    let portalRoleId:  number | null = null
    let maintTypeId:   number | null = null
    let portalRoleLbl: string | undefined
    let maintLbl:      string | undefined

    try {
      serviceTypeId = await lookupId('ref_service_types', input.serviceCode)
      if (input.portalRole) {
        portalRoleId  = await lookupId('ref_portal_roles', input.portalRole)
        if (portalRoleId) portalRoleLbl = (await lookupLabel('ref_portal_roles', portalRoleId)) ?? undefined
      }
      if (input.maintenanceType) {
        maintTypeId   = await lookupId('ref_maintenance_types', input.maintenanceType)
        if (maintTypeId) maintLbl = (await lookupLabel('ref_maintenance_types', maintTypeId)) ?? undefined
      }
    } catch (err) {
      // Lookup failure shouldn't block the booking — just log and proceed.
      console.warn('[bookings] Lookup resolution issue:', err)
    }

    const serviceLabel =
      (serviceTypeId && (await lookupLabel('ref_service_types', serviceTypeId).catch(() => null))) ||
      SERVICE_LABEL_FALLBACK[input.serviceCode] ||
      input.serviceCode

    // ── Persist to Supabase (best-effort) ─────────────────────────────────────
    // Cast to `never` for the insert payload because the PostgreSQL column
    // "User_id" uses mixed casing — Supabase JS infers the Insert type loosely.
    let bookingId: string | null = null
    let dbSaved = false
    try {
      const admin = createAdminClient()
      const insertPayload = {
        User_id:             null,
        service_type_id:     serviceTypeId,
        portal_role_id:      portalRoleId,
        full_name:           input.fullName,
        email:               input.email,
        phone:               input.phone || null,
        maintenance_type_id: maintTypeId,
        summary:             input.summary,
        service_date:        input.serviceDate,
        call_back_time:      input.callBackTime,
        notes:               null,
      }
      const { data, error } = await admin
        .from('service_bookings')
        .insert(insertPayload as never)
        .select('"Booking_Id"')
        .single()
      if (error) {
        console.error('[bookings] DB insert error:', error.message)
      } else {
        dbSaved = true
        bookingId = (data as { Booking_Id: string } | null)?.Booking_Id ?? null
      }
    } catch (err) {
      console.warn('[bookings] Supabase not available, skipping DB save:', err)
    }

    // ── Send email to admin via Resend ────────────────────────────────────────
    let emailSent = false
    const to   = process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'contactus@3ccore.com'
    const from = process.env.RESEND_FROM_EMAIL
      ? `3C Core <${process.env.RESEND_FROM_EMAIL}>`
      : '3C Core <onboarding@resend.dev>'

    const isResendConfigured =
      !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'placeholder'

    if (!isResendConfigured) {
      console.log('[bookings DEV] Email skipped (RESEND_API_KEY missing). Payload:', input)
    } else {
      try {
        const { error } = await resend.emails.send({
          from,
          to,
          reply_to: input.email,
          subject: `New ${serviceLabel} booking — ${input.fullName}`,
          html: bookingEmailHtml({
            serviceLabel,
            fullName:         input.fullName,
            email:            input.email,
            phone:            input.phone,
            portalRoleLabel:  portalRoleLbl,
            maintenanceLabel: maintLbl,
            summary:          input.summary,
            serviceDate:      input.serviceDate,
            callBackTime:     input.callBackTime,
          }),
        })
        if (error) {
          console.error('[bookings] Resend error:', error)
        } else {
          emailSent = true
        }
      } catch (err) {
        console.error('[bookings] Email send threw:', err)
      }

      // Flag the booking as emailed (best-effort)
      if (emailSent && bookingId) {
        try {
          const admin = createAdminClient()
          await admin
            .from('service_bookings')
            .update({ email_sent: true } as never)
            .eq('Booking_Id', bookingId)
        } catch { /* non-fatal */ }
      }
    }

    if (!dbSaved && !emailSent && isResendConfigured) {
      return NextResponse.json(
        { success: false, message: 'We could not record your booking. Please email contactus@3ccore.com directly.' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success:    true,
      bookingId,
      dbSaved,
      emailSent,
      message:    'Booking received. Our team will be in touch within 24 hours.',
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: err.errors[0]?.message ?? 'Invalid request.' },
        { status: 400 },
      )
    }
    console.error('[bookings] Unexpected error:', err)
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again or email contactus@3ccore.com.' },
      { status: 500 },
    )
  }
}
