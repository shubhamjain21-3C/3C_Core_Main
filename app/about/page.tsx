import type { Metadata } from 'next'
import { Mail, Phone, MapPin, Handshake, CheckCircle, Trophy } from 'lucide-react'
import { ServicePageHeader } from '@/components/layout/ServicePageHeader'
import { ComingSoonWidget } from '@/components/ui/ComingSoonWidget'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'About 3C Core Ltd. — Connected, Consistent, Confident.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#FFF8EE 0%,#FDE8B0 60%,#F5C060 100%)' }}>
      <ServicePageHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="font-heading font-bold text-[#2C1F14] text-4xl sm:text-5xl">About 3C Core</h1>
          <p className="mt-3 text-[#D4860A] font-medium text-lg tracking-wide">Connected. Consistent. Confident.</p>
        </div>

        {/* Who We Are */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,134,10,0.2)' }}>
          <h2 className="font-heading font-semibold text-[#D4860A] text-2xl mb-4">Who We Are</h2>
          <p className="text-[#2C1F14] leading-relaxed mb-4">3C Core Ltd. is a UK-based property services company providing:</p>
          <ul className="space-y-2 text-[#2C1F14] mb-6">
            {['Inventory services (check-in, check-out, midterm inspections)', 'Dispute resolution (landlord-tenant mediation)', 'Property maintenance and compliance', 'Deposit negotiation services'].map(s => (
              <li key={s} className="flex items-start gap-2 text-sm"><span className="text-[#D4860A] mt-0.5">•</span>{s}</li>
            ))}
          </ul>
          <div className="text-sm text-[#8B3A2A] space-y-0.5">
            <p>Registered in England and Wales · Companies House No: 17050206</p>
            <p>Registered Address: 60 Tottenham Court Road, London, England, W1T 2EW</p>
          </div>
        </div>

        {/* Mission */}
        <div className="rounded-2xl p-8 mb-8 text-center" style={{ background: 'rgba(212,134,10,0.08)', border: '1px solid rgba(212,134,10,0.3)' }}>
          <h2 className="font-heading font-semibold text-[#D4860A] text-2xl mb-4">Our Mission</h2>
          <p className="text-[#2C1F14] text-lg leading-relaxed italic">
            &quot;To provide property services that people can finally trust — connected to our clients, consistent in our standards, and confident in our delivery.&quot;
          </p>
        </div>

        {/* Values */}
        <h2 className="font-heading font-semibold text-[#D4860A] text-2xl mb-6 text-center">Our Values</h2>
        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          {VALUES.map(v => (
            <div key={v.title} className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(212,134,10,0.2)' }}>
              <div className="flex justify-center mb-3"><v.Icon size={32} className="text-[#D4860A]" /></div>
              <h3 className="font-heading font-bold text-[#2C1F14] text-xl mb-2">{v.title}</h3>
              <p className="text-sm text-[#8B3A2A] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="rounded-2xl p-6 mb-10 text-center" style={{ background: 'rgba(45,80,22,0.06)', border: '1px solid rgba(45,80,22,0.2)' }}>
          <h2 className="font-heading font-semibold text-[#2D5016] text-xl mb-2">Coming Soon</h2>
          <p className="text-sm text-[#2C1F14]">We are continuously expanding our services. Stay tuned for new inventory tools, subscription plans and more.</p>
        </div>

        {/* Contact */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,134,10,0.2)' }}>
          <h2 className="font-heading font-semibold text-[#D4860A] text-xl mb-4">Contact Details</h2>
          <div className="space-y-2 text-sm text-[#2C1F14]">
            <p className="flex items-center gap-2"><Mail size={14} className="text-[#D4860A] shrink-0" /><a href="mailto:contactus@3ccore.com" className="text-[#D4860A] underline">contactus@3ccore.com</a></p>
            <p className="flex items-center gap-2"><Phone size={14} className="text-[#D4860A] shrink-0" /><a href="tel:07852254792" className="text-[#D4860A] underline">07852254792</a></p>
            <p className="flex items-start gap-2"><MapPin size={14} className="text-[#D4860A] shrink-0 mt-0.5" />60 Tottenham Court Road, London, England, W1T 2EW</p>
          </div>
        </div>
      </div>

      <ComingSoonWidget />
    </div>
  )
}

const VALUES = [
  { Icon: Handshake, title: 'Connected', desc: 'We build genuine relationships between landlords, tenants, and property professionals.' },
  { Icon: CheckCircle, title: 'Consistent', desc: 'Every inspection, report, and mediation is carried out to the same high standard.' },
  { Icon: Trophy, title: 'Confident', desc: 'We are transparent, compliant, and backed by UK property law expertise.' },
]
