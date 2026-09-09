import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset the password for your Upnotify account.',
  robots: { index: false, follow: true },
}

export default function ForgotPasswordPage(): React.ReactElement {
  return <ForgotPasswordForm />
}
