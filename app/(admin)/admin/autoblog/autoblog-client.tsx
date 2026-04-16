'use client'



import { useState, useCallback } from 'react'

import type { AutoblogChannel, AutoblogTopic, AutoblogSource, AutoblogRun, ChannelCronRun } from '@/lib/db/autoblog'



// - Schedule label map -

const SCHEDULE_LABELS: Record<string, string> = {

  daily:       'Daily',

  weekly_mon:  'Weekly - Monday',

  weekly_fri:  'Weekly - Friday',

  monthly_1:   'Monthly - 1st',

  monthly_15:  'Monthly - 15th',

}



// - Category label map -

const CATEGORY_LABELS: Record<string, string> = {

  wordpress:   'WordPress',

  press_wire:  'Press Wire',

  tech_news:   'Tech News',

  ai_specific: 'AI Specific',

  community:   'Community',

  other:       'Other',

}



// - Status badge colours -

const RUN_STATUS_COLOURS: Record<string, string> = {

  generated: '#10b981',

  failed:    '#ef4444',

  skipped:   '#f59e0b',

  duplicate: '#6b7280',

}



// - Helpers -

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



// - Props -

interface Props {

  initialChannels: AutoblogChannel[]

  initialTopics: AutoblogTopic[]

  initialSources: AutoblogSource[]

  initialRuns: AutoblogRun[]

  initialCronHistory: Record<string, ChannelCronRun[]>

}



// - Topic form state -

interface TopicForm {

  name: string

  prompt: string

  schedule: string

  post_to_social: boolean

}



const EMPTY_TOPIC_FORM: TopicForm = {

  name: '', prompt: '', schedule: 'weekly_mon', post_to_social: true,

}



// - Main component -

