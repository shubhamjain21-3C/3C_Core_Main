import type { Service } from '@/types'

/**
 * The services 3C Core actually offers today. Each slug maps to a real page
 * under app/services/<slug>. Do not add entries for services we do not provide.
 */
export const services: Service[] = [
  { id: '1', slug: 'inventory',            title: 'Inventory Management' },
  { id: '2', slug: 'maintenance',          title: 'Maintenance & Cleaning' },
  { id: '3', slug: 'midterm-inspections',  title: 'Midterm Property Inspection' },
  { id: '4', slug: 'dispute-resolution',   title: 'Dispute Resolution' },
  { id: '5', slug: 'deposit-negotiation',  title: 'Deposit Negotiation' },
  { id: '6', slug: 'letting-services',     title: 'Letting Services' },
]
