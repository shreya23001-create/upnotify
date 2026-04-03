import { redirect } from 'next/navigation'

interface ReferralPageProps {
  params: Promise<{ code: string }>
}

/**
 * Referral redirect page.
 * /r/[code] redirects to /signup?ref=[code]
 * This is a public route — no auth required.
 */
export default async function ReferralPage({ params }: ReferralPageProps): Promise<never> {
  const { code } = await params
  redirect(`/signup?ref=${encodeURIComponent(code)}`)
}
