import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { CookieConsent } from "@/components/ui/cookie-consent"
import { GoogleTagManager } from "@/components/analytics/google-tag-manager"
import "./styles.css"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" })
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" })

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
    default: "Uptrue — Uptime Monitoring for Agencies & Teams",
    template: "%s | Uptrue",
  },
  description:
    "Monitor uptime, performance and infrastructure across all your sites. 10 monitor types, AI-powered reports, public status pages, multi-channel alerts, and agency white-label — all in one platform.",
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
  alternates: {
    canonical: "https://uptrue.io",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://uptrue.io",
    siteName: "Uptrue",
    title: "Uptrue — Uptime Monitoring for Agencies & Teams",
    description:
      "Monitor uptime, performance and infrastructure across all your sites. 10 monitor types, AI-powered reports, public status pages, and multi-channel alerts.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Uptrue — Uptime Monitoring for Agencies & Teams",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Uptrue — Uptime Monitoring for Agencies & Teams",
    description:
      "Monitor uptime, performance and infrastructure across all your sites. 10 monitor types, AI-powered reports, public status pages, and multi-channel alerts.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
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
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
