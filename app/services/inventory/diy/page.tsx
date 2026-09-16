'use client'
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, ArrowRight, Upload, Camera, Plus, Trash2, Loader2, Download,
  ChevronDown, ChevronUp, Pencil, CheckCircle, Lock, LogIn, AlertTriangle,
  FileVideo, Image as ImageIcon, Sparkles, Save,
} from 'lucide-react'
import { ServicePageHeader } from '@/components/layout/ServicePageHeader'
import { CameraCapture } from '@/components/inventory/CameraCapture'
import type { LookupRow } from '@/types/database'

// AI photo analysis is built but not activated. Flag defaults to off.
const AI_ENABLED = process.env.NEXT_PUBLIC_AI_ANALYSIS_ENABLED === 'true'

// ── Types ────────────────────────────────────────────────────────────────────

interface MediaItem {
  localId:     string
  file?:       File           // present until uploaded
  previewUrl:  string         // object URL or signed URL
  caption:     string
  uploading:   boolean
  uploadError: string | null
  mediaId?:    string         // assigned after upload
  storagePath?: string
  remoteUrl?:  string
  mediaTypeCode?: 'image' | 'video' | 'document' | 'pdf'
}

interface Item {
  localId:        string
  itemId?:        string
  itemTypeCode:   string
  itemLabel:      string
  quantity:       number
  conditionCode:  string
  notes:          string
  media:          MediaItem[]
}

interface Room {
  localId:        string
  roomId?:        string       // assigned after first save
  roomName:       string
  roomTypeCode:   string
  conditionCode:  string
  notes:          string
  collapsed:      boolean
  media:          MediaItem[]
  items:          Item[]
}

interface ReportMeta {
  reportId:        string | null
  reportTypeCode:  string
  inspectionDate:  string
  inspectorName:   string
  addressLine1:    string
  addressLine2:    string
  city:            string
  postcode:        string
  propertyId?:     string
}

interface AnalysisItem {
  item_name:   string
  category:    string
  condition:   string
  description: string
  concerns:    string
}

interface RoomAnalysis {
  room_name:         string
  room_summary:      string
  overall_condition: string
  items:             AnalysisItem[]
}

// ── Styling ──────────────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 rounded-lg text-sm text-[#2C1F14] border border-[rgba(212,134,10,0.35)] bg-white/80 focus:outline-none focus:border-[#D4860A] focus:ring-1 focus:ring-[#D4860A] transition-colors'
const labelCls = 'block text-xs font-medium text-[#8B3A2A] mb-1 tracking-wide'
const lockedCls = 'flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#2C1F14] border border-[rgba(212,134,10,0.25)] bg-[rgba(212,134,10,0.06)]'
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const btnGhost   = 'inline-flex items-center gap-1.5 text-sm text-[#8B3A2A] hover:text-[#D4860A] transition-colors'
const cardCls    = 'rounded-2xl p-5 bg-[rgba(255,255,255,0.7)] border border-[rgba(212,134,10,0.3)]'

const STEPS: { n: number; label: string }[] = [
  { n: 1, label: 'Property' },
  { n: 2, label: 'Rooms & Media' },
  { n: 3, label: 'Review & Analyse' },
  { n: 4, label: 'Download' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
}

function newMedia(file: File): MediaItem {
  return {
    localId:     uid(),
    file,
    previewUrl:  URL.createObjectURL(file),
    caption:     '',
    uploading:   false,
    uploadError: null,
    mediaTypeCode: file.type.startsWith('video/') ? 'video' : 'image',
  }
}

function newRoom(name = 'New Room'): Room {
  return {
    localId:       uid(),
    roomName:      name,
    roomTypeCode:  '',
    conditionCode: '',
    notes:         '',
    collapsed:     false,
    media:         [],
    items:         [],
  }
}

function newItem(): Item {
  return {
    localId:       uid(),
    itemTypeCode:  '',
    itemLabel:     '',
    quantity:      1,
    conditionCode: '',
    notes:         '',
    media:         [],
  }
}

// ── Main page wrapper ────────────────────────────────────────────────────────

export default function InventoryDIYPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF8EE]" />}>
      <InventoryDIYContent />
    </Suspense>
  )
}

