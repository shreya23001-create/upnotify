import type { FaqItem } from '@/lib/constants/faq'

interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps): React.ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function OrganizationJsonLd(): React.ReactElement {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Upnotify',
    legalName: 'Crozent Techlabs Private Limited',
    url: 'https://upnotify-monitoring.vercel.app',
    logo: 'https://upnotify-monitoring.vercel.app/logo.svg',
    description:
      'Uptime, performance and infrastructure monitoring platform for agencies and teams.',
    foundingDate: '2026',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'B-59, B-Block, Chipyana',
      addressLocality: 'Noida',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN',
      postalCode: '201009',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@upnotify.com',
      contactType: 'customer support',
    },
    // sameAs: [
    //   'https://x.com/uptrue_io',
    //   'https://www.linkedin.com/company/uptrue-io/',
    // ],
  }

  return <JsonLd data={data} />
}

export function SoftwareApplicationJsonLd(): React.ReactElement {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Upnotify',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://upnotify-monitoring.vercel.app',
    description:
      'Uptime, performance and infrastructure monitoring for agencies and teams. 24 monitor types, AI-powered reports, public status pages, multi-channel alerts, competitor tracking, free SSL checker and uptime calculator, and a public uptime leaderboard.',
    featureList: [
      '24 monitor types (HTTP, SSL, DNS, API, keyword, TCP, and more)',
      '1-minute check intervals',
      'Two-region confirmation to eliminate false alarms',
      'AI-powered uptime reports',
      'Public and branded status pages',
      'Multi-channel alerts (Slack, email, Teams, webhook)',
      'Agency white-label and client management',
      'Competitor uptime tracking',
      'API access for automation',
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Crozent Techlabs Private Limited',
      url: 'https://upnotify-monitoring.vercel.app',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'GBP',
        description: 'Get started with basic monitoring — 3 monitors, email alerts',
      },
      {
        '@type': 'Offer',
        name: 'Lite',
        price: '10',
        priceCurrency: 'GBP',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '10',
          priceCurrency: 'GBP',
          billingDuration: 'P1Y',
        },
        description: 'Affordable monitoring for small projects — 5 monitors, 1-minute checks',
      },
      {
        '@type': 'Offer',
        name: 'Builder',
        price: '15',
        priceCurrency: 'GBP',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '15',
          priceCurrency: 'GBP',
          billingDuration: 'P1M',
        },
        description: 'For growing teams and serious projects — 25 monitors, AI reports',
      },
      {
        '@type': 'Offer',
        name: 'Scale',
        price: '39',
        priceCurrency: 'GBP',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '39',
          priceCurrency: 'GBP',
          billingDuration: 'P1M',
        },
        description: 'Full power for teams — 100 monitors, 30-second checks, full API access',
      },
    ],
  }

  return <JsonLd data={data} />
}

export function WebSiteJsonLd(): React.ReactElement {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Upnotify',
    url: 'https://upnotify-monitoring.vercel.app',
    description:
      'Uptime, performance and infrastructure monitoring for agencies and teams.',
    dateModified: new Date().toISOString().split('T')[0],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://upnotify-monitoring.vercel.app/tracker?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return <JsonLd data={data} />
}

interface FaqPageJsonLdProps {
  items: FaqItem[]
}

export function FaqPageJsonLd({ items }: FaqPageJsonLdProps): React.ReactElement {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return <JsonLd data={data} />
}
