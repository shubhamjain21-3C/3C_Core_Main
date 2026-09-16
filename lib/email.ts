import { Resend } from 'resend'
import { escapeHtml } from '@/lib/escape-html'

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')

interface ContactEmailData {
  name: string
  company: string
  email: string
  phone: string
  service: string
  message: string
}

export async function sendContactEmail(data: ContactEmailData) {
  const to = process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'contactus@3ccore.com'

  const from = process.env.RESEND_FROM_EMAIL
    ? `3C Core <${process.env.RESEND_FROM_EMAIL}>`
    : 'onboarding@resend.dev'

  return resend.emails.send({
    from,
    to,
    reply_to: 'contactus@3ccore.com',
    subject: `New enquiry from ${data.name} — ${data.service}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#2C1F14;color:#FDE8B0;padding:32px;border-radius:12px;">
        <h2 style="color:#ffffff;margin-bottom:8px;">New Enquiry — 3C Core</h2>
        <hr style="border-color:#5C3D28;margin-bottom:24px;"/>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#D4860A;width:140px;">Name</td><td style="padding:8px 0;color:#ffffff;">${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding:8px 0;color:#D4860A;">Company</td><td style="padding:8px 0;color:#ffffff;">${escapeHtml(data.company) || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#D4860A;">Email</td><td style="padding:8px 0;color:#F0A830;">${escapeHtml(data.email)}</td></tr>
          <tr><td style="padding:8px 0;color:#D4860A;">Phone</td><td style="padding:8px 0;color:#ffffff;">${escapeHtml(data.phone) || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#D4860A;">Service</td><td style="padding:8px 0;color:#F0A830;">${escapeHtml(data.service)}</td></tr>
        </table>
        <hr style="border-color:#5C3D28;margin:24px 0;"/>
        <h3 style="color:#D4860A;margin-bottom:12px;">Message</h3>
        <p style="color:#FDE8B0;line-height:1.7;">${escapeHtml(data.message)}</p>
        <hr style="border-color:#5C3D28;margin-top:32px;"/>
        <p style="color:#8B3A2A;font-size:12px;margin:0;">Sent via 3ccore.com contact form</p>
      </div>
    `,
  })
}