export function AutoblogClient({ initialChannels, initialTopics, initialSources, initialRuns, initialCronHistory }: Props): React.ReactElement {

  const [activeTab, setActiveTab] = useState<'channels' | 'topics' | 'sources' | 'runs'>('channels')

  const [channels, setChannels] = useState(initialChannels)

  const [topics, setTopics] = useState(initialTopics)

  const [sources, setSources] = useState(initialSources)

  // Channel cron history + trigger state
  const [cronHistory, setCronHistory] = useState<Record<string, ChannelCronRun[]>>(initialCronHistory)
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  const [triggerState, setTriggerState] = useState<Record<string, 'idle' | 'running' | 'ok' | 'error'>>({})
  const [topicCronExpanded, setTopicCronExpanded] = useState(false)

  const triggerChannel = useCallback(async (cronPath: string): Promise<void> => {
    setTriggerState(prev => ({ ...prev, [cronPath]: 'running' }))
    try {
      const res = await fetch('/api/admin/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: cronPath }),
      })
      const state = res.ok ? 'ok' : 'error'
      setTriggerState(prev => ({ ...prev, [cronPath]: state }))
      // Refresh history for this path
      const histRes = await fetch(`/api/admin/autoblog/cron-history?path=${encodeURIComponent(cronPath)}`)
      if (histRes.ok) {
        const { history } = await histRes.json() as { history: ChannelCronRun[] }
        setCronHistory(prev => ({ ...prev, [cronPath]: history }))
      }
      setTimeout(() => setTriggerState(prev => ({ ...prev, [cronPath]: 'idle' })), 4000)
    } catch {
      setTriggerState(prev => ({ ...prev, [cronPath]: 'error' }))
      setTimeout(() => setTriggerState(prev => ({ ...prev, [cronPath]: 'idle' })), 4000)
    }
  }, [])

  // Topic modal — step wizard
  const [showTopicModal, setShowTopicModal] = useState(false)

  const [editingTopic, setEditingTopic] = useState<AutoblogTopic | null>(null)

  const [topicForm, setTopicForm] = useState<TopicForm>(EMPTY_TOPIC_FORM)

  const [topicSaving, setTopicSaving] = useState(false)

  const [topicStep, setTopicStep] = useState<1 | 2>(1)

  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set())

  const [sourceSearch, setSourceSearch] = useState('')

  const [showInlineSourceForm, setShowInlineSourceForm] = useState(false)

  const [inlineSourceForm, setInlineSourceForm] = useState({ name: '', url: '', category: 'wordpress' })

  const [inlineSourceSaving, setInlineSourceSaving] = useState(false)



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



  // - Channel toggle -

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



  // - Topic CRUD -

  function openAddTopic(): void {

    setEditingTopic(null)

    setTopicForm(EMPTY_TOPIC_FORM)

    setTopicStep(1)

    setSelectedSourceIds(new Set())

    setSourceSearch('')

    setShowInlineSourceForm(false)

    setInlineSourceForm({ name: '', url: '', category: 'wordpress' })

    setShowTopicModal(true)

  }



  async function openEditTopic(topic: AutoblogTopic): Promise<void> {

    setEditingTopic(topic)

    setTopicForm({

      name: topic.name,

      prompt: topic.prompt,

      schedule: topic.schedule,

      post_to_social: topic.post_to_social,

    })

    setTopicStep(1)

    setSourceSearch('')

    setShowInlineSourceForm(false)

    setInlineSourceForm({ name: '', url: '', category: 'wordpress' })

    setShowTopicModal(true)

    // Load existing source assignments
    try {

      const res = await fetch(`/api/admin/autoblog/topics/${topic.id}/sources`)

      if (res.ok) {

        const { sources } = await res.json() as { sources: AutoblogSource[] }

        setSelectedSourceIds(new Set(sources.map(s => s.id)))

      }

    } catch {

      setSelectedSourceIds(new Set())

    }

  }



  function goToStep2(): void {

    if (!topicForm.name.trim() || !topicForm.prompt.trim()) {

      showMsg('Name and prompt are required', true)

      return

    }

    setTopicStep(2)

  }



  async function saveTopicWithSources(): Promise<void> {

    setTopicSaving(true)

    const payload = {

      name: topicForm.name,

      prompt: topicForm.prompt,

      schedule: topicForm.schedule,

      post_to_social: topicForm.post_to_social,

      keywords: [] as string[],

    }



    try {

      let topicId: string



      if (editingTopic) {

        const res = await fetch(`/api/admin/autoblog/topics/${editingTopic.id}`, {

          method: 'PATCH',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify(payload),

        })

        if (!res.ok) throw new Error('Failed to update')

        setTopics(prev => prev.map(t => t.id === editingTopic.id ? { ...t, ...payload } : t))

        topicId = editingTopic.id

      } else {

        const res = await fetch('/api/admin/autoblog/topics', {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify(payload),

        })

        if (!res.ok) throw new Error('Failed to create')

        const { topic } = await res.json() as { topic: AutoblogTopic }

        setTopics(prev => [topic, ...prev])

        topicId = topic.id

      }



      // Save source assignments
      await fetch(`/api/admin/autoblog/topics/${topicId}/sources`, {

        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ sourceIds: Array.from(selectedSourceIds) }),

      })



      showMsg(editingTopic ? 'Topic updated' : 'Topic created')

      setShowTopicModal(false)

    } catch {

      showMsg('Failed to save topic', true)

    } finally {

      setTopicSaving(false)

    }

  }



  async function addInlineSource(): Promise<void> {

    if (!inlineSourceForm.name.trim() || !inlineSourceForm.url.trim()) {

      showMsg('Name and URL are required', true)

      return

    }

    setInlineSourceSaving(true)

    try {

      const res = await fetch('/api/admin/autoblog/sources', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(inlineSourceForm),

      })

      if (!res.ok) {

        const data = await res.json() as { error: string }

        throw new Error(data.error ?? 'Failed to add source')

      }

      const { source } = await res.json() as { source: AutoblogSource }

      setSources(prev => [...prev, source])

      setSelectedSourceIds(prev => new Set([...prev, source.id]))

      setInlineSourceForm({ name: '', url: '', category: 'wordpress' })

      setShowInlineSourceForm(false)

      showMsg('Source added and selected')

    } catch (err) {

      showMsg(err instanceof Error ? err.message : 'Failed to add source', true)

    } finally {

      setInlineSourceSaving(false)

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



  // - Source CRUD -

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



  // - Grouped sources for display -

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

            Self-running blog - all posts require your approval before going live

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



      {/* - CHANNELS TAB - */}

      {activeTab === 'channels' && (

        <div className="autoblog-section">

          <p className="autoblog-section-desc">

            System channels are built-in pipelines. Toggle them on or off below. Every post they generate requires your approval.

          </p>

          <div className="autoblog-channel-grid">

            {channels.map(channel => {
              const path = channel.cron_path ?? ''
              const tState = triggerState[path] ?? 'idle'
              const history = cronHistory[path] ?? []
              const isExpanded = expandedChannel === channel.key
              const lastRun = history[0]

              return (
                <div key={channel.key} className={`autoblog-channel-card${channel.is_enabled ? ' autoblog-channel-card-enabled' : ''}`}>

                  {/* Header row: name + enable toggle */}
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

                  {/* Footer: social toggle + run button + history toggle */}
                  <div className="autoblog-channel-footer">
                    <label className="autoblog-social-toggle">
                      <input
                        type="checkbox"
                        checked={channel.post_to_social}
                        onChange={e => toggleChannel(channel.key, 'post_to_social', e.target.checked)}
                      />
                      <span className="autoblog-social-label">Post to social on approval</span>
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      {channel.cron_path && (
                        <button
                          className="autoblog-action-btn"
                          style={{
                            opacity: !channel.is_enabled ? 0.4 : 1,
                            cursor: !channel.is_enabled ? 'not-allowed' : 'pointer',
                            fontWeight: 600, fontSize: 12, padding: '4px 10px',
                          }}
                          disabled={tState === 'running' || !channel.is_enabled}
                          onClick={() => triggerChannel(path)}
                          title={!channel.is_enabled ? 'Enable channel first' : 'Run now'}
                        >
                          {tState === 'running' ? 'Running…' : tState === 'ok' ? '✓ Done' : tState === 'error' ? '✗ Error' : '▶ Run now'}
                        </button>
                      )}

                      {history.length > 0 && (
                        <button
                          className="autoblog-action-btn"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() => setExpandedChannel(isExpanded ? null : channel.key)}
                        >
                          {isExpanded ? '▲ Hide history' : `▼ History (${history.length})`}
                        </button>
                      )}

                      {lastRun && (
                        <span
                          title={`Last: ${lastRun.status} · ${timeAgo(lastRun.ran_at)}${lastRun.result_summary ? ' · ' + lastRun.result_summary : ''}${lastRun.error_message ? ' — ' + lastRun.error_message : ''}`}
                          style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                            background: lastRun.status === 'ok' ? '#22c55e' : lastRun.status === 'error' ? '#ef4444' : '#f59e0b',
                            border: lastRun.triggered_by === 'manual' ? '2px solid #3b82f6' : '2px solid transparent',
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Accordion: run history */}
                  {isExpanded && (
                    <div className="autoblog-channel-history">
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                            <th style={{ padding: '4px 8px' }}>When</th>
                            <th style={{ padding: '4px 8px' }}>Status</th>
                            <th style={{ padding: '4px 8px' }}>Result</th>
                            <th style={{ padding: '4px 8px' }}>ms</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map(run => (
                            <tr key={run.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '5px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {timeAgo(run.ran_at)}
                                {run.triggered_by === 'manual' && (
                                  <span style={{ marginLeft: 4, fontSize: 10, color: '#3b82f6', fontWeight: 600 }}>manual</span>
                                )}
                              </td>
                              <td style={{ padding: '5px 8px' }}>
                                <span style={{
                                  display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 5,
                                  background: run.status === 'ok' ? '#22c55e' : run.status === 'error' ? '#ef4444' : '#f59e0b',
                                }} />
                                {run.status}
                              </td>
                              <td style={{ padding: '5px 8px', color: run.error_message ? '#ef4444' : 'var(--text-muted)' }}>
                                {run.error_message ?? run.result_summary ?? '—'}
                              </td>
                              <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>
                                {run.duration_ms ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}

          </div>

        </div>

      )}



      {/* - TOPICS TAB - */}

      {activeTab === 'topics' && (

        <div className="autoblog-section">

          <div className="autoblog-section-header">

            <p className="autoblog-section-desc">

              Add your own topics with custom prompts. The engine runs them on your chosen schedule and sends you a draft for approval.

            </p>

            <button className="btn-primary" onClick={openAddTopic}>+ Add Topic</button>

          </div>

          {/* Topic-runner cron control bar */}
          {(() => {
            const TOPIC_RUNNER = '/api/cron/autoblog/topic-runner'
            const tState = triggerState[TOPIC_RUNNER] ?? 'idle'
            const history = cronHistory[TOPIC_RUNNER] ?? []
            const lastRun = history[0]
            return (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Topic Runner Cron</span>
                  <code style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4 }}>{TOPIC_RUNNER}</code>

                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {lastRun && (
                      <span
                        title={`Last: ${lastRun.status} · ${timeAgo(lastRun.ran_at)}${lastRun.result_summary ? ' · ' + lastRun.result_summary : ''}${lastRun.error_message ? ' — ' + lastRun.error_message : ''}`}
                        style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                          background: lastRun.status === 'ok' ? '#22c55e' : lastRun.status === 'error' ? '#ef4444' : '#f59e0b',
                          border: lastRun.triggered_by === 'manual' ? '2px solid #3b82f6' : '2px solid transparent',
                        }}
                      />
                    )}
                    <button
                      className="autoblog-action-btn"
                      style={{ fontWeight: 600, fontSize: 12, padding: '4px 10px' }}
                      disabled={tState === 'running'}
                      onClick={() => triggerChannel(TOPIC_RUNNER)}
                    >
                      {tState === 'running' ? 'Running…' : tState === 'ok' ? '✓ Done' : tState === 'error' ? '✗ Error' : '▶ Run now'}
                    </button>
                    {history.length > 0 && (
                      <button
                        className="autoblog-action-btn"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => setTopicCronExpanded(e => !e)}
                      >
                        {topicCronExpanded ? '▲ Hide history' : `▼ History (${history.length})`}
                      </button>
                    )}
                  </div>
                </div>

                {lastRun && (
                  <div style={{ marginTop: 6, fontSize: 12, color: lastRun.status === 'error' ? '#ef4444' : 'var(--text-muted)' }}>
                    Last run: {timeAgo(lastRun.ran_at)} · {lastRun.status}
                    {lastRun.result_summary ? ` · ${lastRun.result_summary}` : ''}
                    {lastRun.error_message ? ` — ${lastRun.error_message}` : ''}
                  </div>
                )}

                {topicCronExpanded && history.length > 0 && (
                  <div style={{ marginTop: 10, borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                          <th style={{ padding: '4px 8px' }}>When</th>
                          <th style={{ padding: '4px 8px' }}>Status</th>
                          <th style={{ padding: '4px 8px' }}>Result</th>
                          <th style={{ padding: '4px 8px' }}>ms</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(run => (
                          <tr key={run.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '5px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {timeAgo(run.ran_at)}
                              {run.triggered_by === 'manual' && (
                                <span style={{ marginLeft: 4, fontSize: 10, color: '#3b82f6', fontWeight: 600 }}>manual</span>
                              )}
                            </td>
                            <td style={{ padding: '5px 8px' }}>
                              <span style={{
                                display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 5,
                                background: run.status === 'ok' ? '#22c55e' : run.status === 'error' ? '#ef4444' : '#f59e0b',
                              }} />
                              {run.status}
                            </td>
                            <td style={{ padding: '5px 8px', color: run.error_message ? '#ef4444' : 'var(--text-muted)' }}>
                              {run.error_message ?? run.result_summary ?? '—'}
                            </td>
                            <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>
                              {run.duration_ms ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })()}



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

                    <button className="autoblog-action-btn" onClick={() => { void openEditTopic(topic) }}>Edit</button>

                    <button className="autoblog-action-btn autoblog-action-btn-danger" onClick={() => deleteTopic(topic.id, topic.name)}>Delete</button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      )}



      {/* - SOURCES TAB - */}

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



      {/* - RUN LOG TAB - */}

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

                            {run.title ?? '-'}

                          </a>

                        ) : (

                          <span>{run.title ?? '-'}</span>

                        )}

                        {run.error_message && (

                          <div className="autoblog-run-error">{run.error_message}</div>

                        )}

                      </td>

                      <td>

                        {run.confidence_score !== null ? (

                          <span className="autoblog-confidence">{run.confidence_score}%</span>

                        ) : '-'}

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



      {/* - TOPIC MODAL (2-step wizard) - */}

      {showTopicModal && (

        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>

          <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>

            {/* Header */}
            <div className="modal-header">

              <h2 className="modal-title">{editingTopic ? 'Edit Topic' : 'Add Topic'}</h2>

              <button className="modal-close" onClick={() => setShowTopicModal(false)}>&#x2715;</button>

            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--border-color)' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: topicStep === 1 ? '#3b82f6' : '#22c55e' }}>

                <span style={{ width: 24, height: 24, borderRadius: '50%', background: topicStep === 1 ? '#3b82f6' : '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>

                  {topicStep === 1 ? '1' : '✓'}

                </span>

                Topic Details

              </div>

              <div style={{ flex: 1, height: 1, background: 'var(--border-color)', margin: '0 12px' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: topicStep === 2 ? 600 : 400, color: topicStep === 2 ? '#3b82f6' : 'var(--text-muted)' }}>

                <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${topicStep === 2 ? '#3b82f6' : 'var(--text-muted)'}`, background: topicStep === 2 ? '#3b82f6' : 'transparent', color: topicStep === 2 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>

                  2

                </span>

                Assign Sources

              </div>

            </div>

            {/* Step 1 — Topic Details */}
            {topicStep === 1 && (

              <div className="modal-body">

                <div className="form-group">

                  <label className="form-label">Topic Name</label>

                  <input

                    className="form-input"

                    value={topicForm.name}

                    onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))}

                    placeholder="e.g. WordPress Weekly Roundup"

                    autoFocus

                  />

                </div>

                <div className="form-group">

                  <label className="form-label">Prompt / Instructions</label>

                  <textarea

                    className="form-input form-textarea"

                    rows={6}

                    value={topicForm.prompt}

                    onChange={e => setTopicForm(f => ({ ...f, prompt: e.target.value }))}

                    placeholder="Describe what the blog post should cover. Be specific — tone, angle, target audience, key sections, call to action. The engine follows your instructions faithfully."

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

            )}

            {/* Step 2 — Assign Sources */}
            {topicStep === 2 && (

              <div className="modal-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>

                {/* Count + inline add trigger */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>

                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>

                    <strong style={{ color: selectedSourceIds.size > 0 ? '#3b82f6' : 'var(--text-primary)' }}>{selectedSourceIds.size}</strong> sources selected

                  </span>

                  <button

                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}

                    onClick={() => setShowInlineSourceForm(v => !v)}

                  >

                    {showInlineSourceForm ? '✕ Cancel' : '+ Add new source'}

                  </button>

                </div>

                {/* Inline add source form */}
                {showInlineSourceForm && (

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, padding: 12, background: 'var(--bg-secondary)', border: '1px dashed #3b82f6', borderRadius: 8 }}>

                    <div style={{ display: 'flex', gap: 8 }}>

                      <input

                        className="form-input"

                        style={{ flex: 1, fontSize: 13, padding: '7px 10px' }}

                        placeholder="Source name (e.g. WP Tavern)"

                        value={inlineSourceForm.name}

                        onChange={e => setInlineSourceForm(f => ({ ...f, name: e.target.value }))}

                      />

                      <input

                        className="form-input"

                        style={{ flex: 1, fontSize: 13, padding: '7px 10px' }}

                        placeholder="RSS feed URL"

                        value={inlineSourceForm.url}

                        onChange={e => setInlineSourceForm(f => ({ ...f, url: e.target.value }))}

                      />

                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

                      <select

                        className="form-input form-select"

                        style={{ maxWidth: 160, fontSize: 13, padding: '7px 10px' }}

                        value={inlineSourceForm.category}

                        onChange={e => setInlineSourceForm(f => ({ ...f, category: e.target.value }))}

                      >

                        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (

                          <option key={val} value={val}>{label}</option>

                        ))}

                      </select>

                      <div style={{ flex: 1 }} />

                      <button

                        className="btn-secondary"

                        style={{ fontSize: 13, padding: '6px 12px' }}

                        onClick={() => { setShowInlineSourceForm(false); setInlineSourceForm({ name: '', url: '', category: 'wordpress' }) }}

                      >

                        Cancel

                      </button>

                      <button

                        className="btn-primary"

                        style={{ fontSize: 13, padding: '6px 14px' }}

                        onClick={() => { void addInlineSource() }}

                        disabled={inlineSourceSaving}

                      >

                        {inlineSourceSaving ? 'Adding…' : 'Add source'}

                      </button>

                    </div>

                  </div>

                )}

                {/* Search */}
                <input

                  className="form-input"

                  style={{ marginBottom: 14, fontSize: 13 }}

                  placeholder="Search sources…"

                  value={sourceSearch}

                  onChange={e => setSourceSearch(e.target.value)}

                />

                {/* Sources grouped by category */}
                {(() => {

                  const q = sourceSearch.toLowerCase()

                  const filtered = sources.filter(s =>
                    !q || s.name.toLowerCase().includes(q) || (s.category ?? '').includes(q)
                  )

                  const grouped = filtered.reduce<Record<string, AutoblogSource[]>>((acc, s) => {

                    const cat = s.category ?? 'other'

                    if (!acc[cat]) acc[cat] = []

                    acc[cat].push(s)

                    return acc

                  }, {})

                  if (filtered.length === 0) {

                    return <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No sources found.</p>

                  }

                  return Object.entries(grouped).map(([cat, catSources]) => (

                    <div key={cat} style={{ marginBottom: 16 }}>

                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>

                        {CATEGORY_LABELS[cat] ?? cat}

                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

                        {catSources.map(source => (

                          <label

                            key={source.id}

                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedSourceIds.has(source.id) ? 'color-mix(in srgb, #3b82f6 12%, var(--bg-secondary))' : 'var(--bg-secondary)', border: `1px solid ${selectedSourceIds.has(source.id) ? '#3b82f6' : 'var(--border-color)'}`, transition: 'all 0.15s' }}

                          >

                            <input

                              type="checkbox"

                              checked={selectedSourceIds.has(source.id)}

                              onChange={e => {

                                setSelectedSourceIds(prev => {

                                  const next = new Set(prev)

                                  if (e.target.checked) next.add(source.id)

                                  else next.delete(source.id)

                                  return next

                                })

                              }}

                              style={{ accentColor: '#3b82f6', width: 15, height: 15, flexShrink: 0 }}

                            />

                            <div style={{ flex: 1, minWidth: 0 }}>

                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{source.name}</div>

                              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{source.url}</div>

                            </div>

                            {!source.is_enabled && (

                              <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', flexShrink: 0 }}>disabled</span>

                            )}

                          </label>

                        ))}

                      </div>

                    </div>

                  ))

                })()}

              </div>

            )}

            {/* Footer */}
            <div className="modal-footer">

              {topicStep === 1 ? (

                <>

                  <button className="btn-secondary" onClick={() => setShowTopicModal(false)}>Cancel</button>

                  <button className="btn-primary" onClick={goToStep2}>Next: Assign Sources →</button>

                </>

              ) : (

                <>

                  <button className="btn-secondary" onClick={() => setTopicStep(1)}>← Back</button>

                  <button className="btn-primary" onClick={() => { void saveTopicWithSources() }} disabled={topicSaving}>

                    {topicSaving ? 'Saving...' : editingTopic ? 'Save Changes' : 'Create Topic'}

                  </button>

                </>

              )}

            </div>

          </div>

        </div>

      )}



      {/* - SOURCE MODAL - */}

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

