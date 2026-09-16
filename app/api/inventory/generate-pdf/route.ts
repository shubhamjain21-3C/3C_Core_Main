import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jsPDF } from 'jspdf'
import { createAdminClient } from '@/lib/supabase'
import { COMPANY } from '@/lib/constants'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkReportAccess } from '@/lib/inventory-auth'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

// ── Limits ──────────────────────────────────────────────────────────────────
// PDF generation is CPU-heavy and reachable by guests, so cap the payload.
const MAX_ROOMS            = 60
const MAX_ITEMS_PER_ROOM   = 200
const MAX_IMAGES_PER_ROOM  = 40
const MAX_IMAGES_TOTAL     = 60
// One compressed photo as a base64 data URI (~500 KB of image data).
const MAX_IMAGE_CHARS      = 700_000

// Photos arrive as inline JPEG/PNG data URIs, compressed in the browser. The
// server never fetches a URL on the caller's behalf, so there is no SSRF path.
const IMAGE_DATA_URI_RE = /^data:image\/(jpeg|png);base64,/

// ── Schema ──────────────────────────────────────────────────────────────────
const roomSchema = z.object({
  room_name:         z.string(),
  room_type_label:   z.string().optional(),
  overall_condition: z.string().optional(),
  room_summary:      z.string().optional(),
  notes:             z.string().optional(),
  items: z.array(z.object({
    item_name:   z.string(),
    condition:   z.string().optional(),
    description: z.string().optional(),
    concerns:    z.string().max(5000).optional(),
  })).max(MAX_ITEMS_PER_ROOM).default([]),
  imageUrls: z.array(z.string().max(MAX_IMAGE_CHARS)).max(MAX_IMAGES_PER_ROOM).default([]),
  imageCaptions: z.array(z.string().max(200)).max(MAX_IMAGES_PER_ROOM).default([]),
})

const pdfSchema = z.object({
  reportId:        z.string().uuid().optional(),
  reportTypeLabel: z.string().default('Inventory Report'),
  propertyAddress: z.string().default(''),
  inspectionDate:  z.string().default(''),
  inspectorName:   z.string().default(''),
  preparedBy:      z.string().default(''),
  rooms:           z.array(roomSchema).max(MAX_ROOMS).default([]),
}).refine(
  d => d.rooms.reduce((n, r) => n + r.imageUrls.length, 0) <= MAX_IMAGES_TOTAL,
  { message: 'Too many photos.' },
)

// Colour palette — keep aligned with the amber/gold brand
const COLOURS = {
  primary:   [212, 134, 10] as [number, number, number],
  dark:      [44, 31, 20]   as [number, number, number],
  muted:     [139, 58, 42]  as [number, number, number],
  bg:        [255, 248, 238] as [number, number, number],
  divider:   [212, 134, 10] as [number, number, number],
}

const CONDITION_RGB: Record<string, [number, number, number]> = {
  excellent: [22, 163, 74],
  good:      [5, 150, 105],
  fair:      [217, 119, 6],
  poor:      [234, 88, 12],
  damaged:   [220, 38, 38],
  missing:   [127, 29, 29],
  not_applicable: [120, 120, 120],
}

