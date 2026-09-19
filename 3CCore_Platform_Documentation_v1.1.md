# 3C CORE LTD.
## Connected · Consistent · Confident

# Platform Documentation
Business Model · Workflows · Users · Data · Technology · Roadmap · AI

**Version 1.2 · June 2026**
3ccore.com · contactus@3ccore.com
**CONFIDENTIAL**

---

## Contents

1. Business Model — What the Website Is and Does
2. User Journey & Workflow Diagram
3. Types of Users and Lookups
4. Data Storage — Tables and What We Store
5. Technology — Software, Tools, and Languages
6. Future Goals — Buying & Selling Services
7. AI Capabilities
8. Design System — Colour Palette & Typography

---

## 1. Business Model — What the Website Is and Does

3C Core Ltd. is a UK-based property services company registered in England and Wales (Companies House No. 17050206). The 3C Core website is a digital platform that connects property managers, landlords, tenants, and students with professional property services — available around the clock.

The core commercial idea is to sell this platform to property managers so they can handle the inventory work that is a legal and practical part of every tenancy — producing a Check-In inventory report when a tenant moves in, and a Check-Out report when they move out. Around this core, the platform also offers a set of related property services that can be booked online.

### 1.1 The Services Offered

| Service | What It Does |
|---|---|
| Inventory Management | Check-In and Check-Out property condition reports. Done either by the user themselves (DIY, AI-assisted) or by booking a professional agent. |
| Midterm Property Inspection | Scheduled inspections during a tenancy to check the property is being maintained. |
| Dispute Resolution | Independent mediation between landlords and tenants — deposits, damage, maintenance, and more. |
| Maintenance & Cleaning | Compliance checks (Gas Safety, EICR, EPC, Legionella, PAT, Licensing) and cleaning services. |
| Deposit Negotiation | Fair, evidence-based negotiation of deposit deductions at the end of a tenancy (landlords/managers). |
| Letting Services | Helping tenants and students find rental properties — short-term, long-term, and student lets. |

### 1.2 How the Business Makes Money

- Selling the platform/portal to property managers to run their inventory and tenancy workflows.
- Charging for individual service bookings (inventory, inspections, maintenance, disputes).
- Subscription plans for landlords and managers with multiple properties (planned).
- Letting services fees (charged to landlords, free to tenants under the Tenant Fees Act 2019).
- Future: selling the AI inventory tool and chatbot as standalone products to other companies (B2B / white-label).

---

## 2. User Journey & Workflow Diagram

Every visitor is guided through a simple journey. The website first asks who they are and then what they want, then shows only the services relevant to them, and routes each service to the right action — a report tool, a booking form, or a property listing.

### 2.1 The Journey in Words

| Step | What Happens |
|---|---|
| 1. Arrive | Visitor lands on 3ccore.com. |
| 2. Who are you? | They select their role: Property Manager/Landlord, Tenant, Student, or Others. |
| 3. What are you looking for? | They choose Services or Letting. |
| 4. Services page | Only the services allowed for that role are shown. |
| 5. Select a service | Routing depends on the service (see below). |
| 6a. Inventory | Choose "Do It Yourself" (AI report tool) or "Book an Agent" (booking form). |
| 6b. Maintenance | Asks the maintenance type first, then shows the booking form. |
| 6c. Midterm / Dispute / Deposit | Goes straight to the booking form. |
| 6d. Letting | Shows available rental properties, with a "Schedule a Callback" button. |
| 7. Booking form | Role, name, and service type are auto-filled. User adds summary, date, and call-back time. |
| 8. Submit | Saved to the database and emailed to the admin (contactus@3ccore.com). |
| 9. Portal | Logged-in users track reports, documents, media, and bookings in their dashboard. |
| 10. Download App | `/download-app` page with App Store / Google Play toggle (links pending). |

---

## 3. Types of Users and Lookups

### 3.1 User Types (Roles)

| Role | Description | Key Access |
|---|---|---|
| Property Manager / Landlord | Manages one or more properties; the primary paying customer. | All services including Deposit Negotiation; no Letting. |
| Tenant | Rents a property managed or let through 3C Core. | All services except Deposit Negotiation; can use Letting. |
| Student | A tenant seeking student accommodation. | Same as Tenant; Letting aligned to academic year. |
| Others | General visitors or enquirers not fitting the above roles. | All services — full access to both Services and Letting. |

Roles are stored as a lookup table (ref_portal_roles), so new roles can be added in future without changing the code.

### 3.2 Lookups (Fact Tables) Currently in Place

