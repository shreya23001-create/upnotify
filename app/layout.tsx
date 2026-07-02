import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans, Figtree } from "next/font/google"
import { CookieConsent } from "@/components/ui/cookie-consent"
import { BackToTop } from "@/components/ui/back-to-top"
import { GoogleTagManager } from "@/components/analytics/google-tag-manager"
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity"
import "./styles.css"

// Hard SEO rule: only the production host (uptrue.io / www.uptrue.io) is
// indexable. Vercel sets VERCEL_ENV='production' only on master deploys —
// any other environment (preview/dev/local) must emit noindex,nofollow so
// Google never crawls duplicate content under dev.uptrue.io.
const IS_PRODUCTION_HOST = process.env.VERCEL_ENV === "production"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" })
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" })
const plusJakartaSans = Plus_Jakarta_Sans({ variable: "--font-display", subsets: ["latin"], display: "swap", weight: ["700", "800"] })
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], display: "swap", weight: ["300", "400", "500", "600", "700", "800", "900"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL("https://uptrue.io"),
  title: {
    default: "Free Uptime Monitoring for Agencies, SaaS & Dev Teams — Uptrue",
    template: "%s",
  },
  description:
    "Monitor uptime, SSL, DNS, APIs & more across all your sites. 1-min checks, 2-region confirm, zero false alarms. Free — no card needed.",
  keywords: [
    "uptime monitoring",
    "website monitoring",
    "server monitoring",
    "performance monitoring",
    "infrastructure monitoring",
    "status page",
    "incident management",
    "SSL monitoring",
    "DNS monitoring",
    "agency monitoring",
    "white-label monitoring",
    "AI reports",
    "downtime alerts",
    "uptime checker",
  ],
  authors: [{ name: "Vision Software Solutions Limited" }],
  creator: "Uptrue",
  publisher: "Vision Software Solutions Limited",

  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://uptrue.io",
    siteName: "Uptrue",
    title: "Free Uptime Monitoring for Agencies, SaaS & Dev Teams — Uptrue",
    description:
      "Monitor uptime, SSL, DNS, APIs & more across all your sites. 1-min checks, 2-region confirm, zero false alarms. Free — no card needed.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Free Uptime Monitoring for Agencies, SaaS & Dev Teams — Uptrue",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Uptime Monitoring for Agencies, SaaS & Dev Teams — Uptrue",
    description:
      "Monitor uptime, SSL, DNS, APIs & more across all your sites. 1-min checks, 2-region confirm, zero false alarms. Free — no card needed.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  robots: IS_PRODUCTION_HOST
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      }
    : {
        // Non-production: emit noindex,nofollow at the meta layer.
        // X-Robots-Tag header (in next.config.ts) repeats this at the HTTP
        // layer so cached responses and 30x redirects also carry the signal.
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false },
      },
  other: {
    // SaaSHub directory verification. Required permanently — SaaSHub re-checks
    // periodically; removing the tag would un-verify the listing.
    "saashub-verification": "l5obg5hu6ag6",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${plusJakartaSans.variable} ${figtree.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var saved = localStorage.getItem('uptrue_theme');
            if (saved !== 'light') {
              document.documentElement.classList.add('dark');
            }
          })();
        ` }} />
        <GoogleTagManager />
        <MicrosoftClarity />
        {children}
        <BackToTop />
        <CookieConsent />
      </body>
    </html>
  )
}
