
export default function LegalLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="legal-layout">
      
      <main className="legal-content" style={{ paddingTop: 80 }}>{children}</main>
      
    </div>
  )
}
