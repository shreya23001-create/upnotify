'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailTemplate {
  id: string
  template_key: string
  name: string
  subject: string
  body_text: string
  body_html: string
  is_active: boolean
  category: string
  variables: string[]
  send_count: number
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  onboarding: { label: 'Onboarding', color: '#3b82f6' },
  billing: { label: 'Billing', color: '#f59e0b' },
  engagement: { label: 'Engagement', color: '#8b5cf6' },
  system: { label: 'System', color: '#6b7280' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminEmailsPage(): React.ReactElement {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBodyText, setEditBodyText] = useState('')
  const [editBodyHtml, setEditBodyHtml] = useState('')
  const [saving, setSaving] = useState(false)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const editorRef = useRef<HTMLDivElement>(null)

  // -------------------------------------------------------------------------
  // Fetch templates
  // -------------------------------------------------------------------------

  const fetchTemplates = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/emails')
      if (res.ok) {
        const data = await res.json() as { success: boolean; templates: EmailTemplate[] }
        if (data.success) setTemplates(data.templates)
      }
    } catch {
      setToast({ type: 'error', text: 'Failed to load templates.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  // -------------------------------------------------------------------------
  // Edit handlers
  // -------------------------------------------------------------------------

  function handleEdit(template: EmailTemplate): void {
    setEditingKey(template.template_key)
    setEditSubject(template.subject)
    setEditBodyText(template.body_text)
    setEditBodyHtml(template.body_html)
    setShowPreview(false)

    // Scroll to editor after state update
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  function handleCancelEdit(): void {
    setEditingKey(null)
    setEditSubject('')
    setEditBodyText('')
    setEditBodyHtml('')
    setShowPreview(false)
  }

  async function handleSave(): Promise<void> {
    if (!editingKey) return
    setSaving(true)

    try {
      const res = await fetch('/api/admin/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_key: editingKey,
          subject: editSubject.trim(),
          body_text: editBodyText.trim(),
          body_html: editBodyHtml.trim(),
        }),
      })

      const data = await res.json() as { success: boolean; error?: string }

      if (data.success) {
        setToast({ type: 'success', text: 'Template saved successfully.' })
        setEditingKey(null)
        fetchTemplates()
      } else {
        setToast({ type: 'error', text: data.error ?? 'Failed to save template.' })
      }
    } catch {
      setToast({ type: 'error', text: 'Network error while saving.' })
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Toggle active/inactive
  // -------------------------------------------------------------------------

  async function handleToggle(templateKey: string, currentActive: boolean): Promise<void> {
    setTogglingKey(templateKey)

    try {
      const res = await fetch('/api/admin/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_key: templateKey,
          is_active: !currentActive,
        }),
      })

      const data = await res.json() as { success: boolean; error?: string }

      if (data.success) {
        setToast({ type: 'success', text: `Template ${!currentActive ? 'activated' : 'deactivated'}.` })
        fetchTemplates()
      } else {
        setToast({ type: 'error', text: data.error ?? 'Failed to toggle template.' })
      }
    } catch {
      setToast({ type: 'error', text: 'Network error.' })
    } finally {
      setTogglingKey(null)
    }
  }

  // -------------------------------------------------------------------------
  // Preview rendering
  // -------------------------------------------------------------------------

  function renderPreviewHtml(): string {
    // Wrap the body_html content in the nurture base template shell for preview
    const content = editBodyHtml
      .replace(/\{\{first_name\}\}/g, 'John')
      .replace(/\{\{app_url\}\}/g, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
      .replace(/\{\{month_name\}\}/g, 'March 2026')
      .replace(/\{\{total_monitors\}\}/g, '12')
      .replace(/\{\{total_checks\}\}/g, '45,231')
      .replace(/\{\{uptime_percent\}\}/g, '99.97')
      .replace(/\{\{incident_count\}\}/g, '2')
      .replace(/\{\{days_left\}\}/g, '4')
      .replace(/\{\{cta_button\}\}/g, '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td><a href="#" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">Call to Action</a></td></tr></table>')
      .replace(/\{\{stats_table\}\}/g, '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;border-collapse:collapse;"><tr><td style="padding:12px 16px;text-align:center;border:1px solid #e5e7eb;"><div style="font-size:24px;font-weight:700;color:#111827;">12</div><div style="font-size:12px;color:#6b7280;">MONITORS</div></td><td style="padding:12px 16px;text-align:center;border:1px solid #e5e7eb;"><div style="font-size:24px;font-weight:700;color:#111827;">45,231</div><div style="font-size:12px;color:#6b7280;">TOTAL CHECKS</div></td></tr></table>')
      .replace(/\{\{performance_note\}\}/g, '<p style="margin:0 0 16px;font-size:14px;color:#16a34a;line-height:1.6;font-weight:500;">Excellent! Your infrastructure maintained 99.97% uptime this month.</p>')
      .replace(/\{\{[^}]+\}\}/g, '[sample]')

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Preview</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="padding:32px 32px 24px;background:linear-gradient(135deg,#3b82f6,#06b6d4);text-align:center;">
<span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Uptrue</span>
</td></tr>
<tr><td style="padding:32px 32px 40px;">
${content}
</td></tr>
<tr><td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #eaeaea;">
<p style="margin:0 0 8px;font-size:12px;color:#9ca3af;line-height:1.5;text-align:center;">
Uptrue &mdash; Uptime, performance &amp; infrastructure monitoring.<br>
Crozent Techlabs Private Limited, Noida, Uttar Pradesh, India.
</p>
<p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;text-align:center;">
<a href="#" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
&nbsp;&middot;&nbsp;
<a href="#" style="color:#6b7280;text-decoration:underline;">Email preferences</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
  }

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------

  const filteredTemplates = filterCategory === 'all'
    ? templates
    : templates.filter(t => t.category === filterCategory)

  const activeCount = templates.filter(t => t.is_active).length
  const editingTemplate = templates.find(t => t.template_key === editingKey)

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            color: '#fff',
            backgroundColor: toast.type === 'success' ? '#22c55e' : '#ef4444',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Email Templates</h1>
          <p className="admin-page-subtitle">
            Manage nurture email templates. Edit subject lines, body content, and toggle active status.
          </p>
        </div>
        <div className="admin-page-header-stat">
          <span className="admin-page-header-stat-number">{activeCount}/{templates.length}</span>
          <span className="admin-page-header-stat-label">active</span>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <label className="form-label" style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Category:</label>
        <select
          className="form-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="all">All ({templates.length})</option>
          {Object.entries(CATEGORY_LABELS).map(([key, val]) => {
            const count = templates.filter(t => t.category === key).length
            return count > 0 ? (
              <option key={key} value={key}>{val.label} ({count})</option>
            ) : null
          })}
        </select>
      </div>

      {/* Templates table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">All Templates</div>
        </div>
        <div className="card-content">
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading templates...</p>
          ) : filteredTemplates.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No templates found.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Sent</th>
                    <th>Last Sent</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map((t) => {
                    const cat = CATEGORY_LABELS[t.category] ?? CATEGORY_LABELS.system
                    const isToggling = togglingKey === t.template_key
                    const isEditing = editingKey === t.template_key

                    return (
                      <tr
                        key={t.id}
                        style={{
                          backgroundColor: isEditing ? 'var(--bg-secondary, #f0f7ff)' : undefined,
                        }}
                      >
                        <td style={{ fontWeight: 500 }}>
                          <div>{t.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {t.template_key}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: `${cat.color}18`,
                              color: cat.color,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {cat.label}
                          </span>
                        </td>
                        <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                          {t.subject}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggle(t.template_key, t.is_active)}
                            disabled={isToggling}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600,
                              border: 'none',
                              cursor: isToggling ? 'wait' : 'pointer',
                              backgroundColor: t.is_active ? '#dcfce7' : '#fee2e2',
                              color: t.is_active ? '#16a34a' : '#dc2626',
                              transition: 'all 0.15s ease',
                            }}
                            title={t.is_active ? 'Click to deactivate' : 'Click to activate'}
                          >
                            <span style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: t.is_active ? '#16a34a' : '#dc2626',
                            }} />
                            {isToggling ? '...' : t.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                          {t.send_count.toLocaleString()}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {t.last_sent_at
                            ? new Date(t.last_sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Never'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleEdit(t)}
                            style={{
                              padding: '4px 12px',
                              fontSize: 12,
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              backgroundColor: isEditing ? 'var(--primary, #3b82f6)' : 'transparent',
                              color: isEditing ? '#fff' : 'var(--text)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isEditing ? 'Editing' : 'Edit'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Inline Editor */}
      {editingKey && editingTemplate && (
        <div className="card" ref={editorRef} style={{ borderColor: 'var(--primary, #3b82f6)', borderWidth: 2 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">
              Editing: {editingTemplate.name}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8, fontFamily: 'monospace' }}>
                ({editingKey})
              </span>
            </div>
            <button
              onClick={handleCancelEdit}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
          <div className="card-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Available variables */}
              {editingTemplate.variables.length > 0 && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-secondary, #f8fafc)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}>
                  <strong style={{ color: 'var(--text)' }}>Available variables:</strong>{' '}
                  {editingTemplate.variables.map((v, i) => (
                    <span key={v}>
                      <code style={{
                        padding: '1px 6px',
                        backgroundColor: 'var(--bg-tertiary, #e2e8f0)',
                        borderRadius: 4,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}>
                        {'{{' + v + '}}'}
                      </code>
                      {i < editingTemplate.variables.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="form-label">Subject Line</label>
                <input
                  className="form-input"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Email subject line..."
                  disabled={saving}
                />
              </div>

              {/* Body Text (plain text fallback) */}
              <div>
                <label className="form-label">Plain Text Body</label>
                <textarea
                  className="form-input"
                  value={editBodyText}
                  onChange={(e) => setEditBodyText(e.target.value)}
                  rows={4}
                  disabled={saving}
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                  placeholder="Plain text version of the email..."
                />
              </div>

              {/* Body HTML */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>HTML Body</label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    style={{
                      padding: '4px 12px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      backgroundColor: showPreview ? 'var(--primary, #3b82f6)' : 'transparent',
                      color: showPreview ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {showPreview ? 'Hide Preview' : 'Preview'}
                  </button>
                </div>
                <textarea
                  className="form-input"
                  value={editBodyHtml}
                  onChange={(e) => setEditBodyHtml(e.target.value)}
                  rows={12}
                  disabled={saving}
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5 }}
                  placeholder="HTML body content (inner content only, wrapper is auto-added)..."
                />
              </div>

              {/* Preview */}
              {showPreview && (
                <div>
                  <label className="form-label">Email Preview</label>
                  <div
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      backgroundColor: '#f4f4f7',
                    }}
                  >
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-secondary, #f1f5f9)',
                      borderBottom: '1px solid var(--border)',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}>
                      <strong>Subject:</strong> {editSubject.replace(/\{\{[^}]+\}\}/g, '[sample]')}
                    </div>
                    <iframe
                      srcDoc={renderPreviewHtml()}
                      style={{
                        width: '100%',
                        height: 500,
                        border: 'none',
                      }}
                      title="Email preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving || !editSubject.trim()}
                  style={{ minWidth: 100 }}
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
                <button
                  className="btn"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    border: '1px solid var(--border)',
                    backgroundColor: 'transparent',
                    color: 'var(--text)',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
