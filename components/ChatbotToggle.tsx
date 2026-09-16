'use client'
import { useState, useEffect } from 'react'
import { MessageCircle, X, Bot, Sparkles, Clock } from 'lucide-react'

export function ChatbotToggle() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-80 rounded-2xl border border-[#D4860A]/40 bg-[#3A2517] shadow-2xl shadow-[#1e0f05]/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#5C3D28] bg-[#2C1F14]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4860A] to-[#F0A830] flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">3C Core Assistant</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <span className="text-[10px] text-yellow-400">Coming Soon</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#D4860A] hover:text-white transition-colors p-1 rounded"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 text-center">
            {/* Animated icon */}
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full bg-[#D4860A]/20 animate-ping" />
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#2C1F14] border-2 border-[#D4860A]/40">
                <Sparkles size={28} className="text-[#F0A830]" />
              </div>
            </div>

            <h3 className="text-white font-bold font-heading text-lg mb-1">Coming Soon</h3>
            <p className="text-[#F0A830] text-xs uppercase tracking-widest font-medium mb-3">Stay Tuned</p>
            <p className="text-[#B89060] text-sm leading-relaxed mb-5">
              We&apos;re building an assistant to answer property questions. Coming soon.
            </p>

            <div className="bg-[#2C1F14] rounded-xl border border-[#5C3D28] p-4 text-left space-y-2">
              {['Instant answers about your properties', 'Service & compliance guidance', 'Smart rent & maintenance insights'].map(f => (
                <div key={f} className="flex items-start gap-2 text-xs text-[#B89060]">
                  <Clock size={11} className="text-[#D4860A] mt-0.5 shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <p className="mt-4 text-[#D4860A] text-xs">
              We&apos;ll notify you when it&apos;s live.
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        className="fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg shadow-[#1e0f05]/60
          bg-gradient-to-r from-[#D4860A] to-[#F0A830] text-white text-sm font-semibold
          hover:opacity-90 active:scale-95 transition-all duration-200"
      >
        {open
          ? <X size={18} />
          : <MessageCircle size={18} />
        }
        <span className="hidden sm:inline">{open ? 'Close' : 'AI Assistant'}</span>
      </button>
    </>
  )
}
