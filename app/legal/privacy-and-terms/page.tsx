'use client'
import { useState } from 'react'
import { ServicePageHeader } from '@/components/layout/ServicePageHeader'
import { ComingSoonWidget } from '@/components/ui/ComingSoonWidget'

export default function PrivacyAndTermsPage() {
  const [tab, setTab] = useState<'privacy' | 'terms'>('privacy')

  return (
    <div className="min-h-screen" style={{ background: '#FFF8EE' }}>
      <ServicePageHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-[#2C1F14] text-3xl">3C Core — Legal Documents</h1>
          <p className="text-[#8B3A2A] text-sm mt-1">Last Updated: March 2026 · Version 1.0</p>
        </div>

        {/* Company details */}
        <div className="rounded-xl p-5 mb-8 text-sm" style={{ background: 'rgba(212,134,10,0.08)', border: '1px solid rgba(212,134,10,0.25)' }}>
          <p className="font-semibold text-[#2C1F14]">3C Core Ltd.</p>
          <p className="text-[#2C1F14]">Registered in England and Wales · Companies House No: 17050206</p>
          <p className="text-[#2C1F14]">Registered Address: 60 Tottenham Court Road, London, England, W1T 2EW</p>
          <p className="text-[#2C1F14]">Email: contactus@3ccore.com · Phone: 07852254792</p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b mb-8" style={{ borderColor: 'rgba(212,134,10,0.3)' }}>
          {(['privacy', 'terms'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-[#D4860A] text-[#D4860A] font-semibold' : 'border-transparent text-[#2C1F14] hover:text-[#D4860A]'}`}
            >
              {t === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
            </button>
          ))}
        </div>

        {tab === 'privacy' && <PrivacyPolicy />}
        {tab === 'terms' && <TermsOfUse />}
      </div>

      <ComingSoonWidget />
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-heading font-semibold text-[#D4860A] text-xl mt-8 mb-3">{children}</h2>
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-[#2C1F14] text-base mt-4 mb-2">{children}</h3>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#2C1F14] text-sm leading-relaxed mb-2">{children}</p>
}
function Li({ children }: { children: React.ReactNode }) {
  return <li className="text-[#2C1F14] text-sm leading-relaxed">• {children}</li>
}

function PrivacyPolicy() {
  return (
    <div>
      <H2>1. Introduction</H2>
      <P>3C Core Ltd. (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting and respecting your privacy. We are a UK-based property services company providing inventory services, property inspections, property management, lettings, property sales, property flipping, and dispute resolution services.</P>
      <P>This Privacy Policy explains how we collect, use, store, share, and protect your personal data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and all other applicable UK data protection legislation.</P>

      <H2>2. Data Controller Details</H2>
      <P>Company Name: 3C Core Ltd.<br />Registered Address: 60 Tottenham Court Road, London, England, W1T 2EW<br />Email: contactus@3ccore.com<br />Phone: 07852254792<br />Companies House Number: 17050206</P>
      <P>For all data protection enquiries, contact our Data Controller at the above details.</P>

      <H2>3. Who This Policy Applies To</H2>
      <P>This policy applies to:</P>
      <ul className="space-y-1 mb-4 ml-2">
        <Li>Landlords engaging us for property management, letting, or inventory services</Li>
        <Li>Tenants renting properties managed or let by us</Li>
        <Li>Buyers and sellers using our property sales or flipping services</Li>
        <Li>Dispute resolution clients seeking mediation or dispute services</Li>
        <Li>Website visitors browsing our site</Li>
        <Li>Contractors and suppliers working with us</Li>
        <Li>Job applicants applying for roles within our company</Li>
      </ul>

      <H2>4. Personal Data We Collect</H2>
      <P>Depending on the services you use, we may collect the following categories of personal data:</P>
      <H3>Identity &amp; Contact Data</H3>
      <ul className="space-y-1 mb-4 ml-2">
        <Li>Full name, date of birth, nationality</Li>
        <Li>Email address, phone number, postal address</Li>
        <Li>Copies of identity documents (passport, driving licence) for compliance and referencing purposes</Li>
      </ul>
      <H3>Financial Data</H3>
      <ul className="space-y-1 mb-4 ml-2">
        <Li>Bank account details (for rent payments, deposits, sale proceeds)</Li>
        <Li>Credit reference and affordability check results</Li>
        <Li>Payment history and invoicing records</Li>
      </ul>
      <H3>Property &amp; Tenancy Data</H3>
      <ul className="space-y-1 mb-4 ml-2">
        <Li>Property address and details</Li>
        <Li>Tenancy agreements, lease terms, rental amounts</Li>
        <Li>Inventory reports, inspection records, and photographs of properties</Li>
        <Li>Maintenance records and repair histories</Li>
        <Li>Deposit information and deposit scheme references</Li>
      </ul>
      <H3>Dispute Resolution Data</H3>
      <ul className="space-y-1 mb-4 ml-2">
        <Li>Details of disputes between landlords and tenants</Li>
        <Li>Evidence submitted by either party (photos, correspondence, receipts)</Li>
        <Li>Mediation notes and outcomes</Li>
      </ul>
      <H3>Technical &amp; Usage Data</H3>
      <ul className="space-y-1 mb-4 ml-2">
        <Li>IP address, browser type, device identifiers</Li>
        <Li>Pages visited, time spent on our website</Li>
        <Li>Referring URLs and search terms</Li>
      </ul>
      <H3>Communications Data</H3>
      <ul className="space-y-1 mb-4 ml-2">
        <Li>Emails, live chat messages, phone call records</Li>
        <Li>Enquiry forms submitted via our website</Li>
      </ul>

      <H2>5. How We Collect Your Data</H2>
      <P>We collect personal data through:</P>
      <ul className="space-y-1 mb-4 ml-2">
        <Li><strong>Direct interactions</strong> — when you sign a tenancy or management agreement, complete an enquiry form, call us, or email us</Li>
        <Li><strong>Referencing agencies</strong> — credit checks, tenant referencing, and right-to-rent verification</Li>
        <Li><strong>Third-party platforms</strong> — Rightmove, Zoopla, OnTheMarket, or other property portals</Li>
        <Li><strong>Contractors and maintenance providers</strong> — information shared in relation to property works</Li>
        <Li><strong>Deposit protection schemes</strong> — such as TDS, DPS, or MyDeposits</Li>
        <Li><strong>Cookies and website analytics</strong> — automatically collected when you browse our site (see Cookie Policy)</Li>
        <Li><strong>Court or tribunal records</strong> — where relevant to dispute resolution services</Li>
      </ul>

      <H2>6. Legal Basis for Processing</H2>
      <P>We rely on the following lawful bases under UK GDPR Article 6:</P>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: 'rgba(212,134,10,0.12)' }}>
              <th className="text-left px-3 py-2 border border-[rgba(212,134,10,0.2)] text-[#2C1F14]">Processing Activity</th>
              <th className="text-left px-3 py-2 border border-[rgba(212,134,10,0.2)] text-[#2C1F14]">Lawful Basis</th>
            </tr>
          </thead>
          <tbody>
            {LEGAL_BASIS.map(row => (
              <tr key={row.activity}>
                <td className="px-3 py-2 border border-[rgba(212,134,10,0.15)] text-[#2C1F14]">{row.activity}</td>
                <td className="px-3 py-2 border border-[rgba(212,134,10,0.15)] text-[#2C1F14]">{row.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>Where we rely on consent, you have the right to withdraw it at any time without affecting the lawfulness of processing before withdrawal.</P>

      <H2>7. Special Category Data</H2>
      <P>In limited circumstances, we may process special category data (under UK GDPR Article 9), such as disability or health information (if relevant to property accessibility adaptations) and immigration status (for Right to Rent compliance checks). We will only process such data where we have explicit consent or a specific legal obligation to do so.</P>

      <H2>8. Anti-Money Laundering (AML) Compliance</H2>
      <P>As a property business involved in sales and lettings, we are required by the Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017 to verify the identity of clients, conduct due diligence checks, and report suspicious activity to the National Crime Agency (NCA) where required. Personal data collected for AML purposes will be retained for a minimum of 5 years.</P>

      <H2>9. How We Use Your Data</H2>
      <ul className="space-y-1 mb-4 ml-2">
        <Li>Manage tenancy agreements, lettings, and property management contracts</Li>
        <Li>Conduct property inspections and produce inventory reports</Li>
        <Li>Register and manage tenancy deposits with government-approved schemes</Li>
        <Li>Carry out Right to Rent checks in compliance with UK immigration law</Li>
        <Li>Process rental payments, maintenance charges, and sales transactions</Li>
        <Li>Market and list properties on portals (Rightmove, Zoopla, etc.)</Li>
        <Li>Communicate with landlords, tenants, buyers, and sellers about their properties</Li>
        <Li>Resolve disputes between landlords and tenants through mediation or formal proceedings</Li>
        <Li>Comply with legal, regulatory, and tax obligations</Li>
        <Li>Send marketing updates and property news (with your consent)</Li>
        <Li>Improve our website and services through analytics</Li>
      </ul>

      <H2>10. Data Sharing &amp; Third Parties</H2>
      <P>We do not sell your personal data. We may share your data with deposit protection schemes (TDS, DPS, MyDeposits), credit referencing agencies, property portals (Rightmove, Zoopla, OnTheMarket), solicitors and conveyancers, HMRC, courts and tribunals, local councils, maintenance contractors, the ICO or other regulators, and IT/cloud storage providers for secure data hosting. All third-party processors are bound by data processing agreements requiring them to handle your data lawfully and securely.</P>

      <H2>11. Data Retention</H2>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: 'rgba(212,134,10,0.12)' }}>
              <th className="text-left px-3 py-2 border border-[rgba(212,134,10,0.2)] text-[#2C1F14]">Data Type</th>
              <th className="text-left px-3 py-2 border border-[rgba(212,134,10,0.2)] text-[#2C1F14]">Retention Period</th>
            </tr>
          </thead>
          <tbody>
            {RETENTION.map(row => (
              <tr key={row.type}>
                <td className="px-3 py-2 border border-[rgba(212,134,10,0.15)] text-[#2C1F14]">{row.type}</td>
                <td className="px-3 py-2 border border-[rgba(212,134,10,0.15)] text-[#2C1F14]">{row.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>After retention periods expire, data is securely deleted or anonymised.</P>

      <H2>12. Cookie Policy</H2>
      <P>Cookies are small text files placed on your device when you visit our website. They help us understand how visitors use our site and improve your experience. See our <a href="/legal/cookies" className="text-[#D4860A] underline">Cookie Settings page</a> for full details and to manage your preferences.</P>

      <H2>13. Your Rights Under UK GDPR</H2>
      <ul className="space-y-1 mb-4 ml-2">
        <Li><strong>Right of Access</strong> — request a copy of all data we hold about you</Li>
        <Li><strong>Right to Rectification</strong> — request correction of inaccurate or incomplete data</Li>
        <Li><strong>Right to Erasure</strong> — request deletion of your data where there is no lawful reason to retain it</Li>
        <Li><strong>Right to Restrict Processing</strong> — ask us to limit how we use your data</Li>
        <Li><strong>Right to Data Portability</strong> — receive your data in a machine-readable format</Li>
        <Li><strong>Right to Object</strong> — object to processing based on legitimate interests or for direct marketing</Li>
        <Li><strong>Right to Withdraw Consent</strong> — at any time for consent-based processing</Li>
        <Li><strong>Rights related to automated decision-making</strong> — not to be subject to solely automated decisions that significantly affect you</Li>
      </ul>
      <P>To exercise any right, contact us at contactus@3ccore.com. We will respond within one calendar month. This service is free of charge, unless requests are manifestly unfounded or excessive.</P>

      <H2>14. Data Security</H2>
      <P>We implement appropriate technical and organisational measures to protect your personal data, including SSL/TLS encryption, password-protected systems, secure cloud storage, regular staff training, and incident response procedures. In the event of a data breach that poses a risk to your rights and freedoms, we will notify the ICO within 72 hours and affected individuals without undue delay, as required by UK GDPR Article 33.</P>

      <H2>15. International Data Transfers</H2>
      <P>We aim to keep all data processing within the UK and European Economic Area (EEA). If any data is transferred outside the UK, we will ensure appropriate safeguards are in place, such as UK adequacy decisions, Standard Contractual Clauses (SCCs) approved by the ICO, or Binding Corporate Rules where applicable.</P>

      <H2>16. Automated Decision-Making &amp; Profiling</H2>
      <P>We may use automated processes for tenant referencing and credit checks via third-party referencing agencies. If a decision is made solely by automated means and significantly affects you, you have the right to request human review. Please contact us to exercise this right.</P>

      <H2>17. Children&apos;s Privacy</H2>
      <P>Our services are directed at adults (18+). We do not knowingly collect personal data from children under the age of 13. If you believe a child has submitted personal data to us, please contact us immediately and we will delete it promptly.</P>

      <H2>18. Links to Third-Party Websites</H2>
      <P>Our website may contain links to third-party websites (e.g. Rightmove, Zoopla, government portals). We are not responsible for the privacy practices of those sites and encourage you to read their privacy policies independently.</P>

      <H2>19. Marketing Communications</H2>
      <P>We will only send you marketing emails, newsletters, or property updates where you have provided explicit consent. You can unsubscribe at any time by clicking the &quot;Unsubscribe&quot; link in any marketing email or contacting us at contactus@3ccore.com. Withdrawing marketing consent does not affect your right to receive service-related communications.</P>

      <H2>20. Complaints</H2>
      <P>If you are dissatisfied with how we have handled your personal data, you have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO):</P>
      <P>www.ico.org.uk · 0303 123 1113 · Information Commissioner&apos;s Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</P>
      <P>We would appreciate the opportunity to resolve your concern directly before you contact the ICO. Please reach out to us first at contactus@3ccore.com.</P>

      <H2>21. Changes to This Policy</H2>
      <P>We may update this Privacy and Cookie Policy from time to time to reflect changes in our services, legal requirements, or best practices. The &quot;Last Updated&quot; date at the top of this document will always reflect the most recent revision. Where changes are significant, we will notify affected individuals directly.</P>
    </div>
  )
}

function TermsOfUse() {
  return (
    <div>
      <H2>1. Introduction</H2>
      <P>Welcome to 3C Core Ltd. trading as 3C (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By accessing or using our website, you agree to be bound by these Terms of Use (&quot;Terms&quot;). Please read them carefully before using our Website.</P>
      <P>We are a UK-based property services company providing inventory services, property inspections, property management, lettings, property sales, property flipping, and dispute resolution services.</P>
      <P>If you do not agree with any part of these Terms, you must stop using the Website immediately.</P>

      <H2>2. About Us</H2>
      <P>Company Name: 3C Core Ltd. · Registered in England and Wales · Companies House Number: 17050206 · Registered Address: 60 Tottenham Court Road, London, England, W1T 2EW · Email: contactus@3ccore.com · Phone: 07852254792</P>

      <H2>3. Who These Terms Apply To</H2>
      <ul className="space-y-1 mb-4 ml-2">
        <Li>Landlords, property owners, and investors seeking our services</Li>
        <Li>Tenants looking to rent properties we manage or let</Li>
        <Li>Buyers and sellers using our property sales services</Li>
        <Li>Visitors browsing our Website for information</Li>
        <Li>Contractors, partners, or suppliers interacting with us online</Li>
      </ul>

      <H2>4. Use of Our Website</H2>
      <H3>Permitted Use</H3>
      <ul className="space-y-1 mb-4 ml-2">
        <Li>Browse information about our property services</Li>
        <Li>Submit enquiries via our contact forms</Li>
        <Li>Download publicly available documents or guides we provide</Li>
        <Li>Access property listings we have published</Li>
      </ul>
      <H3>Prohibited Use</H3>
      <P>You must not use our Website to violate any applicable UK or international law, transmit unsolicited advertising, upload viruses or malware, attempt to gain unauthorised access to our systems, scrape or harvest content without written permission, impersonate any person or entity, damage or impair the Website, or post defamatory, offensive, discriminatory, or harassing content. We reserve the right to suspend or terminate access to any user who violates these Terms.</P>

      <H2>5. Our Services — Important Notices</H2>
      <H3>5.1 Inventory &amp; Inspection Services</H3>
      <P>Inventory reports and property inspection reports are professional documents prepared at a specific point in time. They reflect the condition of the property at the date of the inspection only. We accept no liability for changes in property condition occurring after the inspection date.</P>
      <H3>5.2 Property Management</H3>
      <P>Our property management services are governed by a separate Property Management Agreement. In the event of any conflict, the Property Management Agreement shall take precedence.</P>
      <H3>5.3 Lettings</H3>
      <P>We act as letting agents on behalf of landlords. We comply with all applicable letting agent legislation including the Tenant Fees Act 2019, the Housing Act 1988 (as amended), and relevant local authority licensing requirements. All prospective tenants are subject to referencing and Right to Rent checks in accordance with the Immigration Act 2014.</P>
      <H3>5.4 Property Sales</H3>
      <P>Property sales services are subject to a separate Sales Agency Agreement. All property details published on our Website or portals are for information purposes only and do not constitute an offer or contract. We comply with the Estate Agents Act 1979 and the Consumer Protection from Unfair Trading Regulations 2008.</P>
      <H3>5.5 Property Flipping &amp; Investment</H3>
      <P>Any information provided on our Website regarding property investment, flipping strategies, or returns is for general informational purposes only and does not constitute financial, investment, or legal advice. We are not authorised or regulated by the Financial Conduct Authority (FCA) for investment advice.</P>
      <H3>5.6 Dispute Resolution</H3>
      <P>Our dispute resolution service is a facilitative process aimed at reaching voluntary agreement between parties. It does not constitute legal advice, legal representation, or a legally binding adjudication unless expressly agreed in writing. Outcomes are only binding where both parties agree in writing.</P>

      <H2>6. Information on Our Website</H2>
      <P>We make every effort to ensure that information on our Website is accurate and up to date. However, we make no warranties or representations — express or implied — regarding the completeness, accuracy, or fitness for purpose of any information published on the Website. Nothing on our Website constitutes legal, financial, tax, or investment advice.</P>

      <H2>7. Intellectual Property</H2>
      <P>All content on this Website — including text, images, logos, property photographs, inventory templates, inspection formats, graphics, and software — is the intellectual property of 3C Core Ltd. or its licensors and is protected by UK and international copyright law. You may not reproduce, distribute, modify, transmit, republish, or use any content for commercial purposes without our prior written consent.</P>

      <H2>8. Third-Party Links &amp; Portals</H2>
      <P>Our Website may contain links to third-party websites including property portals, government websites, deposit protection schemes, and other external services. We do not endorse, control, or take responsibility for the content, privacy practices, or accuracy of third-party websites. Accessing third-party links is entirely at your own risk.</P>

      <H2>9. Limitation of Liability</H2>
      <P>To the fullest extent permitted by law, we exclude all implied warranties and shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from your use of our Website, including loss of profits, loss of data, business interruption, or reputational damage. Our total liability to you in connection with the Website shall not exceed £20. Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud, or any liability that cannot be excluded under English law.</P>

      <H2>10. Indemnity</H2>
      <P>You agree to indemnify and hold harmless 3C Core Ltd., its directors, employees, and agents from and against any claims, losses, damages, costs, and expenses (including legal fees) arising from your breach of these Terms or your unlawful use of our Website.</P>

      <H2>11. Data Protection &amp; Privacy</H2>
      <P>Your use of our Website is also governed by our Privacy Policy and Cookie Policy, incorporated into these Terms by reference. By using the Website, you acknowledge that you have read and understood our Privacy Policy.</P>

      <H2>12. Cookie Policy</H2>
      <P>We use cookies on our Website. By continuing to browse the Website after being presented with our cookie consent notice, you consent to our use of cookies in accordance with our Cookie Policy. See our <a href="/legal/cookies" className="text-[#D4860A] underline">Cookie Settings page</a> for full details.</P>

      <H2>13. Regulatory Compliance</H2>
      <P>We operate in compliance with all applicable UK property regulations, including the Estate Agents Act 1979, Tenant Fees Act 2019, Housing Act 1988 &amp; 1996, Landlord and Tenant Act 1985, Immigration Act 2014 (Right to Rent), Money Laundering Regulations 2017, Consumer Protection from Unfair Trading Regulations 2008, UK GDPR &amp; Data Protection Act 2018, PECR, and the Equality Act 2010.</P>

      <H2>14. Redress Scheme</H2>
      <P>Details to be updated.</P>

      <H2>15. Complaints Procedure</H2>
      <P>We take complaints seriously. If you are unhappy with our website or services, please contact us at contactus@3ccore.com · 07852254792 · 60 Tottenham Court Road, London, England, W1T 2EW. We will acknowledge your complaint within 3 business days and aim to resolve it within 8 weeks.</P>

      <H2>16. Availability of the Website</H2>
      <P>We aim to keep our Website available at all times but do not guarantee uninterrupted access. We reserve the right to suspend, withdraw, or restrict access to all or part of the Website at any time for operational, maintenance, or legal reasons without notice.</P>

      <H2>17. Changes to These Terms</H2>
      <P>We may update these Terms at any time. Changes will be posted on this page with a revised &quot;Last Updated&quot; date. Your continued use of the Website after changes are posted constitutes your acceptance of the updated Terms.</P>

      <H2>18. Severability</H2>
      <P>If any provision of these Terms is found to be unlawful, void, or unenforceable under English law, that provision shall be deemed severed from the remaining Terms, which shall continue in full force and effect.</P>

      <H2>19. Entire Agreement</H2>
      <P>These Terms, together with our Privacy Policy and Cookie Policy, and any applicable service agreements, constitute the entire agreement between you and 3C Core Ltd. in relation to your use of the Website.</P>

      <H2>20. Governing Law &amp; Jurisdiction</H2>
      <P>These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</P>

      <H2>21. Contact Us</H2>
      <P>For any questions regarding these Terms of Use, please contact: contactus@3ccore.com · 07852254792 · 60 Tottenham Court Road, London, England, W1T 2EW</P>
    </div>
  )
}

const LEGAL_BASIS = [
  { activity: 'Entering and managing tenancy agreements', basis: 'Contract' },
  { activity: 'Property management and inspections', basis: 'Contract / Legitimate Interests' },
  { activity: 'Identity verification and Right to Rent checks', basis: 'Legal Obligation' },
  { activity: 'Processing rent payments and deposits', basis: 'Contract / Legal Obligation' },
  { activity: 'Inventory reports and condition records', basis: 'Contract / Legitimate Interests' },
  { activity: 'Dispute resolution and mediation', basis: 'Legitimate Interests / Legal Obligation' },
  { activity: 'Property sales and conveyancing', basis: 'Contract' },
  { activity: 'Marketing communications', basis: 'Consent' },
  { activity: 'Website analytics and cookies', basis: 'Consent' },
  { activity: 'Anti-money laundering (AML) checks', basis: 'Legal Obligation' },
  { activity: 'Responding to legal claims or regulatory requests', basis: 'Legal Obligation' },
]

const RETENTION = [
  { type: 'Tenancy agreements and records', period: '6 years after tenancy ends' },
  { type: 'Inventory reports and inspection records', period: '6 years after tenancy ends' },
  { type: 'Deposit records', period: '6 years after deposit returned' },
  { type: 'Property sales records', period: '6 years after completion' },
  { type: 'AML identity verification records', period: '5 years minimum' },
  { type: 'Dispute resolution records', period: '6 years after resolution' },
  { type: 'Website enquiries and contact forms', period: '2 years' },
  { type: 'Marketing consent records', period: 'Until consent is withdrawn' },
  { type: 'Accounting and financial records', period: '6 years (HMRC requirement)' },
]
