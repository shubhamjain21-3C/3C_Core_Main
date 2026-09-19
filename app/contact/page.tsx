import type { Metadata } from 'next'
import { Mail, Phone, MapPin } from 'lucide-react'
import { ServicePageHeader } from '@/components/layout/ServicePageHeader'
import { ComingSoonWidget } from '@/components/ui/ComingSoonWidget'
import { ContactForm } from '@/components/forms/ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the 3C Core team.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#FFF8EE 0%,#FDE8B0 60%,#F5C060 100%)' }}>
      <ServicePageHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="font-heading font-bold text-[#2C1F14] text-3xl sm:text-4xl">Contact 3C Core</h1>
          <p className="mt-2 text-[#8B3A2A]">We&apos;d love to hear from you</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,134,10,0.2)' }}>
              <ContactForm />
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,134,10,0.2)' }}>
              <h2 className="font-heading font-semibold text-[#D4860A] text-lg mb-4">Contact Information</h2>
              <div className="space-y-3 text-sm text-[#2C1F14]">
                <p className="flex items-center gap-2"><Mail size={14} className="text-[#D4860A] shrink-0" /><a href="mailto:contactus@3ccore.com" className="text-[#D4860A] underline">contactus@3ccore.com</a></p>
                <p className="flex items-center gap-2"><Phone size={14} className="text-[#D4860A] shrink-0" /><a href="tel:07852254792" className="text-[#D4860A] underline">07852254792</a></p>
                <p className="flex items-start gap-2"><MapPin size={14} className="text-[#D4860A] shrink-0 mt-0.5" />60 Tottenham Court Road, London, England, W1T 2EW</p>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,134,10,0.2)' }}>
              <h2 className="font-heading font-semibold text-[#D4860A] text-lg mb-4">Office Hours</h2>
              <div className="space-y-1.5 text-sm text-[#2C1F14]">
                <p>Monday – Friday: 9:00am – 6:00pm</p>
                <p>Saturday: 10:00am – 4:00pm</p>
                <p>Sunday: Closed</p>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'rgba(139,58,42,0.06)', border: '1px solid rgba(139,58,42,0.2)' }}>
              <p className="text-xs text-[#8B3A2A] leading-relaxed">
                <strong>Formal Complaints:</strong> Email us with subject line &quot;Formal Complaint&quot;. We acknowledge within 3 business days and aim to resolve within 8 weeks.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ComingSoonWidget />
    </div>
  )
}