A "lookup" is a small editable list of options. Instead of fixing options inside the code, every set of choices lives in its own table with an on/off flag (is_active) and a display order. This means new options can be added from data — no developer needed — and old ones hidden without deleting history.

| Lookup Table | Options Held |
|---|---|
| ref_portal_roles | Property Manager, Landlord, Tenant, Student, Admin, Others |
| ref_property_types | Residential, HMO, Commercial, Student, Holiday Let |
| ref_property_status | Occupied, Vacant, Under Management, For Letting |
| ref_tenancy_status | Pending, Active, Ended |
| ref_furnished_types | Furnished, Unfurnished, Part Furnished |
| ref_letting_status | Available, Let Agreed, Let, Withdrawn |
| ref_report_types | Check-In, Check-Out, Midterm, Periodic |
| ref_report_status | Draft, Pending Review, Signed, Completed |
| ref_condition_levels | Excellent, Good, Fair, Poor, Missing, Not Applicable |
| ref_room_types | Bedroom, Living Room, Kitchen, Bathroom, Hallway, Garden, Garage, Other |
| ref_item_types | Air Conditioner, Geyser, Washer/Dryer, Fridge, Oven, Dishwasher, Other |
| ref_entity_types | Property, Inventory Report, Room, Item, Maintenance, Dispute |
| ref_media_types | Image, Video, Document, PDF |
| ref_service_types | Inventory, Maintenance, Midterm, Dispute, Deposit, Letting |
| ref_service_status | Active, Paused, Completed |
| ref_maintenance_types | Gas Safety, EICR, EPC, Legionella, PAT, Licensing, Cleaning, General Repair, Other |
| ref_chat_roles | User, Assistant |

---

## 4. Data Storage — Tables and What We Store

All information is stored in a secure cloud database (Supabase / PostgreSQL). Each table is a structured list. Tables are linked so the whole picture connects — a property links to its tenancies, which link to inventory reports, which link to rooms, items, and photos.

*Note on status: the database is integrated with Supabase, and the schema below — including the editable lookup (fact) tables and the consistent naming convention — has been applied on the active development branch. Connecting the production environment is a final merge-and-deploy step.*

### 4.1 Core Tables

| Table | What It Stores |
|---|---|
| users | User accounts — name, email, phone, company, role. |
| properties | Every property managed — address, type, bedrooms, rent, status. |
| property_tenancies | Tenancy agreements linking a property, landlord, and tenant for a period. |
| property_lettings | Properties listed as available to rent, with asking rent and furnishing. |
| inventory_reports | Master record of each Check-In / Check-Out / Midterm report. |
| inventory_rooms | Each room within a report, with condition and notes. |
| inventory_items | Each item in a room (e.g. AC, oven), with condition and quantity. |
| media | All photos, videos, and documents, linked to any entity (polymorphic). |
| services | Active service subscriptions/bookings per user and property. |
| chat_conversations | AI chatbot sessions (anonymous or logged-in). |
| chat_messages | Individual messages within a chatbot conversation. |
| ref_* (17 lookups) | Editable option lists (see Section 3.2). |

### 4.2 How Files Are Stored and Retained

| Storage Area | Holds | Retention |
|---|---|---|
| Inventory media | Photos/videos that are part of inventory reports | Kept long-term — lease term + 6 years (legal requirement) |
| Inventory reports | Generated PDF reports | Kept long-term — lease term + 6 years |
| Portal media | General photos/videos not part of a report | Auto-deleted after 30 days |
| Documents | Private contracts, invoices shared in the portal | Kept while the account is active |
| Public assets | Logos, team and service images | Kept indefinitely |
| Avatars | User profile photos | Kept until the user removes them |

### 4.3 Security

- Encrypted in transit (HTTPS) and at rest (encrypted database storage).
- Row Level Security — each user can only see their own data; tenants cannot see other tenants' reports.
- Card details are never stored by 3C Core — payments are handled entirely by Stripe.
- Fully aligned with UK GDPR, the Data Protection Act 2018, and PECR (cookies).

### 4.4 Current Build Status (verified against repository commit history)

The following reflects the active development branch (dev), which is ahead of the production branch (main). Items marked pending are blocked on external credentials or a production merge, not on missing code.

