'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { IconBell } from '@/components/icons'

interface Message {
  id: string
  title: string
  body: string
  type: 'info' | 'warning' | 'success' | 'error' | 'system'
  category: string
  is_read: boolean
  action_url: string | null
  action_label: string | null
  created_at: string
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'warning': return 'var(--color-warning, #f59e0b)'
    case 'error': return 'var(--color-danger, #ef4444)'
    case 'success': return 'var(--color-success, #22c55e)'
    case 'system': return 'var(--color-primary, #3b82f6)'
    default: return 'var(--text-secondary)'
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function MessagesBell(): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/v1/messages')
      if (!res.ok) return
      const data = await res.json() as { success: boolean; messages: Message[]; unreadCount: number }
      if (data.success) {
        setMessages(data.messages)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // Silently ignore
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 60_000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async (): Promise<void> => {
    await fetch('/api/v1/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setMessages(prev => prev.map(m => ({ ...m, is_read: true })))
    setUnreadCount(0)
  }

  const handleMarkRead = async (messageId: string): Promise<void> => {
    await fetch('/api/v1/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    })
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_read: true } : m))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  return (
    <div className="messages-bell-wrapper" ref={dropdownRef}>
      <button
        className="messages-bell-btn"
        onClick={() => setOpen(!open)}
        title="Messages"
        aria-label={`Messages${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <IconBell size={20} />
        {unreadCount > 0 && (
          <span className="messages-bell-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="messages-dropdown">
          <div className="messages-dropdown-header">
            <span className="messages-dropdown-title">Messages</span>
            {unreadCount > 0 && (
              <button
                className="messages-mark-all-btn"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="messages-dropdown-body">
            {messages.length === 0 ? (
              <div className="messages-empty">
                <p>No messages yet</p>
              </div>
            ) : (
              messages.slice(0, 10).map((msg) => (
                <div
                  key={msg.id}
                  className={`messages-item${msg.is_read ? '' : ' messages-item-unread'}`}
                  onClick={() => { if (!msg.is_read) handleMarkRead(msg.id) }}
                >
                  <div className="messages-item-dot" style={{ background: msg.is_read ? 'transparent' : getTypeColor(msg.type) }} />
                  <div className="messages-item-content">
                    <div className="messages-item-title">{msg.title}</div>
                    <div className="messages-item-body">{msg.body}</div>
                    <div className="messages-item-time">{timeAgo(msg.created_at)}</div>
                    {msg.action_url && msg.action_label && (
                      <Link
                        href={msg.action_url}
                        className="messages-item-action"
                        onClick={() => setOpen(false)}
                      >
                        {msg.action_label}
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
