import { redirect } from 'next/navigation'

export default async function CompetitorDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<never> {
  const { id } = await params
  redirect(`/dashboard/watchdog/${id}`)
}
