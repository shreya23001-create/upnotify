'use client'

import type { Invoice, Organisation } from '@/lib/types'
import type { SellerEntity } from '@/lib/db/seller-entities'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtAmount(paise: number, currency: string): string {
  if (currency === 'inr') return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  return `£${(paise / 100).toFixed(2)}`
}

function invoiceNumber(stripeId: string | null, id: string): string {
  if (stripeId) return stripeId.replace('in_', 'INV-').toUpperCase()
  return `INV-${id.slice(0, 8).toUpperCase()}`
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  invoice: Invoice
  organisation: Organisation
  userEmail: string
  seller: SellerEntity
  /** Websites covered by this invoice's payment — shown as one line item
   *  per domain instead of a single generic "Upnotify Subscription" row
   *  when the invoice is linked to a Pro Plan website_subscriptions row. */
  domains?: string[]
}

export function InvoicePrint({ invoice, organisation, userEmail, seller, domains = [] }: Props): React.ReactElement {
  const isInr = invoice.currency === 'inr'

  // GST / VAT calculations for INR invoices (18% GST inclusive)
  const totalPaise = invoice.amount_gbp
  const baseAmountPaise = isInr ? Math.round(totalPaise / 1.18) : totalPaise
  const gstPaise = isInr ? totalPaise - baseAmountPaise : 0
  const perDomainBasePaise = domains.length > 0 ? Math.round(baseAmountPaise / domains.length) : baseAmountPaise

  return (
    <div className="invoice-page">
      {/* Print / Back bar — hidden when printing */}
      <div className="invoice-actions no-print">
        <a href="/dashboard/settings?tab=billing" className="btn btn-secondary btn-sm">
          ← Back to Billing
        </a>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
          Download PDF
        </button>
      </div>

      {/* Invoice document */}
      <div className="invoice-doc">

        {/* Header */}
        <div className="invoice-header">
          <div className="invoice-logo-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo_2.png" alt="Upnotify" className="invoice-logo" />
          </div>
          <div className="invoice-title-block">
            <div className="invoice-title">INVOICE</div>
            <div className="invoice-number">{invoiceNumber(invoice.stripe_invoice_id, invoice.id)}</div>
          </div>
        </div>

        <hr className="invoice-divider" />

        {/* From / To */}
        <div className="invoice-parties">
          <div className="invoice-from">
            <div className="invoice-label">From</div>
            <div className="invoice-party-name">{seller.legal_name}</div>
            <div className="invoice-party-detail">{seller.email}</div>
          </div>
          <div className="invoice-to">
            <div className="invoice-label">Bill To</div>
            <div className="invoice-party-name">{organisation.name}</div>
            {organisation.company_address_line1 && (
              <div className="invoice-party-detail">{organisation.company_address_line1}</div>
            )}
            {organisation.company_address_line2 && (
              <div className="invoice-party-detail">{organisation.company_address_line2}</div>
            )}
            {organisation.company_city && organisation.company_postcode && (
              <div className="invoice-party-detail">{organisation.company_city}, {organisation.company_postcode}</div>
            )}
            {organisation.company_country && (
              <div className="invoice-party-detail">{organisation.company_country}</div>
            )}
            {organisation.company_vat_number && (
              <div className="invoice-party-detail">VAT No. {organisation.company_vat_number}</div>
            )}
            <div className="invoice-party-detail">{userEmail}</div>
          </div>
          <div className="invoice-meta">
            <div className="invoice-label">Invoice Details</div>
            <div className="invoice-meta-row">
              <span>Date</span>
              <span>{fmt(invoice.created_at)}</span>
            </div>
            {invoice.period_start && invoice.period_end && (
              <div className="invoice-meta-row">
                <span>Period</span>
                <span>{fmt(invoice.period_start)} – {fmt(invoice.period_end)}</span>
              </div>
            )}
            <div className="invoice-meta-row">
              <span>Status</span>
              <span style={{ textTransform: 'capitalize', fontWeight: 600, color: invoice.status === 'paid' ? '#16a34a' : '#d97706' }}>
                {invoice.status}
              </span>
            </div>
            <div className="invoice-meta-row">
              <span>Currency</span>
              <span>{invoice.currency.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Period</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {domains.length > 0 ? (
              domains.map(domain => (
                <tr key={domain}>
                  <td>Pro Plan — {domain} (1 year)</td>
                  <td>
                    {invoice.period_start && invoice.period_end && invoice.period_start !== invoice.period_end
                      ? `${fmt(invoice.period_start)} – ${fmt(invoice.period_end)}`
                      : fmt(invoice.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>{fmtAmount(perDomainBasePaise, invoice.currency)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td>Upnotify Subscription</td>
                <td>
                  {invoice.period_start && invoice.period_end && invoice.period_start !== invoice.period_end
                    ? `${fmt(invoice.period_start)} – ${fmt(invoice.period_end)}`
                    : fmt(invoice.created_at)}
                </td>
                <td style={{ textAlign: 'right' }}>{fmtAmount(isInr ? baseAmountPaise : totalPaise, invoice.currency)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            {isInr && (
              <tr>
                <td colSpan={2} style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 13 }}>
                  GST @ 18%
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 13 }}>
                  {fmtAmount(gstPaise, invoice.currency)}
                </td>
              </tr>
            )}
            <tr className="invoice-total-row">
              <td colSpan={2} style={{ textAlign: 'right' }}>Total</td>
              <td style={{ textAlign: 'right' }}>{fmtAmount(totalPaise, invoice.currency)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div className="invoice-footer">
          <p>Thank you for your business. For any billing queries, contact {seller.email}</p>
        </div>

      </div>
    </div>
  )
}