| Area | Status | Note |
|---|---|---|
| Website pages & design | **Live** | Deployed via Vercel |
| User journey & auto-filled booking | **Built** | Flow reversed: Who are you? → What are you looking for? → Services. "Others" role added. |
| Role-based routing & portal branding | **Built** | Cross-role blocking + amber/gold portal sidebar |
| Account registration | **Built** | Company field; duplicate-email blocking; redirect to /what-are-you-looking-for |
| Email OTP verification | **Built & working** | Customer OTP send/verify implemented |
| Admin OTP login | **Built** | Separate admin login via OTP |
| Forgot-password (email OTP) | **Built** | Reset flow; persistent duplicate-email check |
| Authentication base | **NextAuth + OTP** | NextAuth with custom OTP, backed by Supabase |
| Database (Supabase) | **Integrated** | Supabase client wired in; schema with lookup/fact tables applied |
| Schema (lookups + naming) | **Applied** | Renamed tables/columns + fact/lookup tables with flag system |
| DIY inventory tool | **Built (4-step)** | Media upload + live camera capture; inventory API routes present |
| Lettings availability + bookings | **Built** | Available lettings + service-bookings API routes |
| Email sending (Resend) | **DNS added** | Domain DNS records added; sending from contactus@3ccore.com |
| Colour palette unification | **Completed** | All pages and components migrated to unified Amber/Gold palette; navy palette fully removed |
| AI inventory analysis | Stub — needs key | Wire ANTHROPIC_API_KEY to enable live analysis |
| PDF generation | Substantially built | generate-pdf route expanded; verify end-to-end output |
| Payments (Stripe) | Built, needs live keys | SDKs installed; live keys + webhook pending |
| Production merge (dev → main) | Merged | Latest work sits on dev; merge to main to deploy to production |

*Note: the most recent work lives on the dev branch and is ahead of the production (main) branch. A dev-to-main merge publishes it to the live site. The remaining true blockers are external credentials only: the Anthropic API key (AI analysis) and Stripe live keys (payments).*

---

## 5. Technology — Software, Tools, and Languages

The platform is built with modern, widely-trusted technology. Each item below is explained in plain English.

| Technology | What It Is | What It Does Here |
|---|---|---|
| Next.js 14 | The website engine/framework | Powers all pages, routing, and fast loading |
| TypeScript | A safer programming language | Reliable code that catches errors early |
| Tailwind CSS | A design toolkit | Creates the amber/gold style and responsive layout |
| Framer Motion | Animation library | Smooth transitions and fade-ins |
| Supabase (PostgreSQL) | Cloud database | Stores accounts, properties, reports, bookings; schema with lookup tables applied |
| NextAuth.js + OTP | Login & verification system | Account login and email OTP verification, backed by Supabase |
| Supabase Storage | Cloud file storage | Holds photos, videos, and PDF reports |
| Anthropic Claude | AI engine | Analyses inventory photos and writes reports (being connected) |
| Stripe | Payment processing | Card, Apple Pay, and Google Pay |
| Resend | Email service | Sends booking confirmations and admin notifications |
| Vercel | Hosting platform | Keeps the website live, fast, and global |
| GitHub | Code storage & history | Securely stores all code with full change history |
| Lucide React | Icon set | Clean icons throughout (no emojis) |
| jsPDF / PDF engine | PDF generation | Creates downloadable inventory report PDFs |

### 5.1 Where Things Live

| Item | Provider |
|---|---|
| Domain | GoDaddy — 3ccore.com |
| Hosting | Vercel |
| Database & Storage | Supabase |
| Payments | Stripe |
| Email | Resend (from contactus@3ccore.com) |
| AI | Anthropic (Claude API) |
| Code repository | GitHub — shubhamjain21-3C/3C_Core_Main |

---

## 6. Future Goals — Buying & Selling Services

The current platform focuses on property services and letting. A major planned expansion is to add property buying and selling — turning 3C Core into a fuller property business that supports the whole lifecycle of a property.

### 6.1 Planned Buying & Selling Capabilities

- Property Sales — list properties for sale, manage offers, and track sales progression.
- Property Flipping & Investment — tools and guidance for investors buying, renovating, and reselling.
- Buyer–Seller dispute resolution — extend mediation to sales transactions.
- Integration with major portals (Rightmove, Zoopla, OnTheMarket) for listings.
- Conveyancing and solicitor coordination within the platform.
- Valuation tools and offer management.

### 6.2 Broader Roadmap

| Phase | Focus |
|---|---|
| Near term | Activate database, payments, email, and AI; finish portal dashboards; subscription billing. |
| Medium term | Live AI chatbot; automated maintenance routing; portal integrations; tenant referencing. |
| Long term | Buying & selling services; mobile app; B2B white-label of the AI tools; third-party API access. |

The platform has been built to be modular and extensible, so these services can be added without rebuilding the core.

---

## 7. AI Capabilities

