'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ServicePageHeader } from '@/components/layout/ServicePageHeader'
import { ComingSoonWidget } from '@/components/ui/ComingSoonWidget'
import { ServiceBookingForm } from '@/components/booking/ServiceBookingForm'
import { Wand2, UserCheck, ArrowRight, ArrowLeft } from 'lucide-react'

function InventoryChooser() {
  const router = useRouter()
  const params = useSearchParams()
  const [bookingOpen, setBookingOpen] = useState(false)

  const role = params.get('role') ?? (typeof window !== 'undefined' ? sessionStorage.getItem('3c_user_role') : null) ?? ''
  const backHref = role ? `/services?role=${role}` : '/services'

  // Persist any incoming role so deep links keep the journey state
  useEffect(() => {
    const roleParam = params.get('role')
    if (roleParam && typeof window !== 'undefined') {
      sessionStorage.setItem('3c_user_role', roleParam)
    }
  }, [params])

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#FFF8EE 0%,#FDE8B0 50%,#F5C060 100%)' }}>
      <ServicePageHeader />

      {/* Hero */}
      <div className="relative px-6 py-10 text-center overflow-hidden" style={{ borderBottom: '1px solid rgba(212,134,10,0.2)' }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url('/assets/images/homepage_3c.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative">
          <h1 className="font-heading font-bold text-[#2C1F14] text-3xl sm:text-4xl">
            Inventory Management
          </h1>
          <p className="mt-2 text-[#8B3A2A] text-base sm:text-lg">
            Professional property inventories — clear, structured, digitally delivered
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-[#8B3A2A] hover:text-[#D4860A] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Services
        </Link>

        <p className="text-center text-[#2C1F14] text-sm mb-8 max-w-xl mx-auto leading-relaxed">
          How would you like to create your inventory report? You can build it yourself with our online
          tool, or book a qualified inventory agent to attend the property.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* DIY */}
          <button
            type="button"
            onClick={() => router.push('/services/inventory/diy')}
            className="text-left rounded-2xl p-6 transition-all"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1.5px solid rgba(212,134,10,0.35)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#D4860A'
              e.currentTarget.style.background = 'rgba(255,255,255,0.9)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(212,134,10,0.35)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.7)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(212,134,10,0.15)' }}>
              <Wand2 size={20} className="text-[#D4860A]" />
            </div>
            <h2 className="font-heading font-semibold text-[#2C1F14] text-lg mb-2">Do It Yourself</h2>
            <p className="text-sm text-[#8B3A2A] leading-relaxed mb-4">
              Add room photos and notes, review everything, and download a professional PDF report. AI-assisted write-up is coming soon.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#D4860A]">
              Start a report <ArrowRight size={14} />
            </span>
          </button>

          {/* Book an Agent */}
          <button
            type="button"
            onClick={() => setBookingOpen(true)}
            className="text-left rounded-2xl p-6 transition-all"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1.5px solid rgba(212,134,10,0.35)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#D4860A'
              e.currentTarget.style.background = 'rgba(255,255,255,0.9)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(212,134,10,0.35)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.7)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(212,134,10,0.15)' }}>
              <UserCheck size={20} className="text-[#D4860A]" />
            </div>
            <h2 className="font-heading font-semibold text-[#2C1F14] text-lg mb-2">Book an Agent</h2>
            <p className="text-sm text-[#8B3A2A] leading-relaxed mb-4">
              A qualified inventory agent attends the property and delivers a full written report with timestamped photos.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#D4860A]">
              Book an agent <ArrowRight size={14} />
            </span>
          </button>
        </div>
      </div>

      <ServiceBookingForm
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        serviceCode="inventory"
        serviceLabel="Inventory Management"
        heading="Book an Inventory Agent"
        subheading="A qualified agent will attend the property and produce a full inventory report."
        submitLabel="Submit Booking"
      />

      <ComingSoonWidget />
    </div>
  )
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF8EE]" />}>
      <InventoryChooser />
    </Suspense>
  )
}
