'use client'

import { DataTable, type Column } from '@/components/ui/data-table'
import type { Invoice } from '@/lib/types'

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const columns: Column<Invoice>[] = [
    { key: 'created_at', label: 'Date', render: (i) => (
      <span>{new Date(i.created_at).toLocaleDateString()}</span>
    )},
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
      if (!i.period_start || !i.period_end) return <span className="table-muted">{'\u2014'}</span>
      const start = new Date(i.period_start)
      const end = new Date(i.period_end)
      const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      // Same day = data not yet updated; just show the date without a range
      if (start.toDateString() === end.toDateString()) return <span className="table-muted">{fmt(start)}</span>
      return <span className="table-muted">{fmt(start)} → {fmt(end)}</span>
    }},
    { key: 'invoice_pdf_url', label: '', sortable: false, searchable: false, render: (i) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <a href={`/dashboard/billing/invoice/${i.id}`} className="btn btn-sm btn-secondary">
          View Invoice
        </a>
      </div>
    )},
  ]

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">Invoice History</div></div>
      <div className="card-content">
        <DataTable
          columns={columns}
          data={invoices}
          searchPlaceholder="Search invoices..."
          pageSize={10}
          emptyMessage="No invoices yet."
        />
      </div>
    </div>
  )
}
