import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div>
      <div className="auth-card">
        <LoginForm mode="signup" />
      </div>
      <p className="auth-footer">
        Already have an account?{' '}
        <Link href="/login">Sign in</Link>
      </p>
    </div>
  )
}