function InventoryDIYContent() {
  const { data: session, status } = useSession()
  // Guests keep the whole report in the browser: the persistence APIs now
  // require a session, so we never call them when signed out.
  const isGuest = status !== 'authenticated'

  // ── Lookups ───────────────────────────────────────────────────────────────
  const [reportTypes,    setReportTypes]    = useState<LookupRow[]>([])
  const [roomTypes,      setRoomTypes]      = useState<LookupRow[]>([])
  const [itemTypes,      setItemTypes]      = useState<LookupRow[]>([])
  const [conditionLevels, setConditionLevels] = useState<LookupRow[]>([])

  useEffect(() => {
    const fetchLookup = (table: string, setter: (v: LookupRow[]) => void) =>
      fetch(`/api/lookups?table=${table}`)
        .then(r => r.ok ? r.json() : [])
        .then((rows: LookupRow[]) => setter(Array.isArray(rows) ? rows : []))
        .catch(() => setter([]))
    fetchLookup('ref_report_types',     setReportTypes)
    fetchLookup('ref_room_types',       setRoomTypes)
    fetchLookup('ref_item_types',       setItemTypes)
    fetchLookup('ref_condition_levels', setConditionLevels)
  }, [])

  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1)

  // ── Report meta ──────────────────────────────────────────────────────────
  const [meta, setMeta] = useState<ReportMeta>(() => ({
    reportId:       null,
    reportTypeCode: 'check_in',
    inspectionDate: new Date().toISOString().slice(0, 10),
    inspectorName:  '',
    addressLine1:   '',
    addressLine2:   '',
    city:           'London',
    postcode:       '',
  }))

  // Prefill inspector name from session
  useEffect(() => {
    if (session?.user?.name) {
      setMeta(m => m.inspectorName ? m : { ...m, inspectorName: session.user!.name! })
    }
  }, [session])

  // ── Rooms ─────────────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState<Room[]>([])

  // ── UI flags ──────────────────────────────────────────────────────────────
  const [creatingReport,  setCreatingReport]  = useState(false)
  const [createError,     setCreateError]     = useState('')
  const [autosaveState,   setAutosaveState]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [analysing,       setAnalysing]       = useState(false)
  const [analysisResult,  setAnalysisResult]  = useState<RoomAnalysis[] | null>(null)
  const [analysisStubbed, setAnalysisStubbed] = useState(false)
  const [analysisError,   setAnalysisError]   = useState('')
  const [pdfDownloading,  setPdfDownloading]  = useState(false)
  const [pdfError,        setPdfError]        = useState('')
  const [pdfDone,         setPdfDone]         = useState(false)
  const [cameraTarget,    setCameraTarget]    = useState<{ roomIdx: number; itemIdx: number | null } | null>(null)

  // Try to restore an in-progress draft from localStorage
  const HYDRATED = useRef(false)
  useEffect(() => {
    if (HYDRATED.current) return
    HYDRATED.current = true
    try {
      const raw = localStorage.getItem('3c.diy.draft')
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft?.meta && Array.isArray(draft.rooms)) {
        setMeta(draft.meta)
        // Strip uploading state and dropped File objects (can't be re-hydrated)
        setRooms(draft.rooms.map((r: Room) => ({
          ...r,
          collapsed: false,
          media: (r.media || []).map(m => ({ ...m, file: undefined, uploading: false, uploadError: null })),
          items: (r.items || []).map(it => ({
            ...it,
            media: (it.media || []).map(m => ({ ...m, file: undefined, uploading: false, uploadError: null })),
          })),
        })))
      }
    } catch { /* ignore */ }
  }, [])

  // Autosave to localStorage (debounced)
  useEffect(() => {
    if (!HYDRATED.current) return
    const id = setTimeout(() => {
      try {
        const serialisable = {
          meta,
          rooms: rooms.map(r => ({
            ...r,
            media: r.media.map(m => ({ ...m, file: undefined, previewUrl: m.remoteUrl || m.previewUrl })),
            items: r.items.map(it => ({
              ...it,
              media: it.media.map(m => ({ ...m, file: undefined, previewUrl: m.remoteUrl || m.previewUrl })),
            })),
          })),
        }
        localStorage.setItem('3c.diy.draft', JSON.stringify(serialisable))
      } catch { /* ignore (quota) */ }
    }, 600)
    return () => clearTimeout(id)
  }, [meta, rooms])

  // Autosave to server when reportId exists + meta changes
  useEffect(() => {
    if (isGuest || !meta.reportId) return
    const id = setTimeout(async () => {
      setAutosaveState('saving')
      try {
        const res = await fetch('/api/inventory/reports', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId: meta.reportId,
            notes:    `Inspector: ${meta.inspectorName}\nAddress: ${[meta.addressLine1, meta.addressLine2, meta.city, meta.postcode].filter(Boolean).join(', ')}`,
          }),
        })
        if (res.ok) setAutosaveState('saved')
        else setAutosaveState('error')
      } catch { setAutosaveState('error') }
    }, 1200)
    return () => clearTimeout(id)
  }, [meta, isGuest])

  // ── Step 1: create the report ─────────────────────────────────────────────
  async function startReport(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')

    if (!meta.inspectorName.trim()) {
      setCreateError('Inspector name is required.')
      return
    }
    if (!meta.addressLine1.trim() || !meta.postcode.trim()) {
      setCreateError('Address line 1 and postcode are required.')
      return
    }

    setCreatingReport(true)

    // Guest: nothing is persisted. Leaving reportId empty makes every
    // downstream persistence helper a no-op.
    if (isGuest) {
      if (rooms.length === 0) setRooms([newRoom('Living Room')])
      setStep(2)
      setCreatingReport(false)
      return
    }

    try {
      const res = await fetch('/api/inventory/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportTypeCode: meta.reportTypeCode,
          inspectionDate: meta.inspectionDate,
          inspectorName:  meta.inspectorName,
          addressLine1:   meta.addressLine1,
          addressLine2:   meta.addressLine2,
          city:           meta.city,
          postcode:       meta.postcode,
          propertyId:     meta.propertyId,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setCreateError(data.message || 'Failed to start report.')
        return
      }
      setMeta(m => ({ ...m, reportId: data.reportId }))
      if (rooms.length === 0) setRooms([newRoom('Living Room')])
      setStep(2)
    } catch {
      setCreateError('Network error. Please try again.')
    } finally {
      setCreatingReport(false)
    }
  }

  // ── Rooms / items mutators ────────────────────────────────────────────────
  const updateRoom = useCallback((idx: number, patch: Partial<Room>) => {
    setRooms(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }, [])

  function addRoom() {
    setRooms(prev => [...prev, newRoom(`Room ${prev.length + 1}`)])
  }

  function removeRoom(idx: number) {
    const r = rooms[idx]
    if (r?.roomId) {
      fetch('/api/inventory/rooms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: r.roomId }),
      }).catch(() => {})
    }
    setRooms(prev => prev.filter((_, i) => i !== idx))
  }

  function moveRoom(idx: number, dir: -1 | 1) {
    setRooms(prev => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  // Persist a room — call after edits settle (caller controls debouncing)
  async function persistRoom(idx: number): Promise<string | undefined> {
    const r = rooms[idx]
    if (!r || isGuest || !meta.reportId) return r?.roomId
    try {
      const res = await fetch('/api/inventory/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId:      meta.reportId,
          roomId:        r.roomId,
          roomName:      r.roomName || `Room ${idx + 1}`,
          roomTypeCode:  r.roomTypeCode || undefined,
          conditionCode: r.conditionCode || undefined,
          notes:         r.notes || undefined,
          sortOrder:     idx,
        }),
      })
      const data = await res.json()
      if (data.success && data.roomId) {
        if (!r.roomId) updateRoom(idx, { roomId: data.roomId })
        return data.roomId
      }
    } catch { /* tolerate offline */ }
    return r.roomId
  }

  // ── Media upload helpers ──────────────────────────────────────────────────
  async function uploadMedia(roomIdx: number, itemIdx: number | null, mediaIdx: number) {
    // Make sure the room is persisted so we have a roomId for the upload path
    if (isGuest) {
      // Photo stays in the browser as an object URL and goes into the PDF
      // payload from there. Nothing is uploaded.
      patchMedia(roomIdx, itemIdx, mediaIdx, { uploading: false, uploadError: null })
      return
    }
    const roomId = rooms[roomIdx]?.roomId ?? await persistRoom(roomIdx)
    if (!roomId || !meta.reportId) {
      patchMedia(roomIdx, itemIdx, mediaIdx, { uploading: false, uploadError: 'Save the report first.' })
      return
    }
    const target = getMedia(roomIdx, itemIdx, mediaIdx)
    if (!target?.file) return

    patchMedia(roomIdx, itemIdx, mediaIdx, { uploading: true, uploadError: null })

    try {
      const form = new FormData()
      form.append('file',     target.file)
      form.append('reportId', meta.reportId)
      form.append('roomId',   roomId)
      if (itemIdx !== null) {
        const itemId = rooms[roomIdx].items[itemIdx]?.itemId
        if (itemId) form.append('itemId', itemId)
      }
      form.append('caption',  target.caption || '')
      const res = await fetch('/api/inventory/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.success) {
        patchMedia(roomIdx, itemIdx, mediaIdx, { uploading: false, uploadError: data.message || 'Upload failed' })
        return
      }
      patchMedia(roomIdx, itemIdx, mediaIdx, {
        uploading:     false,
        uploadError:   null,
        mediaId:       data.mediaId,
        storagePath:   data.storagePath,
        remoteUrl:     data.publicUrl,
        mediaTypeCode: data.mediaTypeCode,
        file:          undefined,
      })
    } catch (err) {
      patchMedia(roomIdx, itemIdx, mediaIdx, {
        uploading: false,
        uploadError: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }

  function getMedia(roomIdx: number, itemIdx: number | null, mediaIdx: number) {
    if (itemIdx === null) return rooms[roomIdx]?.media[mediaIdx]
    return rooms[roomIdx]?.items[itemIdx]?.media[mediaIdx]
  }

  function patchMedia(roomIdx: number, itemIdx: number | null, mediaIdx: number, patch: Partial<MediaItem>) {
    setRooms(prev => prev.map((r, i) => {
      if (i !== roomIdx) return r
      if (itemIdx === null) {
        return { ...r, media: r.media.map((m, j) => j === mediaIdx ? { ...m, ...patch } : m) }
      }
      return {
        ...r,
        items: r.items.map((it, k) => {
          if (k !== itemIdx) return it
          return { ...it, media: it.media.map((m, j) => j === mediaIdx ? { ...m, ...patch } : m) }
        }),
      }
    }))
  }

  function addMediaFiles(roomIdx: number, itemIdx: number | null, files: File[]) {
    if (files.length === 0) return
    const additions = files.map(newMedia)
    setRooms(prev => prev.map((r, i) => {
      if (i !== roomIdx) return r
      if (itemIdx === null) return { ...r, media: [...r.media, ...additions] }
      return {
        ...r,
        items: r.items.map((it, k) => k === itemIdx ? { ...it, media: [...it.media, ...additions] } : it),
      }
    }))
    // Kick off uploads
    additions.forEach((_, offset) => {
      const idx = (itemIdx === null
        ? rooms[roomIdx].media.length
        : rooms[roomIdx].items[itemIdx].media.length) + offset
      void uploadMedia(roomIdx, itemIdx, idx)
    })
  }

  function removeMedia(roomIdx: number, itemIdx: number | null, mediaIdx: number) {
    const m = getMedia(roomIdx, itemIdx, mediaIdx)
    if (m?.storagePath) {
      fetch('/api/inventory/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: m.storagePath, mediaId: m.mediaId }),
      }).catch(() => {})
    }
    if (m?.previewUrl && m.previewUrl.startsWith('blob:')) URL.revokeObjectURL(m.previewUrl)
    setRooms(prev => prev.map((r, i) => {
      if (i !== roomIdx) return r
      if (itemIdx === null) return { ...r, media: r.media.filter((_, j) => j !== mediaIdx) }
      return {
        ...r,
        items: r.items.map((it, k) =>
          k !== itemIdx ? it : { ...it, media: it.media.filter((_, j) => j !== mediaIdx) }
        ),
      }
    }))
  }

  // ── Items ─────────────────────────────────────────────────────────────────
  function addItem(roomIdx: number) {
    setRooms(prev => prev.map((r, i) => i === roomIdx ? { ...r, items: [...r.items, newItem()] } : r))
  }

  function removeItem(roomIdx: number, itemIdx: number) {
    const it = rooms[roomIdx]?.items[itemIdx]
    if (it?.itemId) {
      fetch('/api/inventory/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: it.itemId }),
      }).catch(() => {})
    }
    setRooms(prev => prev.map((r, i) =>
      i !== roomIdx ? r : { ...r, items: r.items.filter((_, k) => k !== itemIdx) }
    ))
  }

  function updateItem(roomIdx: number, itemIdx: number, patch: Partial<Item>) {
    setRooms(prev => prev.map((r, i) =>
      i !== roomIdx ? r : {
        ...r,
        items: r.items.map((it, k) => k !== itemIdx ? it : { ...it, ...patch }),
      }
    ))
  }

  // Persist item after edits (best-effort)
  async function persistItem(roomIdx: number, itemIdx: number) {
    const room = rooms[roomIdx]
    const item = room?.items[itemIdx]
    if (!room || !item || isGuest) return
    const roomId = room.roomId ?? await persistRoom(roomIdx)
    if (!roomId) return
    try {
      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId:        item.itemId,
          roomId,
          itemTypeCode:  item.itemTypeCode || undefined,
          itemLabel:     item.itemLabel || undefined,
          quantity:      item.quantity,
          conditionCode: item.conditionCode || undefined,
          notes:         item.notes || undefined,
          sortOrder:     itemIdx,
        }),
      })
      const data = await res.json()
      if (data.success && data.itemId && !item.itemId) {
        updateItem(roomIdx, itemIdx, { itemId: data.itemId })
      }
    } catch { /* tolerate offline */ }
  }

  // ── Step 3: analyse + step 4: PDF ─────────────────────────────────────────
  async function runAnalysis() {
    setAnalysing(true)
    setAnalysisError('')
    setAnalysisResult(null)
    try {
      const payload = {
        rooms: rooms.map(r => ({
          name:      r.roomName,
          mediaUrls: r.media.map(m => m.remoteUrl).filter(Boolean) as string[],
          notes:     [r.notes, ...r.items.map(i => i.notes)].filter(Boolean),
        })),
      }
      const res = await fetch('/api/inventory/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setAnalysisError(data.error || 'Analysis failed.')
        return
      }
      setAnalysisResult(data.analysis as RoomAnalysis[])
      setAnalysisStubbed(!!data.stubbed)

      // Save the AI summary as a single string on the report
      if (meta.reportId) {
        const summary = (data.analysis as RoomAnalysis[]).map(a =>
          `# ${a.room_name}\n${a.room_summary}\n` +
          a.items.map(i => `- ${i.item_name} [${i.condition}]: ${i.description}`).join('\n')
        ).join('\n\n')
        await fetch('/api/inventory/reports', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId:   meta.reportId,
            statusCode: 'pending_review',
            aiSummary:  summary,
          }),
        }).catch(() => {})
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed.')
    } finally {
      setAnalysing(false)
    }
  }

  async function downloadPdf() {
    setPdfDownloading(true)
    setPdfError('')
    setPdfDone(false)
    try {
      const propertyAddress = [
        meta.addressLine1, meta.addressLine2, meta.city, meta.postcode,
      ].filter(Boolean).join(', ')

      const reportTypeLabel = reportTypes.find(t => t.code === meta.reportTypeCode)?.label || 'Inventory Report'

      const roomsPayload = rooms.map(r => {
        const aiRoom = analysisResult?.find(a => a.room_name === r.roomName)
        return {
          room_name:       r.roomName,
          room_type_label: roomTypes.find(t => t.code === r.roomTypeCode)?.label,
          overall_condition: aiRoom?.overall_condition || r.conditionCode || undefined,
          room_summary:    aiRoom?.room_summary || undefined,
          notes:           r.notes || undefined,
          items: [
            // Items from user input
            ...r.items.map(i => ({
              item_name:   i.itemLabel || itemTypes.find(t => t.code === i.itemTypeCode)?.label || 'Item',
              condition:   i.conditionCode || 'good',
              description: i.notes || '',
              concerns:    '',
            })),
            // AI-discovered items (if any)
            ...(aiRoom?.items ?? []),
          ],
          imageUrls: r.media.map(m => m.remoteUrl).filter(Boolean) as string[],
        }
      })

      const res = await fetch('/api/inventory/generate-pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId:        meta.reportId ?? undefined,
          reportTypeLabel,
          propertyAddress,
          inspectionDate:  meta.inspectionDate,
          inspectorName:   meta.inspectorName,
          preparedBy:      session?.user?.name || meta.inspectorName,
          rooms:           roomsPayload,
        }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setPdfError(text || `PDF generation failed (${res.status}).`)
        return
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `3CCore-Inventory-${(meta.reportId ?? 'report').slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      setPdfDone(true)
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'PDF generation failed.')
    } finally {
      setPdfDownloading(false)
    }
  }

  // ── Step 2 readiness ──────────────────────────────────────────────────────
  const totalMedia   = useMemo(() => rooms.reduce((t, r) => t + r.media.length + r.items.reduce((u, i) => u + i.media.length, 0), 0), [rooms])
  const canAnalyse   = rooms.length > 0 && rooms.every(r => r.roomName.trim().length > 0)
  const hasUploads   = rooms.some(r => r.media.length > 0 || r.items.some(i => i.media.length > 0))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#FFF8EE 0%,#FDE8B0 60%,#F5C060 100%)' }}>
      <ServicePageHeader />

      {/* Hero */}
      <div className="relative px-6 py-8 text-center" style={{ borderBottom: '1px solid rgba(212,134,10,0.2)' }}>
        <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full" style={{ background: 'rgba(212,134,10,0.12)', border: '1px solid rgba(212,134,10,0.4)' }}>
          <Sparkles size={12} style={{ color: '#D4860A' }} />
          <span className="text-[11px] font-medium tracking-wide" style={{ color: '#D4860A' }}>DIY Inventory Tool</span>
        </div>
        <h1 className="font-heading font-bold text-[#2C1F14] text-2xl sm:text-3xl">Build Your Inventory Report</h1>
        <p className="mt-1 text-[#8B3A2A] text-sm">Capture rooms with photos &amp; notes — generate a professional PDF in minutes</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <Link href="/services/inventory" className={btnGhost}>
            <ArrowLeft size={14} /> Back to Inventory
          </Link>
          {meta.reportId && (
            <span className="text-[10px] text-[#8B3A2A]/70 inline-flex items-center gap-1.5">
              <Save size={11} />
              {autosaveState === 'saving' ? 'Saving…' :
                autosaveState === 'saved' ? 'Draft saved' :
                autosaveState === 'error' ? 'Save failed — kept locally' : 'Autosave on'}
            </span>
          )}
        </div>

        {/* Step indicator */}
        <ol className="flex items-start mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <li key={s.n} className="flex items-start flex-1 min-w-0 first:flex-initial">
              {i > 0 && (
                <div className="flex-1 h-px mt-4 mx-2" style={{ background: step > i ? '#D4860A' : 'rgba(212,134,10,0.25)' }} />
              )}
              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: step >= s.n ? '#D4860A' : 'rgba(255,255,255,0.5)',
                    color:      step >= s.n ? 'white' : '#8B3A2A',
                    border:     step >= s.n ? 'none' : '1.5px solid rgba(212,134,10,0.3)',
                  }}>
                  {step > s.n ? <CheckCircle size={14} /> : s.n}
                </div>
                <span className="text-[10px] text-center" style={{ color: step >= s.n ? '#D4860A' : '#8B3A2A' }}>
                  {s.label}
                </span>
              </div>
            </li>
          ))}
        </ol>

        {/* ── STEP 1 — Property + report meta ────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={startReport} className="space-y-5 max-w-2xl">
            <h2 className="font-heading font-semibold text-[#D4860A] text-xl">Property &amp; Report Details</h2>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Report Type *</label>
                <select
                  value={meta.reportTypeCode}
                  onChange={e => setMeta(m => ({ ...m, reportTypeCode: e.target.value }))}
                  className={inputCls}
                >
                  {(reportTypes.length > 0 ? reportTypes : [
                    { code: 'check_in',  label: 'Check In'  },
                    { code: 'check_out', label: 'Check Out' },
                    { code: 'midterm',   label: 'Midterm'   },
                    { code: 'periodic',  label: 'Periodic'  },
                  ]).map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Inspection Date *</label>
                <input
                  type="date"
                  value={meta.inspectionDate}
                  onChange={e => setMeta(m => ({ ...m, inspectionDate: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  Inspector Name *
                  {session?.user?.name && <Lock size={10} className="inline ml-1 text-[#8B3A2A]/60" />}
                </label>
                <input
                  value={meta.inspectorName}
                  onChange={e => setMeta(m => ({ ...m, inspectorName: e.target.value }))}
                  className={inputCls}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Your Role</label>
                <div className={lockedCls}>
                  <span>{session?.user?.portalRole ?? 'Guest'}</span>
                  <Lock size={12} className="text-[#8B3A2A]/60" />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Address Line 1 *</label>
              <input
                value={meta.addressLine1}
                onChange={e => setMeta(m => ({ ...m, addressLine1: e.target.value }))}
                className={inputCls}
                placeholder="14 Maple Avenue"
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Address Line 2 <span className="text-[#8B3A2A]/60 normal-case font-normal">(optional)</span></label>
                <input
                  value={meta.addressLine2}
                  onChange={e => setMeta(m => ({ ...m, addressLine2: e.target.value }))}
                  className={inputCls}
                  placeholder="Flat 2"
                />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input
                  value={meta.city}
                  onChange={e => setMeta(m => ({ ...m, city: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Postcode *</label>
              <input
                value={meta.postcode}
                onChange={e => setMeta(m => ({ ...m, postcode: e.target.value.toUpperCase() }))}
                className={inputCls}
                placeholder="SW1A 1AA"
                required
              />
            </div>

            {createError && (
              <p className="text-[#8B3A2A] text-xs text-center py-2 px-3 rounded-lg"
                style={{ background: 'rgba(139,58,42,0.08)', border: '1px solid rgba(139,58,42,0.25)' }}>
                {createError}
              </p>
            )}

            <button
              type="submit"
              disabled={creatingReport}
              className={btnPrimary}
              style={{ background: creatingReport ? '#aaa' : '#D4860A' }}
            >
              {creatingReport && <Loader2 size={14} className="animate-spin" />}
              {creatingReport ? 'Starting…' : 'Start Report'} <ArrowRight size={14} />
            </button>

            {status === 'unauthenticated' && (
              <p className="text-xs text-[#8B3A2A]/80 leading-relaxed">
                <LogIn size={11} className="inline mr-1" />
                Tip: <Link href="/portal/login?role=property_manager" className="text-[#D4860A] underline">Log in</Link> to save this report to your portal and resume later.
              </p>
            )}
          </form>
        )}

        {/* ── STEP 2 — Rooms / media ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            {isGuest && (
              <div className="rounded-xl p-3 text-xs text-[#8B3A2A] flex items-start gap-2"
                style={{ background: 'rgba(212,134,10,0.08)', border: '1px solid rgba(212,134,10,0.25)' }}>
                <LogIn size={13} className="text-[#D4860A] mt-0.5 flex-shrink-0" />
                <span>
                  Your photos and notes stay in this browser and are not uploaded.{' '}
                  <Link href="/portal/login?role=property_manager" className="text-[#D4860A] underline">Log in</Link>{' '}
                  to save this report to your portal.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-heading font-semibold text-[#D4860A] text-xl">Rooms &amp; Media</h2>
                <p className="text-xs text-[#8B3A2A] mt-1">
                  {rooms.length} room{rooms.length === 1 ? '' : 's'} · {totalMedia} file{totalMedia === 1 ? '' : 's'}
                </p>
              </div>
              <button type="button" onClick={() => setStep(1)} className={btnGhost}>
                <ArrowLeft size={14} /> Edit details
              </button>
            </div>

            {rooms.map((room, ri) => (
              <RoomCard
                key={room.localId}
                room={room}
                index={ri}
                totalRooms={rooms.length}
                roomTypes={roomTypes}
                itemTypes={itemTypes}
                conditionLevels={conditionLevels}
                onChange={patch => updateRoom(ri, patch)}
                onPersist={() => persistRoom(ri)}
                onRemove={() => removeRoom(ri)}
                onMove={dir => moveRoom(ri, dir)}
                onAddFiles={files => addMediaFiles(ri, null, files)}
                onOpenCamera={() => setCameraTarget({ roomIdx: ri, itemIdx: null })}
                onRemoveMedia={mediaIdx => removeMedia(ri, null, mediaIdx)}
                onMediaCaption={(mediaIdx, caption) => patchMedia(ri, null, mediaIdx, { caption })}
                onRetryMedia={mediaIdx => uploadMedia(ri, null, mediaIdx)}
                onAddItem={() => addItem(ri)}
                onRemoveItem={ii => removeItem(ri, ii)}
                onUpdateItem={(ii, patch) => updateItem(ri, ii, patch)}
                onPersistItem={ii => persistItem(ri, ii)}
                onAddItemFiles={(ii, files) => addMediaFiles(ri, ii, files)}
                onOpenItemCamera={ii => setCameraTarget({ roomIdx: ri, itemIdx: ii })}
                onRemoveItemMedia={(ii, mIdx) => removeMedia(ri, ii, mIdx)}
                onItemMediaCaption={(ii, mIdx, caption) => patchMedia(ri, ii, mIdx, { caption })}
                onRetryItemMedia={(ii, mIdx) => uploadMedia(ri, ii, mIdx)}
              />
            ))}

            <button
              type="button"
              onClick={addRoom}
              className="w-full py-3 rounded-xl text-sm font-semibold text-[#D4860A] inline-flex items-center justify-center gap-2"
              style={{ background: 'rgba(212,134,10,0.08)', border: '1.5px dashed rgba(212,134,10,0.4)' }}
            >
              <Plus size={15} /> Add Another Room
            </button>

            {!hasUploads && rooms.length > 0 && (
              <p className="text-xs text-center text-[#8B3A2A]/70">
                Add at least one photo or note per room — you can still proceed without media, but your report will have less detail.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canAnalyse}
                className={btnPrimary + ' flex-1'}
                style={{ background: canAnalyse ? '#D4860A' : '#aaa' }}
              >
                Continue to Review <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Review ────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading font-semibold text-[#D4860A] text-xl">{AI_ENABLED ? 'Review &amp; Analyse' : 'Review'}</h2>
              <button type="button" onClick={() => setStep(2)} className={btnGhost}>
                <ArrowLeft size={14} /> Edit rooms
              </button>
            </div>

            <div className="rounded-xl p-4 text-sm text-[#2C1F14]"
              style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,134,10,0.25)' }}>
              <p className="font-semibold mb-1">{reportTypes.find(t => t.code === meta.reportTypeCode)?.label || 'Inventory Report'}</p>
              <p className="text-xs text-[#8B3A2A]">
                {[meta.addressLine1, meta.addressLine2, meta.city, meta.postcode].filter(Boolean).join(', ') || 'No address set'}
                <br/>{meta.inspectionDate} · Inspector: {meta.inspectorName || '—'}
              </p>
            </div>

            <div className="space-y-3">
              {rooms.map((r, ri) => {
                const ai = analysisResult?.find(a => a.room_name === r.roomName)
                return (
                  <div key={r.localId} className={cardCls}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-heading font-semibold text-[#2C1F14]">{r.roomName}</h3>
                      <div className="flex items-center gap-2">
                        {ai?.overall_condition && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white" style={{ background: '#D4860A' }}>
                            {ai.overall_condition}
                          </span>
                        )}
                        <button type="button" onClick={() => setStep(2)} className="text-xs text-[#8B3A2A] hover:text-[#D4860A] inline-flex items-center gap-1">
                          <Pencil size={11} /> Edit
                        </button>
                      </div>
                    </div>

                    {r.media.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {r.media.map(m => (
                          <ThumbPreview key={m.localId} m={m} />
                        ))}
                      </div>
                    )}

                    {ai && (
                      <textarea
                        className="w-full text-sm text-[#2C1F14] rounded-lg px-3 py-2 mb-2 resize-y"
                        style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(212,134,10,0.25)' }}
                        rows={3}
                        value={ai.room_summary}
                        onChange={e => {
                          setAnalysisResult(prev => prev?.map(a => a.room_name === r.roomName ? { ...a, room_summary: e.target.value } : a) ?? null)
                        }}
                      />
                    )}

                    {r.notes && (
                      <p className="text-xs italic text-[#8B3A2A] mb-2">Notes: {r.notes}</p>
                    )}

                    {(r.items.length > 0 || (ai?.items?.length ?? 0) > 0) && (
                      <div className="space-y-1.5 mt-2">
                        {r.items.map((it, ii) => (
                          <div key={it.localId} className="text-xs text-[#2C1F14]">
                            <span className="font-semibold">{it.itemLabel || itemTypes.find(t => t.code === it.itemTypeCode)?.label || 'Item'}</span>
                            {it.conditionCode && <span className="text-[#D4860A] ml-2">[{it.conditionCode}]</span>}
                            <span className="ml-2 text-[#8B3A2A]">× {it.quantity}</span>
                            {it.notes && <span className="text-[#8B3A2A] ml-2">— {it.notes}</span>}
                          </div>
                        ))}
                        {ai?.items?.map((aiItem, ii) => (
                          <div key={`ai-${ii}`} className="text-xs text-[#2C1F14] pl-2 border-l-2 border-[#D4860A]">
                            <span className="font-semibold">{aiItem.item_name}</span>
                            <span className="text-[#D4860A] ml-2">[{aiItem.condition}]</span>
                            <span className="ml-2 text-[#8B3A2A]">{aiItem.description}</span>
                            {aiItem.concerns && <p className="text-red-600 mt-0.5">{aiItem.concerns}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {(!AI_ENABLED || analysisStubbed) && (
              <div className="rounded-xl p-3 text-xs text-[#8B3A2A] flex items-start gap-2"
                style={{ background: 'rgba(212,134,10,0.08)', border: '1px solid rgba(212,134,10,0.25)' }}>
                <AlertTriangle size={13} className="text-[#D4860A] mt-0.5 flex-shrink-0" />
                AI analysis is not yet available. Your report is built from the photos and notes you
                entered yourself — nothing is written or assessed automatically.
              </div>
            )}

            {analysisError && (
              <p className="text-[#8B3A2A] text-xs py-2 px-3 rounded-lg"
                style={{ background: 'rgba(139,58,42,0.08)', border: '1px solid rgba(139,58,42,0.25)' }}>
                {analysisError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              {AI_ENABLED && (
                <button
                  type="button"
                  onClick={runAnalysis}
                  disabled={analysing}
                  className={btnPrimary + ' flex-1'}
                  style={{ background: analysing ? '#aaa' : '#D4860A' }}
                >
                  {analysing
                    ? <><Loader2 size={14} className="animate-spin" /> Analysing…</>
                    : <><Sparkles size={14} /> {analysisResult ? 'Re-run AI Analysis' : 'Generate Report with AI'}</>}
                </button>
              )}
              <button
                type="button"
                onClick={() => setStep(4)}
                className={btnPrimary + ' flex-1'}
                style={{ background: '#2C1F14' }}
              >
                Continue to PDF <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4 — Download PDF ──────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5 max-w-xl">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading font-semibold text-[#D4860A] text-xl">Download Report</h2>
              <button type="button" onClick={() => setStep(3)} className={btnGhost}>
                <ArrowLeft size={14} /> Back to review
              </button>
            </div>

            <div className="text-center p-8 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,134,10,0.25)' }}>
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(212,134,10,0.15)' }}>
                <Download size={24} className="text-[#D4860A]" />
              </div>
              <h3 className="font-heading font-bold text-[#2C1F14] text-lg mb-2">Your Inventory Report</h3>
              <p className="text-sm text-[#8B3A2A] mb-1">
                {[meta.addressLine1, meta.postcode].filter(Boolean).join(', ') || 'Property address'}
              </p>
              <p className="text-xs text-[#8B3A2A] mb-6">
                Report ID: <span className="font-mono text-[#D4860A]">{(meta.reportId ?? '—').slice(0, 8)}</span>
              </p>

              {pdfError && (
                <p className="text-[#8B3A2A] text-xs mb-3 py-2 px-3 rounded-lg"
                  style={{ background: 'rgba(139,58,42,0.08)', border: '1px solid rgba(139,58,42,0.25)' }}>
                  {pdfError}
                </p>
              )}

              {pdfDone && !pdfError && (
                <p className="text-green-700 text-xs mb-3">PDF downloaded — check your downloads folder.</p>
              )}

              <button
                type="button"
                onClick={downloadPdf}
                disabled={pdfDownloading}
                className={btnPrimary}
                style={{ background: pdfDownloading ? '#aaa' : '#D4860A' }}
              >
                {pdfDownloading
                  ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                  : <><Download size={14} /> Download PDF</>}
              </button>
            </div>

            {status === 'unauthenticated' && (
              <div className="p-4 rounded-xl text-sm text-[#2C1F14]"
                style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,134,10,0.25)' }}>
                <p className="font-semibold text-[#D4860A] mb-1">Save your report</p>
                <p className="text-xs text-[#8B3A2A]">
                  Create a free account to save this report, share it with landlords and tenants, and get digital signatures.
                </p>
                <Link href="/portal/register" className="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#D4860A' }}>
                  Create Free Account
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera capture modal */}
      <CameraCapture
        open={!!cameraTarget}
        onClose={() => setCameraTarget(null)}
        onCapture={files => {
          if (!cameraTarget) return
          addMediaFiles(cameraTarget.roomIdx, cameraTarget.itemIdx, files)
        }}
      />
    </div>
  )
}

// ── Room card ────────────────────────────────────────────────────────────────

interface RoomCardProps {
  room:           Room
  index:          number
  totalRooms:     number
  roomTypes:      LookupRow[]
  itemTypes:      LookupRow[]
  conditionLevels: LookupRow[]
  onChange:       (patch: Partial<Room>) => void
  onPersist:      () => void
  onRemove:       () => void
  onMove:         (dir: -1 | 1) => void
  onAddFiles:     (files: File[]) => void
  onOpenCamera:   () => void
  onRemoveMedia:  (mediaIdx: number) => void
  onMediaCaption: (mediaIdx: number, caption: string) => void
  onRetryMedia:   (mediaIdx: number) => void
  onAddItem:      () => void
  onRemoveItem:   (itemIdx: number) => void
  onUpdateItem:   (itemIdx: number, patch: Partial<Item>) => void
  onPersistItem:  (itemIdx: number) => void
  onAddItemFiles: (itemIdx: number, files: File[]) => void
  onOpenItemCamera: (itemIdx: number) => void
  onRemoveItemMedia: (itemIdx: number, mediaIdx: number) => void
  onItemMediaCaption: (itemIdx: number, mediaIdx: number, caption: string) => void
  onRetryItemMedia: (itemIdx: number, mediaIdx: number) => void
}

function RoomCard(props: RoomCardProps) {
  const { room, index, totalRooms, roomTypes, itemTypes, conditionLevels } = props
  const uploadRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className={cardCls}>
      <div className="flex items-start gap-2 mb-4">
        <input
          value={room.roomName}
          onChange={e => props.onChange({ roomName: e.target.value })}
          onBlur={props.onPersist}
          className="flex-1 px-3 py-2 rounded-lg text-base font-semibold text-[#2C1F14] border border-[rgba(212,134,10,0.25)] bg-white/85 focus:outline-none focus:border-[#D4860A]"
          placeholder="Room name"
        />
        <div className="flex flex-col gap-1">
          {index > 0 && (
            <button type="button" onClick={() => props.onMove(-1)} className="text-[#8B3A2A] hover:text-[#D4860A]" title="Move up">
              <ChevronUp size={14} />
            </button>
          )}
          {index < totalRooms - 1 && (
            <button type="button" onClick={() => props.onMove(1)} className="text-[#8B3A2A] hover:text-[#D4860A]" title="Move down">
              <ChevronDown size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => props.onChange({ collapsed: !room.collapsed })}
          className="text-[#8B3A2A] hover:text-[#D4860A] px-2 py-1 text-xs"
        >
          {room.collapsed ? 'Expand' : 'Collapse'}
        </button>
        <button
          type="button"
          onClick={props.onRemove}
          className="text-[#8B3A2A]/60 hover:text-red-600"
          title="Remove room"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {!room.collapsed && (
        <>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className={labelCls}>Room Type</label>
              <select
                value={room.roomTypeCode}
                onChange={e => props.onChange({ roomTypeCode: e.target.value })}
                onBlur={props.onPersist}
                className={inputCls}
              >
                <option value="">Select…</option>
                {roomTypes.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Condition</label>
              <select
                value={room.conditionCode}
                onChange={e => props.onChange({ conditionCode: e.target.value })}
                onBlur={props.onPersist}
                className={inputCls}
              >
                <option value="">Set by AI</option>
                {conditionLevels.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sort #</label>
              <input
                value={index + 1}
                readOnly
                className={inputCls + ' text-center'}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className={labelCls}>Notes</label>
            <textarea
              value={room.notes}
              onChange={e => props.onChange({ notes: e.target.value })}
              onBlur={props.onPersist}
              rows={2}
              className={inputCls + ' resize-none'}
              placeholder="Existing damage, access notes, anything important…"
            />
          </div>

          {/* Upload + camera */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#D4860A' }}
            >
              <Upload size={13} /> Upload
            </button>
            <input
              ref={uploadRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={e => {
                if (e.target.files) props.onAddFiles(Array.from(e.target.files))
                e.currentTarget.value = ''
              }}
            />
            <button
              type="button"
              onClick={props.onOpenCamera}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border"
              style={{ borderColor: '#D4860A', color: '#D4860A', background: 'rgba(212,134,10,0.06)' }}
            >
              <Camera size={13} /> Camera
            </button>
            <span className="text-[10px] text-[#8B3A2A]/70 ml-auto">
              {room.media.length} file{room.media.length === 1 ? '' : 's'}
            </span>
          </div>

          {room.media.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
              {room.media.map((m, mIdx) => (
                <MediaTile
                  key={m.localId}
                  m={m}
                  onRemove={() => props.onRemoveMedia(mIdx)}
                  onCaption={c => props.onMediaCaption(mIdx, c)}
                  onRetry={() => props.onRetryMedia(mIdx)}
                />
              ))}
            </div>
          )}

          {/* Items */}
          <div className="rounded-xl p-3 mt-3" style={{ background: 'rgba(255,255,255,0.4)', border: '1px dashed rgba(212,134,10,0.25)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#8B3A2A]">Items in this room (optional)</p>
              <button
                type="button"
                onClick={props.onAddItem}
                className="text-xs text-[#D4860A] inline-flex items-center gap-1 hover:text-[#F0A830]"
              >
                <Plus size={12} /> Add item
              </button>
            </div>
            {room.items.length === 0 && (
              <p className="text-[10px] text-[#8B3A2A]/60">Add appliances or fixtures you want to inventory individually.</p>
            )}
            <div className="space-y-2">
              {room.items.map((it, ii) => (
                <ItemRow
                  key={it.localId}
                  item={it}
                  itemTypes={itemTypes}
                  conditionLevels={conditionLevels}
                  onChange={patch => props.onUpdateItem(ii, patch)}
                  onPersist={() => props.onPersistItem(ii)}
                  onRemove={() => props.onRemoveItem(ii)}
                  onAddFiles={files => props.onAddItemFiles(ii, files)}
                  onOpenCamera={() => props.onOpenItemCamera(ii)}
                  onRemoveMedia={mIdx => props.onRemoveItemMedia(ii, mIdx)}
                  onMediaCaption={(mIdx, c) => props.onItemMediaCaption(ii, mIdx, c)}
                  onRetryMedia={mIdx => props.onRetryItemMedia(ii, mIdx)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Item row ─────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: Item
  itemTypes: LookupRow[]
  conditionLevels: LookupRow[]
  onChange: (patch: Partial<Item>) => void
  onPersist: () => void
  onRemove: () => void
  onAddFiles: (files: File[]) => void
  onOpenCamera: () => void
  onRemoveMedia: (mIdx: number) => void
  onMediaCaption: (mIdx: number, caption: string) => void
  onRetryMedia: (mIdx: number) => void
}

function ItemRow(props: ItemRowProps) {
  const { item, itemTypes, conditionLevels } = props
  const uploadRef = useRef<HTMLInputElement | null>(null)
  return (
    <div className="rounded-lg p-3 bg-white/70" style={{ border: '1px solid rgba(212,134,10,0.18)' }}>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
        <select
          value={item.itemTypeCode}
          onChange={e => props.onChange({ itemTypeCode: e.target.value })}
          onBlur={props.onPersist}
          className={inputCls + ' col-span-2 sm:col-span-1'}
        >
          <option value="">Type…</option>
          {itemTypes.map(it => <option key={it.code} value={it.code}>{it.label}</option>)}
        </select>
        <input
          value={item.itemLabel}
          onChange={e => props.onChange({ itemLabel: e.target.value })}
          onBlur={props.onPersist}
          className={inputCls + ' col-span-2'}
          placeholder="Custom label (optional)"
        />
        <input
          type="number"
          min={1}
          value={item.quantity}
          onChange={e => props.onChange({ quantity: Math.max(1, Number(e.target.value || 1)) })}
          onBlur={props.onPersist}
          className={inputCls + ' text-center'}
        />
        <select
          value={item.conditionCode}
          onChange={e => props.onChange({ conditionCode: e.target.value })}
          onBlur={props.onPersist}
          className={inputCls}
        >
          <option value="">Condition</option>
          {conditionLevels.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>
      <textarea
        value={item.notes}
        onChange={e => props.onChange({ notes: e.target.value })}
        onBlur={props.onPersist}
        rows={1}
        className={inputCls + ' resize-none mb-2 text-xs'}
        placeholder="Notes (model, serial, defects)…"
      />
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <button
          type="button"
          onClick={() => uploadRef.current?.click()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-white"
          style={{ background: '#D4860A' }}
        >
          <Upload size={11} /> Upload
        </button>
        <input
          ref={uploadRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={e => {
            if (e.target.files) props.onAddFiles(Array.from(e.target.files))
            e.currentTarget.value = ''
          }}
        />
        <button
          type="button"
          onClick={props.onOpenCamera}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border"
          style={{ borderColor: '#D4860A', color: '#D4860A' }}
        >
          <Camera size={11} /> Camera
        </button>
        <button
          type="button"
          onClick={props.onRemove}
          className="ml-auto text-[#8B3A2A]/60 hover:text-red-600"
          title="Remove item"
        >
          <Trash2 size={12} />
        </button>
      </div>
      {item.media.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {item.media.map((m, mIdx) => (
            <MediaTile
              key={m.localId}
              m={m}
              compact
              onRemove={() => props.onRemoveMedia(mIdx)}
              onCaption={c => props.onMediaCaption(mIdx, c)}
              onRetry={() => props.onRetryMedia(mIdx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Media tile (with upload state) ───────────────────────────────────────────

function MediaTile({ m, onRemove, onCaption, onRetry, compact }: {
  m: MediaItem
  onRemove: () => void
  onCaption: (caption: string) => void
  onRetry: () => void
  compact?: boolean
}) {
  const isVideo = m.mediaTypeCode === 'video' || m.file?.type.startsWith('video/')
  return (
    <div className="relative rounded-lg overflow-hidden bg-white/60" style={{ border: '1px solid rgba(212,134,10,0.2)' }}>
      <div className="aspect-square relative bg-[rgba(212,134,10,0.08)]">
        {isVideo ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileVideo size={20} className="text-[#D4860A]" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {m.uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 size={16} className="text-white animate-spin" />
          </div>
        )}
        {m.uploadError && (
          <div className="absolute inset-0 bg-red-700/60 flex flex-col items-center justify-center text-white text-[9px] text-center px-1">
            <AlertTriangle size={14} className="mb-0.5" />
            Failed
            <button type="button" onClick={onRetry} className="mt-0.5 underline">Retry</button>
          </div>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center text-white"
          aria-label="Remove media"
        >
          <Trash2 size={10} />
        </button>
      </div>
      {!compact && (
        <input
          value={m.caption}
          onChange={e => onCaption(e.target.value)}
          placeholder="Caption…"
          className="w-full px-2 py-1 text-[10px] border-t bg-white/80 text-[#2C1F14] outline-none"
          style={{ borderColor: 'rgba(212,134,10,0.2)' }}
        />
      )}
    </div>
  )
}

function ThumbPreview({ m }: { m: MediaItem }) {
  const isVideo = m.mediaTypeCode === 'video'
  return (
    <div className="w-12 h-12 rounded overflow-hidden relative" style={{ border: '1px solid rgba(212,134,10,0.25)' }}>
      {isVideo
        ? <div className="w-full h-full flex items-center justify-center bg-[rgba(212,134,10,0.08)]"><FileVideo size={14} className="text-[#D4860A]" /></div>
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />}
    </div>
  )
}

// Avoid TS6133 'ImageIcon' unused
void ImageIcon
