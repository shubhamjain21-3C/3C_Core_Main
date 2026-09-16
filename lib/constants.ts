export const COMPANY = {
  name:            '3C Core Ltd.',
  trading:         '3C',
  address:         '60 Tottenham Court Road, Office 818, London, W1T 2EW, England',
  email:           'contactus@3ccore.com',
  phone:           '07852254792',
  companies_house: '17050206',
  ico:             'TBC',
} as const

// Legacy single-value exports for backward compatibility
export const SITE_NAME     = '3C Core'
export const SITE_URL      = process.env.NEXT_PUBLIC_SITE_URL      || 'https://3ccore.com'
export const COMPANY_EMAIL = process.env.NEXT_PUBLIC_COMPANY_EMAIL  || 'contactus@3ccore.com'
export const COMPANY_PHONE = '07852254792'
export const COMPANY_ADDRESS = '60 Tottenham Court Road, Office 818, London, W1T 2EW, England'

export const NAV_LINKS = [
  { href: '/',          label: 'Home'      },
  { href: '/about',     label: 'About'     },
  { href: '/services',  label: 'Services'  },
  { href: '/contact',   label: 'Contact'   },
]

export const SERVICES_LIST = [
  'Inventory Management',
  'Maintenance & Cleaning',
  'Midterm Property Inspection',
  'Dispute Resolution',
  'Deposit Negotiation',
  'Letting Services',
]

