'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { BellOff, Mail, Hash, Webhook, Phone, MessageSquare, Users, Edit2, Trash2, Power, PowerOff, Send } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteAlertChannelAction, toggleAlertChannelAction, bulkDeleteAlertChannelsAction, bulkEnableAlertChannelsAction, bulkDisableAlertChannelsAction } from '@/app/(dashboard)/dashboard/alerts/actions'
import { useToast } from '@/components/ui/toast'
import { Pagination } from '@/components/ui/pagination'
import type { PaginationMeta } from '@/lib/utils/pagination'
import type { AlertChannel } from '@/lib/types'

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  email: { label: 'Email', icon: <Mail size={16} />, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  slack: { label: 'Slack', icon: <Hash size={16} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  teams: { label: 'Teams', icon: <Users size={16} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  whatsapp: { label: 'WhatsApp', icon: <MessageSquare size={16} />, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  voice: { label: 'Voice', icon: <Phone size={16} />, color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  webhook: { label: 'Webhook', icon: <Webhook size={16} />, color: '#2ee06b', bg: 'rgba(46,224,107,0.12)' },
  telegram: { label: 'Telegram', icon: <Send size={16} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
}

const DEFAULT_META = { label: 'Channel', icon: <BellOff size={16} />, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' }

interface ChannelConfig {
  email?: string
  slackWebhookUrl?: string
  slackChannel?: string
  teamsWebhookUrl?: string
  webhookUrl?: string
  telegramChatId?: string
}

function getDestination(channel: AlertChannel): string {
  const config = channel.config as ChannelConfig
  switch (channel.type) {
    case 'email': return config.email || '—'
    case 'slack': return config.slackChannel || (config.slackWebhookUrl ? config.slackWebhookUrl.slice(0, 36) + '…' : '—')
    case 'teams': return config.teamsWebhookUrl ? config.teamsWebhookUrl.slice(0, 36) + '…' : '—'
    case 'webhook': return config.webhookUrl ? config.webhookUrl.slice(0, 36) + '…' : '—'
    case 'telegram': return config.telegramChatId ? `Chat ID: ${config.telegramChatId}` : '—'
    default: return '—'
  }
}

interface PendingConfirm {
  type: 'delete' | 'bulk-delete' | 'bulk-enable' | 'bulk-disable'
  ids: string[]
}

export function AlertChannelsTable({ channels, pagination }: { channels: AlertChannel[]; pagination?: PaginationMeta }) {
  const [isPending, startTransition] = useTransition()
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const toast = useToast()

  async function handleTestAlert(channelId: string): Promise<void> {
    setTestingChannelId(channelId)
    try {
      const res = await fetch('/api/v1/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      })
      const data: { success?: boolean; error?: string; message?: string } = await res.json()
      if (res.ok && data.success) toast.addToast(data.message || 'Test alert sent.', 'success')
      else toast.addToast(data.error || 'Failed to send test alert.', 'error')
    } catch {
      toast.addToast('Failed to send test alert. Check your connection.', 'error')
    } finally {
      setTestingChannelId(null)
    }
  }

  function handleToggle(id: string, currentlyEnabled: boolean): void {
    startTransition(async () => { await toggleAlertChannelAction(id, !currentlyEnabled) })
  }

  function executeConfirm(): void {
    if (!pendingConfirm) return
    const { type, ids } = pendingConfirm
    setPendingConfirm(null)
    setSelectedIds(new Set())
    startTransition(async () => {
      switch (type) {
        case 'delete': {
          const result = await deleteAlertChannelAction(ids[0])
          if (result?.error) toast.addToast(result.error, 'error')
          else toast.addToast('Alert channel deleted.', 'success')
          break
        }
        case 'bulk-delete':
          await bulkDeleteAlertChannelsAction(ids)
          toast.addToast(`${ids.length} channel(s) deleted.`, 'success')
          break
        case 'bulk-enable':
          await bulkEnableAlertChannelsAction(ids)
          toast.addToast(`${ids.length} channel(s) enabled.`, 'success')
          break
        case 'bulk-disable':
          await bulkDisableAlertChannelsAction(ids)
          toast.addToast(`${ids.length} channel(s) disabled.`, 'success')
          break
      }
    })
  }

  function getConfirmProps(): { title: string; message: string; confirmText: string; variant: 'danger' | 'warning' } {
    if (!pendingConfirm) return { title: '', message: '', confirmText: '', variant: 'danger' }
    switch (pendingConfirm.type) {
      case 'delete': return { title: 'Delete Channel', message: 'This alert channel will be permanently deleted.', confirmText: 'Delete', variant: 'danger' }
      case 'bulk-delete': return { title: `Delete ${pendingConfirm.ids.length} Channel(s)`, message: `${pendingConfirm.ids.length} channel(s) will be permanently deleted.`, confirmText: 'Delete All', variant: 'danger' }
      case 'bulk-enable': return { title: `Enable ${pendingConfirm.ids.length} Channel(s)`, message: `${pendingConfirm.ids.length} channel(s) will be enabled.`, confirmText: 'Enable All', variant: 'warning' }
      case 'bulk-disable': return { title: `Disable ${pendingConfirm.ids.length} Channel(s)`, message: `${pendingConfirm.ids.length} channel(s) will be disabled.`, confirmText: 'Disable All', variant: 'warning' }
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleSelectAll() {
    setSelectedIds(prev => prev.size === channels.length ? new Set() : new Set(channels.map(c => c.id)))
  }

  const confirmProps = getConfirmProps()
  const someSelected = selectedIds.size > 0
  const allSelected = channels.length > 0 && selectedIds.size === channels.length

  if (channels.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><BellOff size={32} strokeWidth={1.5} /></div>
        <h3>No alert channels yet</h3>
        <p>Add a channel to receive downtime notifications.</p>
        <Link href="/dashboard/alerts/new" className="btn btn-primary" style={{ marginTop: 16 }}>+ Add Channel</Link>
      </div>
    )
  }

  return (
    <div className="ac-wrap">
      {/* Bulk bar */}
      {someSelected && (
        <div className="ac-bulk-bar">
          <span className="ac-bulk-count">{selectedIds.size} selected</span>
          <div className="ac-bulk-actions">
            <button className="btn btn-sm" onClick={() => setPendingConfirm({ type: 'bulk-enable', ids: Array.from(selectedIds) })}>Enable</button>
            <button className="btn btn-sm" onClick={() => setPendingConfirm({ type: 'bulk-disable', ids: Array.from(selectedIds) })}>Disable</button>
            <button className="btn btn-sm" style={{ color: '#ef4444' }} onClick={() => setPendingConfirm({ type: 'bulk-delete', ids: Array.from(selectedIds) })}>Delete</button>
            <button className="btn btn-sm" onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="ac-header">
        <div className="ac-col-check">
          <input type="checkbox" className="mon-checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" />
        </div>
        <div className="ac-col-channel">Channel</div>
        <div className="ac-col-dest">Destination</div>
        <div className="ac-col-severity">Severities</div>
        <div className="ac-col-status">Status</div>
        <div className="ac-col-status">Actions</div>
      </div>

      {/* Rows */}
      <div className="ac-list">
        {channels.map(ch => {
          const meta = TYPE_META[ch.type] ?? DEFAULT_META
          const severities = (ch.severity_filter || []) as string[]
          const isSelected = selectedIds.has(ch.id)

          return (
            <div key={ch.id} className={`ac-row${isSelected ? ' ac-row--selected' : ''}${!ch.is_enabled ? ' ac-row--disabled' : ''}`}>
              {/* Checkbox — always col 1 */}
              <div className="ac-col-check">
                <input type="checkbox" className="mon-checkbox" checked={isSelected} onChange={() => toggleSelect(ch.id)} aria-label={`Select ${ch.name}`} />
              </div>

              {/* Desktop: individual grid columns. Mobile: .ac-mobile-body wraps everything */}
              <div className="ac-col-channel">
                <div className="ac-type-icon" style={{ background: meta.bg, color: meta.color }}>
                  {meta.icon}
                </div>
                <div className="ac-channel-info">
                  <span className="ac-channel-name">{ch.name}</span>
                  <span className="ac-channel-type">{meta.label}{!ch.is_enabled ? ' · Disabled' : ''}</span>
                </div>
              </div>

              <div className="ac-col-dest">
                <span className="ac-dest">{getDestination(ch)}</span>
              </div>

              <div className="ac-col-severity">
                <div className="ac-severity-chips">
                  {severities.length === 0
                    ? <span className="ac-severity-all">All</span>
                    : severities.map(s => (
                      <span key={s} className={`ac-severity-chip${s === 'P1' || s === 'P2' ? ' ac-severity-chip--high' : ''}`}>{s}</span>
                    ))
                  }
                </div>
              </div>

              <div className="ac-col-status">
                <span className={`ac-status-badge${ch.is_enabled ? ' ac-status-badge--on' : ' ac-status-badge--off'}`}>
                  <span className="ac-status-dot" />
                  {ch.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="ac-col-actions">
                <button
                  className="mon-action-btn"
                  title={testingChannelId === ch.id ? 'Sending…' : 'Send test alert'}
                  onClick={() => handleTestAlert(ch.id)}
                  disabled={testingChannelId === ch.id}
                >
                  <Send size={13} />
                </button>
                <Link href={`/dashboard/alerts/${ch.id}`} className="mon-action-btn" title="Edit">
                  <Edit2 size={13} />
                </Link>
                <button
                  className="mon-action-btn"
                  title={ch.is_enabled ? 'Disable' : 'Enable'}
                  onClick={() => handleToggle(ch.id, ch.is_enabled)}
                  disabled={isPending}
                >
                  {ch.is_enabled ? <PowerOff size={13} /> : <Power size={13} />}
                </button>
                <button
                  className="mon-action-btn mon-action-btn--danger"
                  title="Delete"
                  onClick={() => setPendingConfirm({ type: 'delete', ids: [ch.id] })}
                  disabled={isPending}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Mobile-only card body — shown instead of desktop columns */}
              <div className="ac-mobile-body">
                <div className="ac-mobile-row1">
                  <div className="ac-type-icon ac-mobile-icon" style={{ background: meta.bg, color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className="ac-mobile-name-wrap">
                    <span className="ac-channel-name">{ch.name}</span>
                    <span className="ac-channel-type">{meta.label}{!ch.is_enabled ? ' · Disabled' : ''}</span>
                  </div>
                  <span className={`ac-status-badge${ch.is_enabled ? ' ac-status-badge--on' : ' ac-status-badge--off'}`}>
                    <span className="ac-status-dot" />
                    {ch.is_enabled ? 'On' : 'Off'}
                  </span>
                </div>

                <div className="ac-mobile-dest">
                  <span className="ac-dest">{getDestination(ch)}</span>
                </div>

                <div className="ac-mobile-row3">
                  <div className="ac-severity-chips">
                    {severities.length === 0
                      ? <span className="ac-severity-all">All severities</span>
                      : severities.map(s => (
                        <span key={s} className={`ac-severity-chip${s === 'P1' || s === 'P2' ? ' ac-severity-chip--high' : ''}`}>{s}</span>
                      ))
                    }
                  </div>
                  <div className="ac-mobile-actions">
                    <button
                      className="mon-action-btn"
                      title={testingChannelId === ch.id ? 'Sending…' : 'Send test'}
                      onClick={() => handleTestAlert(ch.id)}
                      disabled={testingChannelId === ch.id}
                    >
                      <Send size={13} />
                    </button>
                    <Link href={`/dashboard/alerts/${ch.id}`} className="mon-action-btn" title="Edit">
                      <Edit2 size={13} />
                    </Link>
                    <button
                      className="mon-action-btn"
                      title={ch.is_enabled ? 'Disable' : 'Enable'}
                      onClick={() => handleToggle(ch.id, ch.is_enabled)}
                      disabled={isPending}
                    >
                      {ch.is_enabled ? <PowerOff size={13} /> : <Power size={13} />}
                    </button>
                    <button
                      className="mon-action-btn mon-action-btn--danger"
                      title="Delete"
                      onClick={() => setPendingConfirm({ type: 'delete', ids: [ch.id] })}
                      disabled={isPending}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {pagination && <Pagination {...pagination} />}

      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        onConfirm={executeConfirm}
        onCancel={() => setPendingConfirm(null)}
        title={confirmProps.title}
        message={confirmProps.message}
        confirmText={confirmProps.confirmText}
        variant={confirmProps.variant}
      />
    </div>
  )
}
