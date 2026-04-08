import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign Up Free',
  description:
    'Create a free Uptrue account. Start monitoring uptime, performance and infrastructure in 60 seconds. No credit card required.',
  alternates: { canonical: 'https://uptrue.io/signup' },
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }): Promise<React.ReactElement> {
  const { next } = await searchParams
  return <LoginForm mode="signup" next={next} />
}
