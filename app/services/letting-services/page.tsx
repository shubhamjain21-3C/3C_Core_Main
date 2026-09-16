'use client'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, BedDouble, Bath, MapPin, CalendarClock, PhoneCall, Home } from 'lucide-react'
import { ServicePageHeader } from '@/components/layout/ServicePageHeader'
import { ComingSoonWidget } from '@/components/ui/ComingSoonWidget'
import { ServiceBookingForm } from '@/components/booking/ServiceBookingForm'

interface AvailableListing {
  letting_id:         string
  property_id:        string
  address_line1:      string
  address_line2:      string | null
  city:               string
  postcode:           string
  bedrooms:           number
  bathrooms:          number
  asking_rent:        number | null
  available_from:     string | null
  description:        string | null
  min_tenancy_months: number | null
  property_type:      string | null
  furnished:          string | null
}

function LettingServicesContent() {
  const params = useSearchParams()
  const role = params.get('role') ?? (typeof window !== 'undefined' ? sessionStorage.getItem('3c_user_role') : null) ?? ''
  const backHref = role ? `/services?role=${role}` : '/services'

  const [listings, setListings] = useState<AvailableListing[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [focusedListing, setFocusedListing] = useState<AvailableListing | null>(null)

  useEffect(() => {
    const roleParam = params.get('role')
    if (roleParam && typeof window !== 'undefined') {
      sessionStorage.setItem('3c_user_role', roleParam)
    }
  }, [params])

  useEffect(() => {
    fetch('/api/lettings/available')
      .then(r => r.ok ? r.json() : { listings: [] })
      .then(data => setListings(Array.isArray(data.listings) ? data.listings : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [])

  function openCallback(listing?: AvailableListing) {
    setFocusedListing(listing ?? null)
    setBookingOpen(true)
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#FFF8EE 0%,#FDE8B0 60%,#F5C060 100%)' }}>
      <ServicePageHeader />

      {/* Hero */}
      <div className="relative px-6 py-10 text-center overflow-hidden" style={{ borderBottom: '1px solid rgba(212,134,10,0.2)' }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "url('/assets/images/homepage_3c.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative">
          <h1 className="font-heading font-bold text-[#2C1F14] text-3xl sm:text-4xl">Letting Services</h1>
          <p className="mt-2 text-[#8B3A2A] text-base">
            Available properties — short-term, long-term, and student lets
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-[#8B3A2A] hover:text-[#D4860A] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Services
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="font-heading font-bold text-[#2C1F14] text-xl">Currently Available</h2>
            <p className="text-xs text-[#8B3A2A] mt-1">
              See something you like? Schedule a callback and our team will arrange a viewing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCallback()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: '#D4860A' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F0A830' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#D4860A' }}
          >
            <PhoneCall size={14} />
            Schedule a Callback
          </button>
        </div>

        {loading && (
          <div className="text-center py-12 text-sm text-[#8B3A2A]">Loading available properties…</div>
        )}

        {!loading && listings.length === 0 && (
          <div className="text-center py-14 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px dashed rgba(212,134,10,0.3)' }}>
            <Home size={32} className="text-[#D4860A] mx-auto mb-3" />
            <p className="text-sm text-[#2C1F14] font-medium">No properties are listed right now.</p>
            <p className="text-xs text-[#8B3A2A] mt-1 mb-4">Contact us and we&apos;ll help you search.</p>
            <button
              type="button"
              onClick={() => openCallback()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#D4860A' }}
            >
              <PhoneCall size={13} /> Schedule a Callback
            </button>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(l => (
              <div
                key={l.letting_id}
                className="rounded-2xl p-5 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(212,134,10,0.3)',
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-heading font-semibold text-[#2C1F14] text-base leading-tight">
                      {l.address_line1}
                      {l.address_line2 && <span className="block text-xs font-normal text-[#8B3A2A] mt-0.5">{l.address_line2}</span>}
                    </h3>
                    <p className="flex items-center gap-1 text-[11px] text-[#8B3A2A] mt-1">
                      <MapPin size={11} /> {l.city}, {l.postcode}
                    </p>
                  </div>
                  {l.property_type && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: 'rgba(212,134,10,0.15)', color: '#D4860A' }}>
                      {l.property_type}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#2C1F14] mb-2">
                  <span className="flex items-center gap-1"><BedDouble size={12} className="text-[#D4860A]" /> {l.bedrooms} bed</span>
                  <span className="flex items-center gap-1"><Bath size={12} className="text-[#D4860A]" /> {l.bathrooms} bath</span>
                  {l.min_tenancy_months && (
                    <span className="flex items-center gap-1">
                      <CalendarClock size={12} className="text-[#D4860A]" /> {l.min_tenancy_months} mo min
                    </span>
                  )}
                </div>

                {l.asking_rent && (
                  <p className="text-base font-bold text-[#D4860A] mb-2">
                    £{l.asking_rent.toLocaleString()}
                    <span className="text-[10px] font-medium text-[#8B3A2A] ml-1">pcm</span>
                  </p>
                )}

                {l.description && (
                  <p className="text-xs text-[#2C1F14] leading-relaxed mb-3 line-clamp-3 flex-1">
                    {l.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[rgba(212,134,10,0.2)]">
                  <span className="text-[10px] text-[#8B3A2A]">
                    {l.furnished || (l.available_from ? `Avail. ${l.available_from}` : 'Available now')}
                  </span>
                  <button
                    type="button"
                    onClick={() => openCallback(l)}
                    className="text-xs font-semibold text-[#D4860A] hover:text-[#F0A830] transition-colors"
                  >
                    Schedule callback →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-xs text-[#8B3A2A] text-center max-w-2xl mx-auto leading-relaxed">
          3C Core acts as a letting agent in compliance with the Tenant Fees Act 2019, Housing Act 1988, and all applicable UK letting legislation.
          No tenant fees for tenants and students — our fee is charged to the landlord only.
        </p>
      </div>

      <ServiceBookingForm
        open={bookingOpen}
        onClose={() => { setBookingOpen(false); setFocusedListing(null) }}
        serviceCode="letting"
        serviceLabel="Letting Services"
        heading={focusedListing ? `Callback — ${focusedListing.address_line1}` : 'Schedule a Callback'}
        subheading={focusedListing
          ? `We'll arrange a viewing or answer questions about ${focusedListing.address_line1}, ${focusedListing.postcode}.`
          : 'Tell us what you’re looking for and the best time to reach you.'}
        submitLabel="Request Callback"
      />

      <ComingSoonWidget />
    </div>
  )
}

export default function LettingServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF8EE]" />}>
      <LettingServicesContent />
    </Suspense>
  )
}
