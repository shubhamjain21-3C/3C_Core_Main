/**
 * In-memory data store — DEMO / PROTOTYPE ONLY
 * ─────────────────────────────────────────────
 * 9 test users: Shubham, Irfan & Adamya × 3 roles (property_manager, tenant, student)
 *
 * The demo users, properties and services below are seeded ONLY when
 * ENABLE_DEMO_ACCOUNTS === 'true'. The flag is never set in production, so the
 * store starts empty there: demo credentials cannot log in and the portals show
 * empty states instead of fictional data.
 */

import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import type { PortalUser, Property, CustomerService } from '@/types'

// ── Password hashing ────────────────────────────────────────────────────────
// Real customer passwords use bcrypt (cost factor 12 — ~150 ms per hash on
// Vercel's Node runtime; fine for login, expensive for attackers).
//
// `legacyHash` is the original sha256(pw + salt) scheme. It's kept so that:
//   1. The 9 seeded in-memory demo accounts (Shubham/Irfan/Adamya × roles)
//      still work without re-seeding on every cold start.
//   2. Any production user who registered before bcrypt was wired up still
//      logs in — `verifyPassword` detects the old format and the auth flow
//      re-hashes the password with bcrypt on success (lazy migration —
//      see lib/auth.ts customer-login provider).

const legacyHash = (pw: string) =>
  createHash('sha256').update(pw + 'salt_3ccore').digest('hex')

const BCRYPT_COST = 12

/**
 * Demo seed switch. Default OFF — set ENABLE_DEMO_ACCOUNTS=true in local/dev
 * environments only. Must never be set on Vercel Production.
 */
export const ENABLE_DEMO_ACCOUNTS = process.env.ENABLE_DEMO_ACCOUNTS === 'true'

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, BCRYPT_COST)
}

