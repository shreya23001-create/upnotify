import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="legal-layout">
      <header className="legal-header">
        <Link href="/" className="legal-logo">Uptrue</Link>
        <nav className="legal-nav">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/acceptable-use">Acceptable Use</Link>
        </nav>
      </header>
      <main className="legal-content">{children}</main>
      <footer className="legal-footer">
        &copy; {new Date().getFullYear()} Vision Software Solutions Limited. All rights reserved.
      </footer>
    </div>
  )
}
