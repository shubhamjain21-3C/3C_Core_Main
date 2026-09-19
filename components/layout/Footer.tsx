import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail } from 'lucide-react'
import { NAV_LINKS, COMPANY_PHONE, COMPANY_EMAIL, COMPANY_ADDRESS } from '@/lib/constants'
import { services } from '@/data/services'

export function Footer() {
  return (
    <footer className="bg-[#2C1F14] border-t border-[#5C3D28] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/">
              <Image
                src="/logo/3CCore_Logo_Compact_Header.svg"
                alt="3C Core"
                width={200}
                height={40}
                className="h-10 w-auto opacity-85 mb-4"
              />
            </Link>
            <p className="text-[#B89060] text-sm leading-relaxed mb-6">
              Professional property management built on trust, precision, and lasting results.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wide mb-4">Navigation</h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[#B89060] text-sm hover:text-[#F0A830] transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wide mb-4">Services</h3>
            <ul className="space-y-2.5">
              {services.map(s => (
                <li key={s.id}>
                  <Link href={`/services/${s.slug}`} className="text-[#B89060] text-sm hover:text-[#F0A830] transition-colors duration-200">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wide mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-[#B89060]">
                <MapPin size={14} className="mt-0.5 flex-shrink-0 text-[#D4860A]" />
                <span>{COMPANY_ADDRESS}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-[#B89060]">
                <Phone size={14} className="flex-shrink-0 text-[#D4860A]" />
                <a href={`tel:${COMPANY_PHONE}`} className="hover:text-[#F0A830] transition-colors">{COMPANY_PHONE}</a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-[#B89060]">
                <Mail size={14} className="flex-shrink-0 text-[#D4860A]" />
                <a href={`mailto:${COMPANY_EMAIL}`} className="hover:text-[#F0A830] transition-colors">{COMPANY_EMAIL}</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#5C3D28] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[#D4860A] text-xs">© {new Date().getFullYear()} 3C Core Ltd. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-[#D4860A]">
            <Link href="/legal/privacy-and-terms" className="hover:text-[#B89060] transition-colors">Privacy Policy</Link>
            <Link href="/legal/privacy-and-terms" className="hover:text-[#B89060] transition-colors">Terms of Use</Link>
            <Link href="/legal/cookies" className="hover:text-[#B89060] transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
