'use client'

import { useState, useCallback } from 'react'
import type { Referral } from '@/lib/types'

interface ReferralSectionProps {
  referralCode: string | null
  referrals: Referral[]
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'completed': return 'badge-success'
    case 'signed_up': return 'badge-warning'
    case 'expired': return 'badge-danger'
    default: return 'badge-outline'
  }
}

export function ReferralSection({ referralCode, referrals }: ReferralSectionProps): React.ReactElement {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://uptrue.io'
  const referralLink = referralCode ? `${origin}/r/${referralCode}` : null

  const handleCopy = useCallback((): void => {
    if (!referralLink) return
    void navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [referralLink])

  return (
    <div className="space-y">
      {/* Referral invite card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Refer a Friend</div>
        </div>
        <div className="card-content">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>
            Share your unique referral link. When someone signs up and upgrades to a paid plan,
            you both get <strong>{'\u00A3'}5.00 credit</strong> applied to your next bill.
          </p>

          {referralLink ? (
            <div className="referral-link-row">
              <input
                className="form-input"
                value={referralLink}
                readOnly
                style={{ flex: 1, fontSize: 13, fontFamily: 'monospace' }}
                aria-label="Your referral link"
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCopy}
                style={{ whiteSpace: 'nowrap' }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Generating your referral code...
            </p>
          )}
        </div>
      </div>

      {/* Referral history */}
      <div className="card">
        <div className="card-header card-header-row">
          <div className="card-title">Your Referrals</div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {referrals.filter(r => r.status === 'completed').length} completed
          </span>
        </div>
        <div className="card-content">
          {referrals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              No referrals yet. Share your link to get started!
            </p>
          ) : (
            <div className="referral-list">
              {referrals.map((ref) => (
                <div key={ref.id} className="referral-list-item">
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {new Date(ref.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(ref.status)}`}>
                    {ref.status === 'signed_up' ? 'Signed Up' : ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
