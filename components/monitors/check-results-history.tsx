'use client'

import type { CheckResult } from '@/lib/types'

export function CheckResultsHistory({ results }: { results: CheckResult[] }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">Check History</div></div>
      <div className="card-content">
        {results.length === 0 ? (
          <p style={{ fontSize: 14, color: '#71717a' }}>No check results yet. The first check will run shortly.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Response Time</th>
                <th>Status Code</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="table-muted">{new Date(result.checked_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${
                      result.status === 'up' ? 'badge-success' :
                      result.status === 'down' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {result.status}
                    </span>
                  </td>
                  <td>{result.response_time_ms ? `${result.response_time_ms}ms` : '—'}</td>
                  <td>{result.status_code ?? '—'}</td>
                  <td className="table-muted table-truncate">{result.error_message ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
