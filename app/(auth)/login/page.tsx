import { Card, CardContent } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <LoginForm mode="login" />
        </CardContent>
      </Card>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
