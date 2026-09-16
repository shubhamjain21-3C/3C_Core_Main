export interface Service {
  id: string
  slug: string
  title: string
}

export interface TimelineEvent {
  year: string
  title: string
  description: string
}

export interface ContactFormData {
  name: string
  company: string
  email: string
  phone: string
  service: string
  message: string
}

// ── Portal / Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin'
export type PortalRole = 'property_manager' | 'landlord' | 'tenant' | 'student'

export interface PortalUser {
  id: string
  name: string
  email: string
  passwordHash: string
  role: UserRole
  portalRole?: PortalRole
  company?: string
  phone?: string
  createdAt: string
}

export type PropertyType = 'Residential' | 'HMO' | 'Commercial' | 'Student' | 'Holiday Let'
export type PropertyStatus = 'Occupied' | 'Vacant' | 'Under Management' | 'For Letting'

export interface Property {
  id: string
  customerId: string
  address: string
  postcode: string
  type: PropertyType
  bedrooms: number
  monthlyRent: number
  status: PropertyStatus
  serviceIds: string[]   // which 3C Core services are active on this property
  createdAt: string
}

export interface CustomerService {
  id: string
  customerId: string
  propertyId: string
  serviceName: string
  startDate: string
  status: 'Active' | 'Paused' | 'Completed'
  benefits: string[]    // measurable outcomes achieved
}
