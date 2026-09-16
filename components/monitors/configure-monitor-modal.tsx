'use client'

import { useState } from 'react'
import { KeywordTagInput } from './keyword-tag-input'

interface Props {
  type: string
  domain: string
  initialConfig?: Record<string, unknown>
  onSave: (config: Record<string, unknown>) => void
  onCancel: () => void
  isSaving?: boolean
  error?: string
  keywordSuggestions?: { positive: string[]; negative: string[] }
}

export function ConfigureMonitorModal({ type, domain, initialConfig, onSave, onCancel, isSaving, error, keywordSuggestions }: Props): React.ReactElement {
  const [positiveKeywords, setPositiveKeywords] = useState<string[]>((initialConfig?.positiveKeywords as string[]) ?? [])
  const [negativeKeywords, setNegativeKeywords] = useState<string[]>((initialConfig?.negativeKeywords as string[]) ?? [])
  const [port, setPort] = useState<string>(initialConfig?.port ? String(initialConfig.port) : '')
  const [expectedInterval, setExpectedInterval] = useState<string>(initialConfig?.expectedIntervalSeconds ? String(initialConfig.expectedIntervalSeconds) : '300')
  const [method, setMethod] = useState<string>((initialConfig?.method as string) ?? 'GET')
  const [headers, setHeaders] = useState<string>(initialConfig?.headers ? JSON.stringify(initialConfig.headers) : '')
  const [body, setBody] = useState<string>((initialConfig?.body as string) ?? '')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(initialConfig?.ignoreWhitespace !== false)

  function handleSave(): void {
    if (type === 'keyword') {
      onSave({ positiveKeywords, negativeKeywords })
      return
    }
    if (type === 'port') {
      onSave({ port: parseInt(port || '80', 10) })
      return
    }
    if (type === 'heartbeat') {
      onSave({ expectedIntervalSeconds: parseInt(expectedInterval || '300', 10) })
      return
    }
    if (type === 'api') {
      let parsedHeaders: Record<string, string> | undefined
      if (headers.trim()) {
        try { parsedHeaders = JSON.parse(headers) } catch { /* ignore invalid JSON */ }
      }
      onSave({ method, headers: parsedHeaders, body: body || undefined })
      return
    }
    if (type === 'competitor') {
      onSave({ ignoreWhitespace })
    }
  }

  const titleByType: Record<string, string> = {
    keyword: 'Configure Keyword Detection',
    port: 'Configure Port Check',
    heartbeat: 'Configure Heartbeat Monitor',
    api: 'Configure API Endpoint',
    competitor: 'Configure Page Change Detection',
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{titleByType[type] ?? 'Configure Monitor'}</span>
          <button className="modal-close" onClick={onCancel} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <p className="form-helper-text" style={{ marginBottom: 16 }}>For {domain}</p>

          {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

          {type === 'keyword' && (
            <>
              <KeywordTagInput
                label="Must Contain (positive keywords)"
                helperText="Alert if these words disappear from the page"
                keywords={positiveKeywords}
                onChange={setPositiveKeywords}
                variant="positive"
                disabled={isSaving}
                suggestions={keywordSuggestions?.positive}
              />
              <KeywordTagInput
                label="Must Not Contain (negative keywords)"
                helperText="Alert if these words appear on the page"
                keywords={negativeKeywords}
                onChange={setNegativeKeywords}
                variant="negative"
                disabled={isSaving}
                suggestions={keywordSuggestions?.negative}
              />
            </>
          )}

          {type === 'port' && (
            <div className="form-group">
              <label className="form-label" htmlFor="cfg-port">Port Number</label>
              <input
                className="form-input"
                id="cfg-port"
                type="number"
                placeholder="3306"
                value={port}
                onChange={e => setPort(e.target.value)}
                disabled={isSaving}
              />
            </div>
          )}

          {type === 'heartbeat' && (
            <div className="form-group">
              <label className="form-label" htmlFor="cfg-interval">Expected Ping Interval (seconds)</label>
              <input
                className="form-input"
                id="cfg-interval"
                type="number"
                value={expectedInterval}
                onChange={e => setExpectedInterval(e.target.value)}
                disabled={isSaving}
              />
              <span className="form-helper-text">Your heartbeat URL will appear on the monitor detail page after creation.</span>
            </div>
          )}

          {type === 'api' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="cfg-method">HTTP Method</label>
                <select
                  id="cfg-method"
                  className="form-input"
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  disabled={isSaving}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cfg-headers">Headers (JSON)</label>
                <input
                  className="form-input"
                  id="cfg-headers"
                  placeholder='{"Authorization": "Bearer ..."}'
                  value={headers}
                  onChange={e => setHeaders(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cfg-body">Body (optional)</label>
                <input
                  className="form-input"
                  id="cfg-body"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </>
          )}

          {type === 'competitor' && (
            <label className="form-label form-label-toggle" htmlFor="cfg-ignore-ws">
              <input
                type="checkbox"
                id="cfg-ignore-ws"
                checked={ignoreWhitespace}
                onChange={e => setIgnoreWhitespace(e.target.checked)}
                disabled={isSaving}
              />
              Ignore whitespace-only changes
            </label>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
