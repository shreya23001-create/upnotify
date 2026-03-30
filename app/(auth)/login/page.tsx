import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
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
