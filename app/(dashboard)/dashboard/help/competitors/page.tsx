import { redirect } from 'next/navigation'

export default function CompetitorsHelpRedirect(): never {
  redirect('/dashboard/help/watchdog')
}
