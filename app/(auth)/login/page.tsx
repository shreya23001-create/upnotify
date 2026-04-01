import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Log In',
  description:
    'Log in to your Uptrue account. Monitor uptime, performance and infrastructure for all your sites.',
  alternates: { canonical: 'https://uptrue.io/login' },
  robots: { index: false, follow: true },
}

export default function LoginPage(): React.ReactElement {
  return (
    <div>
      <div className="auth-card">
        <LoginForm mode="login" />
      </div>
      <p className="auth-footer">
        Don&apos;t have an account?{' '}
        <Link href="/signup">Sign up</Link>
      </p>
    </div>
  )
}