export async function verifyPassword(plain: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false
  // bcrypt hashes always start with $2a$, $2b$, or $2y$
  if (stored.startsWith('$2')) {
    try { return await bcrypt.compare(plain, stored) } catch { return false }
  }
  // Legacy sha256 — timing-safe compare to avoid leaking bytes
  const computed = legacyHash(plain)
  if (computed.length !== stored.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ stored.charCodeAt(i)
  return diff === 0
}

export function isLegacyHash(stored: string | null | undefined): boolean {
  if (!stored) return false
  return !stored.startsWith('$2')
}

/**
 * @deprecated Use `hashPassword` (bcrypt). Kept as an alias only so the seeded
 *   demo accounts and the legacy-verify path continue to compile.
 */
export const hash = legacyHash

// ── Users ──────────────────────────────────────────────────────────────────────

const demoUsers: Array<[string, PortalUser]> = [

  // ── Property Managers ──────────────────────────────────────────────────────
  ['user-shubham-pm', {
    id: 'user-shubham-pm',
    name: 'Demo property manager 1',
    email: 'shubham.pm@3ccore.com',
    passwordHash: hash('Shubham@123'),
    role: 'customer',
    portalRole: 'property_manager',
    createdAt: '2026-03-02',
  }],
  ['user-irfan-pm', {
    id: 'user-irfan-pm',
    name: 'Demo property manager 2',
    email: 'irfan.pm@3ccore.com',
    passwordHash: hash('Irfan@123'),
    role: 'customer',
    portalRole: 'property_manager',
    createdAt: '2026-03-03',
  }],
  ['user-adamya-pm', {
    id: 'user-adamya-pm',
    name: 'Demo property manager 3',
    email: 'adamya.pm@3ccore.com',
    passwordHash: hash('Adamya@123'),
    role: 'customer',
    portalRole: 'property_manager',
    createdAt: '2026-03-04',
  }],

  // ── Tenants ────────────────────────────────────────────────────────────────
  ['user-shubham-tenant', {
    id: 'user-shubham-tenant',
    name: 'Demo tenant 1',
    email: 'shubham.tenant@3ccore.com',
    passwordHash: hash('Shubham@123'),
    role: 'customer',
    portalRole: 'tenant',
    createdAt: '2026-03-05',
  }],
  ['user-irfan-tenant', {
    id: 'user-irfan-tenant',
    name: 'Demo tenant 2',
    email: 'irfan.tenant@3ccore.com',
    passwordHash: hash('Irfan@123'),
    role: 'customer',
    portalRole: 'tenant',
    createdAt: '2026-03-06',
  }],
  ['user-adamya-tenant', {
    id: 'user-adamya-tenant',
    name: 'Demo tenant 3',
    email: 'adamya.tenant@3ccore.com',
    passwordHash: hash('Adamya@123'),
    role: 'customer',
    portalRole: 'tenant',
    createdAt: '2026-03-07',
  }],

  // ── Students ───────────────────────────────────────────────────────────────
  ['user-shubham-student', {
    id: 'user-shubham-student',
    name: 'Demo student 1',
    email: 'shubham.student@3ccore.com',
    passwordHash: hash('Shubham@123'),
    role: 'customer',
    portalRole: 'student',
    createdAt: '2026-03-08',
  }],
  ['user-irfan-student', {
    id: 'user-irfan-student',
    name: 'Demo student 2',
    email: 'irfan.student@3ccore.com',
    passwordHash: hash('Irfan@123'),
    role: 'customer',
    portalRole: 'student',
    createdAt: '2026-03-09',
  }],
  ['user-adamya-student', {
    id: 'user-adamya-student',
    name: 'Demo student 3',
    email: 'adamya.student@3ccore.com',
    passwordHash: hash('Adamya@123'),
    role: 'customer',
    portalRole: 'student',
    createdAt: '2026-03-10',
  }],
]

export const users = new Map<string, PortalUser>(ENABLE_DEMO_ACCOUNTS ? demoUsers : [])

export const findUserByEmail = (email: string) =>
  Array.from(users.values()).find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null

export const createUser = (data: Omit<PortalUser, 'id' | 'createdAt'>): PortalUser => {
  const id = `user-${Date.now()}`
  const user: PortalUser = { ...data, id, createdAt: new Date().toISOString().split('T')[0] }
  users.set(id, user)
  return user
}

// Update an existing user's password hash by email (used by forgot-password flow)
export const updateUserPasswordByEmail = (email: string, passwordHash: string): boolean => {
  const user = findUserByEmail(email)
  if (!user) return false
  user.passwordHash = passwordHash
  users.set(user.id, user)
  return true
}

// ── Properties ────────────────────────────────────────────────────────────────

const demoProperties: Array<[string, Property]> = [

  // Placeholder records for local testing only. Addresses and postcodes are
  // deliberately not real locations.

  ['prop-1', {
    id: 'prop-1', customerId: 'user-shubham-pm',
    address: 'Demo property 1', postcode: 'DEMO',
    type: 'Residential', bedrooms: 2, monthlyRent: 1850,
    status: 'Occupied', serviceIds: ['inventory', 'midterm-inspections', 'maintenance'],
    createdAt: '2026-03-11',
  }],
  ['prop-2', {
    id: 'prop-2', customerId: 'user-shubham-pm',
    address: 'Demo property 2', postcode: 'DEMO',
    type: 'Residential', bedrooms: 1, monthlyRent: 1400,
    status: 'Occupied', serviceIds: ['inventory'],
    createdAt: '2026-03-12',
  }],
  ['prop-3', {
    id: 'prop-3', customerId: 'user-shubham-pm',
    address: 'Demo property 3', postcode: 'DEMO',
    type: 'HMO', bedrooms: 5, monthlyRent: 3600,
    status: 'Occupied', serviceIds: ['midterm-inspections', 'maintenance'],
    createdAt: '2026-03-13',
  }],
  ['prop-4', {
    id: 'prop-4', customerId: 'user-irfan-pm',
    address: 'Demo property 4', postcode: 'DEMO',
    type: 'Commercial', bedrooms: 0, monthlyRent: 5200,
    status: 'Occupied', serviceIds: ['inventory'],
    createdAt: '2026-03-14',
  }],
  ['prop-5', {
    id: 'prop-5', customerId: 'user-irfan-pm',
    address: 'Demo property 5', postcode: 'DEMO',
    type: 'Residential', bedrooms: 3, monthlyRent: 1600,
    status: 'For Letting', serviceIds: ['letting-services'],
    createdAt: '2026-03-15',
  }],
  ['prop-6', {
    id: 'prop-6', customerId: 'user-adamya-pm',
    address: 'Demo property 6', postcode: 'DEMO',
    type: 'Student', bedrooms: 6, monthlyRent: 4200,
    status: 'Occupied', serviceIds: ['midterm-inspections', 'inventory'],
    createdAt: '2026-03-16',
  }],
  ['prop-7', {
    id: 'prop-7', customerId: 'user-shubham-tenant',
    address: 'Demo property 7', postcode: 'DEMO',
    type: 'Residential', bedrooms: 2, monthlyRent: 1650,
    status: 'Occupied', serviceIds: ['inventory'],
    createdAt: '2026-03-17',
  }],
  ['prop-8', {
    id: 'prop-8', customerId: 'user-irfan-tenant',
    address: 'Demo property 8', postcode: 'DEMO',
    type: 'Residential', bedrooms: 1, monthlyRent: 900,
    status: 'Occupied', serviceIds: ['maintenance'],
    createdAt: '2026-03-18',
  }],
  ['prop-9', {
    id: 'prop-9', customerId: 'user-adamya-tenant',
    address: 'Demo property 9', postcode: 'DEMO',
    type: 'Residential', bedrooms: 1, monthlyRent: 1300,
    status: 'Occupied', serviceIds: ['maintenance'],
    createdAt: '2026-03-19',
  }],
  ['prop-10', {
    id: 'prop-10', customerId: 'user-shubham-student',
    address: 'Demo property 10', postcode: 'DEMO',
    type: 'Student', bedrooms: 1, monthlyRent: 750,
    status: 'Occupied', serviceIds: ['inventory'],
    createdAt: '2026-03-20',
  }],
  ['prop-11', {
    id: 'prop-11', customerId: 'user-irfan-student',
    address: 'Demo property 11', postcode: 'DEMO',
    type: 'Student', bedrooms: 1, monthlyRent: 680,
    status: 'Occupied', serviceIds: ['deposit-negotiation'],
    createdAt: '2026-03-21',
  }],
  ['prop-12', {
    id: 'prop-12', customerId: 'user-adamya-student',
    address: 'Demo property 12', postcode: 'DEMO',
    type: 'Student', bedrooms: 1, monthlyRent: 620,
    status: 'Occupied', serviceIds: ['dispute-resolution'],
    createdAt: '2026-03-22',
  }],
]

export const properties = new Map<string, Property>(ENABLE_DEMO_ACCOUNTS ? demoProperties : [])

export const getPropertiesByCustomer = (customerId: string) =>
  Array.from(properties.values()).filter(p => p.customerId === customerId)

export const createProperty = (data: Omit<Property, 'id' | 'createdAt'>): Property => {
  const id = `prop-${Date.now()}`
  const property: Property = { ...data, id, createdAt: new Date().toISOString().split('T')[0] }
  properties.set(id, property)
  return property
}

export const deleteProperty = (id: string) => properties.delete(id)

// ── Customer Services ─────────────────────────────────────────────────────────

// Neutral placeholder text: demo records must not describe results or outcomes.
const DEMO_BENEFIT = 'Demo record for local testing — not a real service'

const demoCustomerServices: Array<[string, CustomerService]> = [

  ['svc-1', {
    id: 'svc-1', customerId: 'user-shubham-pm', propertyId: 'prop-1',
    serviceName: 'Inventory Management', startDate: '2026-03-11', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-2', {
    id: 'svc-2', customerId: 'user-shubham-pm', propertyId: 'prop-3',
    serviceName: 'Midterm Property Inspection', startDate: '2026-03-13', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-3', {
    id: 'svc-3', customerId: 'user-shubham-pm', propertyId: 'prop-3',
    serviceName: 'Maintenance & Cleaning', startDate: '2026-03-13', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-4', {
    id: 'svc-4', customerId: 'user-irfan-pm', propertyId: 'prop-4',
    serviceName: 'Inventory Management', startDate: '2026-03-14', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-5', {
    id: 'svc-5', customerId: 'user-irfan-pm', propertyId: 'prop-5',
    serviceName: 'Letting Services', startDate: '2026-03-15', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-6', {
    id: 'svc-6', customerId: 'user-adamya-pm', propertyId: 'prop-6',
    serviceName: 'Midterm Property Inspection', startDate: '2026-03-16', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-7', {
    id: 'svc-7', customerId: 'user-adamya-pm', propertyId: 'prop-6',
    serviceName: 'Inventory Management', startDate: '2026-03-16', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-8', {
    id: 'svc-8', customerId: 'user-shubham-tenant', propertyId: 'prop-7',
    serviceName: 'Inventory Management', startDate: '2026-03-17', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-9', {
    id: 'svc-9', customerId: 'user-irfan-tenant', propertyId: 'prop-8',
    serviceName: 'Maintenance & Cleaning', startDate: '2026-03-18', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-10', {
    id: 'svc-10', customerId: 'user-adamya-tenant', propertyId: 'prop-9',
    serviceName: 'Maintenance & Cleaning', startDate: '2026-03-19', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-11', {
    id: 'svc-11', customerId: 'user-shubham-student', propertyId: 'prop-10',
    serviceName: 'Inventory Management', startDate: '2026-03-20', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-12', {
    id: 'svc-12', customerId: 'user-irfan-student', propertyId: 'prop-11',
    serviceName: 'Deposit Negotiation', startDate: '2026-03-21', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
  ['svc-13', {
    id: 'svc-13', customerId: 'user-adamya-student', propertyId: 'prop-12',
    serviceName: 'Dispute Resolution', startDate: '2026-03-22', status: 'Active',
    benefits: [DEMO_BENEFIT],
  }],
]

export const customerServices = new Map<string, CustomerService>(
  ENABLE_DEMO_ACCOUNTS ? demoCustomerServices : [],
)

export const getServicesByCustomer = (customerId: string) =>
  Array.from(customerServices.values()).filter(s => s.customerId === customerId)

export const getAllCustomers = () =>
  Array.from(users.values()).filter(u => u.role === 'customer')
