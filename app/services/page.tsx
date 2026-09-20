'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, User, LogOut, LayoutDashboard } from 'lucide-react'
import { ComingSoonWidget } from '@/components/ui/ComingSoonWidget'

type Role = 'property_manager' | 'landlord' | 'tenant' | 'student' | 'others'

const SERVICE_MATRIX: Record<string, string[]> = {
  property_manager: ['inventory', 'maintenance', 'midterm', 'dispute', 'deposit'],
  landlord:         ['inventory', 'maintenance', 'midterm', 'dispute', 'deposit'],
  tenant:           ['inventory', 'maintenance', 'midterm', 'dispute', 'letting'],
  student:          ['inventory', 'maintenance', 'midterm', 'dispute', 'letting'],
  others:           ['inventory', 'maintenance', 'midterm', 'dispute', 'deposit', 'letting'],
}

const ALL_SERVICES = [
  { id: 'inventory',   label: 'Inventory Management',            href: '/services/inventory' },
  { id: 'maintenance', label: 'Maintenance & Cleaning',           href: '/services/maintenance' },
  { id: 'midterm',     label: 'Midterm Property Inspection',      href: '/services/midterm-inspections' },
  { id: 'dispute',     label: 'Dispute Resolution',               href: '/services/dispute-resolution' },
  { id: 'deposit',     label: 'Deposit Negotiation',              href: '/services/deposit-negotiation' },
  { id: 'letting',     label: 'Letting Services',                 href: '/services/letting-services' },
]

const ROLE_GREETINGS: Record<string, string> = {
  property_manager: 'Welcome, Property Manager',
  landlord:         'Welcome, Landlord',
  tenant:           'Welcome, Tenant',
  student:          'Welcome, Student',
  others:           'Welcome',
}

