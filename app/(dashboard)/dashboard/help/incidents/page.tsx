'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpSidebar } from '../help-sidebar'

export default function HelpIncidentsPage(): React.ReactElement {
  const pathname = usePathname()
  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <div className="help-main">
        <article className="help-article">
          <div className="help-article-hero">
            <h1 className="help-article-title">Incidents</h1>
            <p className="help-article-intro">Incidents are created automatically when a monitor confirms downtime. They track the lifecycle of an outage from detection to resolution.</p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">How Incidents Work</h2>
            <p>When a monitor check fails, Uptrue runs a second confirmation check 30 seconds later. If both checks fail, an incident is created automatically with status &quot;investigating.&quot; Alert channels fire immediately.</p>
            <p>When the monitor recovers, the incident is automatically resolved and recovery alerts are sent.</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Incident States</h2>
            <p>You can manage incident states from <Link href="/dashboard/incidents">Dashboard &gt; Incidents</Link>:</p>
            <ul className="help-list">
              <li><strong>Investigating</strong> — initial state, the issue has been detected</li>
              <li><strong>Identified</strong> — the root cause has been identified</li>
              <li><strong>Monitoring</strong> — a fix has been applied and you are watching for recovery</li>
              <li><strong>Resolved</strong> — the issue is fixed, duration is recorded</li>
            </ul>
            <p>State changes move forward only — you cannot go back from &quot;monitoring&quot; to &quot;investigating.&quot;</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Resolution Notes</h2>
            <p>When resolving an incident, you can add a resolution note describing what happened and how it was fixed. This is stored with the incident for future reference and appears in reports.</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Incidents in Reports</h2>
            <p>AI-powered reports include a full incident analysis — severity, duration, affected monitors, and trends. This helps you identify recurring issues and present uptime data to clients or stakeholders.</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Notifications</h2>
            <p>When an incident is created or resolved, you receive:</p>
            <ul className="help-list">
              <li>Alerts via your configured channels (email, Slack, Teams, webhook)</li>
              <li>An in-app message in the bell icon dropdown</li>
              <li>A badge count on the Incidents sidebar item</li>
            </ul>
          </section>
        </article>
      </div>
    </div>
  )
}
