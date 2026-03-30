import { Card, CardContent } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function SignupPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <LoginForm mode="signup" />
        </CardContent>
      </Card>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
