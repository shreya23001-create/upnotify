import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Create your Upnotify account. Start monitoring uptime, performance and infrastructure in 60 seconds. Plans from ₹999/year.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/signup' },
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }): Promise<React.ReactElement> {
  const { next } = await searchParams
  return <LoginForm mode="signup" next={next} />
}
