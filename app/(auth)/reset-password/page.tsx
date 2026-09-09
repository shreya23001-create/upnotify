import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Set New Password',
  description: 'Set a new password for your Upnotify account.',
  robots: { index: false, follow: true },
}

export default function ResetPasswordPage(): React.ReactElement {
  return <ResetPasswordForm />
}
