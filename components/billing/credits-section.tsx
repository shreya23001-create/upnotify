'use client'

import { useState, useCallback } from 'react'
import { IconChevronDown, IconChevronUp } from '@/components/icons'
import type { UserCredit, CreditRule } from '@/lib/types'
import type { SupportedCurrency } from '@/lib/utils/currency'
import { formatGbp, formatInr } from '@/lib/utils/currency'

// 1 pence ≈ 1.07 paise (1 GBP ≈ ₹107). Used to convert stored GBP credit amounts for display.
const GBP_PENCE_TO_INR_PAISE = 107

interface CreditsSectionProps {
  credits: UserCredit[]
  creditRules: CreditRule[]
  balancePence: number
  currency?: SupportedCurrency
}

interface CreditSubmission {
  id: string
  credit_type: string
  submission_url: string | null
  evidence_text: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  credit_amount_pence: number
  created_at: string
}

function formatAmount(pence: number, currency: SupportedCurrency = 'gbp'): string {
  if (currency === 'inr') return formatInr(pence * GBP_PENCE_TO_INR_PAISE)
  return formatGbp(pence)
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

const CREDIT_TYPES: Array<{
  key: string
  icon: React.ReactElement
  label: string
  amount: number
  type: string
  description: string
  requiresUrl: boolean
  urlPlaceholder: string
}> = [
  {
    key: 'trustpilot_review',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    label: 'Trustpilot Review',
    amount: 200,
    type: 'one-time',
    description: 'Write a genuine review about Upnotify on Trustpilot. Share your honest experience — positive or constructive, we value all feedback. Paste the URL of your review below.',
    requiresUrl: true,
    urlPlaceholder: 'https://www.trustpilot.com/reviews/...',
  },
  {
    key: 'g2_review',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    label: 'G2 Review',
    amount: 200,
    type: 'one-time',
    description: 'Leave a review on G2.com about your Upnotify experience. G2 reviews help other businesses discover monitoring solutions. Paste the URL of your review below.',
    requiresUrl: true,
    urlPlaceholder: 'https://www.g2.com/products/uptrue/reviews/...',
  },
  {
    key: 'capterra_review',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
    label: 'Capterra Review',
    amount: 200,
    type: 'one-time',
    description: 'Share your feedback on Capterra. Your review helps SMBs find the right monitoring tool. Paste the URL of your review below.',
    requiresUrl: true,
    urlPlaceholder: 'https://www.capterra.com/reviews/...',
  },
  {
    key: 'blog_post',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    label: 'Blog Post / Tutorial',
    amount: 500,
    type: 'one-time',
    description: 'Write a blog post or tutorial about Upnotify on your own website or Medium. Must be at least 500 words and include a link to upnotify-monitoring.vercel.app. Submit the URL below.',
    requiresUrl: true,
    urlPlaceholder: 'https://yourblog.com/uptrue-review',
  },
  {
    key: 'social_share',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    label: 'Social Media Share',
    amount: 100,
    type: 'one-time',
    description: 'Share Upnotify on Twitter/X, LinkedIn, or other social platforms. Tag @uptrue_io and include a link. Paste the URL of your post below.',
    requiresUrl: true,
    urlPlaceholder: 'https://twitter.com/you/status/...',
  },
  {
    key: 'bug_report',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 2l1.5 1.5"/><path d="M14.5 3.5L16 2"/><path d="M9 7a4 4 0 0 1 6 0v1a6 6 0 0 1-6 0V7z"/><path d="M3 13h2m14 0h2"/><path d="M5 9l1.5 1.5M17.5 10.5 19 9"/><path d="M5 19l1.5-1.5M17.5 17.5 19 19"/><path d="M9 21a6 6 0 0 1 0-12h6a6 6 0 0 1 0 12H9z"/></svg>,
    label: 'Bug Report',
    amount: 300,
    type: 'one-time',
    description: 'Found a bug? Report it with clear steps to reproduce, expected vs actual behaviour, and screenshots if possible. Describe the issue below.',
    requiresUrl: false,
    urlPlaceholder: '',
  },
]

export function CreditsSection({ credits, creditRules, balancePence, currency = 'gbp' }: CreditsSectionProps): React.ReactElement {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<CreditSubmission[]>([])
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitText, setSubmitText] = useState('')
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchSubmissions = useCallback(async (): Promise<void> => {
    if (submissionsLoaded) return
    try {
      const res = await fetch('/api/v1/credits/submit')
      if (res.ok) {
        const data = await res.json() as { success: boolean; submissions: CreditSubmission[] }
        if (data.success) {
          setSubmissions(data.submissions)
          setSubmissionsLoaded(true)
        }
      }
    } catch {
      // Silently ignore
    }
  }, [submissionsLoaded])

  const handleToggle = (key: string): void => {
    if (openAccordion === key) {
      setOpenAccordion(null)
    } else {
      setOpenAccordion(key)
      setSubmitUrl('')
      setSubmitText('')
      setSubmitMessage(null)
      fetchSubmissions()
    }
  }

  const handleSubmit = async (creditType: string): Promise<void> => {
    setSubmitting(creditType)
    setSubmitMessage(null)

    try {
      const res = await fetch('/api/v1/credits/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditType,
          submissionUrl: submitUrl || undefined,
          evidenceText: submitText || undefined,
        }),
      })

      const data = await res.json() as { success: boolean; submission?: CreditSubmission; error?: string }

      if (data.success && data.submission) {
        setSubmissions(prev => [data.submission!, ...prev])
        setSubmitUrl('')
        setSubmitText('')
        setSubmitMessage({ type: 'success', text: 'Submitted! We will review it within 48 hours.' })
      } else {
        setSubmitMessage({ type: 'error', text: data.error ?? 'Failed to submit. Please try again.' })
      }
    } catch {
      setSubmitMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSubmitting(null)
    }
  }

  const getExistingSubmission = (key: string): CreditSubmission | undefined => {
    return submissions.find(s => s.credit_type === key)
  }

  const capAmount = formatAmount(1000, currency)

  return (
    <div className="space-y">
      {/* Balance card */}
      <div className="card stat-card stat-card-green">
        <div className="card-content">
          <div className="stat-label">Credit Balance</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            {formatAmount(balancePence, currency)}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Credits are automatically applied to your next invoice. Maximum {capAmount}/month.
          </p>
          {balancePence >= 1000 && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 8 }}>
              You have reached the monthly credit cap of {capAmount}.
            </p>
          )}
        </div>
      </div>

      {/* Earn credits — accordion */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Earn Credits</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Complete any of the actions below to earn credits towards your subscription.
            Each submission is reviewed within 48 hours.
          </p>
        </div>
        <div className="card-content" style={{ padding: 0 }}>
          <div className="credit-accordion">
            {CREDIT_TYPES.map((ct) => {
              const isOpen = openAccordion === ct.key
              const existing = getExistingSubmission(ct.key)

              return (
                <div key={ct.key} className="credit-accordion-item">
                  <button
                    className="credit-accordion-trigger"
                    onClick={() => handleToggle(ct.key)}
                  >
                    <div className="credit-accordion-trigger-left">
                      <span className="credit-accordion-trigger-icon">{ct.icon}</span>
                      <div>
                        <div className="credit-accordion-trigger-label">{ct.label}</div>
                        <div className="credit-accordion-trigger-sublabel">{ct.type === 'one-time' ? 'One-time' : 'Recurring'}</div>
                      </div>
                    </div>
                    <div className="credit-accordion-trigger-right">
                      <span className="credit-accordion-trigger-amount">{formatAmount(ct.amount, currency)}</span>
                      {existing && (
                        <span className={`badge ${existing.status === 'approved' ? 'badge-success' : existing.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                          {existing.status === 'approved' ? 'Approved' : existing.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      )}
                      {isOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="credit-accordion-content">
                      <p className="credit-accordion-desc">{ct.description}</p>

                      {existing && existing.status === 'pending' && (
                        <div className="credit-submit-status credit-submit-status-pending">
                          Pending review — submitted {new Date(existing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
                          We will notify you once reviewed.
                        </div>
                      )}

                      {existing && existing.status === 'approved' && (
                        <div className="credit-submit-status credit-submit-status-approved">
                          Approved! {formatAmount(existing.credit_amount_pence, currency)} credit has been added to your account.
                        </div>
                      )}

                      {existing && existing.status === 'rejected' && (
                        <div className="credit-submit-status credit-submit-status-rejected">
                          {existing.review_notes || 'This submission did not meet our guidelines. Please try again with a different submission.'}
                        </div>
                      )}

                      {(!existing || existing.status === 'rejected') && (
                        <div className="credit-submit-form">
                          {ct.requiresUrl && (
                            <input
                              className="form-input"
                              type="url"
                              placeholder={ct.urlPlaceholder}
                              value={submitUrl}
                              onChange={(e) => setSubmitUrl(e.target.value)}
                              disabled={submitting === ct.key}
                            />
                          )}
                          <textarea
                            className="form-input"
                            placeholder={ct.requiresUrl ? 'Additional notes (optional)' : 'Describe the bug with steps to reproduce...'}
                            value={submitText}
                            onChange={(e) => setSubmitText(e.target.value)}
                            rows={ct.requiresUrl ? 2 : 4}
                            disabled={submitting === ct.key}
                            style={{ resize: 'vertical' }}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSubmit(ct.key)}
                            disabled={submitting === ct.key || (!submitUrl && !submitText)}
                          >
                            {submitting === ct.key ? 'Submitting...' : 'Submit for Review'}
                          </button>

                          {submitMessage && (
                            <div className={`credit-submit-status ${submitMessage.type === 'success' ? 'credit-submit-status-approved' : 'credit-submit-status-rejected'}`}>
                              {submitMessage.text}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Credit history */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Credit History</div>
        </div>
        <div className="card-content">
          {credits.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No credits earned yet. Complete an action above to start earning!</p>
          ) : (
            <div className="credit-history-list">
              {credits.map((credit) => (
                <div key={credit.id} className="credit-history-item">
                  <div className="credit-history-info">
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{credit.rule_key.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(credit.earned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${getCreditStatusClass(credit)}`}>
                      {getCreditStatusLabel(credit)}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {formatAmount(credit.amount_pence, currency)}
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
