'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { createMonitorAction } from '@/app/(dashboard)/dashboard/monitors/actions'
import { getKeywordSuggestions } from '@/lib/utils/keyword-suggestions'
import { ConfigureMonitorModal } from './configure-monitor-modal'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'
import { CustomSelect } from '@/components/ui/custom-select'
import { MonitorTypeIcon } from './monitor-type-icon'
import { Globe, Settings2, X } from 'lucide-react'

const CHECKLIST_TYPES = MONITOR_TYPES.filter(t => t.type !== 'wordpress')
const MANUAL_CONFIG_TYPES = new Set(['keyword', 'port', 'api', 'heartbeat', 'competitor'])

const ALL_INTERVALS = [
  { value: 30, label: 'Every 30 seconds' },
  { value: 60, label: 'Every 1 minute' },
  { value: 180, label: 'Every 3 minutes' },
  { value: 300, label: 'Every 5 minutes' },
  { value: 600, label: 'Every 10 minutes' },
  { value: 1800, label: 'Every 30 minutes' },
  { value: 3600, label: 'Every 1 hour' },
  { value: 21600, label: 'Every 6 hours' },
  { value: 86400, label: 'Every 24 hours' },
]

const SEVERITY_OPTIONS = [
  { value: 'P1', label: 'P1 — Critical', icon: <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} /> },
  { value: 'P2', label: 'P2 — High', icon: <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', display: 'inline-block', flexShrink: 0 }} /> },
  { value: 'P3', label: 'P3 — Medium', icon: <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', display: 'inline-block', flexShrink: 0 }} /> },
  { value: 'P4', label: 'P4 — Low', icon: <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', flexShrink: 0 }} /> },
]

function getDefaultIntervalForType(type: string, minCheckInterval: number): number {
  const def = MONITOR_TYPES.find(t => t.type === type)
  const recommended = def?.defaultInterval ?? 60
  return Math.max(recommended, minCheckInterval)
}

/** Builds the FormData fields createMonitorAction expects for a given
 *  manual-config type, from the config object ConfigureMonitorModal saves. */
function applyConfigToFormData(formData: FormData, type: string, config: Record<string, unknown>): void {
  if (type === 'keyword') {
    formData.set('positiveKeywords', JSON.stringify(config.positiveKeywords ?? []))
    formData.set('negativeKeywords', JSON.stringify(config.negativeKeywords ?? []))
  }
  if (type === 'port') {
    formData.set('port', String(config.port ?? 80))
  }
  if (type === 'heartbeat') {
    formData.set('expectedInterval', String(config.expectedIntervalSeconds ?? 300))
  }
  if (type === 'api') {
    formData.set('method', String(config.method ?? 'GET'))
    if (config.headers) formData.set('headers', JSON.stringify(config.headers))
    if (config.body) formData.set('body', String(config.body))
  }
  if (type === 'competitor') {
    formData.set('ignoreWhitespace', String(config.ignoreWhitespace !== false))
  }
}

export function CreateMonitorForm({ minCheckInterval = 600, defaultType = 'http' }: { minCheckInterval?: number; defaultType?: string }): React.ReactElement {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set([defaultType]))
  const [configs, setConfigs] = useState<Record<string, Record<string, unknown>>>({})
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [interval, setInterval] = useState(() => getDefaultIntervalForType(defaultType, minCheckInterval))
  const [severity, setSeverity] = useState('P2')
  const [target, setTarget] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Interval/help text tracks the most recently checked type, since that
  // field is shared across every monitor this submission will create.
  const [primaryType, setPrimaryType] = useState(defaultType)

  const typeDef = MONITOR_TYPES.find(t => t.type === primaryType)
  const typeMinInterval = typeDef?.minInterval ?? 30
  const intervals = ALL_INTERVALS.filter(i => i.value >= minCheckInterval && i.value >= typeMinInterval)
  const intervalOptions = intervals.map(i => ({ value: String(i.value), label: i.label }))

  const localSuggestions = useMemo(() => getKeywordSuggestions(target), [target])
  const [dbSuggestions, setDbSuggestions] = useState<{ positive: string[]; negative: string[] }>({ positive: [], negative: [] })

  const hasKeywordType = selectedTypes.has('keyword')

  useEffect(() => {
    if (!hasKeywordType) return
    const url = target.trim()
    async function fetchDbSuggestions(): Promise<void> {
      try {
        const params = url ? `?url=${encodeURIComponent(url)}` : ''
        const res = await fetch(`/api/v1/keyword-suggestions${params}`)
        if (res.ok) {
          const data = await res.json() as { positive: { keyword: string }[]; negative: { keyword: string }[] }
          setDbSuggestions({
            positive: data.positive.map(s => s.keyword),
            negative: data.negative.map(s => s.keyword),
          })
        }
      } catch {
        // Silently ignore
      }
    }
    fetchDbSuggestions()
  }, [hasKeywordType, target])

  const suggestions = useMemo(() => {
    const pos = [...new Set([...localSuggestions.positive, ...dbSuggestions.positive])]
    const neg = [...new Set([...localSuggestions.negative, ...dbSuggestions.negative])]
    return { positive: pos, negative: neg }
  }, [localSuggestions, dbSuggestions])

  function handleToggle(type: string, checked: boolean): void {
    setError(null)
    if (checked) {
      if (MANUAL_CONFIG_TYPES.has(type)) {
        // Don't check the box yet — open the modal first. It only becomes
        // checked once valid config is actually saved (handleConfigSave).
        setConfiguring(type)
        return
      }
      setSelectedTypes(prev => new Set(prev).add(type))
      setPrimaryType(type)
      setInterval(getDefaultIntervalForType(type, minCheckInterval))
      return
    }
    setSelectedTypes(prev => {
      const next = new Set(prev)
      next.delete(type)
      return next
    })
    setConfigs(prev => {
      const next = { ...prev }
      delete next[type]
      return next
    })
  }

  function handleConfigSave(type: string, config: Record<string, unknown>): void {
    // Same "empty config = stays unchecked" validation createMonitorAction
    // enforces server-side, applied here too so the checkbox never shows
    // checked for a configuration that would just be rejected on submit.
    if (type === 'keyword') {
      const pos = (config.positiveKeywords as string[] | undefined) ?? []
      const neg = (config.negativeKeywords as string[] | undefined) ?? []
      if (pos.length === 0 && neg.length === 0) {
        setError('Please add at least one positive or negative keyword')
        return
      }
    }
    setConfigs(prev => ({ ...prev, [type]: config }))
    setSelectedTypes(prev => new Set(prev).add(type))
    setPrimaryType(type)
    setInterval(getDefaultIntervalForType(type, minCheckInterval))
    setConfiguring(null)
    setError(null)
  }

  function handleSubmit(formDataTemplate: FormData): void {
    setError(null)
    const name = (formDataTemplate.get('name') as string) ?? ''
    if (!name.trim()) { setError('Monitor name is required'); return }
    if (!target.trim()) { setError('Target is required'); return }
    if (selectedTypes.size === 0) { setError('Select at least one monitor type'); return }

    const types = Array.from(selectedTypes)

    startTransition(async () => {
      for (const type of types) {
        const fd = new FormData()
        fd.set('name', types.length > 1 ? `${name} — ${MONITOR_TYPES.find(t => t.type === type)?.name ?? type}` : name)
        fd.set('type', type)
        fd.set('target', target)
        const perTypeMin = Math.max(minCheckInterval, MONITOR_TYPES.find(t => t.type === type)?.minInterval ?? 30)
        fd.set('check_interval_seconds', String(Math.max(interval, perTypeMin)))
        fd.set('severity', severity)
        const cfg = configs[type]
        if (cfg) applyConfigToFormData(fd, type, cfg)

        const result = await createMonitorAction(fd)
        if (result?.error) {
          setError(`${MONITOR_TYPES.find(t => t.type === type)?.name ?? type}: ${result.error}`)
          return
        }
      }
    })
  }

  const selectedList = Array.from(selectedTypes)
    .map(t => MONITOR_TYPES.find(mt => mt.type === t))
    .filter((mt): mt is (typeof MONITOR_TYPES)[number] => Boolean(mt))

  return (
    <div>
      <form action={handleSubmit}>
        {error && (
          <div className="form-error" style={{ marginBottom: 16 }}>
            {error.includes('Monitor limit reached') && <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6, flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
            {error}
            {error.includes('Monitor limit reached') && (
              <>{' '}<Link href="/dashboard/settings?tab=billing" className="form-error-link">Upgrade your plan</Link></>
            )}
          </div>
        )}

        <div className="create-monitor-grid">
          <div className="create-monitor-form-card">
            <div className="mon-card-header">
              <div className="mon-card-header-icon"><Globe size={16} /></div>
              <div>
                <div className="mon-card-header-title">Monitor Details</div>
                <div className="mon-card-header-sub">Basic information about what you want to monitor.</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name">Monitor Name</label>
              <input className="mon-target-input" id="name" name="name" required placeholder="My Website" disabled={isPending} maxLength={500} />
              <span className="form-hint">Give your monitor a recognizable name.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="target">Target URL or Domain</label>
              <div className="mon-input-icon-wrap">
                <Globe size={15} className="mon-input-icon" />
                <input
                  className="mon-target-input"
                  id="target"
                  name="target"
                  required
                  placeholder="https://example.com"
                  disabled={isPending}
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                />
              </div>
              {hasKeywordType && (
                <span className="form-hint">For Keyword Detection, use the full page URL, not just the domain</span>
              )}
            </div>

            <div className="mon-field-row">
              <div className="form-group">
                <label className="form-label" htmlFor="check_interval_seconds">Check Interval</label>
                <CustomSelect
                  id="check_interval_seconds"
                  name="check_interval_seconds"
                  options={intervalOptions}
                  value={String(interval)}
                  onChange={v => setInterval(Number(v))}
                  disabled={isPending}
                />
                {typeDef && typeDef.defaultInterval >= 3600 && (
                  <span className="form-hint">
                    Recommended every {typeDef.defaultInterval === 86400 ? '24 hours' : typeDef.defaultInterval === 21600 ? '6 hours' : '1 hour'}.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="severity">Severity</label>
                <CustomSelect
                  id="severity"
                  name="severity"
                  options={SEVERITY_OPTIONS}
                  value={severity}
                  onChange={setSeverity}
                  disabled={isPending}
                />
              </div>
            </div>

            {selectedList.length > 0 && (
              <div className="mon-selection-summary">
                <span className="mon-selection-summary-count">
                  {selectedList.length} monitoring type{selectedList.length === 1 ? '' : 's'} selected
                </span>
                <div className="mon-selection-summary-chips">
                  {selectedList.map(mt => (
                    <span key={mt.type} className="mon-selection-chip">
                      {mt.name}
                      <button
                        type="button"
                        aria-label={`Remove ${mt.name}`}
                        onClick={() => handleToggle(mt.type, false)}
                        disabled={isPending}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mon-create-actions">
              <Link href="/dashboard/monitors" className="btn btn-ghost">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? 'Creating…' : selectedTypes.size > 1 ? `Create ${selectedTypes.size} Monitors` : 'Create Monitor'}
              </button>
            </div>
          </div>

          <div className="create-monitor-form-card create-monitor-types-card">
            <div className="mon-card-header">
              <div className="mon-card-header-icon"><Settings2 size={16} /></div>
              <div>
                <div className="mon-card-header-title">Monitoring Types</div>
                <div className="mon-card-header-sub">Choose what you want to monitor for this target.</div>
              </div>
            </div>

            <div className="mon-tile-grid mon-tile-grid--2col">
              {CHECKLIST_TYPES.map(mt => {
                const checked = selectedTypes.has(mt.type)
                const isManual = MANUAL_CONFIG_TYPES.has(mt.type)
                return (
                  <div key={mt.type} className={`mon-tile${checked ? ' mon-tile--selected' : ''}`}>
                    <label className="mon-tile-main">
                      <input
                        type="checkbox"
                        className="mon-tile-checkbox"
                        checked={checked}
                        disabled={isPending}
                        onChange={e => handleToggle(mt.type, e.target.checked)}
                      />
                      <span className="mon-tile-icon"><MonitorTypeIcon type={mt.type} iconOnly iconSize={16} /></span>
                      <span className="mon-tile-name">{mt.name}</span>
                    </label>
                    {isManual && (
                      <button
                        type="button"
                        className="mon-tile-configure"
                        onClick={() => setConfiguring(mt.type)}
                        disabled={isPending}
                      >
                        <Settings2 size={12} />
                        {checked ? 'Edit config' : 'Configure'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </form>

      {configuring && (
        <ConfigureMonitorModal
          type={configuring}
          domain={target || 'this target'}
          initialConfig={configs[configuring]}
          onSave={config => handleConfigSave(configuring, config)}
          onCancel={() => setConfiguring(null)}
          error={error ?? undefined}
          keywordSuggestions={configuring === 'keyword' ? suggestions : undefined}
        />
      )}
    </div>
  )
}
