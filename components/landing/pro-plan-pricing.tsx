import Link from 'next/link'
import {
  Globe, Lock, Radio, Search, CalendarClock, Plug, Wifi, Zap, HeartPulse,
  Eye, ShieldCheck, Timer, Bot, MapPin, Mail, Landmark, Map, Link2,
  MailCheck, Ban, Package, Cookie, Network,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'

const MONITOR_TYPE_ICONS: Record<string, LucideIcon> = {
  http: Globe, ssl: Lock, dns: Radio, keyword: Search, domain: CalendarClock,
  port: Plug, ping: Wifi, api: Zap, heartbeat: HeartPulse, competitor: Eye,
  'security-headers': ShieldCheck, 'response-time': Timer, 'robots-txt': Bot,
  'ip-change': MapPin, 'mx-health': Mail, 'whois-change': Landmark, sitemap: Map,
  'redirect-chain': Link2, 'spf-dmarc': MailCheck, blacklist: Ban,
  'page-size': Package, 'cookie-consent': Cookie, 'nameserver-change': Network,
}

// Same figures as the dashboard Plans page (components/billing/plans-dashboard.tsx) —
// keep both in sync if pricing ever changes.
const ORIGINAL_PRICE_PER_WEBSITE_INR = 1788 // ₹149/month × 12
const DISCOUNTED_PRICE_PER_WEBSITE_INR = 999
const GST_RATE = 0.18

function fmtMoney(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
}

export default function ProPlanPricing(): React.ReactElement {
  const finalPricePerWebsite = Math.round(DISCOUNTED_PRICE_PER_WEBSITE_INR * (1 + GST_RATE) * 100) / 100

  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">No surprises</div>
          <h2 className="section-title pricing-title-gradient">One plan. One price per website.</h2>
          <p className="section-sub">No tiers to compare, no feature gates to hit — every monitor type comes included with every website.</p>
        </div>

        <div className="pro-plan-columns pro-plan-columns-centered">
          <div className="pro-plan-card pro-plan-col-solo">
            <div className="pro-plan-badge">Best Value</div>
            <div className="pro-plan-name">Pro Plan</div>
            <div className="pro-plan-tagline">Everything included. One simple price per website.</div>

            <div className="pro-plan-price-row">
              <span className="pro-plan-price-original">₹{fmtMoney(ORIGINAL_PRICE_PER_WEBSITE_INR)}/year</span>
              <span className="pro-plan-price-discounted">₹{fmtMoney(DISCOUNTED_PRICE_PER_WEBSITE_INR)}<span className="pro-plan-price-unit">/website/year</span></span>
            </div>
            <div className="pro-plan-price-sub">
              Normally ₹149/month per website, billed yearly at a discount — ₹{fmtMoney(finalPricePerWebsite)}/website/year including 18% GST.
            </div>

            <div className="plans-included-monitors">
              {MONITOR_TYPES.filter(mt => mt.type !== 'wordpress').map(mt => {
                const Icon = MONITOR_TYPE_ICONS[mt.type] ?? Globe
                return (
                  <span key={mt.type} className="plans-included-monitor-pill">
                    <Icon size={14} strokeWidth={2} />
                    {mt.name}
                  </span>
                )
              })}
            </div>

            <div className="pro-plan-empty">
              <Link href="/signup" className="btn btn-primary btn-lg">Start Now</Link>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
          + 18% GST · Secure checkout via Razorpay · Add as many websites as you need, each billed the same way
        </p>
      </div>
    </section>
  )
}
