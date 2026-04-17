import { redirect } from 'next/navigation'

export default function NewMonitorPage(): never {
  redirect('/dashboard/monitors/scan')
}
