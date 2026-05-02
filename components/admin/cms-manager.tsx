'use client'

import { useState, useCallback, useTransition } from 'react'
import type { PageSection, CmsTheme, CmsThemeSettings } from '@/lib/types/cms'

// ─── Visual field editor helpers ─────────────────────────────────────────────

function prettify(key: string): string {
  return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function VisualField({ fieldKey, value, onChange }: {
  fieldKey: string
  value: unknown
  onChange: (v: unknown) => void
}): React.ReactElement {
  const label = prettify(fieldKey)

  if (typeof value === 'boolean') {
    return (
      <div style={{ marginBottom: 14 }}>
        <label className="cms-field-label">{label}</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{value ? 'Yes' : 'No'}</span>
        </label>
      </div>
    )
  }

  if (typeof value === 'number') {
    return (
      <div style={{ marginBottom: 14 }}>
        <label className="cms-field-label">{label}</label>
        <input className="cms-input" type="number" value={value}
          style={{ maxWidth: 160 }}
          onChange={e => onChange(Number(e.target.value))} />
      </div>
    )
  }

  if (typeof value === 'string' || value === null) {
    const str = (value as string) ?? ''
    const isUrl  = /href|url|src|link/i.test(fieldKey)
    const isHtml = fieldKey === 'html' || str.trim().startsWith('<')
    const isLong = str.length > 80 || str.includes('\n') || isHtml
    return (
      <div style={{ marginBottom: 14 }}>
        <label className="cms-field-label">
          {label}
          {isUrl  && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#3b82f6' }}>URL</span>}
          {isHtml && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#8b5cf6' }}>HTML</span>}
        </label>
        {isLong ? (
          <textarea className="cms-json-editor"
            style={{ minHeight: isHtml ? 120 : 64, fontSize: 13, fontFamily: isHtml ? 'var(--font-mono, monospace)' : 'inherit' }}
            value={str}
            onChange={e => onChange(e.target.value || null)}
            spellCheck={false}
            rows={isHtml ? 6 : 3}
          />
        ) : (
          <input className="cms-input" type="text" value={str}
            placeholder={`Enter ${label.toLowerCase()}…`}
            onChange={e => onChange(e.target.value)} />
        )}
      </div>
    )
  }

  if (Array.isArray(value)) {
    return <VisualArrayField label={label} value={value} onChange={onChange} />
  }

  if (value !== null && typeof value === 'object') {
    return <VisualObjectField label={label} value={value as Record<string, unknown>} onChange={onChange} />
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label className="cms-field-label">{label}</label>
      <input className="cms-input" type="text" value={String(value ?? '')}
        onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function VisualObjectField({ label, value, onChange }: {
  label: string
  value: Record<string, unknown>
  onChange: (v: unknown) => void
}): React.ReactElement {
  const [open, setOpen] = useState(true)
  const count = Object.keys(value).length
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: open ? 8 : 0 }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 9, color: 'var(--text-muted)', display: 'inline-block', transition: 'transform .15s', transform: open ? 'rotate(0)' : 'rotate(-90deg)' }}>▼</span>
        <span className="cms-field-label" style={{ margin: 0 }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({count} field{count !== 1 ? 's' : ''})</span>
      </button>
      {open && (
        <div style={{ paddingLeft: 16, borderLeft: '2px solid var(--border-primary)', paddingTop: 4 }}>
          {Object.entries(value).map(([k, v]) => (
            <VisualField key={k} fieldKey={k} value={v}
              onChange={newV => onChange({ ...value, [k]: newV })} />
          ))}
        </div>
      )}
    </div>
  )
}

function VisualArrayObjectItem({ index, value, onChange, onDelete, onMove, total }: {
  index: number
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
  onDelete: () => void
  onMove: (dir: 'up' | 'down') => void
  total: number
}): React.ReactElement {
  const [open, setOpen] = useState(false)
  const preview = Object.values(value).find(v => typeof v === 'string' && (v as string).length > 0) as string | undefined

  return (
    <div style={{ border: '1px solid var(--border-primary)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-card)' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-secondary)', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 9, color: 'var(--text-muted)', display: 'inline-block', transition: 'transform .15s', transform: open ? 'rotate(0)' : 'rotate(-90deg)', flexShrink: 0 }}>▼</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>#{index + 1}</span>
        {preview && (
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview.length > 60 ? preview.slice(0, 60) + '…' : preview}
          </span>
        )}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
          <button
            style={{ padding: '2px 7px', border: '1px solid var(--border-primary)', borderRadius: 4, background: 'none', cursor: 'pointer', fontSize: 11 }}
            onClick={() => onMove('up')} disabled={index === 0}
            title="Move up">▲</button>
          <button
            style={{ padding: '2px 7px', border: '1px solid var(--border-primary)', borderRadius: 4, background: 'none', cursor: 'pointer', fontSize: 11 }}
            onClick={() => onMove('down')} disabled={index === total - 1}
            title="Move down">▼</button>
          <button
            style={{ padding: '2px 7px', border: '1px solid #fecaca', borderRadius: 4, background: 'none', cursor: 'pointer', fontSize: 11, color: '#ef4444' }}
            onClick={onDelete} title="Remove">✕</button>
        </div>
      </div>
      {open && (
        <div style={{ padding: '12px 16px' }}>
          {Object.entries(value).map(([k, v]) => (
            <VisualField key={k} fieldKey={k} value={v}
              onChange={newV => onChange({ ...value, [k]: newV })} />
          ))}
        </div>
      )}
    </div>
  )
}

function VisualArrayField({ label, value, onChange }: {
  label: string
  value: unknown[]
  onChange: (v: unknown) => void
}): React.ReactElement {
  const isObjects = value.length > 0 && value[0] !== null && typeof value[0] === 'object' && !Array.isArray(value[0])
  const [open, setOpen] = useState(true)

  if (!isObjects) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <label className="cms-field-label" style={{ margin: 0 }}>{label}</label>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({value.length} item{value.length !== 1 ? 's' : ''})</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {value.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input className="cms-input" style={{ flex: 1 }} value={String(item ?? '')}
                placeholder={`Item ${i + 1}`}
                onChange={e => { const n = [...value]; n[i] = e.target.value; onChange(n) }} />
              <button
                style={{ padding: '4px 8px', border: '1px solid #fecaca', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: '#ef4444', flexShrink: 0 }}
                onClick={() => onChange(value.filter((_, j) => j !== i))} title="Remove">✕</button>
            </div>
          ))}
          <button
            style={{ alignSelf: 'flex-start', padding: '5px 12px', border: '1px dashed var(--border-primary)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}
            onClick={() => onChange([...value, ''])}>+ Add item</button>
        </div>
      </div>
    )
  }

  const items = value as Record<string, unknown>[]
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: open ? 8 : 0 }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 9, color: 'var(--text-muted)', display: 'inline-block', transition: 'transform .15s', transform: open ? 'rotate(0)' : 'rotate(-90deg)' }}>▼</span>
        <span className="cms-field-label" style={{ margin: 0 }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({items.length} item{items.length !== 1 ? 's' : ''})</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => (
            <VisualArrayObjectItem
              key={i} index={i} value={item} total={items.length}
              onChange={newV => { const n = [...items]; n[i] = newV; onChange(n) }}
              onDelete={() => onChange(items.filter((_, j) => j !== i))}
              onMove={dir => {
                const n = [...items]
                const si = dir === 'up' ? i - 1 : i + 1
                if (si >= 0 && si < n.length) { [n[i], n[si]] = [n[si], n[i]]; onChange(n) }
              }}
            />
          ))}
          <button
            style={{ alignSelf: 'flex-start', padding: '5px 12px', border: '1px dashed var(--border-primary)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}
            onClick={() => {
              const template = items.length > 0
                ? Object.fromEntries(Object.keys(items[0]).map(k => [k, '']))
                : {}
              onChange([...items, template])
            }}>+ Add item</button>
        </div>
      )}
    </div>
  )
}

