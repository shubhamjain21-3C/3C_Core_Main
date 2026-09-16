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
    name: 'Shubham Jain',
    email: 'shubham.pm@3ccore.com',
    passwordHash: hash('Shubham@123'),
    role: 'customer',
    portalRole: 'property_manager',
    company: '3C Core Ltd',
    phone: '+44 7700 000001',
    createdAt: '2024-01-10',
  }],
  ['user-irfan-pm', {
    id: 'user-irfan-pm',
    name: 'Irfan Ahmed',
    email: 'irfan.pm@3ccore.com',
    passwordHash: hash('Irfan@123'),
    role: 'customer',
    portalRole: 'property_manager',
    company: 'Ahmed Properties',
    phone: '+44 7700 000002',
    createdAt: '2024-02-05',
  }],
  ['user-adamya-pm', {
    id: 'user-adamya-pm',
    name: 'Adamya Singh',
    email: 'adamya.pm@3ccore.com',
    passwordHash: hash('Adamya@123'),
    role: 'customer',
    portalRole: 'property_manager',
    company: 'Singh Estates',
    phone: '+44 7700 000003',
    createdAt: '2024-03-01',
  }],

  // ── Tenants ────────────────────────────────────────────────────────────────
  ['user-shubham-tenant', {
    id: 'user-shubham-tenant',
    name: 'Shubham Jain',
    email: 'shubham.tenant@3ccore.com',
    passwordHash: hash('Shubham@123'),
    role: 'customer',
    portalRole: 'tenant',
    phone: '+44 7700 000004',
    createdAt: '2024-01-15',
  }],
  ['user-irfan-tenant', {
    id: 'user-irfan-tenant',
    name: 'Irfan Ahmed',
    email: 'irfan.tenant@3ccore.com',
    passwordHash: hash('Irfan@123'),
    role: 'customer',
    portalRole: 'tenant',
    phone: '+44 7700 000005',
    createdAt: '2024-02-10',
  }],
  ['user-adamya-tenant', {
    id: 'user-adamya-tenant',
    name: 'Adamya Singh',
    email: 'adamya.tenant@3ccore.com',
    passwordHash: hash('Adamya@123'),
    role: 'customer',
    portalRole: 'tenant',
    phone: '+44 7700 000006',
    createdAt: '2024-03-05',
  }],

  // ── Students ───────────────────────────────────────────────────────────────
  ['user-shubham-student', {
    id: 'user-shubham-student',
    name: 'Shubham Jain',
    email: 'shubham.student@3ccore.com',
    passwordHash: hash('Shubham@123'),
    role: 'customer',
    portalRole: 'student',
    phone: '+44 7700 000007',
    createdAt: '2024-01-20',
  }],
  ['user-irfan-student', {
    id: 'user-irfan-student',
    name: 'Irfan Ahmed',
    email: 'irfan.student@3ccore.com',
    passwordHash: hash('Irfan@123'),
    role: 'customer',
    portalRole: 'student',
    phone: '+44 7700 000008',
    createdAt: '2024-02-20',
  }],
  ['user-adamya-student', {
    id: 'user-adamya-student',
    name: 'Adamya Singh',
    email: 'adamya.student@3ccore.com',
    passwordHash: hash('Adamya@123'),
    role: 'customer',
    portalRole: 'student',
    phone: '+44 7700 000009',
    createdAt: '2024-03-10',
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

  // Shubham PM — 3 properties
  ['prop-1', {
    id: 'prop-1', customerId: 'user-shubham-pm',
    address: '14 Maple Avenue', postcode: 'SW1A 1AA',
    type: 'Residential', bedrooms: 2, monthlyRent: 1850,
    status: 'Occupied', serviceIds: ['property-management', 'compliance-legal'],
    createdAt: '2024-01-20',
  }],
  ['prop-2', {
    id: 'prop-2', customerId: 'user-shubham-pm',
    address: '7 Oak Street, Flat 3', postcode: 'E1 6RF',
    type: 'Residential', bedrooms: 1, monthlyRent: 1400,
    status: 'Occupied', serviceIds: ['property-management'],
    createdAt: '2024-02-10',
  }],
  ['prop-3', {
    id: 'prop-3', customerId: 'user-shubham-pm',
    address: '22 Victoria Road', postcode: 'N1 5TQ',
    type: 'HMO', bedrooms: 5, monthlyRent: 3600,
    status: 'Occupied', serviceIds: ['property-management', 'tenant-relations', 'maintenance-facilities', 'compliance-legal'],
    createdAt: '2024-03-05',
  }],

  // Irfan PM — 2 properties
  ['prop-4', {
    id: 'prop-4', customerId: 'user-irfan-pm',
    address: '88 Park Lane', postcode: 'W1K 7TN',
    type: 'Commercial', bedrooms: 0, monthlyRent: 5200,
    status: 'Occupied', serviceIds: ['property-management', 'compliance-legal'],
    createdAt: '2024-02-15',
  }],
  ['prop-5', {
    id: 'prop-5', customerId: 'user-irfan-pm',
    address: '45 Birchwood Close', postcode: 'M14 6GH',
    type: 'Residential', bedrooms: 3, monthlyRent: 1600,
    status: 'For Letting', serviceIds: ['lettings-consultancy', 'property-management'],
    createdAt: '2024-03-12',
  }],

  // Adamya PM — 1 property
  ['prop-6', {
    id: 'prop-6', customerId: 'user-adamya-pm',
    address: '10 Regent Street', postcode: 'W1B 5TR',
    type: 'Student', bedrooms: 6, monthlyRent: 4200,
    status: 'Occupied', serviceIds: ['property-management', 'tenant-relations', 'compliance-legal'],
    createdAt: '2024-03-05',
  }],

  // Shubham Tenant — 1 rented property
  ['prop-7', {
    id: 'prop-7', customerId: 'user-shubham-tenant',
    address: 'Flat 2, 33 Elm Road', postcode: 'N4 3AP',
    type: 'Residential', bedrooms: 2, monthlyRent: 1650,
    status: 'Occupied', serviceIds: ['tenant-relations', 'maintenance-facilities'],
    createdAt: '2024-01-15',
  }],

  // Irfan Tenant — 1 rented property
  ['prop-8', {
    id: 'prop-8', customerId: 'user-irfan-tenant',
    address: '19 Chestnut Way, Room 4', postcode: 'B15 2TT',
    type: 'Residential', bedrooms: 1, monthlyRent: 900,
    status: 'Occupied', serviceIds: ['tenant-relations'],
    createdAt: '2024-02-10',
  }],

  // Adamya Tenant — 1 rented property
  ['prop-9', {
    id: 'prop-9', customerId: 'user-adamya-tenant',
    address: 'Flat 7, Camden Heights', postcode: 'NW1 8EP',
    type: 'Residential', bedrooms: 1, monthlyRent: 1300,
    status: 'Occupied', serviceIds: ['tenant-relations', 'maintenance-facilities'],
    createdAt: '2024-03-05',
  }],

  // Shubham Student — student accommodation
  ['prop-10', {
    id: 'prop-10', customerId: 'user-shubham-student',
    address: 'Room 12, Uni House, Kings Road', postcode: 'SW3 4UZ',
    type: 'Student', bedrooms: 1, monthlyRent: 750,
    status: 'Occupied', serviceIds: ['tenant-relations'],
    createdAt: '2024-01-20',
  }],

  // Irfan Student — student accommodation
  ['prop-11', {
    id: 'prop-11', customerId: 'user-irfan-student',
    address: 'Studio 5, Scholar Place', postcode: 'LS2 9JT',
    type: 'Student', bedrooms: 1, monthlyRent: 680,
    status: 'Occupied', serviceIds: ['tenant-relations'],
    createdAt: '2024-02-20',
  }],

  // Adamya Student — student accommodation
  ['prop-12', {
    id: 'prop-12', customerId: 'user-adamya-student',
    address: 'Block C, Room 8, Prospect House', postcode: 'M13 9PL',
    type: 'Student', bedrooms: 1, monthlyRent: 620,
    status: 'Occupied', serviceIds: ['tenant-relations'],
    createdAt: '2024-03-10',
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

const demoCustomerServices: Array<[string, CustomerService]> = [

  // Shubham PM
  ['svc-1', {
    id: 'svc-1', customerId: 'user-shubham-pm', propertyId: 'prop-1',
    serviceName: 'Property Management', startDate: '2024-01-20', status: 'Active',
    benefits: ['Void period reduced from 6 weeks to under 1 week', 'Rent collected on time every month', 'Gas & EPC certificates renewed on schedule'],
  }],
  ['svc-2', {
    id: 'svc-2', customerId: 'user-shubham-pm', propertyId: 'prop-3',
    serviceName: 'Compliance & Legal', startDate: '2024-03-05', status: 'Active',
    benefits: ['HMO licence secured within 3 weeks', 'All safety certificates up to date', 'Zero compliance breaches since onboarding'],
  }],
  ['svc-3', {
    id: 'svc-3', customerId: 'user-shubham-pm', propertyId: 'prop-3',
    serviceName: 'Tenant Relations', startDate: '2024-03-05', status: 'Active',
    benefits: ['Tenant satisfaction score: 94%', 'All 5 rooms re-let within 2 weeks of vacancy', 'No formal disputes raised'],
  }],

  // Irfan PM
  ['svc-4', {
    id: 'svc-4', customerId: 'user-irfan-pm', propertyId: 'prop-4',
    serviceName: 'Property Management', startDate: '2024-02-15', status: 'Active',
    benefits: ['Lease renewal secured at 12% uplift', 'Service charge reconciliation completed on time', 'Emergency repairs resolved within 4 hours average'],
  }],
  ['svc-5', {
    id: 'svc-5', customerId: 'user-irfan-pm', propertyId: 'prop-5',
    serviceName: 'Lettings Consultancy', startDate: '2024-03-12', status: 'Active',
    benefits: ['Tenant found within 10 days of listing', 'Referencing completed with zero issues', 'Above-market rent achieved by 8%'],
  }],

  // Adamya PM
  ['svc-6', {
    id: 'svc-6', customerId: 'user-adamya-pm', propertyId: 'prop-6',
    serviceName: 'Property Management', startDate: '2024-03-05', status: 'Active',
    benefits: ['All 6 student rooms fully let for academic year', 'Maintenance response time under 24 hours', 'Rental income increased 5% year-on-year'],
  }],
  ['svc-7', {
    id: 'svc-7', customerId: 'user-adamya-pm', propertyId: 'prop-6',
    serviceName: 'Compliance & Legal', startDate: '2024-03-05', status: 'Active',
    benefits: ['HMO licence renewed on time', 'Fire safety audit passed with no actions', 'All tenancy agreements fully compliant'],
  }],

  // Shubham Tenant
  ['svc-8', {
    id: 'svc-8', customerId: 'user-shubham-tenant', propertyId: 'prop-7',
    serviceName: 'Tenant Relations', startDate: '2024-01-15', status: 'Active',
    benefits: ['Check-in inventory report provided within 24 hours', 'Maintenance request resolved in 3 days', 'Deposit registered with TDS on day of move-in'],
  }],

  // Irfan Tenant
  ['svc-9', {
    id: 'svc-9', customerId: 'user-irfan-tenant', propertyId: 'prop-8',
    serviceName: 'Tenant Relations', startDate: '2024-02-10', status: 'Active',
    benefits: ['Check-in inventory completed & signed', 'Heating repair request logged & resolved within 48 hours'],
  }],

  // Adamya Tenant
  ['svc-10', {
    id: 'svc-10', customerId: 'user-adamya-tenant', propertyId: 'prop-9',
    serviceName: 'Maintenance & Facilities', startDate: '2024-03-05', status: 'Active',
    benefits: ['Bathroom leak repaired within 24 hours', 'Annual gas safety check completed on schedule'],
  }],

  // Shubham Student
  ['svc-11', {
    id: 'svc-11', customerId: 'user-shubham-student', propertyId: 'prop-10',
    serviceName: 'Tenant Relations', startDate: '2024-01-20', status: 'Active',
    benefits: ['Check-in inventory signed digitally', 'Contents insurance arranged through 3C Core', 'Maintenance reported via app — resolved in 2 days'],
  }],

  // Irfan Student
  ['svc-12', {
    id: 'svc-12', customerId: 'user-irfan-student', propertyId: 'prop-11',
    serviceName: 'Tenant Relations', startDate: '2024-02-20', status: 'Active',
    benefits: ['Deposit protected with DPS on move-in', 'Heating fixed within 24 hours of report'],
  }],

  // Adamya Student
  ['svc-13', {
    id: 'svc-13', customerId: 'user-adamya-student', propertyId: 'prop-12',
    serviceName: 'Tenant Relations', startDate: '2024-03-10', status: 'Active',
    benefits: ['Room condition documented with photos at check-in', 'Internet fault resolved same day via landlord escalation'],
  }],
]

export const customerServices = new Map<string, CustomerService>(
  ENABLE_DEMO_ACCOUNTS ? demoCustomerServices : [],
)

export const getServicesByCustomer = (customerId: string) =>
  Array.from(customerServices.values()).filter(s => s.customerId === customerId)

export const getAllCustomers = () =>
  Array.from(users.values()).filter(u => u.role === 'customer')
