'use client'

import type { UserCredit, CreditRule } from '@/lib/types'

interface CreditsSectionProps {
  credits: UserCredit[]
  creditRules: CreditRule[]
  balancePence: number
}

function formatPence(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`
}

function getCreditStatusLabel(credit: UserCredit): string {
  if (credit.applied) return 'Applied'
  if (credit.expires_at && new Date(credit.expires_at) < new Date()) return 'Expired'
  return 'Active'
}

function getCreditStatusClass(credit: UserCredit): string {
  if (credit.applied) return 'badge-outline'
  if (credit.expires_at && new Date(credit.expires_at) < new Date()) return 'badge-danger'
  return 'badge-success'
}

export function CreditsSection({ credits, creditRules, balancePence }: CreditsSectionProps): React.ReactElement {
  return (
    <div className="space-y">
      {/* Balance card */}
      <div className="card stat-card stat-card-green">
        <div className="card-content">
          <div className="stat-label">Credit Balance</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            {formatPence(balancePence)}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Credits are automatically applied to your next bill.
          </p>
          {balancePence >= 1000 && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 8 }}>
              Monthly credit cap: {formatPence(1000)}
            </p>
          )}
        </div>
      </div>

      {/* How to earn */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">How to Earn Credits</div>
        </div>
        <div className="card-content">
          {creditRules.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No credit programs available right now.</p>
          ) : (
            <div className="credit-rules-list">
              {creditRules.map((rule) => (
                <div key={rule.id} className="credit-rule-item">
                  <div className="credit-rule-info">
                    <span className="credit-rule-name">{rule.display_name}</span>
                    <span className="credit-rule-type">
                      {rule.credit_type === 'recurring' ? 'Recurring' : 'One-time'}
                      {rule.max_per_user > 1 ? ` (up to ${rule.max_per_user}x)` : ''}
                    </span>
                  </div>
                  <span className="credit-rule-amount">{formatPence(rule.credit_amount_pence)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Credit history */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Credit History</div>
        </div>
        <div className="card-content">
          {credits.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No credits earned yet. Start earning above!</p>
          ) : (
            <div className="credit-history-list">
              {credits.map((credit) => (
                <div key={credit.id} className="credit-history-item">
                  <div className="credit-history-info">
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{credit.rule_key.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(credit.earned_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${getCreditStatusClass(credit)}`}>
                      {getCreditStatusLabel(credit)}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {formatPence(credit.amount_pence)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
