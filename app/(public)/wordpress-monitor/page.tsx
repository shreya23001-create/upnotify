import { redirect } from 'next/navigation'

export default function WordPressMonitorRedirect(): never {
  redirect('/monitoring/wordpress-site-monitor')
}
