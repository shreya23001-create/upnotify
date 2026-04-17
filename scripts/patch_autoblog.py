import re

path = r"d:\D drv\LYB\2 Client\UpTrue.io\uptrue-app\app\(admin)\admin\autoblog\autoblog-client.tsx"
content = open(path, "r", encoding="utf-8").read()

# Find the channel grid section and replace it entirely
start_marker = 'autoblog-channel-grid">'
end_marker = '))}\n\n          </div>\n\n        </div>\n\n      )}\n\n\n\n     '

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print(f"Markers not found: start={start_idx}, end={end_idx}")
    exit(1)

new_grid = '''autoblog-channel-grid">

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
                          {tState === 'running' ? 'Running\u2026' : tState === 'ok' ? '\u2713 Done' : tState === 'error' ? '\u2717 Error' : '\u25b6 Run now'}
                        </button>
                      )}

                      {history.length > 0 && (
                        <button
                          className="autoblog-action-btn"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() => setExpandedChannel(isExpanded ? null : channel.key)}
                        >
                          {isExpanded ? '\u25b2 Hide history' : `\u25bc History (${history.length})`}
                        </button>
                      )}

                      {lastRun && (
                        <span
                          title={`Last: ${lastRun.status} \u00b7 ${timeAgo(lastRun.ran_at)}${lastRun.result_summary ? ' \u00b7 ' + lastRun.result_summary : ''}${lastRun.error_message ? ' \u2014 ' + lastRun.error_message : ''}`}
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
                                {run.error_message ?? run.result_summary ?? '\u2014'}
                              </td>
                              <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>
                                {run.duration_ms ?? '\u2014'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}'''

new_content = content[:start_idx] + new_grid + content[end_idx:]
open(path, "w", encoding="utf-8").write(new_content)
print("done")