Artificial Intelligence (powered by Anthropic's Claude) is central to what makes 3C Core different. The AI features below are designed; the inventory analysis is being connected to the live AI now, and the chatbot is planned.

### 7.1 AI Inventory Report Generation (in progress)

- The user uploads photos and videos of a property, room by room, or captures them live with their camera.
- The AI reviews every image and assesses the condition of walls, ceilings, floors, doors, windows, appliances, electrical fittings, fixtures, and furniture.
- It writes a clear, professional description of each item and a summary for each room.
- It turns the user's rough notes into clean, professional report language.
- The user reviews and confirms the report before a downloadable PDF is produced.

### 7.2 AI Chatbot Assistant (coming soon)

- A 24/7 assistant for tenants and landlords, available to account holders.
- Answers property and maintenance questions and helps troubleshoot issues before escalating.
- Shares relevant links and documents to guide users.
- Reduces the workload on property managers by handling routine queries.
- Logs every interaction; escalates anything it cannot answer to a human and flags it for improvement.

### 7.3 Commercial AI Vision

- The inventory tool and chatbot are being built so they can later be sold to other property companies as a plug-in or standalone software.
- Designed for multi-tenant use, client data isolation, and configurable behaviour per client (white-label).
- Free and subscription tiers: basic help free, detailed help via paid subscription.

### 7.4 AI Guardrails

- The AI never instructs a maintenance contractor on its own.
- A human reviews and confirms important outputs (e.g. inventory reports) before they are final.
- Personal data is handled in line with UK GDPR.

---

## 8. Design System — Colour Palette & Typography

### 8.1 Unified Amber/Gold Colour Palette

The entire website and portal use a single, consistent Amber/Gold colour palette. There is no separate portal colour scheme — all pages share the same visual identity.

#### Brand Colours

| Token | Hex | Usage |
|---|---|---|
| Gold (primary) | `#D4860A` | Primary brand colour — buttons, accents, links, icons |
| Gold Light | `#F0A830` | Hover states, secondary accents, highlights |
| Gold Pale | `#FDE8B0` | Light backgrounds, subtle fills, secondary text on dark |
| Brick | `#8B3A2A` | Muted text, secondary descriptions, earthy accent |
| Charcoal | `#2C1F14` | Primary text on light backgrounds, dark UI elements |
| Forest | `#2D5016` | Tenant role accent, success states |
| Cream | `#FFF8EE` | Page backgrounds, portal base, light surfaces |
| Glass Blue | `#4A6FA5` | Student role accent |

#### Surface & Background Styles

| Context | Treatment |
|---|---|
| Full-screen pages (landing, what-are-you-looking-for, services, download-app) | Background image with warm dark overlay `rgba(30,15,5,0.55)`, white text, gold accents, glass-morphism cards |
| Content pages (about, contact, legal) | Gold gradient background `linear-gradient(160deg, #FFF8EE, #FDE8B0, #F5C060)`, charcoal text, white/translucent cards |
| Portal pages (dashboard, properties, account) | Cream `#FFF8EE` base, white cards with gold borders, charcoal text |
| Portal login/selection | Gold gradient background, white translucent cards |

#### Card Styles

| Style | Background | Border |
|---|---|---|
| Glass card (dark pages) | `rgba(255,255,255,0.10)` with `backdrop-filter: blur(8px)` | `1.5px solid rgba(240,168,48,0.65)` |
| Light card (content pages) | `rgba(255,255,255,0.6)` | `1px solid rgba(212,134,10,0.2)` |
| Portal card (dashboard) | `white` | `1px solid rgba(212,134,10,0.2)` |

#### Buttons

| Style | Background | Border | Text |
|---|---|---|---|
| Primary | `#D4860A` | `#D4860A` | White |
| Primary hover | `#F0A830` | `#F0A830` | White |
| Secondary (outline) | Transparent | `#D4860A` | `#D4860A` |

### 8.2 Typography

| Usage | Font | Weight |
|---|---|---|
| Headings | Montserrat | Bold (700) |
| Body text | Inter | Regular (400) / Medium (500) |

### 8.3 Gradients

| Name | Definition | Usage |
|---|---|---|
| Gold Gradient | `linear-gradient(160deg, #FFF8EE 0%, #FDE8B0 50%, #F5C060 100%)` | Content page backgrounds |
| Hero Gradient | `linear-gradient(to bottom, #1e0f05, #2C1F14)` | Legacy dark sections |
| Nav Gradient | `linear-gradient(to right, #1e0f05, #2C1F14)` | Legacy dark navigation |

---

*3C Core Ltd. · 60 Tottenham Court Road, London, England, W1T 2EW*
*Connected · Consistent · Confident · 3ccore.com · contactus@3ccore.com*
