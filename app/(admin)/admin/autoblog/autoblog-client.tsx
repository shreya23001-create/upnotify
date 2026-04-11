'use client'

import { useState } from 'react'
import type { AutoblogChannel, AutoblogTopic, AutoblogSource, AutoblogRun } from '@/lib/db/autoblog'

// ── Schedule label map ───────────────────────────────────────────────────────
const SCHEDULE_LABELS: Record<string, string> = {
  daily:       'Daily',
  weekly_mon:  'Weekly — Monday',
  weekly_fri:  'Weekly — Friday',
  monthly_1:   'Monthly — 1st',
  monthly_15:  'Monthly — 15th',
}

// ── Category label map ───────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  press_wire:  'Press Wire',
  tech_news:   'Tech News',
  ai_specific: 'AI Specific',
  community:   'Community',
  other:       'Other',
}

// ── Status badge colours ─────────────────────────────────────────────────────
const RUN_STATUS_COLOURS: Record<string, string> = {
  generated: '#10b981',
  failed:    '#ef4444',
  skipped:   '#f59e0b',
  duplicate: '#6b7280',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function nextRunLabel(schedule: string, lastRunAt: string | null): string {
  if (!lastRunAt) return 'Not yet run'
  const last = new Date(lastRunAt)
  const scheduleHours: Record<string, number> = {
    daily: 24, weekly_mon: 168, weekly_fri: 168, monthly_1: 720, monthly_15: 720,
  }
  const hours = scheduleHours[schedule] ?? 24
  const next = new Date(last.getTime() + hours * 60 * 60 * 1000)
  const diff = next.getTime() - Date.now()
  if (diff <= 0) return 'Due now'
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `In ${hrs}h`
  return `In ${Math.floor(hrs / 24)}d`
}

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  initialChannels: AutoblogChannel[]
  initialTopics: AutoblogTopic[]
  initialSources: AutoblogSource[]
  initialRuns: AutoblogRun[]
}

// ── Topic form state ─────────────────────────────────────────────────────────
interface TopicForm {
  name: string
  prompt: string
  schedule: string
  keywords: string
  post_to_social: boolean
}

const EMPTY_TOPIC_FORM: TopicForm = {
  name: '', prompt: '', schedule: 'weekly_mon', keywords: '', post_to_social: true,
}

