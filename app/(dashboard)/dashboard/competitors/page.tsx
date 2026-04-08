import { redirect } from 'next/navigation'

export default function CompetitorsRedirect(): never {
  redirect('/dashboard/watchdog')
}