function VisualEditor({ data, onChange }: {
  data: Record<string, unknown>
  onChange: (d: Record<string, unknown>) => void
}): React.ReactElement {
  return (
    <div>
      {Object.entries(data).map(([key, value]) => (
        <VisualField key={key} fieldKey={key} value={value}
          onChange={newV => onChange({ ...data, [key]: newV })} />
      ))}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CmsManagerProps {
  initialSections: PageSection[]
  initialTheme:    CmsTheme | null
}

type Tab = 'sections' | 'theme'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  hero:                'Hero',
  trusted_logos:       'Trusted Logos',
  stats_bar:           'Stats Bar',
  features:            'Features',
  how_it_works:        'How It Works',
  ai_features:         'AI Features',
  agency:              'Agency CTA',
  faq:                 'FAQ',
  testimonials:        'Testimonials',
  comparison_table:    'Comparison Table',
  cta_band:            'CTA Band',
  ticker:              'Live Ticker',
  pricing:             'Pricing Table',
  downtime_calculator: 'Downtime Calculator',
  blog_preview:        'Blog Preview',
  nav:                 'Navigation (Header)',
  footer:              'Footer',
  custom:              'Custom',
}

const PAGE_BADGE: Record<string, string> = {
  landing: '',
  global:  'Global',
}

// These sections are structurally fixed — nav always top, footer always bottom
const LOCKED_SECTIONS = new Set(['nav', 'footer'])

function sectionLabel(key: string): string {
  return SECTION_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

async function apiPatch(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  return res.ok ? { ok: true } : { ok: false, error: json.error ?? 'Request failed' }
}

async function apiPost(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  return res.ok ? { ok: true } : { ok: false, error: json.error ?? 'Request failed' }
}

async function apiDelete(url: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, { method: 'DELETE' })
  const json = await res.json()
  return res.ok ? { ok: true } : { ok: false, error: json.error ?? 'Request failed' }
}

// ─── Section Editor ───────────────────────────────────────────────────────────

interface SectionEditorProps {
  section:   PageSection
  onSave:    (id: string, content: Record<string, unknown>) => void
  onClose:   () => void
  saving:    boolean
}

type EditorMode = 'visual' | 'json' | 'html'

function SectionEditor({ section, onSave, onClose, saving }: SectionEditorProps): React.ReactElement {
  const initialData = section.content as Record<string, unknown>
  const [mode, setMode]       = useState<EditorMode>('visual')
  const [data, setData]       = useState<Record<string, unknown>>(initialData)
  const [rawJson, setRawJson] = useState(() => JSON.stringify(initialData, null, 2))
  const [err, setErr]         = useState('')
  const hasHtml = typeof initialData?.html === 'string'

  function switchMode(next: EditorMode): void {
    if (mode === 'json') {
      try {
        const parsed = JSON.parse(rawJson) as Record<string, unknown>
        setData(parsed)
        setErr('')
      } catch {
        setErr('Fix JSON errors before switching views.')
        return
      }
    } else {
      setRawJson(JSON.stringify(data, null, 2))
    }
    setMode(next)
    setErr('')
  }

  function handleSave(): void {
    if (mode === 'json') {
      try {
        const parsed = JSON.parse(rawJson) as Record<string, unknown>
        onSave(section.id, parsed)
      } catch {
        setErr('Invalid JSON — fix syntax errors before saving.')
      }
    } else {
      onSave(section.id, data)
    }
  }

  const modes: { id: EditorMode; label: string }[] = [
    { id: 'visual', label: 'Visual' },
    { id: 'json',   label: 'Raw JSON' },
    ...(hasHtml ? [{ id: 'html' as EditorMode, label: 'HTML Preview' }] : []),
  ]

  return (
    <div className="cms-editor-overlay" onClick={onClose}>
      <div className="cms-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="cms-editor-header">
          <div>
            <h3 className="cms-editor-title">{sectionLabel(section.section_key)}</h3>
            <span className="cms-editor-type">{section.section_type}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', border: '1px solid var(--border-primary)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
              {modes.map(m => (
                <button
                  key={m.id}
                  style={{
                    padding: '5px 13px',
                    fontSize: 12,
                    fontWeight: mode === m.id ? 700 : 400,
                    background: mode === m.id ? 'var(--accent, #3b82f6)' : 'none',
                    color: mode === m.id ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background .15s, color .15s',
                  }}
                  onClick={() => switchMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button className="cms-editor-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="cms-editor-body">
          {err && <p className="cms-error-text" style={{ marginBottom: 12 }}>{err}</p>}

          {mode === 'visual' && (
            <VisualEditor data={data} onChange={d => { setData(d); setErr('') }} />
          )}

          {mode === 'json' && (
            <>
              <label className="cms-field-label">Content JSON</label>
              <textarea
                className={`cms-json-editor${err ? ' cms-json-editor-error' : ''}`}
                value={rawJson}
                onChange={e => { setRawJson(e.target.value); setErr('') }}
                spellCheck={false}
                rows={24}
              />
            </>
          )}

          {mode === 'html' && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Preview of the <code>html</code> field rendered as HTML.
              </p>
              <div
                style={{ border: '1px solid var(--border-primary)', borderRadius: 8, padding: 20, background: '#fff', color: '#111', fontSize: 14, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: (data.html as string) ?? '' }}
              />
            </div>
          )}
        </div>

        <div className="cms-editor-footer">
          <button className="admin-btn admin-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Content'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── New Section Modal ────────────────────────────────────────────────────────

interface NewSectionModalProps {
  onSave:  (key: string, type: string, content: Record<string, unknown>, order: number, page: string) => void
  onClose: () => void
  saving:  boolean
  maxOrder: number
}

const SECTION_TEMPLATES: Record<string, Record<string, unknown>> = {
  custom: {
    eyebrow:    'Optional label',
    headline:   'Your Section Headline',
    body:       'A short description for this section.',
    cta_text:   'Learn More',
    cta_href:   '/link',
    align:      'center',
    background: '',
  },
  hero: {
    eyebrow:        '10 monitor types · 1-minute checks',
    headline_line1: 'Know when your sites go down.',
    headline_line2: 'Before your customers do.',
    subheadline:    'Uptime monitoring for agencies and teams.',
    cta_primary:    { text: 'Start Free', href: '/signup' },
    cta_secondary:  { text: 'See How It Works', href: '/#how-it-works' },
    trust_items:    ['No credit card required', '3 monitors free forever'],
  },
  faq: {
    eyebrow:  'FAQ',
    headline: 'Common questions',
    items: [
      { q: 'Question one?', a: 'Answer one.' },
      { q: 'Question two?', a: 'Answer two.' },
    ],
  },
}

function getTemplate(type: string): Record<string, unknown> {
  return SECTION_TEMPLATES[type] ?? {}
}

type NewEditorMode = 'visual' | 'json'

function NewSectionModal({ onSave, onClose, saving, maxOrder }: NewSectionModalProps): React.ReactElement {
  const [key,     setKey]     = useState('')
  const [page,    setPage]    = useState('landing')
  const [type,    setType]    = useState('custom')
  const [mode,    setMode]    = useState<NewEditorMode>('visual')
  const [data,    setData]    = useState<Record<string, unknown>>(() => getTemplate('custom'))
  const [rawJson, setRawJson] = useState(() => JSON.stringify(getTemplate('custom'), null, 2))
  const [order,   setOrder]   = useState(maxOrder + 10)
  const [err,     setErr]     = useState('')

  function switchMode(next: NewEditorMode): void {
    if (mode === 'json') {
      try {
        const parsed = JSON.parse(rawJson) as Record<string, unknown>
        setData(parsed)
        setErr('')
      } catch {
        setErr('Fix JSON errors before switching views.')
        return
      }
    } else {
      setRawJson(JSON.stringify(data, null, 2))
    }
    setMode(next)
    setErr('')
  }

  function handleTypeChange(newType: string): void {
    setType(newType)
    const tpl = getTemplate(newType)
    setData(tpl)
    setRawJson(JSON.stringify(tpl, null, 2))
    setErr('')
  }

  function handleSave(): void {
    if (!key.trim()) { setErr('Section key is required.'); return }
    if (mode === 'json') {
      try {
        const content = JSON.parse(rawJson) as Record<string, unknown>
        setErr('')
        onSave(key.trim(), type, content, order, page)
      } catch {
        setErr('Invalid JSON — fix syntax errors before saving.')
      }
    } else {
      onSave(key.trim(), type, data, order, page)
    }
  }

  const editorModes: { id: NewEditorMode; label: string }[] = [
    { id: 'visual', label: 'Visual' },
    { id: 'json',   label: 'Raw JSON' },
  ]

  return (
    <div className="cms-editor-overlay" onClick={onClose}>
      <div className="cms-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="cms-editor-header">
          <h3 className="cms-editor-title">New Section</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', border: '1px solid var(--border-primary)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
              {editorModes.map(m => (
                <button
                  key={m.id}
                  style={{
                    padding: '5px 13px',
                    fontSize: 12,
                    fontWeight: mode === m.id ? 700 : 400,
                    background: mode === m.id ? 'var(--accent, #3b82f6)' : 'none',
                    color: mode === m.id ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background .15s, color .15s',
                  }}
                  onClick={() => switchMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button className="cms-editor-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="cms-editor-body">
          <div className="cms-field-row">
            <div className="cms-field-col" style={{ maxWidth: 120 }}>
              <label className="cms-field-label">Page</label>
              <select className="cms-select" value={page} onChange={e => setPage(e.target.value)}>
                <option value="landing">landing</option>
                <option value="global">global</option>
              </select>
            </div>
            <div className="cms-field-col">
              <label className="cms-field-label">Section Key <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                className="cms-input"
                placeholder="e.g. my_custom_section"
                value={key}
                onChange={e => setKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              />
            </div>
            <div className="cms-field-col">
              <label className="cms-field-label">Section Type</label>
              <select className="cms-select" value={type} onChange={e => handleTypeChange(e.target.value)}>
                <option value="hero">hero</option>
                <option value="trusted_logos">trusted_logos</option>
                <option value="stats_bar">stats_bar</option>
                <option value="features">features</option>
                <option value="how_it_works">how_it_works</option>
                <option value="ai_features">ai_features</option>
                <option value="agency">agency</option>
                <option value="faq">faq</option>
                <option value="testimonials">testimonials</option>
                <option value="comparison_table">comparison_table</option>
                <option value="cta_band">cta_band</option>
                <option value="custom">custom</option>
              </select>
            </div>
            <div className="cms-field-col" style={{ maxWidth: 120 }}>
              <label className="cms-field-label">Sort Order</label>
              <input
                className="cms-input"
                type="number"
                value={order}
                onChange={e => setOrder(Number(e.target.value))}
              />
            </div>
          </div>

          {err && <p className="cms-error-text" style={{ marginBottom: 12 }}>{err}</p>}

          {mode === 'visual' && (
            <>
              <label className="cms-field-label" style={{ marginTop: 16, marginBottom: 8 }}>Content</label>
              <VisualEditor data={data} onChange={d => { setData(d); setErr('') }} />
              {type === 'custom' && (
                <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 6, lineHeight: 1.6 }}>
                  <strong>Custom section fields:</strong>{' '}
                  <code>eyebrow</code>, <code>headline</code>, <code>body</code>, <code>cta_text</code>, <code>cta_href</code>,{' '}
                  <code>align</code> (left/center/right), <code>background</code> (any CSS value).{' '}
                  To use raw HTML instead, switch to Raw JSON and set a single <code>html</code> field.
                </p>
              )}
            </>
          )}

          {mode === 'json' && (
            <>
              <label className="cms-field-label" style={{ marginTop: 16 }}>Content JSON</label>
              <textarea
                className={`cms-json-editor${err ? ' cms-json-editor-error' : ''}`}
                value={rawJson}
                onChange={e => { setRawJson(e.target.value); setErr('') }}
                spellCheck={false}
                rows={12}
              />
            </>
          )}
        </div>

        <div className="cms-editor-footer">
          <button className="admin-btn admin-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Creating…' : 'Create Section'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Theme Editor ─────────────────────────────────────────────────────────────

interface ThemeEditorProps {
  theme:   CmsTheme | null
  onSave:  (settings: CmsThemeSettings) => void
  saving:  boolean
}

const DEFAULT_THEME: CmsThemeSettings = {
  colors: {
    brand_primary:   '#3b82f6',
    brand_secondary: '#06b6d4',
    accent:          '#8b5cf6',
    success:         '#10b981',
    warning:         '#f59e0b',
    danger:          '#ef4444',
  },
  gradient:          'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  dark_mode_default: true,
}

function ThemeEditor({ theme, onSave, saving }: ThemeEditorProps): React.ReactElement {
  const initial = theme?.settings ?? DEFAULT_THEME
  const [colors, setColors] = useState(initial.colors)
  const [gradient, setGradient] = useState(initial.gradient)
  const [darkMode, setDarkMode] = useState(initial.dark_mode_default ?? true)

  function setColor(key: keyof typeof colors, value: string): void {
    setColors(prev => ({ ...prev, [key]: value }))
  }

  function handleSave(): void {
    onSave({ colors, gradient, dark_mode_default: darkMode })
  }

  const colorFields: Array<{ key: keyof typeof colors; label: string }> = [
    { key: 'brand_primary',   label: 'Brand Primary' },
    { key: 'brand_secondary', label: 'Brand Secondary' },
    { key: 'accent',          label: 'Accent' },
    { key: 'success',         label: 'Success' },
    { key: 'warning',         label: 'Warning' },
    { key: 'danger',          label: 'Danger' },
  ]

  return (
    <div className="cms-theme-editor">
      <div className="cms-theme-section">
        <h3 className="cms-theme-heading">Brand Colours</h3>
        <div className="cms-color-grid">
          {colorFields.map(({ key, label }) => (
            <div key={key} className="cms-color-row">
              <label className="cms-field-label">{label}</label>
              <div className="cms-color-input-wrap">
                <input
                  type="color"
                  className="cms-color-swatch"
                  value={colors[key] ?? '#000000'}
                  onChange={e => setColor(key, e.target.value)}
                />
                <input
                  className="cms-input cms-color-text"
                  value={colors[key] ?? ''}
                  onChange={e => setColor(key, e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cms-theme-section">
        <h3 className="cms-theme-heading">Gradient</h3>
        <input
          className="cms-input"
          value={gradient}
          onChange={e => setGradient(e.target.value)}
          placeholder="linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)"
        />
        <div className="cms-gradient-preview" style={{ background: gradient }} />
      </div>

      <div className="cms-theme-section">
        <h3 className="cms-theme-heading">Defaults</h3>
        <label className="cms-toggle-row">
          <span className="cms-field-label" style={{ marginBottom: 0 }}>Dark mode by default</span>
          <input
            type="checkbox"
            className="cms-toggle-checkbox"
            checked={darkMode}
            onChange={e => setDarkMode(e.target.checked)}
          />
        </label>
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Theme'}
        </button>
        {theme?.updated_at && (
          <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--admin-text-muted)' }}>
            Last saved {new Date(theme.updated_at).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main CmsManager ──────────────────────────────────────────────────────────

export function CmsManager({ initialSections, initialTheme }: CmsManagerProps): React.ReactElement {
  const [sections,   setSections]   = useState<PageSection[]>(initialSections)
  const [theme,      setTheme]      = useState<CmsTheme | null>(initialTheme)
  const [tab,        setTab]        = useState<Tab>('sections')
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [showNew,    setShowNew]    = useState(false)
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [isPending,  startTransition] = useTransition()
  const [savingIds,  setSavingIds]  = useState<Set<string>>(new Set())

  const editingSection = editingId ? sections.find(s => s.id === editingId) ?? null : null
  const maxOrder = sections.reduce((m, s) => Math.max(m, s.sort_order), 0)

  function showToast(msg: string, type: 'success' | 'error'): void {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function markSaving(id: string, on: boolean): void {
    setSavingIds(prev => {
      const next = new Set(prev)
      on ? next.add(id) : next.delete(id)
      return next
    })
  }

  // ── Visibility toggle ────────────────────────────────────────────────────
  const toggleVisibility = useCallback(async (section: PageSection) => {
    const next = !section.is_visible
    // Optimistic update
    setSections(prev => prev.map(s => s.id === section.id ? { ...s, is_visible: next } : s))
    markSaving(section.id, true)

    const result = await apiPatch(`/api/admin/cms/sections/${section.id}`, { is_visible: next })
    markSaving(section.id, false)

    if (!result.ok) {
      setSections(prev => prev.map(s => s.id === section.id ? { ...s, is_visible: !next } : s))
      showToast(result.error ?? 'Failed to update visibility', 'error')
    } else {
      showToast(`"${sectionLabel(section.section_key)}" ${next ? 'shown' : 'hidden'}`, 'success')
    }
  }, [])

  // ── Reorder ──────────────────────────────────────────────────────────────
  const moveSection = useCallback(async (section: PageSection, direction: 'up' | 'down') => {
    if (LOCKED_SECTIONS.has(section.section_key)) return  // structural sections can't be moved
    const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex(s => s.id === section.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const swapWith = sorted[swapIdx]
    if (LOCKED_SECTIONS.has(swapWith.section_key)) return  // can't swap past a locked section
    const orders = [
      { id: section.id,  sort_order: swapWith.sort_order },
      { id: swapWith.id, sort_order: section.sort_order  },
    ]

    // Optimistic update
    setSections(prev => prev.map(s => {
      const o = orders.find(o => o.id === s.id)
      return o ? { ...s, sort_order: o.sort_order } : s
    }))

    const result = await apiPost('/api/admin/cms/sections/reorder', { orders })
    if (!result.ok) {
      // Revert
      setSections(prev => prev.map(s => {
        const o = orders.find(o => o.id === s.id)
        return o ? { ...s, sort_order: orders.find(x => x.id === swapWith.id)?.sort_order === o.sort_order ? swapWith.sort_order : section.sort_order } : s
      }))
      showToast(result.error ?? 'Failed to reorder', 'error')
    }
  }, [sections])

  // ── Save content ─────────────────────────────────────────────────────────
  const saveContent = useCallback(async (id: string, content: Record<string, unknown>) => {
    markSaving(id, true)
    const result = await apiPatch(`/api/admin/cms/sections/${id}`, { content })
    markSaving(id, false)

    if (result.ok) {
      setSections(prev => prev.map(s => s.id === id ? { ...s, content: content as PageSection['content'] } : s))
      setEditingId(null)
      showToast('Content saved', 'success')
    } else {
      showToast(result.error ?? 'Failed to save content', 'error')
    }
  }, [])

  // ── Delete section ───────────────────────────────────────────────────────
  const deleteSection = useCallback(async (section: PageSection) => {
    if (!confirm(`Delete "${sectionLabel(section.section_key)}"? This cannot be undone.`)) return
    markSaving(section.id, true)
    const result = await apiDelete(`/api/admin/cms/sections/${section.id}`)
    markSaving(section.id, false)

    if (result.ok) {
      setSections(prev => prev.filter(s => s.id !== section.id))
      showToast('Section deleted', 'success')
    } else {
      showToast(result.error ?? 'Failed to delete', 'error')
    }
  }, [])

  // ── Create section ───────────────────────────────────────────────────────
  const createSection = useCallback(async (key: string, type: string, content: Record<string, unknown>, order: number, page = 'landing') => {
    startTransition(async () => {
      const res = await fetch('/api/admin/cms/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_key: key, section_type: type, content, sort_order: order, page }),
      })
      const json = await res.json() as { success?: boolean; section?: PageSection; error?: string }
      if (res.ok && json.section) {
        setSections(prev => [...prev, json.section!])
        setShowNew(false)
        showToast('Section created (hidden by default)', 'success')
      } else {
        showToast(json.error ?? 'Failed to create section', 'error')
      }
    })
  }, [])

  // ── Save theme ───────────────────────────────────────────────────────────
  const saveTheme = useCallback(async (settings: CmsThemeSettings) => {
    startTransition(async () => {
      const res = await fetch('/api/admin/cms/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      const json = await res.json() as { success?: boolean; theme?: CmsTheme; error?: string }
      if (res.ok && json.theme) {
        setTheme(json.theme)
        showToast('Theme saved', 'success')
      } else {
        showToast(json.error ?? 'Failed to save theme', 'error')
      }
    })
  }, [])

  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="cms-manager">
      {/* Toast */}
      {toast && (
        <div className={`cms-toast cms-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="cms-tabs">
        <button
          className={`cms-tab${tab === 'sections' ? ' cms-tab-active' : ''}`}
          onClick={() => setTab('sections')}
        >
          Sections ({sections.length})
        </button>
        <button
          className={`cms-tab${tab === 'theme' ? ' cms-tab-active' : ''}`}
          onClick={() => setTab('theme')}
        >
          Brand Theme
        </button>
      </div>

      {/* ── Sections Tab ── */}
      {tab === 'sections' && (
        <div className="cms-sections-panel">
          <div className="cms-panel-toolbar">
            <p className="cms-panel-hint">
              Toggle visibility, reorder sections, or edit content. Changes on visible sections go live instantly.
            </p>
            <button className="admin-btn admin-btn-primary" onClick={() => setShowNew(true)}>
              + New Section
            </button>
          </div>

          <div className="cms-section-list">
            {sortedSections.map((section, idx) => {
              const isSaving = savingIds.has(section.id)
              const isLocked = LOCKED_SECTIONS.has(section.section_key)
              return (
                <div key={section.id} className={`cms-section-row${!section.is_visible ? ' cms-section-hidden' : ''}`}>
                  {/* Order controls */}
                  <div className="cms-order-btns">
                    {isLocked ? (
                      <span
                        className="cms-lock-icon"
                        title="Position locked — nav is always first, footer is always last"
                        style={{ fontSize: 16, opacity: 0.5, cursor: 'default', userSelect: 'none' }}
                      >🔒</span>
                    ) : (
                      <>
                        <button
                          className="cms-order-btn"
                          onClick={() => moveSection(section, 'up')}
                          disabled={idx === 0 || isSaving || LOCKED_SECTIONS.has(sortedSections[idx - 1]?.section_key)}
                          aria-label="Move up"
                        >▲</button>
                        <button
                          className="cms-order-btn"
                          onClick={() => moveSection(section, 'down')}
                          disabled={idx === sortedSections.length - 1 || isSaving || LOCKED_SECTIONS.has(sortedSections[idx + 1]?.section_key)}
                          aria-label="Move down"
                        >▼</button>
                      </>
                    )}
                  </div>

                  {/* Sort order badge */}
                  <span className="cms-sort-badge">{section.sort_order}</span>

                  {/* Info */}
                  <div className="cms-section-info">
                    <span className="cms-section-name">
                      {sectionLabel(section.section_key)}
                      {PAGE_BADGE[section.page] && (
                        <span className="cms-page-badge">{PAGE_BADGE[section.page]}</span>
                      )}
                    </span>
                    <span className="cms-section-key">{section.section_key} · {section.section_type} · {section.page}</span>
                  </div>

                  {/* Visibility */}
                  <div className="cms-vis-wrap">
                    <label className="cms-vis-label" title={section.is_visible ? 'Visible — click to hide' : 'Hidden — click to show'}>
                      <input
                        type="checkbox"
                        className="cms-vis-checkbox"
                        checked={section.is_visible}
                        onChange={() => toggleVisibility(section)}
                        disabled={isSaving}
                      />
                      <span className={`cms-vis-pill${section.is_visible ? ' cms-vis-on' : ' cms-vis-off'}`}>
                        {isSaving ? '…' : section.is_visible ? 'Live' : 'Hidden'}
                      </span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="cms-section-actions">
                    <button
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                      onClick={() => setEditingId(section.id)}
                      disabled={isSaving}
                    >
                      Edit
                    </button>
                    <button
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => deleteSection(section)}
                      disabled={isSaving}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Theme Tab ── */}
      {tab === 'theme' && (
        <div className="cms-theme-panel">
          <ThemeEditor theme={theme} onSave={saveTheme} saving={isPending} />
        </div>
      )}

      {/* ── Editing Modal ── */}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          onSave={saveContent}
          onClose={() => setEditingId(null)}
          saving={savingIds.has(editingSection.id)}
        />
      )}

      {/* ── New Section Modal ── */}
      {showNew && (
        <NewSectionModal
          onSave={createSection}
          onClose={() => setShowNew(false)}
          saving={isPending}
          maxOrder={maxOrder}
        />
      )}
    </div>
  )
}