const FOOTER_LINKS = [
  { label: 'Privacy & Terms', href: '/legal/privacy-and-terms' },
  { label: 'Cookie Settings', href: '/legal/cookies' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
]

function ServicesContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { data: session } = useSession()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const roleParam = params.get('role') as Role | null
  const intent = params.get('intent') ?? 'services'

  const role = roleParam ?? (
    typeof window !== 'undefined' ? (sessionStorage.getItem('3c_user_role') as Role | null) : null
  ) ?? 'property_manager'

  useEffect(() => {
    if (intent === 'letting') {
      router.replace(`/services/letting-services?role=${role}`)
    }
  }, [intent, role, router])

  const allowedIds = SERVICE_MATRIX[role] ?? SERVICE_MATRIX.property_manager
  const visibleServices = ALL_SERVICES.filter(s => allowedIds.includes(s.id))
  const greeting = ROLE_GREETINGS[role] ?? 'Welcome'

  if (intent === 'letting') {
    return (
      <div className="w-screen h-screen bg-[#1e0f05] flex items-center justify-center">
        <p style={{ color: '#F0A830' }}>Redirecting…</p>
      </div>
    )
  }

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('/assets/images/homepage_3c.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(30,15,5,0.52)' }} />
      <div className="ai-grid-overlay" />

      {/* Top bar: back + user */}
      <div className="relative z-20 pt-5 px-5 flex items-center justify-between">
        <Link href={`/what-are-you-looking-for?role=${role}`} className="inline-flex items-center gap-1.5 text-white/70 hover:text-[#F0A830] transition-colors text-sm">
          <ArrowLeft size={15} />
          Change Selection
        </Link>

        {session ? (
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(212,134,10,0.18)', border: '1px solid rgba(240,168,48,0.45)', color: '#F0A830' }}
            >
              <User size={13} />
              {session.user?.name?.split(' ')[0]}
            </button>
            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-44 rounded-xl py-1 shadow-xl"
                style={{ background: '#2C1F14', border: '1px solid rgba(212,134,10,0.3)' }}
              >
                <Link href="/portal/customer/dashboard" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:text-[#F0A830] hover:bg-[rgba(212,134,10,0.1)] transition-colors">
                  <LayoutDashboard size={13} /> My Portal
                </Link>
                <Link href="/portal/customer/account" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:text-[#F0A830] hover:bg-[rgba(212,134,10,0.1)] transition-colors">
                  <User size={13} /> My Account
                </Link>
                <div style={{ borderTop: '1px solid rgba(212,134,10,0.2)', margin: '4px 0' }} />
                <button onClick={() => signOut({ callbackUrl: '/portal' })}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-400/5 transition-colors w-full text-left">
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/portal/login"
            className="text-sm px-3 py-1.5 border border-[#F0A830] text-[#F0A830] rounded hover:bg-[rgba(212,134,10,0.2)] transition-colors">
            Login
          </Link>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center overflow-y-auto py-4 -mt-6">

        {/* Brand */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-3">
          <Link href="/">
            <h1 className="font-heading font-bold text-white text-3xl sm:text-4xl leading-none">3C Core</h1>
            <p className="mt-1 text-[10px] sm:text-xs tracking-[0.18em] uppercase font-medium" style={{ color: '#F0A830' }}>
              Connected&nbsp;|&nbsp;Consistent&nbsp;|&nbsp;Confident
            </p>
          </Link>
        </motion.div>

        {/* Role greeting */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="font-heading font-bold text-white text-xl sm:text-2xl mb-1"
        >
          {greeting}
        </motion.p>


        {/* Services label */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-[11px] tracking-widest uppercase mb-4 font-medium"
          style={{ color: '#F0A830' }}
        >
          Your Services
        </motion.p>

        {/* Service buttons */}
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl">
          {visibleServices.map((svc, i) => (
            <motion.div
              key={svc.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.5 + i * 0.08 }}
            >
              <Link
                href={svc.href}
                className="inline-block px-6 py-3.5 text-sm font-medium text-white rounded-md min-w-[210px]"
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  border: '1.5px solid rgba(240,168,48,0.65)',
                  backdropFilter: 'blur(8px)',
                  letterSpacing: '0.03em',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.background = 'rgba(240,168,48,0.22)'
                  el.style.borderColor = '#F0A830'
                  el.style.color = '#FDE8B0'
                  el.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.background = 'rgba(255,255,255,0.10)'
                  el.style.borderColor = 'rgba(240,168,48,0.65)'
                  el.style.color = 'white'
                  el.style.transform = 'translateY(0)'
                }}
              >
                {svc.label}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* My Dashboard button — only when logged in */}
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-6"
          >
            <Link
              href="/portal/customer/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
              style={{
                background: '#D4860A',
                color: 'white',
                border: '1.5px solid #D4860A',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F0A830'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#F0A830' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#D4860A'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#D4860A' }}
            >
              <LayoutDashboard size={15} />
              My Portal Dashboard
            </Link>
          </motion.div>
        )}
      </div>

      <ComingSoonWidget />

      <motion.footer
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
        className="relative z-10 flex items-center justify-center gap-1 px-4 py-3"
        style={{ background: 'rgba(30,15,5,0.68)' }}
      >
        {FOOTER_LINKS.map((link, i) => (
          <span key={link.href} className="flex items-center gap-1">
            {i > 0 && <span className="text-white/30 text-xs">|</span>}
            <Link href={link.href} className="text-[11px] text-white/75 hover:text-[#F0A830] hover:underline transition-colors">
              {link.label}
            </Link>
          </span>
        ))}
      </motion.footer>

      <style>{`
        .ai-grid-overlay {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(240,168,48,0.08) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none; z-index: 1;
          animation: gridFade 4s ease-in-out infinite alternate;
        }
        @keyframes gridFade { from { opacity: 0.3; } to { opacity: 0.7; } }
      `}</style>
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-[#1e0f05] flex items-center justify-center"><p style={{ color: '#F0A830' }}>Loading…</p></div>}>
      <ServicesContent />
    </Suspense>
  )
}
