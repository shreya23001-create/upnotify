'use client'

import { DataTable, type Column } from '@/components/ui/data-table'
import type { Invoice } from '@/lib/types'

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const columns: Column<Invoice>[] = [
    { key: 'created_at', label: 'Date', render: (i) => (
      <span>{new Date(i.created_at).toLocaleDateString()}</span>
    )},
    { key: 'amount_gbp', label: 'Amount', render: (i) => (
      <span style={{ fontWeight: 600 }}>{'\u00A3'}{(i.amount_gbp / 100).toFixed(2)}</span>
    )},
    { key: 'status', label: 'Status', render: (i) => (
      <span className={`badge ${i.status === 'paid' ? 'badge-success' : i.status === 'open' ? 'badge-warning' : 'badge-outline'}`}>
        {i.status}
      </span>
    )},
    { key: 'period_start', label: 'Period', render: (i) => (
      <span className="table-muted">
        {i.period_start ? new Date(i.period_start).toLocaleDateString() : '\u2014'}
        {' \u2014 '}
        {i.period_end ? new Date(i.period_end).toLocaleDateString() : '\u2014'}
      </span>
    )},
    { key: 'invoice_pdf_url', label: '', sortable: false, searchable: false, render: (i) => (
      i.invoice_pdf_url ? (
        <a href={i.invoice_pdf_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
          Download PDF
        </a>
      ) : null
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