// ── Main component ───────────────────────────────────────────────────────────
export function AutoblogClient({ initialChannels, initialTopics, initialSources, initialRuns }: Props): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'channels' | 'topics' | 'sources' | 'runs'>('channels')
  const [channels, setChannels] = useState(initialChannels)
  const [topics, setTopics] = useState(initialTopics)
  const [sources, setSources] = useState(initialSources)

  // Topic modal
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [editingTopic, setEditingTopic] = useState<AutoblogTopic | null>(null)
  const [topicForm, setTopicForm] = useState<TopicForm>(EMPTY_TOPIC_FORM)
  const [topicSaving, setTopicSaving] = useState(false)

  // Source modal
  const [showSourceModal, setShowSourceModal] = useState(false)
  const [sourceForm, setSourceForm] = useState({ name: '', url: '', category: 'tech_news' })
  const [sourceSaving, setSourceSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function showMsg(msg: string, isError = false): void {
    if (isError) { setError(msg); setTimeout(() => setError(''), 4000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
  }

  // ── Channel toggle ──────────────────────────────────────────────────────
  async function toggleChannel(key: string, field: 'is_enabled' | 'post_to_social', value: boolean): Promise<void> {
    setChannels(prev => prev.map(c => c.key === key ? { ...c, [field]: value } : c))
    const res = await fetch(`/api/admin/autoblog/channels/${key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (!res.ok) {
      setChannels(prev => prev.map(c => c.key === key ? { ...c, [field]: !value } : c))
      showMsg('Failed to update channel', true)
    } else {
      showMsg(value ? 'Channel enabled' : 'Channel disabled')
    }
  }

  // ── Topic CRUD ──────────────────────────────────────────────────────────
  function openAddTopic(): void {
    setEditingTopic(null)
    setTopicForm(EMPTY_TOPIC_FORM)
    setShowTopicModal(true)
  }

  function openEditTopic(topic: AutoblogTopic): void {
    setEditingTopic(topic)
    setTopicForm({
      name: topic.name,
      prompt: topic.prompt,
      schedule: topic.schedule,
      keywords: topic.keywords.join(', '),
      post_to_social: topic.post_to_social,
    })
    setShowTopicModal(true)
  }

  async function saveTopic(): Promise<void> {
    if (!topicForm.name.trim() || !topicForm.prompt.trim()) {
      showMsg('Name and prompt are required', true)
      return
    }
    setTopicSaving(true)
    const keywords = topicForm.keywords.split(',').map(k => k.trim()).filter(Boolean)
    const payload = { ...topicForm, keywords }

    try {
      if (editingTopic) {
        const res = await fetch(`/api/admin/autoblog/topics/${editingTopic.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update')
        setTopics(prev => prev.map(t => t.id === editingTopic.id ? { ...t, ...payload, keywords } : t))
        showMsg('Topic updated')
      } else {
        const res = await fetch('/api/admin/autoblog/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create')
        const { topic } = await res.json() as { topic: AutoblogTopic }
        setTopics(prev => [topic, ...prev])
        showMsg('Topic created')
      }
      setShowTopicModal(false)
    } catch {
      showMsg('Failed to save topic', true)
    } finally {
      setTopicSaving(false)
    }
  }

  async function toggleTopic(id: string, isEnabled: boolean): Promise<void> {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, is_enabled: isEnabled } : t))
    const res = await fetch(`/api/admin/autoblog/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: isEnabled }),
    })
    if (!res.ok) {
      setTopics(prev => prev.map(t => t.id === id ? { ...t, is_enabled: !isEnabled } : t))
      showMsg('Failed to update topic', true)
    }
  }

  async function deleteTopic(id: string, name: string): Promise<void> {
    if (!confirm(`Delete topic "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/autoblog/topics/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTopics(prev => prev.filter(t => t.id !== id))
      showMsg('Topic deleted')
    } else {
      showMsg('Failed to delete topic', true)
    }
  }

  // ── Source CRUD ─────────────────────────────────────────────────────────
  async function saveSource(): Promise<void> {
    if (!sourceForm.name.trim() || !sourceForm.url.trim()) {
      showMsg('Name and URL are required', true)
      return
    }
    setSourceSaving(true)
    try {
      const res = await fetch('/api/admin/autoblog/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceForm),
      })
      if (!res.ok) {
        const data = await res.json() as { error: string }
        throw new Error(data.error ?? 'Failed to create')
      }
      const { source } = await res.json() as { source: AutoblogSource }
      setSources(prev => [...prev, source])
      setShowSourceModal(false)
      setSourceForm({ name: '', url: '', category: 'tech_news' })
      showMsg('Source added')
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Failed to add source', true)
    } finally {
      setSourceSaving(false)
    }
  }

  async function toggleSource(id: string, isEnabled: boolean): Promise<void> {
    setSources(prev => prev.map(s => s.id === id ? { ...s, is_enabled: isEnabled } : s))
    const res = await fetch(`/api/admin/autoblog/sources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: isEnabled }),
    })
    if (!res.ok) {
      setSources(prev => prev.map(s => s.id === id ? { ...s, is_enabled: !isEnabled } : s))
      showMsg('Failed to update source', true)
    }
  }

  async function deleteSource(id: string, name: string): Promise<void> {
    if (!confirm(`Remove source "${name}"?`)) return
    const res = await fetch(`/api/admin/autoblog/sources/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSources(prev => prev.filter(s => s.id !== id))
      showMsg('Source removed')
    } else {
      showMsg('Failed to remove source', true)
    }
  }

  // ── Grouped sources for display ─────────────────────────────────────────
  const groupedSources = sources.reduce<Record<string, AutoblogSource[]>>((acc, s) => {
    const cat = s.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const tabs: Array<{ key: typeof activeTab; label: string; count?: number }> = [
    { key: 'channels', label: 'Channels', count: channels.filter(c => c.is_enabled).length },
    { key: 'topics',   label: 'Topics',   count: topics.length },
    { key: 'sources',  label: 'Sources',  count: sources.filter(s => s.is_enabled).length },
    { key: 'runs',     label: 'Run Log',  count: initialRuns.length },
  ]

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Autoblog Engine</h1>
          <p className="admin-page-subtitle">
            Self-running blog — all posts require your approval before going live
          </p>
        </div>
      </div>

      {/* Toast messages */}
      {error   && <div className="admin-toast admin-toast-error">{error}</div>}
      {success && <div className="admin-toast admin-toast-success">{success}</div>}

      {/* Tabs */}
      <div className="autoblog-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`autoblog-tab${activeTab === tab.key ? ' autoblog-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="autoblog-tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CHANNELS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'channels' && (
        <div className="autoblog-section">
          <p className="autoblog-section-desc">
            System channels are built-in pipelines. Toggle them on or off below. Every post they generate requires your approval.
          </p>
          <div className="autoblog-channel-grid">
            {channels.map(channel => (
              <div key={channel.key} className={`autoblog-channel-card${channel.is_enabled ? ' autoblog-channel-card-enabled' : ''}`}>
                <div className="autoblog-channel-header">
                  <div>
                    <div className="autoblog-channel-name">{channel.name}</div>
                    <div className="autoblog-channel-cron">{channel.cron_path}</div>
                  </div>
                  <label className="autoblog-toggle">
                    <input
                      type="checkbox"
                      checked={channel.is_enabled}
                      onChange={e => toggleChannel(channel.key, 'is_enabled', e.target.checked)}
                    />
                    <span className="autoblog-toggle-slider" />
                  </label>
                </div>
                <p className="autoblog-channel-desc">{channel.description}</p>
                <div className="autoblog-channel-footer">
                  <label className="autoblog-social-toggle">
                    <input
                      type="checkbox"
                      checked={channel.post_to_social}
                      onChange={e => toggleChannel(channel.key, 'post_to_social', e.target.checked)}
                    />
                    <span className="autoblog-social-label">Post to social on approval</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TOPICS TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'topics' && (
        <div className="autoblog-section">
          <div className="autoblog-section-header">
            <p className="autoblog-section-desc">
              Add your own topics with custom prompts. The engine runs them on your chosen schedule and sends you a draft for approval.
            </p>
            <button className="btn-primary" onClick={openAddTopic}>+ Add Topic</button>
          </div>

          {topics.length === 0 ? (
            <div className="autoblog-empty">
              <p>No topics yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="autoblog-topics-list">
              {topics.map(topic => (
                <div key={topic.id} className="autoblog-topic-row">
                  <div className="autoblog-topic-main">
                    <div className="autoblog-topic-name">{topic.name}</div>
                    <div className="autoblog-topic-meta">
                      <span className="autoblog-badge autoblog-badge-schedule">
                        {SCHEDULE_LABELS[topic.schedule] ?? topic.schedule}
                      </span>
                      {topic.keywords.length > 0 && (
                        <span className="autoblog-topic-keywords">
                          {topic.keywords.slice(0, 3).join(', ')}{topic.keywords.length > 3 ? ` +${topic.keywords.length - 3}` : ''}
                        </span>
                      )}
                      <span className="autoblog-topic-next">
                        Next: {nextRunLabel(topic.schedule, topic.last_run_at)}
                      </span>
                    </div>
                    <div className="autoblog-topic-prompt">{topic.prompt.slice(0, 120)}{topic.prompt.length > 120 ? '...' : ''}</div>
                  </div>
                  <div className="autoblog-topic-actions">
                    <label className="autoblog-toggle autoblog-toggle-sm">
                      <input
                        type="checkbox"
                        checked={topic.is_enabled}
                        onChange={e => toggleTopic(topic.id, e.target.checked)}
                      />
                      <span className="autoblog-toggle-slider" />
                    </label>
                    <button className="autoblog-action-btn" onClick={() => openEditTopic(topic)}>Edit</button>
                    <button className="autoblog-action-btn autoblog-action-btn-danger" onClick={() => deleteTopic(topic.id, topic.name)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SOURCES TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'sources' && (
        <div className="autoblog-section">
          <div className="autoblog-section-header">
            <p className="autoblog-section-desc">
              {sources.filter(s => s.is_enabled).length} of {sources.length} sources enabled.
              The feed fetcher runs every 6 hours and collects items from all enabled sources.
            </p>
            <button className="btn-primary" onClick={() => setShowSourceModal(true)}>+ Add Source</button>
          </div>

          {Object.entries(groupedSources).map(([cat, catSources]) => (
            <div key={cat} className="autoblog-source-group">
              <div className="autoblog-source-group-label">{CATEGORY_LABELS[cat] ?? cat}</div>
              <div className="autoblog-sources-table">
                {catSources.map(source => (
                  <div key={source.id} className="autoblog-source-row">
                    <div className="autoblog-source-info">
                      <div className="autoblog-source-name">{source.name}</div>
                      <div className="autoblog-source-url">{source.url}</div>
                    </div>
                    <div className="autoblog-source-stats">
                      {source.last_fetched_at && (
                        <span className="autoblog-source-last">{timeAgo(source.last_fetched_at)}</span>
                      )}
                      <span className="autoblog-source-count">{source.item_count} items</span>
                    </div>
                    <div className="autoblog-source-actions">
                      <label className="autoblog-toggle autoblog-toggle-sm">
                        <input
                          type="checkbox"
                          checked={source.is_enabled}
                          onChange={e => toggleSource(source.id, e.target.checked)}
                        />
                        <span className="autoblog-toggle-slider" />
                      </label>
                      <button
                        className="autoblog-action-btn autoblog-action-btn-danger"
                        onClick={() => deleteSource(source.id, source.name)}
                      >Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RUN LOG TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'runs' && (
        <div className="autoblog-section">
          <p className="autoblog-section-desc">Last 50 generation attempts across all channels and topics.</p>
          {initialRuns.length === 0 ? (
            <div className="autoblog-empty"><p>No runs yet.</p></div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Generated Title</th>
                    <th>Confidence</th>
                    <th>Sources</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {initialRuns.map(run => (
                    <tr key={run.id}>
                      <td>
                        <span className="autoblog-run-source">
                          {run.channel_key ?? `Topic`}
                        </span>
                      </td>
                      <td className="autoblog-run-title">
                        {run.blog_post_id ? (
                          <a href={`/admin/blog/${run.blog_post_id}`} className="autoblog-run-link">
                            {run.title ?? '—'}
                          </a>
                        ) : (
                          <span>{run.title ?? '—'}</span>
                        )}
                        {run.error_message && (
                          <div className="autoblog-run-error">{run.error_message}</div>
                        )}
                      </td>
                      <td>
                        {run.confidence_score !== null ? (
                          <span className="autoblog-confidence">{run.confidence_score}%</span>
                        ) : '—'}
                      </td>
                      <td>{run.sources_count}</td>
                      <td>
                        <span
                          className="admin-status-badge"
                          style={{ background: RUN_STATUS_COLOURS[run.status] ?? '#6b7280', color: '#fff' }}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="autoblog-run-time">{timeAgo(run.ran_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TOPIC MODAL ──────────────────────────────────────────────────── */}
      {showTopicModal && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTopic ? 'Edit Topic' : 'Add Topic'}</h2>
              <button className="modal-close" onClick={() => setShowTopicModal(false)}>&#x2715;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Topic Name</label>
                <input
                  className="form-input"
                  value={topicForm.name}
                  onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Monthly Uptime Roundup"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prompt / Instructions</label>
                <textarea
                  className="form-input form-textarea"
                  rows={6}
                  value={topicForm.prompt}
                  onChange={e => setTopicForm(f => ({ ...f, prompt: e.target.value }))}
                  placeholder="Describe what the blog post should cover. Be specific — tone, angle, sections, CTA. The engine will follow your instructions faithfully."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Schedule</label>
                <select
                  className="form-input form-select"
                  value={topicForm.schedule}
                  onChange={e => setTopicForm(f => ({ ...f, schedule: e.target.value }))}
                >
                  {Object.entries(SCHEDULE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Keywords (comma-separated, optional)</label>
                <input
                  className="form-input"
                  value={topicForm.keywords}
                  onChange={e => setTopicForm(f => ({ ...f, keywords: e.target.value }))}
                  placeholder="uptime, monitoring, downtime, SaaS"
                />
                <p className="form-hint">Used to filter relevant feed items for this topic</p>
              </div>
              <div className="form-group">
                <label className="autoblog-social-toggle">
                  <input
                    type="checkbox"
                    checked={topicForm.post_to_social}
                    onChange={e => setTopicForm(f => ({ ...f, post_to_social: e.target.checked }))}
                  />
                  <span className="autoblog-social-label">Post to social media when approved</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTopicModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveTopic} disabled={topicSaving}>
                {topicSaving ? 'Saving...' : editingTopic ? 'Save Changes' : 'Create Topic'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SOURCE MODAL ─────────────────────────────────────────────────── */}
      {showSourceModal && (
        <div className="modal-overlay" onClick={() => setShowSourceModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Source</h2>
              <button className="modal-close" onClick={() => setShowSourceModal(false)}>&#x2715;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Source Name</label>
                <input
                  className="form-input"
                  value={sourceForm.name}
                  onChange={e => setSourceForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. TechCrunch"
                />
              </div>
              <div className="form-group">
                <label className="form-label">RSS Feed URL</label>
                <input
                  className="form-input"
                  value={sourceForm.url}
                  onChange={e => setSourceForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/feed.xml"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input form-select"
                  value={sourceForm.category}
                  onChange={e => setSourceForm(f => ({ ...f, category: e.target.value }))}
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSourceModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveSource} disabled={sourceSaving}>
                {sourceSaving ? 'Adding...' : 'Add Source'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
