'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { HelpSidebar } from '../help-sidebar'

export default function HelpCompetePage(): React.ReactElement {
  const pathname = usePathname()
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/help') }, [router]) // Hidden until v1.5 launch
  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <div className="help-main">
        <article className="help-article">
          <div className="help-article-hero">
            <h1 className="help-article-title">Upnotify Compete</h1>
            <p className="help-article-intro">Track competitor prices, detect stock changes, and get alerts when competitors adjust their pricing. Compete is a separate add-on available with any paid monitoring plan.</p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">What is Compete?</h2>
            <p>Upnotify Compete monitors competitor product prices and stock availability automatically. It extracts prices from any ecommerce site using intelligent parsing (JSON-LD, Open Graph, Microdata, or custom CSS selectors) — no code or browser extensions needed.</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">How to Subscribe</h2>
            <p>Compete is a separate add-on with its own pricing. Go to <Link href="/dashboard/compete">Dashboard &gt; Compete</Link> to see plans and subscribe. You need an active Pro Plan website first.</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Adding Products</h2>
            <ol className="help-steps">
              <li>Go to <strong>Compete</strong> in the dashboard</li>
              <li>Click <strong>Add Product</strong> and paste a product URL from any ecommerce site</li>
              <li>Upnotify extracts the price, stock status, and product name automatically</li>
              <li>Preview the extraction before confirming — check the price, confidence score, and extraction method</li>
              <li>Organise products into groups for easier comparison</li>
            </ol>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Pricing Rules</h2>
            <p>Set rules to get alerts or automatically update your own prices when competitors change theirs.</p>
            <ul className="help-list">
              <li><strong>Alert only</strong> (default) — get notified via email and in-app messages when a rule triggers</li>
              <li><strong>Auto-update</strong> — automatically send a webhook to your store with a new price. Options: match, undercut by X%, or stay above by X%</li>
            </ul>
            <p><strong>Safety limits</strong> protect you from runaway pricing:</p>
            <ul className="help-list">
              <li>Minimum and maximum price floors/ceilings</li>
              <li>Maximum percentage change per update</li>
              <li>Maximum updates per day</li>
            </ul>
            <p>Enabling auto-update requires a 10-second confirmation and acceptance of the <Link href="/automated-pricing-policy">Automated Pricing Policy</Link>.</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Store Integrations</h2>
            <p>Connect your WooCommerce, Shopify, or BigCommerce store to send price updates automatically via webhook. Go to <strong>Compete &gt; Connect Store</strong> for setup instructions specific to your platform.</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">AI Weekly Brief</h2>
            <p>Every Monday, Compete generates an AI-powered summary of the week&apos;s price changes, stock movements, and competitor sales. The brief is delivered via email and in-app message.</p>
          </section>
        </article>
      </div>
    </div>
  )
}