// ── Builder ────────────────────────────────────────────────────────────────
function buildPdf(data: z.infer<typeof pdfSchema>) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pw  = doc.internal.pageSize.getWidth()
  const ph  = doc.internal.pageSize.getHeight()
  const m   = 14
  const mw  = pw - m * 2

  // ── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(...COLOURS.dark)
  doc.rect(0, 0, pw, 32, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(...COLOURS.primary)
  doc.text('3C Core', m, 14)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(255, 255, 255)
  doc.text(data.reportTypeLabel, m, 21)
  doc.setFontSize(7)
  doc.text('Connected | Consistent | Confident', m, 27)
  doc.setFontSize(7).setTextColor(255, 255, 255)
  // Registered office, from the single source of truth in lib/constants.ts
  const addressLines = COMPANY.address.split(', ')
  doc.text(addressLines.slice(0, 2).join(', ') + ',', pw - m, 12, { align: 'right' })
  doc.text(addressLines.slice(2).join(', '), pw - m, 17, { align: 'right' })
  doc.text(`${COMPANY.email}  ·  3ccore.com`, pw - m, 22, { align: 'right' })

  let y = 42

  // ── Meta block ─────────────────────────────────────────────────────────────
  doc.setTextColor(...COLOURS.dark).setFontSize(8)
  const meta: Array<[string, string]> = [
    ['Report ID',       (data.reportId ?? '—').slice(0, 24)],
    ['Report Type',     data.reportTypeLabel],
    ['Inspection Date', data.inspectionDate || '—'],
    ['Inspector',       data.inspectorName  || '—'],
    ['Prepared by',     data.preparedBy     || data.inspectorName || '—'],
    ['Property',        data.propertyAddress || '—'],
  ]
  for (const [k, v] of meta) {
    doc.setFont('helvetica', 'bold').text(`${k}:`, m, y)
    doc.setFont('helvetica', 'normal').text(v, m + 32, y)
    y += 6
  }
  y += 2
  doc.setDrawColor(...COLOURS.divider).setLineWidth(0.5).line(m, y, pw - m, y)
  y += 8

  // ── Rooms ──────────────────────────────────────────────────────────────────
  for (const room of data.rooms) {
    if (y > ph - 60) { doc.addPage(); y = 20 }

    // Room title bar
    doc.setFillColor(...COLOURS.bg)
    doc.rect(m, y - 5, mw, 10, 'F')
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...COLOURS.dark)
    doc.text(room.room_name, m + 2, y + 2)
    if (room.overall_condition) {
      const rgb = CONDITION_RGB[room.overall_condition] ?? COLOURS.dark
      doc.setFontSize(8).setTextColor(...rgb)
      doc.text(room.overall_condition.toUpperCase(), pw - m - 2, y + 2, { align: 'right' })
    }
    y += 12

    // Room type / summary / notes
    if (room.room_type_label) {
      doc.setFont('helvetica', 'italic').setFontSize(8).setTextColor(...COLOURS.muted)
      doc.text(`Type: ${room.room_type_label}`, m, y); y += 5
    }
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...COLOURS.dark)
    if (room.room_summary) {
      const lines = doc.splitTextToSize(room.room_summary, mw)
      doc.text(lines, m, y); y += lines.length * 4.5 + 3
    }
    if (room.notes) {
      doc.setFont('helvetica', 'italic').setTextColor(...COLOURS.muted)
      const noteLines = doc.splitTextToSize(`Notes: ${room.notes}`, mw)
      doc.text(noteLines, m, y); y += noteLines.length * 4.5 + 3
      doc.setFont('helvetica', 'normal').setTextColor(...COLOURS.dark)
    }

    // Items table
    if (room.items.length > 0) {
      if (y > ph - 40) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold').setFontSize(7)
      doc.setFillColor(...COLOURS.primary).rect(m, y - 4, mw, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.text('Item',        m + 2,  y)
      doc.text('Condition',   m + 60, y)
      doc.text('Description', m + 90, y)
      y += 6

      for (const item of room.items) {
        if (y > ph - 25) { doc.addPage(); y = 20 }
        const descLines = doc.splitTextToSize(item.description ?? '', mw - 92)
        const rowH = Math.max(descLines.length * 4, 6)
        doc.setFillColor(252, 250, 245).rect(m, y - 4, mw, rowH + 3, 'F')
        doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(...COLOURS.dark)
        doc.text(item.item_name, m + 2, y)
        const condRgb = CONDITION_RGB[(item.condition ?? '').toLowerCase()] ?? COLOURS.dark
        doc.setTextColor(...condRgb)
        doc.text((item.condition ?? '').toUpperCase(), m + 60, y)
        doc.setTextColor(...COLOURS.dark)
        doc.text(descLines, m + 90, y)
        y += rowH + 4
      }
    }

    // Photos — 3-column grid, aspect ratio preserved
    const gap   = 4
    const cellW = (mw - gap * 2) / 3
    const maxH  = 55
    const capH  = 4
    // Measure first, so corrupt images are dropped before anything is counted.
    const photos = room.imageUrls
      .map((src, i) => ({ src, caption: room.imageCaptions[i] ?? '' }))
      .filter(p => IMAGE_DATA_URI_RE.test(p.src))
      .map(p => {
        try {
          const props = doc.getImageProperties(p.src)
          if (!props.width || !props.height) return null
          const h = Math.min(maxH, cellW * (props.height / props.width))
          const w = h * (props.width / props.height)
          return { ...p, w, h, fmt: props.fileType === 'PNG' ? 'PNG' : 'JPEG' }
        } catch {
          return null // corrupt image data — skip it rather than fail the report
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)

    if (photos.length > 0) {
      if (y > ph - 40) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(...COLOURS.muted)
      doc.text(`Photos (${photos.length})`, m, y)
      y += 4

      for (let i = 0; i < photos.length; i += 3) {
        const row = photos.slice(i, i + 3)

        const rowH = Math.max(...row.map(p => p.h)) + capH + 2
        if (y + rowH > ph - 20) { doc.addPage(); y = 20 }
        row.forEach((p, k) => {
          const x = m + k * (cellW + gap)
          try {
            doc.addImage(p.src, p.fmt, x, y, p.w, p.h)
          } catch { /* skip unrenderable image */ }
          if (p.caption) {
            doc.setFont('helvetica', 'normal').setFontSize(6).setTextColor(...COLOURS.muted)
            const cap = doc.splitTextToSize(p.caption, cellW)[0] ?? ''
            doc.text(cap, x, y + p.h + 3)
          }
        })
        y += rowH + 2
      }
    }
    y += 6
  }

  // ── Signature blocks ───────────────────────────────────────────────────────
  if (y > ph - 60) { doc.addPage(); y = 20 }
  y += 4
  doc.setDrawColor(...COLOURS.divider).line(m, y, pw - m, y)
  y += 8
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...COLOURS.dark)
  doc.text('Signatures', m, y); y += 8

  const colW = mw / 3 - 4
  const signBlock = (label: string, x: number) => {
    doc.setDrawColor(...COLOURS.muted).setLineWidth(0.3)
    doc.line(x, y + 14, x + colW, y + 14)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...COLOURS.muted)
    doc.text(label, x, y + 19)
    doc.text('Date: __________________', x, y + 24)
  }
  signBlock('Landlord / Manager', m)
  signBlock('Tenant',             m + colW + 4)
  signBlock('Agent / Inspector',  m + (colW + 4) * 2)

  // ── Footer (every page) ────────────────────────────────────────────────────
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFontSize(7).setTextColor(180, 180, 180)
    doc.text('Generated by 3C Core | contactus@3ccore.com | 3ccore.com', m, ph - 8)
    doc.text(`Page ${p} of ${total}`, pw - m, ph - 8, { align: 'right' })
  }

  return doc
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = pdfSchema.parse(body)

    const doc = buildPdf(data)
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    let storedUrl: string | null = null
    let storagePath: string | null = null

    // Guests may generate and download a PDF, but nothing is written to
    // storage for them. Only a signed-in owner of the report gets a stored copy.
    const session = await getServerSession(authOptions)

    if (data.reportId && session?.user?.id) {
      try {
        const admin = createAdminClient()
        const verdict = await checkReportAccess(admin, data.reportId, session)
        if (verdict !== 'owned') throw new Error('not-owner')
        storagePath = `${data.reportId}/inventory-${Date.now()}.pdf`
        const { error: upErr } = await admin.storage
          .from('inventory-reports')
          .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          })
        if (!upErr) {
          const { data: signed } = await admin.storage
            .from('inventory-reports')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 30) // 30 days
          storedUrl = signed?.signedUrl ?? null
          // Best-effort: save the URL onto the report row
          await admin
            .from('inventory_reports')
            .update({ pdf_url: storedUrl } as never)
            .eq('InventoryReport_id', data.reportId)
        } else {
          console.warn('[generate-pdf] storage upload failed:', upErr.message)
        }
      } catch (err) {
        console.warn('[generate-pdf] storage not available:', err)
      }
    }

    // Return the PDF inline so the browser can download immediately. We attach
    // the signed URL in a header so the caller can also link to the stored copy.
    return new NextResponse(pdfBuffer, {
      status:  200,
      headers: {
        'Content-Type':         'application/pdf',
        'Content-Disposition':  `attachment; filename="3CCore-Inventory-${(data.reportId ?? 'report').slice(0, 8)}.pdf"`,
        'X-Stored-Pdf-Url':     storedUrl ?? '',
        'X-Stored-Pdf-Path':    storagePath ?? '',
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }
    console.error('[generate-pdf] error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
