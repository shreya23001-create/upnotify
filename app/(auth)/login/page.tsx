import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Log In',
  description:
    'Log in to your Upnotify account. Monitor uptime, performance and infrastructure for all your sites.',
  alternates: { canonical: 'https://uptrue.io/login' },
  robots: { index: false, follow: true },
}

export default function LoginPage(): React.ReactElement {
  return <LoginForm mode="login" />
}
