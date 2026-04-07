import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign Up Free',
  description:
    'Create a free Uptrue account. Start monitoring uptime, performance and infrastructure in 60 seconds. No credit card required.',
  alternates: { canonical: 'https://uptrue.io/signup' },
}

export default function SignupPage(): React.ReactElement {
  return (
    <>
      <LoginForm mode="signup" />
      <p className="auth-switch-link">
        Already have an account?{' '}
        <Link href="/login">Sign in</Link>
      </p>
    </>
  )
}
