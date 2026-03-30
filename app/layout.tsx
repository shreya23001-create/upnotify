import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./styles.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Uptrue — Uptime & Performance Monitoring",
  description: "Multi-tenant SaaS platform for uptime, performance and infrastructure monitoring.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
