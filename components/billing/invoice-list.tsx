'use client'

import { DataTable, type Column } from '@/components/ui/data-table'
import type { Invoice } from '@/lib/types'

/**
 * Each row in the `invoices` table is one successful payment charge from
 * either Stripe (GBP) or Razorpay (INR), so this table doubles as the org's
 * transaction ledger. Provider and reference are derived from the row itself:
 * Razorpay charges store their payment id as `rzp_<id>` in stripe_invoice_id
 * (see app/api/webhooks/razorpay/route.ts), everything else is Stripe.
 */
type Gateway = 'Stripe' | 'Razorpay'

function getGateway(i: Invoice): Gateway {
  if (i.currency === 'inr' || i.stripe_invoice_id?.startsWith('rzp_')) return 'Razorpay'
  return 'Stripe'
}

function getReference(i: Invoice): string | null {
  if (!i.stripe_invoice_id) return null
  // Strip our internal `rzp_` prefix so the user sees the raw Razorpay payment id.
  return i.stripe_invoice_id.startsWith('rzp_')
    ? i.stripe_invoice_id.slice(4)
    : i.stripe_invoice_id
}

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const columns: Column<Invoice>[] = [
    { key: 'created_at', label: 'Date', render: (i) => (
      <span>{new Date(i.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    )},
    { key: 'gateway', label: 'Gateway', render: (i) => {
      const gw = getGateway(i)
      return <span className="badge badge-outline">{gw}</span>
    }},
    { key: 'stripe_invoice_id', label: 'Reference', render: (i) => {
      const ref = getReference(i)
      if (!ref) return <span className="table-muted">{'—'}</span>
      return (
        <span
          title={ref}
          style={{ fontFamily: 'monospace', fontSize: 12, display: 'inline-block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}
        >
          {ref}
        </span>
      )
    }},
    { key: 'amount_gbp', label: 'Amount', render: (i) => {
      if (i.currency === 'inr') {
        return <span style={{ fontWeight: 600 }}>₹{(i.amount_gbp / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      }
      return <span style={{ fontWeight: 600 }}>£{(i.amount_gbp / 100).toFixed(2)}</span>
    }},
    { key: 'status', label: 'Status', render: (i) => (
      <span className={`badge ${i.status === 'paid' ? 'badge-success' : i.status === 'open' ? 'badge-warning' : 'badge-outline'}`}>
        {i.status}
      </span>
    )},
    { key: 'period_start', label: 'Billing Period', render: (i) => {
      if (!i.period_start || !i.period_end) return <span className="table-muted">{'—'}</span>
      const start = new Date(i.period_start)
      const end = new Date(i.period_end)
      const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      // Same day = data not yet updated; just show the date without a range
      if (start.toDateString() === end.toDateString()) return <span className="table-muted">{fmt(start)}</span>
      return <span className="table-muted">{fmt(start)} → {fmt(end)}</span>
    }},
    { key: 'invoice_pdf_url', label: '', sortable: false, searchable: false, render: (i) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {i.invoice_pdf_url ? (
          // Stripe invoices: open Stripe-hosted PDF directly (includes full VAT breakdown)
          <a href={i.invoice_pdf_url} target="_blank" rel="noopener noreferrer" className="stt-invoice-link">
            View
          </a>
        ) : (
          // Razorpay / manual invoices: our branded print page
          <a href={`/dashboard/billing/invoice/${i.id}`} className="stt-invoice-link">
            View
          </a>
        )}
      </div>
    )},
  ]

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">Transaction History</div></div>
      <div className="card-content">
        <DataTable
          columns={columns}
          data={invoices}
          searchPlaceholder="Search transactions..."
          pageSize={10}
          emptyMessage="No transactions yet."
        />
      </div>
    </div>
  )
}
